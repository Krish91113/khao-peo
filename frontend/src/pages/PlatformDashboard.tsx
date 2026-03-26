import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
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
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, Building, DollarSign, Activity, Plus, Store, Search, LogOut, Settings, Trash2, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const API_URL: string = (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_URL) || "http://localhost:5000/api";
const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
};

const PLAN_LABELS: Record<string, string> = {
    basic: "Basic",
    professional: "Professional",
    enterprise: "Enterprise",
};

const STATUS_OPTIONS = ["active", "trial", "suspended", "inactive"];

const PlatformDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("overview");
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [manageDialogOpen, setManageDialogOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [saving, setSaving] = useState(false);

    const [createFormData, setCreateFormData] = useState({
        name: "",
        slug: "",
        ownerName: "",
        ownerEmail: "",
        ownerPassword: "",
        plan: "basic",
    });

    const [manageFormData, setManageFormData] = useState({
        restaurantName: "",
        plan: "basic",
        status: "trial",
        ownerPassword: "",
    });

    useEffect(() => {
        checkAuth();
        fetchRestaurants();
    }, []);

    const checkAuth = () => {
        const userStr = localStorage.getItem("user");
        if (!userStr) { navigate("/auth"); return; }
        const user = JSON.parse(userStr);
        if (user.role !== "platform_superadmin") {
            navigate("/auth");
        }
    };

    const fetchRestaurants = async () => {
        try {
            const res = await axios.get(`${API_URL}/platform/restaurants`, getAuthHeader());
            setRestaurants(res.data.restaurants || []);
        } catch (error) {
            console.error("Failed to fetch data", error);
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRestaurant = async () => {
        if (!createFormData.name || !createFormData.slug || !createFormData.ownerName || !createFormData.ownerEmail || !createFormData.ownerPassword) {
            toast.error("Please fill in all required fields");
            return;
        }
        try {
            const payload = {
                name: createFormData.name,
                slug: createFormData.slug.toLowerCase().replace(/\s+/g, "-"),
                address: { street: "TBD", city: "TBD", state: "TBD", pincode: "000000" },
                contact: { phone: "0000000000", email: createFormData.ownerEmail },
                business: {},
                owner: {
                    fullName: createFormData.ownerName,
                    email: createFormData.ownerEmail,
                    password: createFormData.ownerPassword,
                },
                plan: createFormData.plan,
            };

            await axios.post(`${API_URL}/platform/restaurants`, payload, getAuthHeader());
            toast.success("Restaurant created! Welcome email sent to owner.");
            setCreateDialogOpen(false);
            setCreateFormData({ name: "", slug: "", ownerName: "", ownerEmail: "", ownerPassword: "", plan: "basic" });
            fetchRestaurants();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create restaurant");
        }
    };

    const handleOpenManage = (restaurant: any) => {
        setSelectedRestaurant(restaurant);
        setManageFormData({
            restaurantName: restaurant.name,
            plan: restaurant.subscription?.plan || "basic",
            status: restaurant.status || "trial",
            ownerPassword: "",
        });
        setManageDialogOpen(true);
    };

    const handleSaveChanges = async () => {
        if (!selectedRestaurant) return;
        setSaving(true);
        try {
            const payload: any = {
                restaurantName: manageFormData.restaurantName,
                plan: manageFormData.plan,
                status: manageFormData.status,
            };
            if (manageFormData.ownerPassword) {
                payload.ownerPassword = manageFormData.ownerPassword;
            }

            await axios.put(`${API_URL}/platform/restaurants/${selectedRestaurant._id}`, payload, getAuthHeader());
            toast.success("Restaurant updated successfully!");
            setManageDialogOpen(false);
            setSelectedRestaurant(null);
            fetchRestaurants();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update restaurant");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteRestaurant = async () => {
        if (!selectedRestaurant) return;
        setDeleting(true);
        try {
            await axios.delete(`${API_URL}/platform/restaurants/${selectedRestaurant._id}`, getAuthHeader());
            toast.success(`Restaurant "${selectedRestaurant.name}" deleted successfully`);
            setDeleteConfirmOpen(false);
            setManageDialogOpen(false);
            setSelectedRestaurant(null);
            fetchRestaurants();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete restaurant");
        } finally {
            setDeleting(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/auth");
    };

    const filteredRestaurants = restaurants.filter((r) =>
        r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.owner?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getPlanBadgeColor = (plan: string) => {
        if (plan === "enterprise") return "bg-purple-100 text-purple-800 border-purple-200";
        if (plan === "professional") return "bg-blue-100 text-blue-800 border-blue-200";
        return "bg-gray-100 text-gray-800 border-gray-200";
    };

    const getStatusBadgeColor = (status: string) => {
        if (status === "active") return "bg-green-100 text-green-800 border-green-200";
        if (status === "trial") return "bg-yellow-100 text-yellow-800 border-yellow-200";
        if (status === "suspended") return "bg-red-100 text-red-800 border-red-200";
        return "bg-gray-100 text-gray-800 border-gray-200";
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Platform Dashboard</h1>
                    <p className="text-muted-foreground">Manage restaurants, subscriptions, and platform settings.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-sm font-medium">SuperAdmin</div>
                    <Button variant="outline" size="sm" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="restaurants">Restaurants ({restaurants.length})</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Restaurants</CardTitle>
                                <Store className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{restaurants.length}</div>
                                <p className="text-xs text-muted-foreground">Onboarded tenants</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active</CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{restaurants.filter(r => r.status === "active").length}</div>
                                <p className="text-xs text-muted-foreground">Active subscriptions</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">On Trial</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{restaurants.filter(r => r.status === "trial").length}</div>
                                <p className="text-xs text-muted-foreground">Trial period</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Enterprise</CardTitle>
                                <Building className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{restaurants.filter(r => r.subscription?.plan === "enterprise").length}</div>
                                <p className="text-xs text-muted-foreground">Enterprise plans</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Restaurants */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Restaurants</CardTitle>
                            <CardDescription>Last 5 onboarded restaurants</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {restaurants.slice(0, 5).map((r) => (
                                    <div key={r._id} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                                        <div>
                                            <p className="font-medium text-sm">{r.name}</p>
                                            <p className="text-xs text-muted-foreground">{r.owner?.email || "No owner"}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-0.5 rounded border ${getPlanBadgeColor(r.subscription?.plan)}`}>
                                                {PLAN_LABELS[r.subscription?.plan] || "Basic"}
                                            </span>
                                            <span className={`text-xs px-2 py-0.5 rounded border capitalize ${getStatusBadgeColor(r.status)}`}>
                                                {r.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {restaurants.length === 0 && !loading && (
                                    <p className="text-center text-muted-foreground py-4">No restaurants yet.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Restaurants Tab */}
                <TabsContent value="restaurants" className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-[300px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name, slug, email..."
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Create Dialog */}
                        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" /> Add Restaurant
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[480px]">
                                <DialogHeader>
                                    <DialogTitle>Add New Restaurant</DialogTitle>
                                    <DialogDescription>
                                        Create a new restaurant tenant. The owner will receive a welcome email with login credentials.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label className="text-right">Name</Label>
                                        <Input
                                            value={createFormData.name}
                                            onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                                            className="col-span-3"
                                            placeholder="My Restaurant"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label className="text-right">Slug (ID)</Label>
                                        <Input
                                            value={createFormData.slug}
                                            onChange={(e) => setCreateFormData({ ...createFormData, slug: e.target.value })}
                                            className="col-span-3"
                                            placeholder="my-restaurant"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label className="text-right">Plan</Label>
                                        <select
                                            className="col-span-3 p-2 border rounded bg-background text-foreground"
                                            value={createFormData.plan}
                                            onChange={(e) => setCreateFormData({ ...createFormData, plan: e.target.value })}
                                        >
                                            <option value="basic">Basic (10 tables, 5 staff)</option>
                                            <option value="professional">Professional (30 tables, 15 staff)</option>
                                            <option value="enterprise">Enterprise (Unlimited)</option>
                                        </select>
                                    </div>
                                    <div className="border-t pt-3 mt-1">
                                        <p className="text-sm font-semibold text-muted-foreground mb-3">Owner Details</p>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label className="text-right">Full Name</Label>
                                        <Input
                                            value={createFormData.ownerName}
                                            onChange={(e) => setCreateFormData({ ...createFormData, ownerName: e.target.value })}
                                            className="col-span-3"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label className="text-right">Email</Label>
                                        <Input
                                            type="email"
                                            value={createFormData.ownerEmail}
                                            onChange={(e) => setCreateFormData({ ...createFormData, ownerEmail: e.target.value })}
                                            className="col-span-3"
                                            placeholder="owner@restaurant.com"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label className="text-right">Password</Label>
                                        <Input
                                            type="password"
                                            value={createFormData.ownerPassword}
                                            onChange={(e) => setCreateFormData({ ...createFormData, ownerPassword: e.target.value })}
                                            className="col-span-3"
                                            placeholder="Minimum 6 characters"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                                    <Button onClick={handleCreateRestaurant}>Create Restaurant</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Restaurants Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>All Restaurants</CardTitle>
                            <CardDescription>
                                {filteredRestaurants.length} restaurant{filteredRestaurants.length !== 1 ? "s" : ""} found
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Restaurant</TableHead>
                                        <TableHead>Owner</TableHead>
                                        <TableHead>Plan</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRestaurants.map((restaurant) => (
                                        <TableRow key={restaurant._id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{restaurant.name}</p>
                                                    <p className="text-xs text-muted-foreground">{restaurant.slug}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="text-sm">{restaurant.owner?.fullName || "—"}</p>
                                                    <p className="text-xs text-muted-foreground">{restaurant.owner?.email || "—"}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`text-xs px-2 py-1 rounded border font-medium ${getPlanBadgeColor(restaurant.subscription?.plan)}`}>
                                                    {PLAN_LABELS[restaurant.subscription?.plan] || "Basic"}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`text-xs px-2 py-1 rounded border font-medium capitalize ${getStatusBadgeColor(restaurant.status)}`}>
                                                    {restaurant.status || "trial"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(restaurant.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleOpenManage(restaurant)}
                                                >
                                                    <Settings className="h-3.5 w-3.5 mr-1.5" />
                                                    Manage
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredRestaurants.length === 0 && !loading && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                {searchQuery ? "No restaurants match your search." : "No restaurants yet. Create the first one!"}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* === MANAGE RESTAURANT DIALOG === */}
            <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
                <DialogContent className="sm:max-w-[520px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5 text-primary" />
                            Manage: {selectedRestaurant?.name}
                        </DialogTitle>
                        <DialogDescription>
                            Update plan, status, restaurant name, or reset the owner's password.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-5 py-4">
                        {/* Owner Info (read-only) */}
                        <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Owner Info</p>
                            <p className="text-sm font-medium">{selectedRestaurant?.owner?.fullName || "—"}</p>
                            <p className="text-sm text-muted-foreground">{selectedRestaurant?.owner?.email || "—"}</p>
                        </div>

                        {/* Restaurant Name */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-sm">Restaurant Name</Label>
                            <Input
                                value={manageFormData.restaurantName}
                                onChange={(e) => setManageFormData({ ...manageFormData, restaurantName: e.target.value })}
                                className="col-span-3"
                            />
                        </div>

                        {/* Plan */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-sm">Plan</Label>
                            <select
                                className="col-span-3 p-2 border rounded bg-background text-foreground"
                                value={manageFormData.plan}
                                onChange={(e) => setManageFormData({ ...manageFormData, plan: e.target.value })}
                            >
                                <option value="basic">Basic (10 tables, 5 staff)</option>
                                <option value="professional">Professional (30 tables, 15 staff)</option>
                                <option value="enterprise">Enterprise (Unlimited)</option>
                            </select>
                        </div>

                        {/* Status */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-sm">Status</Label>
                            <select
                                className="col-span-3 p-2 border rounded bg-background text-foreground"
                                value={manageFormData.status}
                                onChange={(e) => setManageFormData({ ...manageFormData, status: e.target.value })}
                            >
                                {STATUS_OPTIONS.map((s) => (
                                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                ))}
                            </select>
                        </div>

                        {/* Owner Password Reset */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-sm">New Password</Label>
                            <div className="col-span-3 relative">
                                <Input
                                    type={showNewPassword ? "text" : "password"}
                                    placeholder="Leave blank to keep current"
                                    value={manageFormData.ownerPassword}
                                    onChange={(e) => setManageFormData({ ...manageFormData, ownerPassword: e.target.value })}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
                        {/* Delete button on the left */}
                        <Button
                            variant="destructive"
                            onClick={() => setDeleteConfirmOpen(true)}
                            className="sm:mr-auto"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Restaurant
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setManageDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSaveChanges} disabled={saving}>
                                {saving ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* === DELETE CONFIRMATION === */}
            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{selectedRestaurant?.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the restaurant, all its staff accounts, tables, orders, bills, and subscriptions.
                            <strong className="block mt-2 text-destructive">This action CANNOT be undone.</strong>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleDeleteRestaurant}
                            disabled={deleting}
                        >
                            {deleting ? "Deleting..." : "Yes, Delete Everything"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default PlatformDashboard;
