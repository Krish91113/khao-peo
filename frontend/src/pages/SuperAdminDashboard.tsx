import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { authAPI } from "@/api/auth";
import { usersAPI } from "@/api/users";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UtensilsCrossed, LogOut, Users, TrendingUp, Activity } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import UserManagement from "@/components/UserManagement";
import { pageTransitionConfig } from "@/lib/animations";
import { useQuery } from "@tanstack/react-query";

const SuperAdminDashboard = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");

        if (!token || !userStr) {
            navigate("/auth");
            return;
        }

        try {
            const user = JSON.parse(userStr);
            // Allow owner and superadmin roles
            if (!["owner", "superadmin"].includes(user.role)) {
                toast.error("Access denied. SuperAdmin role required.");
                navigate("/");
                return;
            }
            setProfile(user);
        } catch (error) {
            console.error("Failed to parse user data:", error);
            navigate("/auth");
        }
    };

    const handleSignOut = async () => {
        authAPI.logout();
        toast.success("Signed out successfully");
        navigate("/");
    };

    // Disabled until backend APIs are ready
    // const { data: analytics } = useQuery({
    //     queryKey: ["sales-analytics"],
    //     queryFn: usersAPI.getSalesAnalytics,
    //     refetchInterval: 10000,
    // });

    // const { data: loginLogs = [] } = useQuery({
    //     queryKey: ["login-logs"],
    //     queryFn: usersAPI.getLoginLogs,
    //     refetchInterval: 10000,
    // });

    // Placeholder data until backend is ready
    const analytics = null;
    const loginLogs: any[] = [];

    return (
        <motion.div
            {...pageTransitionConfig}
            className="min-h-screen bg-gradient-to-b from-background to-muted/30"
        >
            {/* Header */}
            <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                        <UtensilsCrossed className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
                        <div className="min-w-0">
                            <h1 className="text-sm sm:text-xl font-bold truncate">KHAO PEEO</h1>
                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">SuperAdmin Dashboard</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-4">
                        <ThemeToggle />
                        <div className="text-right hidden lg:block">
                            <p className="text-sm font-medium">
                                {profile?.full_name || "SuperAdmin"}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                                {profile?.role}
                            </p>
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
                <div className="mb-4 sm:mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">System Management</h2>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Manage users, monitor activity, and view analytics
                    </p>
                </div>

                <Tabs defaultValue="users" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 h-auto">
                        <TabsTrigger value="users" className="text-xs sm:text-sm py-2 sm:py-2.5">
                            <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Users</span>
                            <span className="sm:hidden">Users</span>
                        </TabsTrigger>
                        <TabsTrigger value="analytics" className="text-xs sm:text-sm py-2 sm:py-2.5">
                            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Analytics</span>
                            <span className="sm:hidden">Stats</span>
                        </TabsTrigger>
                        <TabsTrigger value="activity" className="text-xs sm:text-sm py-2 sm:py-2.5">
                            <Activity className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Activity Logs</span>
                            <span className="sm:hidden">Logs</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="users">
                        <UserManagement />
                    </TabsContent>

                    <TabsContent value="analytics">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                            <Card>
                                <CardHeader className="pb-2 sm:pb-6">
                                    <CardTitle className="text-sm sm:text-base">Total Sales</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl sm:text-3xl font-bold">
                                        ₹{analytics?.totalSales?.toFixed(2) || "0.00"}
                                    </div>
                                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
                                        All time revenue
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2 sm:pb-6">
                                    <CardTitle className="text-sm sm:text-base">Total Orders</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl sm:text-3xl font-bold">
                                        {analytics?.totalOrders || 0}
                                    </div>
                                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
                                        Completed orders
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2 sm:pb-6">
                                    <CardTitle className="text-sm sm:text-base">Active Users</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl sm:text-3xl font-bold">
                                        {analytics?.activeUsers || 0}
                                    </div>
                                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
                                        Currently active
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2 sm:pb-6">
                                    <CardTitle className="text-sm sm:text-base">Today's Sales</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl sm:text-3xl font-bold">
                                        ₹{analytics?.todaySales?.toFixed(2) || "0.00"}
                                    </div>
                                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
                                        Revenue today
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2 sm:pb-6">
                                    <CardTitle className="text-sm sm:text-base">Average Order Value</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl sm:text-3xl font-bold">
                                        ₹{analytics?.averageOrderValue?.toFixed(2) || "0.00"}
                                    </div>
                                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
                                        Per order
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2 sm:pb-6">
                                    <CardTitle className="text-sm sm:text-base">Peak Hours</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl sm:text-3xl font-bold">
                                        {analytics?.peakHours || "N/A"}
                                    </div>
                                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
                                        Busiest time
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="activity">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base sm:text-lg">Recent Login Activity</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 sm:space-y-4">
                                    {loginLogs.length === 0 ? (
                                        <p className="text-center text-muted-foreground py-8 text-sm sm:text-base">
                                            No login activity recorded
                                        </p>
                                    ) : (
                                        loginLogs.slice(0, 20).map((log: any, index: number) => (
                                            <div
                                                key={index}
                                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-muted/50 rounded-lg gap-2 sm:gap-0"
                                            >
                                                <div className="min-w-0">
                                                    <p className="font-medium text-sm sm:text-base truncate">
                                                        {log.user?.full_name || log.user?.fullName || "Unknown"}
                                                    </p>
                                                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                                        {log.user?.email || "N/A"}
                                                    </p>
                                                </div>
                                                <div className="text-left sm:text-right">
                                                    <p className="text-xs sm:text-sm font-medium capitalize">
                                                        {log.user?.role || "N/A"}
                                                    </p>
                                                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                                                        {log.timestamp
                                                            ? new Date(log.timestamp).toLocaleString()
                                                            : "N/A"}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </motion.div>
    );
};

export default SuperAdminDashboard;
