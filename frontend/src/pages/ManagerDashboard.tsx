import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { authAPI } from "@/api/auth";
import { tablesAPI } from "@/api/tables";
import { kotAPI } from "@/api/kot";
import { Badge } from "@/components/ui/badge";
import { UtensilsCrossed, LogOut, Bell, Settings } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import TableManagement from "@/components/TableManagement";
import OrderEntry from "@/components/OrderEntry";
import KOTReceipt from "@/components/KOTReceipt";
import { pageTransitionConfig } from "@/lib/animations";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";

/* ─── Sidebar nav items for Manager ─────────────────────────── */
const NAV_ITEMS = [
  { id: "tables",  label: "Tables",    icon: Settings },
  { id: "orders",  label: "Orders",    icon: UtensilsCrossed },
];

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [activeSection, setActiveSection] = useState("tables");
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [showOrderEntry, setShowOrderEntry] = useState(false);
  const [showKOT, setShowKOT] = useState(false);
  const [kotData, setKotData] = useState<any>(null);
  const [newItemsCount, setNewItemsCount] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) { navigate("/auth"); return; }
    try {
      const user = JSON.parse(userStr);
      setProfile(user);
    } catch {
      navigate("/auth");
    }
  };

  // Real-time updates for new items notification
  useRealTimeUpdates({
    onUpdate: async () => {
      try {
        const tables = await tablesAPI.getAll();
        const bookedTables = tables.filter((t: any) => t.is_booked);
        setNewItemsCount(bookedTables.length);
      } catch { /* silent */ }
    },
    interval: 3000,
  });

  const handleSignOut = () => {
    authAPI.logout();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const handleTableSelect = (table: any) => {
    setSelectedTable(table);
    setShowOrderEntry(true);
  };

  const handleGenerateKOT = async (table: any, items: any[]) => {
    try {
      const kot = await kotAPI.generate({
        table_id: table._id || table.id,
        items: items.map(item => ({
          item_name: item.name || item.item_name,
          quantity: item.quantity,
          price: item.price,
        })),
      });
      setKotData({
        table,
        items: items.map(item => ({ name: item.name || item.item_name, quantity: item.quantity, price: item.price })),
        kotNumber: kot.kot_number || kot.kotNumber || `KOT-${Date.now()}`,
      });
      setShowKOT(true);
      toast.success("KOT generated successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to generate KOT");
    }
  };

  return (
    <motion.div
      {...pageTransitionConfig}
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: "#fff8f6" }}
    >

      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <aside
        className="flex-shrink-0 flex flex-col py-6 z-50 hidden md:flex"
        style={{ width: "260px", backgroundColor: "#fff1ec", borderRight: "1px solid #e1bfb4" }}
      >
        {/* Brand */}
        <div className="px-6 mb-8">
          <h1 className="text-lg font-bold" style={{ fontFamily: "Sora, sans-serif", color: "#261814" }}>
            Khao Peeo
          </h1>
          <p className="text-xs" style={{ color: "#594139", opacity: 0.8 }}>
            {profile?.restaurant_name || "Main Branch"}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1 px-3">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeSection === id && !showOrderEntry;
            return (
              <button
                key={id}
                onClick={() => { setActiveSection(id); setShowOrderEntry(false); setSelectedTable(null); }}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-left w-full"
                style={{
                  backgroundColor: isActive ? "#cc490f" : "transparent",
                  color: isActive ? "#fffbff" : "#594139",
                }}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span style={{ fontFamily: "Inter, sans-serif" }}>{label}</span>
              </button>
            );
          })}

          {/* Inventory — Stitch shows it but not in app, render disabled */}
          <div
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-left opacity-40 cursor-not-allowed select-none"
            style={{ color: "#594139" }}
            title="Inventory management — coming soon"
          >
            <Settings className="h-4 w-4" />
            <span style={{ fontFamily: "Inter, sans-serif" }}>Inventory</span>
          </div>
        </nav>

        {/* New Order CTA */}
        <div className="px-3 pt-4" style={{ borderTop: "1px solid #e1bfb4" }}>
          {showOrderEntry ? (
            <button
              onClick={() => { setShowOrderEntry(false); setSelectedTable(null); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold border transition-all"
              style={{ borderColor: "#e1bfb4", color: "#594139" }}
            >
              ← Back to Tables
            </button>
          ) : null}
          <button
            onClick={handleSignOut}
            className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-80"
            style={{ color: "#594139" }}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top Bar */}
        <header
          className="flex-shrink-0 flex items-center justify-between px-6"
          style={{ height: "64px", backgroundColor: "#fff8f6", borderBottom: "1px solid #e1bfb4" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold" style={{ fontFamily: "Sora, sans-serif", color: "#E85D25" }}>
              Khao Peeo
            </span>
            <span className="h-4 w-px mx-1" style={{ backgroundColor: "#e1bfb4" }} />
            <span className="text-sm" style={{ color: "#594139", fontFamily: "Inter, sans-serif" }}>
              Manager Dashboard
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Role pill */}
            <div
              className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
              style={{ backgroundColor: "#fce3db", color: "#261814" }}
            >
              <span
                className="w-2 h-2 rounded-full status-dot-pulse"
                style={{ backgroundColor: "#22C55E" }}
              />
              Manager
            </div>

            {/* Bell */}
            {newItemsCount > 0 && (
              <div className="relative">
                <Bell className="h-5 w-5" style={{ color: "#E85D25" }} />
                <span
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white font-bold notification-badge"
                  style={{ backgroundColor: "#ba1a1a" }}
                >
                  {newItemsCount}
                </span>
              </div>
            )}

            <ThemeToggle />

            {/* User info */}
            <div className="text-right hidden lg:block">
              <p className="text-sm font-semibold" style={{ color: "#261814" }}>{profile?.full_name || "Manager"}</p>
              <p className="text-xs capitalize" style={{ color: "#594139" }}>{profile?.role}</p>
            </div>

            {/* Sign out (mobile) */}
            <button
              onClick={handleSignOut}
              className="md:hidden flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium border transition-all"
              style={{ borderColor: "#E85D25", color: "#E85D25" }}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 animate-fade-in-up">
            <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: "Sora, sans-serif", color: "#261814" }}>
              Restaurant Management
            </h2>
            <p className="text-sm" style={{ color: "#594139" }}>
              Manage tables, orders, and billing
            </p>
          </div>

          {!showOrderEntry ? (
            <div className="animate-fade-in">
              <TableManagement
                onTableSelect={handleTableSelect}
                onResetTable={(tableId) => {
                  if (selectedTable?.id === tableId) setSelectedTable(null);
                }}
              />
            </div>
          ) : (
            <div className="animate-fade-in">
              <button
                className="mb-4 flex items-center gap-2 px-4 py-2 rounded-md border text-sm font-medium transition-all hover:opacity-80"
                style={{ borderColor: "#e1bfb4", color: "#594139" }}
                onClick={() => { setShowOrderEntry(false); setSelectedTable(null); }}
              >
                ← Back to Tables
              </button>
              <OrderEntry
                table={selectedTable}
                onComplete={() => setShowOrderEntry(false)}
              />
            </div>
          )}
        </main>
      </div>

      {/* KOT Receipt Modal */}
      {showKOT && kotData && (
        <KOTReceipt
          table={kotData.table}
          items={kotData.items}
          kotNumber={kotData.kotNumber}
          onClose={() => { setShowKOT(false); setKotData(null); }}
        />
      )}
    </motion.div>
  );
};

export default ManagerDashboard;
