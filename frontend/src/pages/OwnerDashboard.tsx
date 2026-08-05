import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "@/api/auth";
import { tablesAPI } from "@/api/tables";
import { ordersAPI } from "@/api/orders";
import { billsAPI } from "@/api/bills";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Settings,
  Pizza,
  UserCog,
  Plus,
  Trash2,
  LogOut,
  Users,
  IndianRupee,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";
import UserManagement from "@/components/UserManagement";
import FoodMenuManagement from "@/components/FoodMenuManagement";
import TableManagement from "@/components/TableManagement";
import OrderEntry from "@/components/OrderEntry";

/* ─── Sidebar nav items for Owner ───────────────────────────── */
const NAV_ITEMS = [
  { id: "overview", label: "Overview",   icon: LayoutDashboard },
  { id: "tables",   label: "Tables",     icon: Settings },
  { id: "menu",     label: "Menu",       icon: Pizza },
  { id: "staff",    label: "Staff",      icon: UserCog },
];

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalTables: 0,
    activeTables: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [showOrderEntry, setShowOrderEntry] = useState(false);
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [newTableData, setNewTableData] = useState({ tableNumber: "", capacity: "4" });
  const [tables, setTables] = useState<any[]>([]);
  const [deletingTableId, setDeletingTableId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    fetchStats();
    fetchTables();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) { navigate("/auth"); return; }
    try {
      const user = JSON.parse(userStr);
      if (user.role !== "owner" && user.role !== "restaurant_owner") {
        toast.error("Access denied. Owner role required.");
        navigate("/admin-dashboard");
        return;
      }
      setProfile(user);
    } catch { navigate("/auth"); }
  };

  const fetchStats = async () => {
    try {
      const [tablesData, orders, bills] = await Promise.all([
        tablesAPI.getAll(),
        ordersAPI.getAll(),
        billsAPI.getAll(),
      ]);
      const activeTables = tablesData.filter((t: any) => t.is_booked).length;
      const totalRevenue = bills.reduce((sum: number, b: any) => sum + parseFloat(String(b.total_amount || "0")), 0);
      setStats({ totalTables: tablesData.length, activeTables, totalOrders: orders.length, totalRevenue });
    } catch {
      toast.error("Failed to load statistics");
    }
  };

  const fetchTables = async () => {
    try {
      const data = await tablesAPI.getAll();
      setTables(data);
    } catch { /* silent */ }
  };

  const handleSignOut = () => {
    authAPI.logout();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const handleTableSelect = (table: any) => {
    setSelectedTable(table);
    setShowOrderEntry(true);
  };

  const handleAddTable = async () => {
    if (!newTableData.tableNumber) { toast.error("Please enter a table number"); return; }
    try {
      await tablesAPI.create({ tableNumber: parseInt(newTableData.tableNumber), capacity: parseInt(newTableData.capacity) });
      toast.success("Table created successfully");
      setIsAddTableOpen(false);
      setNewTableData({ tableNumber: "", capacity: "4" });
      fetchStats(); fetchTables();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create table");
    }
  };

  const handleDeleteTable = async (tableId: string, tableNumber: string) => {
    setDeletingTableId(tableId);
    try {
      await tablesAPI.deleteTable(tableId);
      toast.success(`Table ${tableNumber} deleted successfully`);
      fetchStats(); fetchTables();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete table");
    } finally {
      setDeletingTableId(null);
    }
  };

  /* ─── Stat card data ─────────────────────────────────────── */
  const statCards = [
    {
      label: "Total Tables",
      value: stats.totalTables,
      sub: `${stats.activeTables} currently booked`,
      icon: UtensilsCrossed,
      iconBg: "#fff1ec",
      iconColor: "#E85D25",
    },
    {
      label: "Active Tables",
      value: stats.activeTables,
      sub: "Tables in use",
      icon: Users,
      iconBg: "#e8f5e9",
      iconColor: "#22C55E",
    },
    {
      label: "Total Orders",
      value: stats.totalOrders,
      sub: "Orders processed",
      icon: TrendingUp,
      iconBg: "#e3f0fb",
      iconColor: "#3B82F6",
    },
    {
      label: "Total Revenue",
      value: `₹${stats.totalRevenue.toFixed(0)}`,
      sub: "Total earnings",
      icon: IndianRupee,
      iconBg: "#fdf4e3",
      iconColor: "#F59E0B",
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#fff8f6" }}>

      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <aside
        className="flex-shrink-0 flex flex-col py-6 z-50"
        style={{ width: "260px", backgroundColor: "#3c2d28" }}
      >
        {/* Brand */}
        <div className="px-6 mb-8">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: "#cc490f" }}
            >
              <img
                src="/khao-peeo-logo.png"
                alt="Khao Peeo"
                className="w-full h-full object-contain p-1.5"
                onError={(e) => { (e.target as HTMLImageElement).src = "/KhaoPeeo Logo.png"; }}
              />
            </div>
            <div>
              <h1 className="text-base font-bold leading-none" style={{ fontFamily: "Sora, sans-serif", color: "#ffffff" }}>
                Khao Peeo
              </h1>
              <p className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: "#ffb59b", opacity: 0.7 }}>
                POS Suite
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1 px-3">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => { setActiveTab(id); setShowOrderEntry(false); }}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-left w-full"
                style={{
                  backgroundColor: isActive ? "rgba(255,181,155,0.12)" : "transparent",
                  color: isActive ? "#ffb59b" : "#f7ddd5",
                  borderLeft: isActive ? "3px solid #ffb59b" : "3px solid transparent",
                }}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span style={{ fontFamily: "Inter, sans-serif" }}>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="px-3 mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 w-full hover:opacity-80"
            style={{ color: "#f7ddd5" }}
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top Bar */}
        <header
          className="flex-shrink-0 flex items-center justify-between px-8"
          style={{
            height: "64px",
            backgroundColor: "#ffffff",
            borderBottom: "1px solid #e1bfb4",
          }}
        >
          <div>
            <h2 className="text-base font-semibold" style={{ fontFamily: "Sora, sans-serif", color: "#261814" }}>
              {activeTab === "overview" && `Welcome back, ${profile?.full_name?.split(' ')[0] || "Owner"}`}
              {activeTab === "tables"   && "Table Management"}
              {activeTab === "menu"     && "Menu Management"}
              {activeTab === "staff"    && "Staff Management"}
            </h2>
            <span
              className="text-[10px] uppercase tracking-widest"
              style={{ color: "#594139", fontFamily: "Inter, sans-serif" }}
            >
              Owner Dashboard
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="px-3 py-1 rounded-full flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"
              style={{ backgroundColor: "#ffdbcf", color: "#380d00" }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#E85D25" }} />
              Restaurant Owner
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold" style={{ color: "#261814" }}>{profile?.full_name || "Owner"}</p>
              <p className="text-xs capitalize" style={{ color: "#594139" }}>{profile?.role?.replace('_', ' ')}</p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8">

          {/* ── OVERVIEW TAB ─────────────────────────────── */}
          {activeTab === "overview" && (
            <div className="animate-fade-in space-y-8">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
                {statCards.map((card) => (
                  <div
                    key={card.label}
                    className="bg-white rounded-xl p-5"
                    style={{ border: "1px solid #e1bfb4", boxShadow: "0 2px 8px rgba(38,24,20,0.04)" }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: card.iconBg }}
                      >
                        <card.icon className="h-5 w-5" style={{ color: card.iconColor }} />
                      </div>
                    </div>
                    <p
                      className="text-xs font-semibold uppercase tracking-wider mb-1"
                      style={{ color: "#594139", fontFamily: "Inter, sans-serif" }}
                    >
                      {card.label}
                    </p>
                    <p
                      className="font-bold"
                      style={{ fontFamily: "Sora, sans-serif", fontSize: "28px", lineHeight: "1.15", color: "#261814" }}
                    >
                      {card.value}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "#8d7167" }}>{card.sub}</p>
                  </div>
                ))}
              </div>

              {/* Quick info */}
              <div
                className="bg-white rounded-xl p-6"
                style={{ border: "1px solid #e1bfb4", boxShadow: "0 2px 8px rgba(38,24,20,0.04)" }}
              >
                <h3 className="font-semibold mb-2" style={{ fontFamily: "Sora, sans-serif", color: "#261814" }}>
                  Quick Start
                </h3>
                <p className="text-sm" style={{ color: "#594139" }}>
                  Use the sidebar to navigate between Tables, Menu, and Staff management. Select a tab to begin.
                </p>
              </div>
            </div>
          )}

          {/* ── TABLES TAB ───────────────────────────────── */}
          {activeTab === "tables" && (
            <div className="animate-fade-in space-y-6">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold" style={{ fontFamily: "Sora, sans-serif", color: "#261814" }}>
                  Table Overview
                </h3>
                <Dialog open={isAddTableOpen} onOpenChange={setIsAddTableOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="flex items-center gap-2 rounded-md font-semibold h-9 px-4 text-white"
                      style={{ backgroundColor: "#E85D25" }}
                    >
                      <Plus className="h-4 w-4" />
                      Add Table
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-xl" style={{ borderColor: "#e1bfb4" }}>
                    <DialogHeader>
                      <DialogTitle style={{ fontFamily: "Sora, sans-serif" }}>Add New Table</DialogTitle>
                      <DialogDescription>Create a new table for your restaurant</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#594139" }}>
                          Table Number
                        </Label>
                        <Input
                          type="number"
                          value={newTableData.tableNumber}
                          onChange={(e) => setNewTableData({ ...newTableData, tableNumber: e.target.value })}
                          placeholder="10"
                          className="mt-1 h-10 rounded-md"
                          style={{ borderColor: "#e1bfb4" }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#594139" }}>
                          Capacity
                        </Label>
                        <Input
                          type="number"
                          value={newTableData.capacity}
                          onChange={(e) => setNewTableData({ ...newTableData, capacity: e.target.value })}
                          placeholder="4"
                          className="mt-1 h-10 rounded-md"
                          style={{ borderColor: "#e1bfb4" }}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddTableOpen(false)} className="rounded-md">Cancel</Button>
                      <Button
                        onClick={handleAddTable}
                        className="rounded-md text-white"
                        style={{ backgroundColor: "#E85D25" }}
                      >
                        Create Table
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Table cards grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                {tables.map((table) => {
                  const isBooked = table.is_booked;
                  return (
                    <div
                      key={table._id || table.id}
                      className="bg-white rounded-xl p-4 flex flex-col"
                      style={{
                        border: "1px solid #e1bfb4",
                        borderBottom: `3px solid ${isBooked ? "#E85D25" : "#22C55E"}`,
                        boxShadow: "0 2px 8px rgba(38,24,20,0.04)",
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-lg" style={{ fontFamily: "Sora, sans-serif", color: "#261814" }}>
                          T {table.table_number}
                        </span>
                        <span
                          className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: isBooked ? "#fff1ec" : "#e8f5e9",
                            color: isBooked ? "#E85D25" : "#22C55E",
                          }}
                        >
                          {isBooked ? "Booked" : "Free"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs mb-3" style={{ color: "#8d7167" }}>
                        <Users className="h-3 w-3" />
                        <span>Cap: {table.capacity}</span>
                      </div>
                      {!isBooked && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="w-full h-8 rounded-md text-xs mt-auto"
                              disabled={deletingTableId === (table._id || table.id)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              {deletingTableId === (table._id || table.id) ? "Deleting..." : "Delete"}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Table {table.table_number}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete Table {table.table_number}. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground"
                                onClick={() => handleDeleteTable(table._id || table.id, table.table_number)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      {isBooked && (
                        <p className="text-[10px] text-center mt-auto" style={{ color: "#8d7167" }}>
                          Reset before deleting
                        </p>
                      )}
                    </div>
                  );
                })}
                {tables.length === 0 && (
                  <div className="col-span-full text-center py-12" style={{ color: "#8d7167" }}>
                    No tables yet. Click "Add Table" to create one.
                  </div>
                )}
              </div>

              {/* Full TableManagement component */}
              {!showOrderEntry ? (
                <TableManagement
                  onTableSelect={handleTableSelect}
                  onResetTable={(tableId: string) => {
                    if (selectedTable?.id === tableId) setSelectedTable(null);
                    fetchStats(); fetchTables();
                  }}
                />
              ) : (
                <div className="animate-fade-in">
                  <Button
                    variant="outline"
                    className="mb-4 rounded-md"
                    onClick={() => { setShowOrderEntry(false); setSelectedTable(null); }}
                  >
                    ← Back to Tables
                  </Button>
                  <OrderEntry
                    table={selectedTable}
                    onComplete={() => {
                      setShowOrderEntry(false);
                      setSelectedTable(null);
                      fetchStats(); fetchTables();
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── MENU TAB ─────────────────────────────────── */}
          {activeTab === "menu" && (
            <div className="animate-fade-in">
              <FoodMenuManagement />
            </div>
          )}

          {/* ── STAFF TAB ────────────────────────────────── */}
          {activeTab === "staff" && (
            <div className="animate-fade-in">
              <UserManagement />
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default OwnerDashboard;
