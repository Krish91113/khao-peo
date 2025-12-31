import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { authAPI } from "@/api/auth";
import { tablesAPI } from "@/api/tables";
import { kotAPI } from "@/api/kot";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UtensilsCrossed, LogOut, Bell } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import TableManagement from "@/components/TableManagement";
import OrderEntry from "@/components/OrderEntry";
import KOTReceipt from "@/components/KOTReceipt";
import { pageTransitionConfig } from "@/lib/animations";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
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

    if (!token || !userStr) {
      navigate("/auth");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      setProfile(user);
    } catch (error) {
      console.error("Failed to parse user data:", error);
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
      } catch (error) {
        console.error("Failed to fetch tables:", error);
      }
    },
    interval: 3000,
  });

  const handleSignOut = async () => {
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
        items: items.map(item => ({
          name: item.name || item.item_name,
          quantity: item.quantity,
          price: item.price,
        })),
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
      className="min-h-screen bg-gradient-to-b from-background to-muted/30"
    >
      {/* Header */}
      <header className="border-b glass-card sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <UtensilsCrossed className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-sm sm:text-xl font-bold truncate">KHAO PEEO</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Admin Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-4">
            {newItemsCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="relative"
              >
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <Badge
                  variant="destructive"
                  className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center notification-badge text-[10px] sm:text-xs"
                >
                  {newItemsCount}
                </Badge>
              </motion.div>
            )}
            <ThemeToggle />
            <div className="text-right hidden lg:block">
              <p className="text-sm font-medium">{profile?.full_name || "Admin"}</p>
              <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-4">
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8 animate-fade-in-up">
          <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Restaurant Management</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Manage tables, orders, and billing</p>
        </div>

        {!showOrderEntry ? (
          <div className="animate-fade-in">
            <TableManagement
              onTableSelect={handleTableSelect}
              onResetTable={(tableId) => {
                if (selectedTable?.id === tableId) {
                  setSelectedTable(null);
                }
              }}
            />
          </div>
        ) : (
          <div className="animate-fade-in">
            <Button
              variant="outline"
              className="mb-4 hover:bg-muted transition-all duration-300"
              onClick={() => {
                setShowOrderEntry(false);
                setSelectedTable(null);
              }}
            >
              ← Back to Tables
            </Button>
            <OrderEntry
              table={selectedTable}
              onComplete={() => setShowOrderEntry(false)}
            />
          </div>
        )}
      </div>

      {/* KOT Receipt Modal */}
      {showKOT && kotData && (
        <KOTReceipt
          table={kotData.table}
          items={kotData.items}
          kotNumber={kotData.kotNumber}
          onClose={() => {
            setShowKOT(false);
            setKotData(null);
          }}
        />
      )}
    </motion.div>
  );
};

export default AdminDashboard;

