import { useState, useEffect } from "react";
import { tablesAPI } from "@/api/tables";
import { ordersAPI } from "@/api/orders";
import { billsAPI } from "@/api/bills";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, Trash2, Receipt, Printer, AlertCircle, Check, ChevronsUpDown } from "lucide-react";
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
  name: string;
  quantity: number;
  price: number;
}

const MENU_ITEMS = [
  // Main Courses
  { name: "Paneer Handi", price: 280 },
  { name: "Butter Chicken", price: 320 },
  { name: "Dal Makhani", price: 220 },
  { name: "Chicken Tikka Masala", price: 340 },
  { name: "Palak Paneer", price: 260 },
  { name: "Mutton Rogan Josh", price: 420 },
  { name: "Fish Curry", price: 380 },
  { name: "Veg Biryani", price: 280 },
  { name: "Chicken Biryani", price: 350 },
  { name: "Mutton Biryani", price: 450 },
  { name: "Hyderabadi Biryani", price: 380 },
  { name: "Kadai Paneer", price: 290 },
  { name: "Malai Kofta", price: 270 },
  { name: "Chole Bhature", price: 180 },
  { name: "Rajma Rice", price: 200 },

  // Breads
  { name: "Naan", price: 40 },
  { name: "Butter Naan", price: 50 },
  { name: "Garlic Naan", price: 60 },
  { name: "Tandoori Roti", price: 30 },
  { name: "Butter Roti", price: 35 },
  { name: "Lachha Paratha", price: 55 },
  { name: "Aloo Paratha", price: 70 },
  { name: "Puri", price: 45 },

  // Rice & Pulao
  { name: "Jeera Rice", price: 120 },
  { name: "Veg Pulao", price: 150 },
  { name: "Chicken Pulao", price: 220 },
  { name: "Fried Rice", price: 180 },

  // Soups & Salads
  { name: "Tomato Soup", price: 120 },
  { name: "Sweet Corn Soup", price: 140 },
  { name: "Manchow Soup", price: 150 },
  { name: "Green Salad", price: 100 },
  { name: "Caesar Salad", price: 180 },

  // Starters
  { name: "Paneer Tikka", price: 240 },
  { name: "Chicken Tikka", price: 280 },
  { name: "Tandoori Chicken", price: 320 },
  { name: "Chicken Wings", price: 260 },
  { name: "Spring Rolls", price: 180 },
  { name: "Samosa", price: 40 },
  { name: "Pakora", price: 120 },
  { name: "Onion Rings", price: 150 },

  // Desserts
  { name: "Gulab Jamun", price: 100 },
  { name: "Rasmalai", price: 120 },
  { name: "Kheer", price: 110 },
  { name: "Ice Cream", price: 90 },
  { name: "Gajar Halwa", price: 130 },
  { name: "Rasgulla", price: 100 },
  { name: "Jalebi", price: 80 },
  { name: "Kulfi", price: 100 },

  // Beverages
  { name: "Raita", price: 80 },
  { name: "Lassi", price: 90 },
  { name: "Mango Lassi", price: 120 },
  { name: "Fresh Lime Soda", price: 60 },
  { name: "Coca Cola", price: 50 },
  { name: "Pepsi", price: 50 },
  { name: "Fresh Juice", price: 100 },
  { name: "Masala Chai", price: 40 },
  { name: "Coffee", price: 60 },

  // Extras
  { name: "Papad", price: 30 },
  { name: "Pickle", price: 40 },
  { name: "Chutney", price: 50 },
];

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

  const addToCart = () => {
    if (!selectedItem) {
      toast.error("Please select an item");
      return;
    }

    const menuItem = MENU_ITEMS.find((item) => item.name === selectedItem);
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
      setCart([...cart, { ...menuItem, quantity }]);
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

  useEffect(() => {
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

  const generateKitchenReceipt = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    setLoading(true);
    try {
      const { subtotal, tax, total } = calculateTotal();
      const tableId = table._id || table.id;

      // Create order first
      const order = await ordersAPI.create({
        table_id: tableId,
        items: cart.map(item => ({
          item_name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        total_amount: total,
      });

      // Generate kitchen receipt (can be generated multiple times)
      const bill = await billsAPI.create({
        order_id: (order as any)._id || (order as any).id,
        table_id: tableId,
        subtotal,
        tax,
        total_amount: total,
        items: cart,
      });

      setBillData({ ...bill, items: cart, table });
      setShowBill(true);
      toast.success("Kitchen receipt generated! You can add more items later.");
    } catch (error: any) {
      toast.error("Failed to generate receipt: " + (error.response?.data?.message || error.message));
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
                >
                  {selectedItem
                    ? MENU_ITEMS.find((item) => item.name === selectedItem)?.name
                    : "Search and select an item..."}
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
                      {MENU_ITEMS
                        .filter((item) =>
                          item.name.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((item) => (
                          <CommandItem
                            key={item.name}
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
                {MENU_ITEMS.find((item) => item.name === selectedItem)?.price}
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
          <Button onClick={addToCart} className="w-full">
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
