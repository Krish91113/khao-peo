import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { authAPI } from "@/api/auth";
import { tablesAPI } from "@/api/tables";
import { ordersAPI } from "@/api/orders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UtensilsCrossed, LogOut, Bell, CheckCircle, Clock, ChefHat, Plus } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import OrderEntry from "@/components/OrderEntry";
import { ThemeToggle } from "@/components/ThemeToggle";
import { pageTransitionConfig } from "@/lib/animations";

interface OrderWithItems {
  id: string;
  table_id: string;
  status: string;
  total_amount: number;
  created_at: string;
  table: {
    table_number: string;
  };
  items: Array<{
    item_name: string;
    quantity: number;
    price: number;
  }>;
}

const WaiterDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("new-order");
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [showOrderEntry, setShowOrderEntry] = useState(false);
  const [tables, setTables] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
    fetchTables();

    // Polling replaces real-time subscriptions
    const ordersInterval = setInterval(() => {
      refetchOrders();
    }, 5000);

    const tablesInterval = setInterval(() => {
      fetchTables();
    }, 5000);

    return () => {
      clearInterval(ordersInterval);
      clearInterval(tablesInterval);
    };
  }, []);

  const fetchTables = async () => {
    try {
      const data = await tablesAPI.getAll();
      setTables(data);
    } catch (error: any) {
      toast.error("Failed to load tables");
    }
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      navigate("/auth");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      // Allow waiter, admin, and owner roles
      if (!["waiter", "admin", "owner"].includes(user.role)) {
        toast.error("Access denied. Waiter role required.");
        navigate("/");
        return;
      }
      setProfile(user);
    } catch (error) {
      console.error("Failed to parse user data:", error);
      navigate("/auth");
    }
  };

  const fetchOrders = async (): Promise<OrderWithItems[]> => {
    const orders = await ordersAPI.getAll();

    // Transform to match expected format
    return orders.map((order: any) => ({
      id: order._id || order.id,
      _id: order._id || order.id,
      table_id: order.table_id || order.table?._id,
      status: order.status,
      total_amount: order.total_amount || order.totalAmount,
      created_at: order.created_at || order.createdAt,
      updated_at: order.updated_at || order.updatedAt,
      table: order.table ? {
        table_number: order.table.table_number || order.table.tableNumber?.toString(),
      } : null,
      items: order.items || [],
    }));
  };

  const { data: orders = [], refetch: refetchOrders, isLoading } = useQuery({
    queryKey: ["waiter-orders"],
    queryFn: fetchOrders,
    refetchInterval: 5000, // Poll every 5 seconds for Stage 2
  });

  const handleSignOut = async () => {
    authAPI.logout();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const markOrderReady = async (orderId: string) => {
    // Kitchen marks as ready - waiter should just acknowledge
    toast.info("Order marked as ready by kitchen");
    refetchOrders();
  };

  const markOrderServed = async (orderId: string) => {
    try {
      await ordersAPI.updateStatus(orderId, "served");
      toast.success("Order marked as served");
      refetchOrders();
    } catch (error: any) {
      toast.error("Failed to update order status: " + (error.response?.data?.message || error.message));
      console.error(error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      sent_to_kitchen: { label: "Sent to Kitchen", variant: "secondary" },
      preparing: { label: "Preparing", variant: "outline" },
      ready: { label: "Ready", variant: "default" },
      served: { label: "Served", variant: "secondary" },
    };

    const config = statusConfig[status] || { label: status, variant: "secondary" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const readyOrders = orders.filter((o) => o.status === "ready");
  const activeOrders = orders.filter((o) => ["sent_to_kitchen", "preparing"].includes(o.status));
  const servedOrders = orders.filter((o) => o.status === "served");

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header - Mobile responsive */}
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              <div>
                <h1 className="text-lg md:text-xl font-bold">KHAO PEEO</h1>
                <p className="text-xs text-muted-foreground hidden md:block">Waiter Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              {readyOrders.length > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  <Bell className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                  {readyOrders.length}
                </Badge>
              )}
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium">{profile?.full_name || "Waiter"}</p>
                <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline ml-2">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Order Management</h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Monitor and manage customer orders
          </p>
        </div>

        {/* Show Order Entry if table selected */}
        {showOrderEntry && selectedTable ? (
          <div>
            <Button
              variant="outline"
              className="mb-4"
              onClick={() => {
                setShowOrderEntry(false);
                setSelectedTable(null);
              }}
            >
              ← Back to Dashboard
            </Button>
            <OrderEntry
              table={selectedTable}
              onComplete={() => {
                setShowOrderEntry(false);
                setSelectedTable(null);
                refetchOrders();
                fetchTables();
              }}
            />
          </div>
        ) : (
          /* Tabs for different order views */
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="new-order">
                <Plus className="h-4 w-4 mr-2" />
                New Order
              </TabsTrigger>
              <TabsTrigger value="ready" className="relative">
                Ready
                {readyOrders.length > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                    {readyOrders.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="served">Served</TabsTrigger>
            </TabsList>

            {/* New Order Tab - Stage 2 Smartphone Flow */}
            <TabsContent value="new-order" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Select Table for New Order</CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Choose a table to create a new order (Stage 2 - Smartphone Order Entry)
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {tables.map((table) => (
                      <Card
                        key={table.id}
                        className={`cursor-pointer transition-all hover:shadow-lg ${table.is_booked ? "border-muted opacity-60" : "border-border"
                          }`}
                        onClick={() => {
                          if (!table.is_booked) {
                            setSelectedTable(table);
                            setShowOrderEntry(true);
                          } else {
                            toast.info("Table is already booked");
                          }
                        }}
                      >
                        <CardContent className="p-4 text-center">
                          <p className="text-xl font-bold">Table {table.table_number}</p>
                          <Badge variant={table.is_booked ? "secondary" : "default"} className="mt-2">
                            {table.is_booked ? "Booked" : "Available"}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Ready Orders Tab */}
            <TabsContent value="ready" className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">Loading orders...</div>
              ) : readyOrders.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No orders ready to serve</p>
                  </CardContent>
                </Card>
              ) : (
                readyOrders.map((order) => (
                  <Card key={order.id} className="border-2 border-primary">
                    <CardHeader>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <CardTitle className="text-xl">Table {order.table.table_number}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(order.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>
                              {item.item_name} × {item.quantity}
                            </span>
                            <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="font-bold">Total: ₹{parseFloat(String(order.total_amount)).toFixed(2)}</span>
                        <Button onClick={() => markOrderServed(order.id)} size="sm">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Served
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Active Orders Tab */}
            <TabsContent value="active" className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">Loading orders...</div>
              ) : activeOrders.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No active orders</p>
                  </CardContent>
                </Card>
              ) : (
                activeOrders.map((order) => (
                  <Card key={order.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <CardTitle className="text-lg md:text-xl">Table {order.table.table_number}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(order.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>
                              {item.item_name} × {item.quantity}
                            </span>
                            <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2 border-t">
                        <span className="font-bold">Total: ₹{parseFloat(String(order.total_amount)).toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Served Orders Tab */}
            <TabsContent value="served" className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">Loading orders...</div>
              ) : servedOrders.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <ChefHat className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No served orders</p>
                  </CardContent>
                </Card>
              ) : (
                servedOrders.map((order) => (
                  <Card key={order.id} className="opacity-75">
                    <CardHeader>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <CardTitle className="text-lg md:text-xl">Table {order.table.table_number}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(order.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>
                              {item.item_name} × {item.quantity}
                            </span>
                            <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2 border-t mt-4">
                        <span className="font-bold">Total: ₹{parseFloat(String(order.total_amount)).toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default WaiterDashboard;

