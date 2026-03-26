import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "@/api/auth";
import { tablesAPI } from "@/api/tables";
import { ordersAPI } from "@/api/orders";
import { billsAPI } from "@/api/bills";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  UtensilsCrossed,
  Users,
  DollarSign,
  TrendingUp,
  LogOut,
  Settings,
  LayoutDashboard,
  Pizza,
  UserCog,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import UserManagement from "@/components/UserManagement";
import FoodMenuManagement from "@/components/FoodMenuManagement";
import TableManagement from "@/components/TableManagement";
import OrderEntry from "@/components/OrderEntry";

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

    if (!token || !userStr) {
      navigate("/auth");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.role !== "owner" && user.role !== "restaurant_owner") {
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
      const [tablesData, orders, bills] = await Promise.all([
        tablesAPI.getAll(),
        ordersAPI.getAll(),
        billsAPI.getAll(),
      ]);

      const activeTables = tablesData.filter((t: any) => t.is_booked).length;
      const totalRevenue = bills.reduce((sum: number, b: any) => sum + parseFloat(String(b.total_amount || "0")), 0);

      setStats({
        totalTables: tablesData.length,
        activeTables,
        totalOrders: orders.length,
        totalRevenue,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      toast.error("Failed to load statistics");
    }
  };

  const fetchTables = async () => {
    try {
      const data = await tablesAPI.getAll();
      setTables(data);
    } catch (error) {
      console.error("Failed to fetch tables:", error);
    }
  };

  const handleSignOut = async () => {
    authAPI.logout();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const handleTableSelect = (table: any) => {
    setSelectedTable(table);
    setShowOrderEntry(true);
  };

  const handleAddTable = async () => {
    if (!newTableData.tableNumber) {
      toast.error("Please enter a table number");
      return;
    }
    try {
      await tablesAPI.create({
        tableNumber: parseInt(newTableData.tableNumber),
        capacity: parseInt(newTableData.capacity)
      });
      toast.success("Table created successfully");
      setIsAddTableOpen(false);
      setNewTableData({ tableNumber: "", capacity: "4" });
      fetchStats();
      fetchTables();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create table");
    }
  };

  const handleDeleteTable = async (tableId: string, tableNumber: string) => {
    setDeletingTableId(tableId);
    try {
      await tablesAPI.deleteTable(tableId);
      toast.success(`Table ${tableNumber} deleted successfully`);
      fetchStats();
      fetchTables();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete table");
    } finally {
      setDeletingTableId(null);
    }
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
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{profile?.full_name || "Owner"}</p>
              <p className="text-xs text-muted-foreground capitalize">{profile?.role?.replace('_', ' ')}</p>
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
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">Restaurant Management</h2>
            <p className="text-muted-foreground">Welcome back, {profile?.full_name?.split(' ')[0] || "Owner"}!</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="overview">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="tables">
              <Settings className="h-4 w-4 mr-2" />
              Tables
            </TabsTrigger>
            <TabsTrigger value="menu">
              <Pizza className="h-4 w-4 mr-2" />
              Menu
            </TabsTrigger>
            <TabsTrigger value="staff">
              <UserCog className="h-4 w-4 mr-2" />
              Staff
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-4 gap-6">
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
          </TabsContent>

          <TabsContent value="tables" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Table Management</h3>
              <Dialog open={isAddTableOpen} onOpenChange={setIsAddTableOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Table
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Table</DialogTitle>
                    <DialogDescription>Create a new table for your restaurant</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Table Number</Label>
                      <Input
                        type="number"
                        value={newTableData.tableNumber}
                        onChange={(e) => setNewTableData({ ...newTableData, tableNumber: e.target.value })}
                        placeholder="10"
                      />
                    </div>
                    <div>
                      <Label>Capacity</Label>
                      <Input
                        type="number"
                        value={newTableData.capacity}
                        onChange={(e) => setNewTableData({ ...newTableData, capacity: e.target.value })}
                        placeholder="4"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddTableOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddTable}>Create Table</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Tables List with Delete Option */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
              {tables.map((table) => (
                <Card key={table._id || table.id} className={`relative ${table.is_booked ? "border-primary/50" : "border-border"}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Table {table.table_number}</CardTitle>
                      <Badge variant={table.is_booked ? "default" : "secondary"}>
                        {table.is_booked ? "Booked" : "Available"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Users className="h-4 w-4" />
                      <span>Capacity: {table.capacity}</span>
                    </div>
                    {!table.is_booked && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="w-full"
                            disabled={deletingTableId === (table._id || table.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {deletingTableId === (table._id || table.id) ? "Deleting..." : "Delete Table"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Table {table.table_number}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete Table {table.table_number}. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleDeleteTable(table._id || table.id, table.table_number)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    {table.is_booked && (
                      <p className="text-xs text-muted-foreground text-center mt-1">
                        Reset table before deleting
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
              {tables.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No tables yet. Click "Add Table" to create one.
                </div>
              )}
            </div>

            {/* Full Table Management Component */}
            {!showOrderEntry ? (
              <TableManagement
                onTableSelect={handleTableSelect}
                onResetTable={(tableId: string) => {
                  if (selectedTable?.id === tableId) {
                    setSelectedTable(null);
                  }
                  fetchStats();
                  fetchTables();
                }}
              />
            ) : (
              <div>
                <Button
                  variant="outline"
                  className="mb-4"
                  onClick={() => {
                    setShowOrderEntry(false);
                    setSelectedTable(null);
                  }}
                >
                  ← Back to Tables
                </Button>
                <OrderEntry
                  table={selectedTable}
                  onComplete={() => {
                    setShowOrderEntry(false);
                    setSelectedTable(null);
                    fetchStats();
                    fetchTables();
                  }}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="menu" className="space-y-4">
            <FoodMenuManagement />
          </TabsContent>

          <TabsContent value="staff" className="space-y-4">
            <UserManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OwnerDashboard;
