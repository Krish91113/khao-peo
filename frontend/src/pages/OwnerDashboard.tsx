import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "@/api/auth";
import { tablesAPI } from "@/api/tables";
import { ordersAPI } from "@/api/orders";
import { billsAPI } from "@/api/bills";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UtensilsCrossed, Users, DollarSign, TrendingUp, LogOut } from "lucide-react";
import { toast } from "sonner";

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalTables: 0,
    activeTables: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    checkAuth();
    fetchStats();
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
      if (user.role !== "owner") {
        toast.error("Access denied. Owner role required.");
        navigate("/admin-dashboard");
        return;
      }
      setProfile(user);
    } catch (error) {
      console.error("Failed to parse user data:", error);
      navigate("/auth");
    }
  };

  const fetchStats = async () => {
    try {
      const [tables, orders, bills] = await Promise.all([
        tablesAPI.getAll(),
        ordersAPI.getAll(),
        billsAPI.getAll(),
      ]);

      const activeTables = tables.filter((t: any) => t.is_booked).length;
      const totalRevenue = bills.reduce((sum: number, b: any) => sum + parseFloat(String(b.total_amount || "0")), 0);

      setStats({
        totalTables: tables.length,
        activeTables,
        totalOrders: orders.length,
        totalRevenue,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      toast.error("Failed to load statistics");
    }
  };

  const handleSignOut = async () => {
    authAPI.logout();
    toast.success("Signed out successfully");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">KHAO PEEO</h1>
              <p className="text-xs text-muted-foreground">Owner Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{profile?.full_name || "Owner"}</p>
              <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
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
          <h2 className="text-3xl font-bold mb-2">Welcome back, {profile?.full_name?.split(' ')[0] || "Owner"}!</h2>
          <p className="text-muted-foreground">Here's what's happening with your restaurant today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Tables</CardTitle>
              <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTables}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.activeTables} currently booked
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Tables</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeTables}</div>
              <p className="text-xs text-muted-foreground mt-1">Tables in use</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground mt-1">Orders processed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Total earnings</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => navigate("/admin-dashboard")}
            >
              <Users className="h-4 w-4 mr-2" />
              Go to Admin Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OwnerDashboard;
