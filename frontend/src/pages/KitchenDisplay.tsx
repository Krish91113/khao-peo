import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "@/api/auth";
import { ordersAPI } from "@/api/orders";
import { LogOut, ChefHat, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

interface OrderWithItems {
  id: string;
  table_id: string;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  table: { table_number: string };
  items: Array<{ item_name: string; quantity: number; price: number }>;
}

/* Get minutes elapsed since a time */
const minutesSince = (isoTime: string) =>
  Math.floor((Date.now() - new Date(isoTime).getTime()) / 60000);

/* Urgency header color by age */
const getUrgencyStyle = (createdAt: string) => {
  const mins = minutesSince(createdAt);
  if (mins >= 20) return { bg: "#ffdad6", color: "#93000a", label: "URGENT" };
  if (mins >= 10) return { bg: "#fdf4e3", color: "#92400e", label: "DELAYED" };
  return { bg: "#fff1ec", color: "#E85D25", label: "NEW" };
};

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
    if (!token || !userStr) { navigate("/auth"); return; }
    try {
      const user = JSON.parse(userStr);
      if (!user) { toast.error("Access denied."); navigate("/"); return; }
      setProfile(user);
    } catch {
      navigate("/auth");
    }
  };

  const fetchOrders = async (): Promise<OrderWithItems[]> => {
    const orders = await ordersAPI.getAll();
    return orders
      .filter((order: any) => ["sent_to_kitchen", "preparing", "ready"].includes(order.status))
      .map((order: any): OrderWithItems => ({
        id: order._id || order.id,
        table_id: order.table_id || order.table?._id,
        status: order.status,
        total_amount: order.total_amount || order.totalAmount,
        created_at: order.created_at || order.createdAt,
        updated_at: order.updated_at || order.updatedAt,
        table: order.table
          ? { table_number: order.table.table_number || order.table.tableNumber?.toString() }
          : { table_number: "" },
        items: order.items || [],
      }))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  };

  const { data: orders = [], refetch: refetchOrders, isLoading } = useQuery({
    queryKey: ["kitchen-orders"],
    queryFn: fetchOrders,
    refetchInterval: 3000,
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
    }
  };

  const newOrders      = orders.filter((o) => o.status === "sent_to_kitchen");
  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const readyOrders    = orders.filter((o) => o.status === "ready");

  const TABS = [
    { id: "queue",     label: "New Orders", count: newOrders.length,       icon: ChefHat },
    { id: "preparing", label: "Preparing",  count: preparingOrders.length, icon: Clock },
    { id: "ready",     label: "Ready",      count: readyOrders.length,     icon: CheckCircle },
  ];

  const tabOrders = { queue: newOrders, preparing: preparingOrders, ready: readyOrders };

  /* Minimal KOT card for Kitchen */
  const KOTCard = ({ order, nextStatus, nextLabel }: { order: OrderWithItems; nextStatus?: string; nextLabel?: string }) => {
    const urgency = getUrgencyStyle(order.created_at);
    return (
      <div
        className="bg-white rounded-lg overflow-hidden"
        style={{ border: "1px solid #e1bfb4", boxShadow: "0 2px 8px rgba(38,24,20,0.06)" }}
      >
        {/* Card header — urgency colored */}
        <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: urgency.bg }}>
          <div>
            <p
              className="text-xl font-bold"
              style={{ fontFamily: "Sora, sans-serif", color: "#261814" }}
            >
              Table {order.table.table_number}
            </p>
            <p
              className="text-xs font-semibold uppercase tracking-wider mt-0.5"
              style={{ color: urgency.color }}
            >
              {urgency.label} · {minutesSince(order.created_at)}m ago
            </p>
          </div>
          <span
            className="text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider"
            style={{ backgroundColor: urgency.color + "22", color: urgency.color }}
          >
            {minutesSince(order.created_at)}m
          </span>
        </div>

        {/* Dashed divider */}
        <div
          style={{
            borderTop: "none",
            backgroundImage: "linear-gradient(to right, #8d7167 50%, transparent 0%)",
            backgroundPosition: "top",
            backgroundSize: "8px 1px",
            backgroundRepeat: "repeat-x",
            height: "1px",
          }}
        />

        {/* Items — JetBrains Mono */}
        <div className="p-4 space-y-2">
          {order.items.map((item: any, idx: number) => (
            <div
              key={idx}
              className="flex items-center justify-between py-1"
              style={{ borderBottom: idx < order.items.length - 1 ? "1px dashed #e1bfb4" : "none" }}
            >
              <span
                className="text-sm font-medium"
                style={{ fontFamily: "JetBrains Mono, monospace", color: "#261814" }}
              >
                {item.item_name}
              </span>
              <span
                className="text-lg font-bold"
                style={{ fontFamily: "JetBrains Mono, monospace", color: "#E85D25" }}
              >
                × {item.quantity}
              </span>
            </div>
          ))}
        </div>

        {/* Action button */}
        {nextStatus && (
          <div className="px-4 pb-4">
            <button
              onClick={() => updateOrderStatus(order.id, nextStatus)}
              className="w-full py-2.5 rounded-md text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: nextStatus === "ready" ? "#22C55E" : "#E85D25" }}
            >
              {nextLabel}
            </button>
          </div>
        )}
        {!nextStatus && (
          <div
            className="px-4 pb-4 pt-2 text-center text-sm font-semibold"
            style={{ color: "#22C55E" }}
          >
            ✓ Awaiting Pickup
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#261814" }}>

      {/* ── DARK HEADER ─────────────────────────────────────── */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-6 sticky top-0 z-50"
        style={{ height: "64px", backgroundColor: "#3c2d28", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center gap-3">
          <ChefHat className="h-7 w-7" style={{ color: "#ffb59b" }} />
          <div>
            <h1 className="text-lg font-bold" style={{ fontFamily: "Sora, sans-serif", color: "#ffffff" }}>
              Khao Peeo Kitchen
            </h1>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: "#ffb59b", opacity: 0.8 }}>
              Kitchen Display System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Clock */}
          <p className="text-sm font-medium hidden sm:block" style={{ fontFamily: "JetBrains Mono, monospace", color: "#f7ddd5" }}>
            {new Date().toLocaleTimeString()}
          </p>
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium" style={{ color: "#f7ddd5" }}>
              {profile?.full_name || "Kitchen Staff"}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all hover:opacity-80"
            style={{ borderColor: "rgba(255,255,255,0.2)", color: "#f7ddd5" }}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* ── TAB SWITCHER ─────────────────────────────────────── */}
      <div
        className="px-6 py-3 flex items-center gap-2 sticky z-40"
        style={{ top: "64px", backgroundColor: "#3c2d28" }}
      >
        {TABS.map(({ id, label, count, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
              style={{
                backgroundColor: isActive ? "#E85D25" : "rgba(255,255,255,0.08)",
                color: isActive ? "#ffffff" : "#f7ddd5",
              }}
            >
              <Icon className="h-4 w-4" />
              {label}
              {count > 0 && (
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: isActive ? "rgba(255,255,255,0.3)" : "#E85D25" }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── KANBAN CONTENT ───────────────────────────────────── */}
      <main className="flex-1 p-6 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-16" style={{ color: "#f7ddd5" }}>
            Loading kitchen orders...
          </div>
        ) : tabOrders[activeTab as keyof typeof tabOrders].length === 0 ? (
          <div className="text-center py-16">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
            >
              {activeTab === "queue" && <ChefHat className="h-8 w-8 text-[#ffb59b]" />}
              {activeTab === "preparing" && <Clock className="h-8 w-8 text-[#ffb59b]" />}
              {activeTab === "ready" && <CheckCircle className="h-8 w-8 text-[#22C55E]" />}
            </div>
            <p className="text-sm" style={{ color: "#f7ddd5", opacity: 0.7 }}>
              {activeTab === "queue" ? "No new orders in queue" :
               activeTab === "preparing" ? "No orders currently being prepared" :
               "No orders ready for pickup"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tabOrders[activeTab as keyof typeof tabOrders].map((order) => (
              <KOTCard
                key={order.id}
                order={order}
                nextStatus={
                  activeTab === "queue"     ? "preparing" :
                  activeTab === "preparing" ? "ready"     :
                  undefined
                }
                nextLabel={
                  activeTab === "queue"     ? "Start Preparing" :
                  activeTab === "preparing" ? "Mark as Ready"   :
                  undefined
                }
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default KitchenDisplay;
