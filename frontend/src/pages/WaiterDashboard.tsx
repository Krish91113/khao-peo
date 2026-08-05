import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { authAPI } from "@/api/auth";
import { tablesAPI } from "@/api/tables";
import { ordersAPI } from "@/api/orders";
import { Badge } from "@/components/ui/badge";
import { Bell, LogOut, CheckCircle, Clock, ChefHat, Plus } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import OrderEntry from "@/components/OrderEntry";
import { pageTransitionConfig } from "@/lib/animations";

interface OrderWithItems {
  id: string;
  table_id: string;
  status: string;
  total_amount: number;
  created_at: string;
  table: { table_number: string };
  items: Array<{ item_name: string; quantity: number; price: number }>;
}

const TABS = [
  { id: "new-order", label: "New Order",  icon: Plus },
  { id: "ready",     label: "Ready",      icon: CheckCircle },
  { id: "active",    label: "Active",     icon: Clock },
  { id: "served",    label: "Served",     icon: ChefHat },
];

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

    const ordersInterval = setInterval(() => { refetchOrders(); }, 5000);
    const tablesInterval = setInterval(() => { fetchTables(); }, 5000);
    return () => { clearInterval(ordersInterval); clearInterval(tablesInterval); };
  }, []);

  const fetchTables = async () => {
    try {
      const data = await tablesAPI.getAll();
      setTables(data);
    } catch { toast.error("Failed to load tables"); }
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) { navigate("/auth"); return; }
    try {
      const user = JSON.parse(userStr);
      if (!["waiter", "admin", "owner", "restaurant_admin", "restaurant_owner"].includes(user.role)) {
        toast.error("Access denied. Waiter role required.");
        navigate("/");
        return;
      }
      setProfile(user);
    } catch {
      navigate("/auth");
    }
  };

  const fetchOrders = async (): Promise<OrderWithItems[]> => {
    const orders = await ordersAPI.getAll();
    return orders.map((order: any) => ({
      id: order._id || order.id,
      _id: order._id || order.id,
      table_id: order.table_id || order.table?._id,
      status: order.status,
      total_amount: order.total_amount || order.totalAmount,
      created_at: order.created_at || order.createdAt,
      updated_at: order.updated_at || order.updatedAt,
      table: order.table ? { table_number: order.table.table_number || order.table.tableNumber?.toString() } : null,
      items: order.items || [],
    }));
  };

  const { data: orders = [], refetch: refetchOrders, isLoading } = useQuery({
    queryKey: ["waiter-orders"],
    queryFn: fetchOrders,
    refetchInterval: 5000,
  });

  const handleSignOut = () => {
    authAPI.logout();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const markOrderServed = async (orderId: string) => {
    try {
      await ordersAPI.updateStatus(orderId, "served");
      toast.success("Order marked as served");
      refetchOrders();
    } catch (error: any) {
      toast.error("Failed to update order status: " + (error.response?.data?.message || error.message));
    }
  };

  const getStatusStyles = (status: string) => {
    const map: Record<string, { label: string; bg: string; color: string }> = {
      sent_to_kitchen: { label: "Sent to Kitchen", bg: "#e3f0fb", color: "#3B82F6" },
      preparing:       { label: "Preparing",       bg: "#fdf4e3", color: "#F59E0B" },
      ready:           { label: "Ready",           bg: "#e8f5e9", color: "#22C55E" },
      served:          { label: "Served",          bg: "#fce3db", color: "#E85D25" },
    };
    return map[status] || { label: status, bg: "#f5f5f5", color: "#594139" };
  };

  const readyOrders  = orders.filter((o) => o.status === "ready");
  const activeOrders = orders.filter((o) => ["sent_to_kitchen", "preparing"].includes(o.status));
  const servedOrders = orders.filter((o) => o.status === "served");

  const tabOrders: Record<string, OrderWithItems[]> = {
    "ready":  readyOrders,
    "active": activeOrders,
    "served": servedOrders,
  };

  const EmptyState = ({ icon: Icon, message }: { icon: any; message: string }) => (
    <div
      className="flex flex-col items-center justify-center py-16 rounded-xl"
      style={{ backgroundColor: "#ffffff", border: "1px solid #e1bfb4" }}
    >
      <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "#fff1ec" }}>
        <Icon className="h-7 w-7" style={{ color: "#E85D25" }} />
      </div>
      <p className="text-sm" style={{ color: "#594139" }}>{message}</p>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#fff8f6" }}>

      {/* ── TOP BAR ─────────────────────────────────────────── */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-6 sticky top-0 z-50"
        style={{ height: "64px", backgroundColor: "#fff8f6", borderBottom: "1px solid #e1bfb4" }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold" style={{ fontFamily: "Sora, sans-serif", color: "#E85D25" }}>
            Khao Peeo
          </span>
          <div className="h-5 w-px mx-1" style={{ backgroundColor: "#e1bfb4" }} />
          <div className="flex flex-col">
            <span
              className="text-[10px] uppercase tracking-wider font-semibold"
              style={{ color: "#594139", fontFamily: "Inter, sans-serif" }}
            >
              Waiter
            </span>
            <span className="text-sm font-semibold" style={{ fontFamily: "Sora, sans-serif", color: "#261814" }}>
              {profile?.full_name || "Waiter"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Ready orders alert */}
          {readyOrders.length > 0 && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: "#fce3db" }}
            >
              <Bell className="h-4 w-4" style={{ color: "#E85D25" }} />
              <span className="text-sm font-bold" style={{ color: "#E85D25" }}>
                {readyOrders.length} Ready
              </span>
            </div>
          )}

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all hover:opacity-80"
            style={{ borderColor: "transparent", color: "#ba1a1a" }}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wider">SIGN OUT</span>
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT ─────────────────────────────────────── */}
      <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl">

        {/* Order Entry view */}
        {showOrderEntry && selectedTable ? (
          <div className="animate-fade-in">
            <button
              className="mb-4 flex items-center gap-2 px-4 py-2 rounded-md border text-sm font-medium transition-all hover:opacity-80"
              style={{ borderColor: "#e1bfb4", color: "#594139" }}
              onClick={() => { setShowOrderEntry(false); setSelectedTable(null); }}
            >
              ← Back to Dashboard
            </button>
            <OrderEntry
              table={selectedTable}
              onComplete={() => { setShowOrderEntry(false); setSelectedTable(null); refetchOrders(); fetchTables(); }}
            />
          </div>
        ) : (
          <>
            {/* Tab pills */}
            <div
              className="flex items-center gap-2 p-1 rounded-xl mb-6 overflow-x-auto"
              style={{ backgroundColor: "#fce3db" }}
            >
              {TABS.map(({ id, label, icon: Icon }) => {
                const isActive = activeTab === id;
                const count = id === "ready" ? readyOrders.length : id === "active" ? activeOrders.length : id === "served" ? servedOrders.length : 0;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                    style={{
                      backgroundColor: isActive ? "#ffffff" : "transparent",
                      color: isActive ? "#E85D25" : "#594139",
                      boxShadow: isActive ? "0 1px 4px rgba(38,24,20,0.08)" : "none",
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                    {count > 0 && (
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ backgroundColor: id === "ready" ? "#22C55E" : "#E85D25" }}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── NEW ORDER TAB ── */}
            {activeTab === "new-order" && (
              <div className="animate-fade-in">
                <div
                  className="bg-white rounded-xl p-6 mb-4"
                  style={{ border: "1px solid #e1bfb4" }}
                >
                  <h3 className="font-semibold mb-1" style={{ fontFamily: "Sora, sans-serif", color: "#261814" }}>
                    Select Table for New Order
                  </h3>
                  <p className="text-sm mb-5" style={{ color: "#594139" }}>
                    Choose a table to create a new order
                  </p>

                  {/* Table strip */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {tables.map((table) => {
                      const isBooked = table.is_booked;
                      const dotColor = isBooked ? "#E85D25" : "#22C55E";
                      return (
                        <button
                          key={table.id || table._id}
                          className="flex flex-col items-center gap-2 px-3 py-3 rounded-xl border-2 transition-all duration-200 touch-target"
                          style={{
                            borderColor: isBooked ? "#E85D25" : "#e1bfb4",
                            backgroundColor: isBooked ? "#fff1ec" : "#ffffff",
                            cursor: isBooked ? "not-allowed" : "pointer",
                            opacity: isBooked ? 0.7 : 1,
                          }}
                          onClick={() => {
                            if (!isBooked) {
                              setSelectedTable(table);
                              setShowOrderEntry(true);
                            } else {
                              toast.info("Table is already booked");
                            }
                          }}
                        >
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }} />
                          <span className="font-bold text-sm" style={{ fontFamily: "Sora, sans-serif", color: "#261814" }}>
                            T {table.table_number}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider" style={{ color: isBooked ? "#E85D25" : "#22C55E" }}>
                            {isBooked ? "Booked" : "Free"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── ORDER LIST TABS (ready / active / served) ── */}
            {["ready", "active", "served"].includes(activeTab) && (
              <div className="animate-fade-in space-y-4">
                {isLoading ? (
                  <div className="text-center py-12" style={{ color: "#8d7167" }}>Loading orders...</div>
                ) : tabOrders[activeTab].length === 0 ? (
                  <EmptyState
                    icon={activeTab === "ready" ? CheckCircle : activeTab === "active" ? Clock : ChefHat}
                    message={
                      activeTab === "ready"  ? "No orders ready to serve" :
                      activeTab === "active" ? "No active orders in kitchen" :
                      "No served orders"
                    }
                  />
                ) : (
                  tabOrders[activeTab].map((order) => {
                    const statusStyle = getStatusStyles(order.status);
                    return (
                      <div
                        key={order.id}
                        className="bg-white rounded-xl p-5"
                        style={{
                          border: `1px solid ${activeTab === "ready" ? "#22C55E" : "#e1bfb4"}`,
                          borderLeft: `4px solid ${activeTab === "ready" ? "#22C55E" : activeTab === "active" ? "#E85D25" : "#8d7167"}`,
                          boxShadow: "0 2px 8px rgba(38,24,20,0.04)",
                          opacity: activeTab === "served" ? 0.75 : 1,
                        }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-bold text-lg" style={{ fontFamily: "Sora, sans-serif", color: "#261814" }}>
                              Table {order.table?.table_number}
                            </h4>
                            <p className="text-xs" style={{ color: "#8d7167" }}>
                              {new Date(order.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                          <span
                            className="text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider"
                            style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                          >
                            {statusStyle.label}
                          </span>
                        </div>

                        {/* Items */}
                        <div className="space-y-2 mb-4">
                          {order.items.map((item: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex justify-between text-sm py-1"
                              style={{ borderBottom: idx < order.items.length - 1 ? "1px dashed #e1bfb4" : "none" }}
                            >
                              <span style={{ color: "#261814" }}>
                                {item.item_name} × {item.quantity}
                              </span>
                              <span className="font-semibold" style={{ fontFamily: "Sora, sans-serif", color: "#261814" }}>
                                ₹{(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div
                          className="flex items-center justify-between pt-3"
                          style={{ borderTop: "1px solid #e1bfb4" }}
                        >
                          <span className="font-bold text-base" style={{ fontFamily: "Sora, sans-serif", color: "#261814" }}>
                            Total: ₹{parseFloat(String(order.total_amount)).toFixed(2)}
                          </span>
                          {activeTab === "ready" && (
                            <button
                              onClick={() => markOrderServed(order.id)}
                              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                              style={{ backgroundColor: "#22C55E" }}
                            >
                              <CheckCircle className="h-4 w-4" />
                              Mark as Served
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default WaiterDashboard;
