import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { authAPI } from "@/api/auth";
import { Users, TrendingUp, Activity, LogOut, LayoutDashboard, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import UserManagement from "@/components/UserManagement";
import { pageTransitionConfig } from "@/lib/animations";

// Placeholder analytics (backend APIs not yet ready)
const analytics = null;
const loginLogs: any[] = [];

/* Sidebar nav items */
const NAV_ITEMS = [
  { id: "users",    label: "User Management", icon: Users },
  { id: "analytics",label: "Analytics",       icon: BarChart3 },
  { id: "activity", label: "Activity Logs",   icon: Activity },
];

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("users");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (!token || !userStr) { navigate("/auth"); return; }
    try {
      const user = JSON.parse(userStr);
      if (!["owner", "superadmin"].includes(user.role)) {
        toast.error("Access denied. SuperAdmin role required.");
        navigate("/");
        return;
      }
      setProfile(user);
    } catch {
      navigate("/auth");
    }
  };

  const handleSignOut = async () => {
    authAPI.logout();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const analyticsCards = [
    { label: "Total Sales",         value: `₹${analytics?.totalSales?.toFixed(2) || "0.00"}`,          sub: "All time revenue",    iconBg: "#fff1ec", iconColor: "#E85D25", icon: TrendingUp },
    { label: "Total Orders",        value: analytics?.totalOrders || 0,                                 sub: "Completed orders",    iconBg: "#e8f5e9", iconColor: "#22C55E", icon: BarChart3 },
    { label: "Active Users",        value: analytics?.activeUsers || 0,                                  sub: "Currently active",    iconBg: "#e3f0fb", iconColor: "#3B82F6", icon: Users },
    { label: "Today's Sales",       value: `₹${analytics?.todaySales?.toFixed(2) || "0.00"}`,          sub: "Revenue today",       iconBg: "#fdf4e3", iconColor: "#F59E0B", icon: TrendingUp },
    { label: "Avg Order Value",     value: `₹${analytics?.averageOrderValue?.toFixed(2) || "0.00"}`,   sub: "Per order",           iconBg: "#f3e8ff", iconColor: "#9333ea", icon: Activity },
    { label: "Peak Hours",          value: analytics?.peakHours || "N/A",                               sub: "Busiest time",        iconBg: "#fce3db", iconColor: "#E85D25", icon: LayoutDashboard },
  ];

  return (
    <motion.div
      {...pageTransitionConfig}
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: "#fff8f6" }}
    >

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
                SuperAdmin
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
                onClick={() => setActiveTab(id)}
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
          style={{ height: "64px", backgroundColor: "#ffffff", borderBottom: "1px solid #e1bfb4" }}
        >
          <div>
            <h2 className="text-base font-semibold" style={{ fontFamily: "Sora, sans-serif", color: "#261814" }}>
              System Management
            </h2>
            <span className="text-[10px] uppercase tracking-widest" style={{ color: "#594139" }}>
              SuperAdmin Dashboard
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div
              className="px-3 py-1 rounded-full flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"
              style={{ backgroundColor: "#ffdbcf", color: "#380d00" }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#E85D25" }} />
              {profile?.role?.replace("_", " ") || "SuperAdmin"}
            </div>
            <div className="text-right hidden lg:block">
              <p className="text-sm font-semibold" style={{ color: "#261814" }}>{profile?.full_name || "SuperAdmin"}</p>
              <p className="text-xs capitalize" style={{ color: "#594139" }}>{profile?.role}</p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8">

          {/* ── USERS TAB ──────────────────────────────────── */}
          {activeTab === "users" && (
            <div className="animate-fade-in">
              <h3 className="text-lg font-semibold mb-6" style={{ fontFamily: "Sora, sans-serif", color: "#261814" }}>
                User Management
              </h3>
              <UserManagement />
            </div>
          )}

          {/* ── ANALYTICS TAB ──────────────────────────────── */}
          {activeTab === "analytics" && (
            <div className="animate-fade-in">
              <h3 className="text-lg font-semibold mb-6" style={{ fontFamily: "Sora, sans-serif", color: "#261814" }}>
                Analytics Overview
              </h3>
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-5">
                {analyticsCards.map((card) => (
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
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#594139" }}>
                      {card.label}
                    </p>
                    <p
                      className="font-bold"
                      style={{ fontFamily: "Sora, sans-serif", fontSize: "28px", lineHeight: "1.15", color: "#261814" }}
                    >
                      {card.value}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "#8d7167" }}>{card.sub}</p>
                    {analytics === null && (
                      <p className="text-[10px] mt-2 italic" style={{ color: "#8d7167" }}>
                        Backend API not yet connected
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ACTIVITY TAB ───────────────────────────────── */}
          {activeTab === "activity" && (
            <div className="animate-fade-in">
              <h3 className="text-lg font-semibold mb-6" style={{ fontFamily: "Sora, sans-serif", color: "#261814" }}>
                Recent Login Activity
              </h3>
              <div
                className="bg-white rounded-xl overflow-hidden"
                style={{ border: "1px solid #e1bfb4" }}
              >
                {loginLogs.length === 0 ? (
                  <div className="py-16 text-center">
                    <Activity className="h-10 w-10 mx-auto mb-3" style={{ color: "#e1bfb4" }} />
                    <p className="text-sm" style={{ color: "#594139" }}>No login activity recorded</p>
                    <p className="text-xs mt-1" style={{ color: "#8d7167" }}>Backend API not yet connected</p>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: "#e1bfb4" }}>
                    {loginLogs.slice(0, 20).map((log: any, index: number) => (
                      <div key={index} className="flex items-center justify-between px-5 py-4">
                        <div>
                          <p className="text-sm font-semibold" style={{ color: "#261814" }}>
                            {log.user?.full_name || "Unknown"}
                          </p>
                          <p className="text-xs" style={{ color: "#8d7167" }}>
                            {log.user?.email || "N/A"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold capitalize" style={{ color: "#E85D25" }}>
                            {log.user?.role || "N/A"}
                          </p>
                          <p className="text-xs" style={{ color: "#8d7167" }}>
                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : "N/A"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>
    </motion.div>
  );
};

export default SuperAdminDashboard;
