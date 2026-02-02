import { useState, useEffect } from "react";
import { tablesAPI } from "@/api/tables";
import { ordersAPI } from "@/api/orders";
import { billsAPI } from "@/api/bills";
import { menuAPI, MenuItem } from "@/api/menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, Trash2, Receipt, Printer, AlertCircle, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import BillDisplay from "./BillDisplay";

interface OrderEntryProps {
  table: any;
  onComplete: () => void;
}

interface CartItem {
  id?: string;
  name: string;
  quantity: number;
  price: number;
}

const OrderEntry = ({ table, onComplete }: OrderEntryProps) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [showBill, setShowBill] = useState(false);
  const [billData, setBillData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [tableStatus, setTableStatus] = useState<any>(table);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // New state for dynamic menu
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);

  useEffect(() => {
    fetchMenu();

    // Check table status
    const checkTableStatus = async () => {
      try {
        const tableId = table._id || table.id;
        const data = await tablesAPI.getById(tableId);
        setTableStatus(data);
      } catch (error) {
        console.error("Failed to fetch table status:", error);
      }
    };

    checkTableStatus();

    // Poll for table updates every 2 seconds
    const interval = setInterval(() => {
      checkTableStatus();
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [table._id || table.id]);

  const fetchMenu = async () => {
    try {
      setLoadingMenu(true);
      const items = await menuAPI.getAll();
      // Filter only available items
      setMenuItems(items.filter((item: MenuItem) => item.isAvailable));
    } catch (error) {
      console.error("Failed to fetch menu:", error);
      toast.error("Failed to load menu items");
    } finally {
      setLoadingMenu(false);
    }
  };

  const addToCart = () => {
    if (!selectedItem) {
      toast.error("Please select an item");
      return;
    }

    const menuItem = menuItems.find((item) => item.name === selectedItem);
    if (!menuItem) return;

    const existingItem = cart.find((item) => item.name === selectedItem);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.name === selectedItem
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
    } else {
      setCart([...cart, {
        id: menuItem._id || menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity
      }]);
    }

    toast.success("Item added to cart");
    setSelectedItem("");
    setQuantity(1);
  };

  const updateQuantity = (itemName: string, delta: number) => {
    setCart(
      cart
        .map((item) =>
          item.name === itemName
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (itemName: string) => {
    setCart(cart.filter((item) => item.name !== itemName));
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * 0.05; // 5% tax
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const sendOrderToKitchen = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    setLoading(true);
    try {
      const { subtotal, tax, total } = calculateTotal();
      const tableId = table._id || table.id;

      // Create order with items (table will be marked as booked automatically)
      const order = await ordersAPI.create({
        table_id: tableId,
        items: cart.map(item => ({
          item_name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        total_amount: total,
      });

      // Clear cart after successful order
      setCart([]);
      setSelectedItem("");
      setQuantity(1);

      toast.success("Order sent to kitchen successfully! You can add more items or generate kitchen receipt.");
      onComplete(); // Refresh table status
    } catch (error: any) {
      toast.error("Failed to send order: " + (error.response?.data?.message || error.message));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (showBill && billData) {
    return <BillDisplay bill={billData} onClose={() => {
      setShowBill(false);
      onComplete();
    }} />;
  }

  const { subtotal, tax, total } = calculateTotal();

  return (
    <div className="grid md:grid-cols-2 gap-6 animate-fade-in">
      {tableStatus.is_booked && (
        <div className="md:col-span-2 animate-fade-in-up">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Table is Booked</AlertTitle>
            <AlertDescription>
              This table is currently booked. You can add more items to the existing order. Admin can generate the final bill when ready.
            </AlertDescription>
          </Alert>
        </div>
      )}
      {/* Menu Selection */}
      <Card className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <CardHeader>
          <CardTitle>Add Items - Table {table.table_number}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Search & Select Item</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                  disabled={loadingMenu}
                >
                  {loadingMenu ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading menu...
                    </span>
                  ) : selectedItem ? (
                    menuItems.find((item) => item.name === selectedItem)?.name
                  ) : (
                    "Search and select an item..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Search items..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <CommandList>
                    <CommandEmpty>No item found.</CommandEmpty>
                    <CommandGroup>
                      {menuItems
                        .filter((item) =>
                          item.name.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((item) => (
                          <CommandItem
                            key={item._id || item.id}
                            value={item.name}
                            onSelect={() => {
                              setSelectedItem(item.name === selectedItem ? "" : item.name);
                              setSearchQuery("");
                              setOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedItem === item.name ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex justify-between w-full">
                              <span>{item.name}</span>
                              <span className="text-muted-foreground ml-2">₹{item.price}</span>
                            </div>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedItem && (
              <div className="text-sm text-muted-foreground p-2 bg-muted/50 rounded">
                Selected: <span className="font-medium">{selectedItem}</span> - ₹
                {menuItems.find((item) => item.name === selectedItem)?.price}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
          </div>
          <Button onClick={addToCart} className="w-full" disabled={loadingMenu}>
            <Plus className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </CardContent>
      </Card>

      {/* Cart */}
      <Card className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <CardHeader>
          <CardTitle>Current Order</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cart.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Cart is empty</p>
          ) : (
            <>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cart.map((item, index) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-all duration-300 transform hover:scale-[1.02] animate-fade-in-up"
                    style={{ animationDelay: `${0.3 + index * 0.05}s` }}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        ₹{item.price} × {item.quantity} = ₹{item.price * item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.name, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.name, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeFromCart(item.name)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax (5%):</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Button
                  onClick={sendOrderToKitchen}
                  className="w-full"
                  disabled={loading}
                  variant="default"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {loading ? "Sending..." : "Send to Kitchen"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderEntry;
