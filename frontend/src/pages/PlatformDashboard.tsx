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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, Building, DollarSign, Activity, Plus, Store, Search, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";

// Helper for API calls
const API_URL = "http://localhost:5000/api"; // Should come from config
const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
};

const PlatformDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("overview");
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        ownerName: "",
        ownerEmail: "",
        ownerPassword: "",
        plan: "basic",
    });

    // Fetch initial data
    useEffect(() => {
        fetchRestaurants();
    }, []);

    const fetchRestaurants = async () => {
        try {
            const res = await axios.get(`${API_URL}/platform/restaurants`, getAuthHeader());
            setRestaurants(res.data.restaurants || []);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch data", error);
            toast.error("Failed to load dashboard data");
            setLoading(false);
        }
    };

    const handleCreateRestaurant = async () => {
        try {
            const payload = {
                name: formData.name,
                slug: formData.slug,
                address: { street: "123 Main St", city: "Mumbai", state: "MH", pincode: "400001" }, // Mocked for simplicity
                contact: { phone: "9876543210", email: "contact@example.com" }, // Mocked
                business: { gstNumber: "27AAAAA0000A1Z5", fssaiNumber: "12345678901234" }, // Mocked
                owner: {
                    fullName: formData.ownerName,
                    email: formData.ownerEmail,
                    password: formData.ownerPassword,
                },
                plan: formData.plan,
            };

            await axios.post(`${API_URL}/platform/restaurants`, payload, getAuthHeader());
            toast.success("Restaurant created successfully!");
            setCreateDialogOpen(false);
            fetchRestaurants();
        } catch (error) {
            console.error("Create error", error);
            toast.error(error.response?.data?.message || "Failed to create restaurant");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/auth");
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Platform Dashboard</h1>
                    <p className="text-muted-foreground">Manage your SaaS restaurants and platform settings.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-sm font-medium">SuperAdmin</div>
                    <Button variant="outline" size="sm" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
                    <TabsTrigger value="settings">Platform Settings</TabsTrigger>
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
                                <p className="text-xs text-muted-foreground">+2 from last month</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">₹45,231.89</div>
                                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{restaurants.length}</div>
                                <p className="text-xs text-muted-foreground">+12 since last hour</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Users (Global)</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">+573</div>
                                <p className="text-xs text-muted-foreground">+201 since last week</p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Restaurants Tab */}
                <TabsContent value="restaurants" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Input placeholder="Search restaurants..." className="w-[300px]" />
                            <Button variant="outline"><Search className="h-4 w-4" /></Button>
                        </div>

                        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button><Plus className="mr-2 h-4 w-4" /> Add Restaurant</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Add New Restaurant</DialogTitle>
                                    <DialogDescription>
                                        Create a new tenant for the platform. This will create an owner account.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="name" className="text-right">Name</Label>
                                        <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="col-span-3" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="slug" className="text-right">Slug (ID)</Label>
                                        <Input id="slug" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} className="col-span-3" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="plan" className="text-right">Plan</Label>
                                        <select id="plan" className="col-span-3 p-2 border rounded" value={formData.plan} onChange={(e) => setFormData({ ...formData, plan: e.target.value })}>
                                            <option value="basic">Basic</option>
                                            <option value="professional">Professional</option>
                                            <option value="enterprise">Enterprise</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="ownerName" className="text-right">Owner Name</Label>
                                        <Input id="ownerName" value={formData.ownerName} onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })} className="col-span-3" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="ownerEmail" className="text-right">Owner Email</Label>
                                        <Input id="ownerEmail" value={formData.ownerEmail} onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })} className="col-span-3" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="ownerPass" className="text-right">Password</Label>
                                        <Input id="ownerPass" type="password" value={formData.ownerPassword} onChange={(e) => setFormData({ ...formData, ownerPassword: e.target.value })} className="col-span-3" />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" onClick={handleCreateRestaurant}>Create Restaurant</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Restaurants List</CardTitle>
                            <CardDescription>Manage all onboarded restaurants.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Slug</TableHead>
                                        <TableHead>Plan</TableHead>
                                        <TableHead>Using Since</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {restaurants.map((restaurant) => (
                                        <TableRow key={restaurant._id}>
                                            <TableCell className="font-medium">{restaurant.name}</TableCell>
                                            <TableCell>{restaurant.slug}</TableCell>
                                            <TableCell><Badge variant="outline" className="uppercase">{restaurant.status}</Badge></TableCell>
                                            <TableCell>{new Date(restaurant.createdAt).toLocaleDateString()}</TableCell>
                                            <TableCell>{restaurant.status === 'active' ? <span className="text-green-500">Active</span> : <span className="text-yellow-500">Trial</span>}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm">Manage</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {restaurants.length === 0 && !loading && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-4">No restaurants found. Create one!</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default PlatformDashboard;
