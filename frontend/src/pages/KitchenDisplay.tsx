import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "@/api/auth";
import { ordersAPI } from "@/api/orders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChefHat, LogOut, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

interface OrderWithItems {
  id: string;
  table_id: string;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  table: {
    table_number: string;
  };
  items: Array<{
    item_name: string;
    quantity: number;
    price: number;
  }>;
}

const KitchenDisplay = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("queue");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      navigate("/auth");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      // Allow kitchen, admin, and owner roles
      if (!user) {
        toast.error("Access denied.");
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
    
    // Filter and transform to match expected format
    return orders
      .filter((order: any) => ["sent_to_kitchen", "preparing", "ready"].includes(order.status))
      .map((order: any): OrderWithItems => ({
        id: order._id || order.id,
        table_id: order.table_id || order.table?._id,
        status: order.status,
        total_amount: order.total_amount || order.totalAmount,
        created_at: order.created_at || order.createdAt,
        updated_at: order.updated_at || order.updatedAt,
        table: order.table ? {
          table_number: order.table.table_number || order.table.tableNumber?.toString(),
        } : { table_number: "" },
        items: order.items || [],
      }))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  };

  const { data: orders = [], refetch: refetchOrders, isLoading } = useQuery({
    queryKey: ["kitchen-orders"],
    queryFn: fetchOrders,
    refetchInterval: 3000, // Poll every 3 seconds for real-time updates
  });

  const handleSignOut = async () => {
    authAPI.logout();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus as any);
      toast.success(`Order status updated to ${newStatus}`);
      refetchOrders();
    } catch (error: any) {
      toast.error("Failed to update order status: " + (error.response?.data?.message || error.message));
      console.error(error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      sent_to_kitchen: { label: "New Order", variant: "destructive" },
      preparing: { label: "Preparing", variant: "outline" },
      ready: { label: "Ready", variant: "default" },
    };

    const config = statusConfig[status] || { label: status, variant: "secondary" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const newOrders = orders.filter((o) => o.status === "sent_to_kitchen");
  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const readyOrders = orders.filter((o) => o.status === "ready");

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">KHAO PEEO KITCHEN</h1>
              <p className="text-xs text-muted-foreground">Kitchen Display System</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{profile?.full_name || "Kitchen Staff"}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Order Queue</h2>
          <p className="text-muted-foreground">Manage kitchen orders and preparation status</p>
        </div>

        {/* Tabs for different order views */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="queue" className="relative">
              New Orders
              {newOrders.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                  {newOrders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="preparing">Preparing</TabsTrigger>
            <TabsTrigger value="ready">Ready</TabsTrigger>
          </TabsList>

          {/* New Orders Queue */}
          <TabsContent value="queue" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">Loading orders...</div>
            ) : newOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No new orders</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {newOrders.map((order) => (
                  <Card key={order.id} className="border-2 border-destructive">
                    <CardHeader className="bg-destructive/10">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-2xl">Table {order.table.table_number}</CardTitle>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(order.created_at).toLocaleTimeString()}
                      </p>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-3 mb-4">
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-2 bg-muted rounded-lg">
                            <div>
                              <p className="font-bold text-lg">{item.item_name}</p>
                              <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                            </div>
                            <span className="text-2xl font-bold text-primary">× {item.quantity}</span>
                          </div>
                        ))}
                      </div>
                      <Button
                        onClick={() => updateOrderStatus(order.id, "preparing")}
                        className="w-full"
                        size="lg"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Start Preparing
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Preparing Orders */}
          <TabsContent value="preparing" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">Loading orders...</div>
            ) : preparingOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No orders being prepared</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {preparingOrders.map((order) => (
                  <Card key={order.id} className="border-2 border-primary">
                    <CardHeader className="bg-primary/10">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-2xl">Table {order.table.table_number}</CardTitle>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Started: {new Date(order.updated_at).toLocaleTimeString()}
                      </p>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-3 mb-4">
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-2 bg-muted rounded-lg">
                            <div>
                              <p className="font-bold text-lg">{item.item_name}</p>
                              <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                            </div>
                            <span className="text-2xl font-bold text-primary">× {item.quantity}</span>
                          </div>
                        ))}
                      </div>
                      <Button
                        onClick={() => updateOrderStatus(order.id, "ready")}
                        className="w-full"
                        size="lg"
                        variant="default"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Ready
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Ready Orders */}
          <TabsContent value="ready" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">Loading orders...</div>
            ) : readyOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No ready orders</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {readyOrders.map((order) => (
                  <Card key={order.id} className="border-2 border-green-500 opacity-75">
                    <CardHeader className="bg-green-500/10">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-2xl">Table {order.table.table_number}</CardTitle>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Ready at: {new Date(order.updated_at).toLocaleTimeString()}
                      </p>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-2 bg-muted rounded-lg">
                            <div>
                              <p className="font-bold text-lg">{item.item_name}</p>
                              <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                            </div>
                            <span className="text-2xl font-bold text-primary">× {item.quantity}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 p-3 bg-green-500/20 rounded-lg text-center">
                        <p className="font-bold text-green-700">Waiting for waiter pickup</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default KitchenDisplay;

