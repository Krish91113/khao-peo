import { useState } from "react";
import { motion } from "framer-motion";
import { usersAPI, User } from "@/api/users";
import { superadminAPI } from "@/api/superadmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { UserPlus, Edit, Trash2, Power, PowerOff, Users, Shield, UserCog } from "lucide-react";
import { toast } from "sonner";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function UserManagement() {
    const queryClient = useQueryClient();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        full_name: "",
        role: "waiter" as "admin" | "waiter",
    });

    // Fetch all users using superadmin API
    const { data: usersData, isLoading } = useQuery({
        queryKey: ["superadmin-users"],
        queryFn: superadminAPI.getAllUsers,
        refetchInterval: 5000,
    });

    // Fetch user statistics
    const { data: statsData } = useQuery({
        queryKey: ["superadmin-stats"],
        queryFn: superadminAPI.getUserStats,
        refetchInterval: 10000,
    });

    const users = usersData?.users || [];
    const stats = statsData?.stats || {};

    const createMutation = useMutation({
        mutationFn: usersAPI.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["superadmin-users"] });
            queryClient.invalidateQueries({ queryKey: ["superadmin-stats"] });
            toast.success("User created successfully");
            setIsCreateDialogOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create user");
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
            usersAPI.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["superadmin-users"] });
            queryClient.invalidateQueries({ queryKey: ["superadmin-stats"] });
            toast.success("User updated successfully");
            setIsEditDialogOpen(false);
            setSelectedUser(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update user");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: usersAPI.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["superadmin-users"] });
            queryClient.invalidateQueries({ queryKey: ["superadmin-stats"] });
            toast.success("User deleted successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to delete user");
        },
    });

    const toggleActiveMutation = useMutation({
        mutationFn: usersAPI.toggleActive,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["superadmin-users"] });
            queryClient.invalidateQueries({ queryKey: ["superadmin-stats"] });
            toast.success("User status updated");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update status");
        },
    });

    const resetForm = () => {
        setFormData({
            email: "",
            password: "",
            full_name: "",
            role: "waiter",
        });
    };

    const handleCreate = () => {
        if (!formData.email || !formData.password || !formData.full_name) {
            toast.error("Please fill all fields");
            return;
        }
        createMutation.mutate(formData);
    };

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setFormData({
            email: user.email,
            password: "",
            full_name: user.full_name || user.fullName || "",
            role: user.role as "admin" | "waiter",
        });
        setIsEditDialogOpen(true);
    };

    const handleUpdate = () => {
        if (!selectedUser) return;
        const updateData: Partial<User> = {
            full_name: formData.full_name,
            role: formData.role,
        };
        if (formData.password) {
            (updateData as any).password = formData.password;
        }
        updateMutation.mutate({
            id: selectedUser._id || selectedUser.id || "",
            data: updateData,
        });
    };

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case "superadmin":
            case "owner":
                return "default";
            case "admin":
                return "secondary";
            case "waiter":
                return "outline";
            default:
                return "outline";
        }
    };

    if (isLoading) {
        return <div className="text-center py-8">Loading users...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Total Users
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Admins
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.admins || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <UserCog className="h-4 w-4" />
                            Owners
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.owners || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Waiters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.waiters || 0}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-bold">User Management</h3>
                    <p className="text-muted-foreground">Manage admin and waiter accounts</p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add User
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New User</DialogTitle>
                            <DialogDescription>
                                Add a new admin or waiter account to the system
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>Full Name</Label>
                                <Input
                                    value={formData.full_name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, full_name: e.target.value })
                                    }
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData({ ...formData, email: e.target.value })
                                    }
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div>
                                <Label>Password</Label>
                                <Input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData({ ...formData, password: e.target.value })
                                    }
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <Label>Role</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(value: "admin" | "waiter") =>
                                        setFormData({ ...formData, role: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="waiter">Waiter</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreate} disabled={createMutation.isPending}>
                                {createMutation.isPending ? "Creating..." : "Create User"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid gap-4"
            >
                {users.map((user, index) => (
                    <motion.div key={user._id || user.id} variants={staggerItem}>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="font-semibold text-lg">
                                                {user.full_name || user.fullName}
                                            </h4>
                                            <Badge variant={getRoleBadgeVariant(user.role)}>
                                                {user.role}
                                            </Badge>
                                            {(user.is_active === false || user.isActive === false) && (
                                                <Badge variant="destructive">Inactive</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                        {(user.last_login || user.lastLogin) && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Last login:{" "}
                                                {new Date(
                                                    user.last_login || user.lastLogin || ""
                                                ).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {user.role !== "superadmin" && user.role !== "owner" && (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEdit(user)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        toggleActiveMutation.mutate(user._id || user.id || "")
                                                    }
                                                >
                                                    {user.is_active !== false && user.isActive !== false ? (
                                                        <PowerOff className="h-4 w-4 text-destructive" />
                                                    ) : (
                                                        <Power className="h-4 w-4 text-success" />
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => {
                                                        if (
                                                            confirm(
                                                                `Are you sure you want to delete ${user.full_name || user.fullName
                                                                }?`
                                                            )
                                                        ) {
                                                            deleteMutation.mutate(user._id || user.id || "");
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>Update user information</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Full Name</Label>
                            <Input
                                value={formData.full_name}
                                onChange={(e) =>
                                    setFormData({ ...formData, full_name: e.target.value })
                                }
                            />
                        </div>
                        <div>
                            <Label>Email</Label>
                            <Input value={formData.email} disabled />
                        </div>
                        <div>
                            <Label>New Password (leave blank to keep current)</Label>
                            <Input
                                type="password"
                                value={formData.password}
                                onChange={(e) =>
                                    setFormData({ ...formData, password: e.target.value })
                                }
                                placeholder="••••••••"
                            />
                        </div>
                        <div>
                            <Label>Role</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(value: "admin" | "waiter") =>
                                    setFormData({ ...formData, role: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="waiter">Waiter</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsEditDialogOpen(false);
                                setSelectedUser(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? "Updating..." : "Update User"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
