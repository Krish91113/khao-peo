import { useState } from "react";
import { motion } from "framer-motion";
import { menuAPI, MenuItem } from "@/api/menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Edit, Trash2, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const CATEGORIES = [
    "Main Course",
    "Breads",
    "Rice & Pulao",
    "Soups & Salads",
    "Starters",
    "Desserts",
    "Beverages",
    "Extras",
];

export default function FoodMenuManagement() {
    const queryClient = useQueryClient();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [formData, setFormData] = useState({
        name: "",
        category: "Main Course",
        price: 0,
        description: "",
        available: true,
    });

    const { data: menuItems = [], isLoading } = useQuery({
        queryKey: ["menu"],
        queryFn: menuAPI.getAll,
        refetchInterval: 5000,
    });

    const createMutation = useMutation({
        mutationFn: menuAPI.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["menu"] });
            toast.success("Menu item created successfully");
            setIsCreateDialogOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create menu item");
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<MenuItem> }) =>
            menuAPI.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["menu"] });
            toast.success("Menu item updated successfully");
            setIsEditDialogOpen(false);
            setSelectedItem(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update menu item");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: menuAPI.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["menu"] });
            toast.success("Menu item deleted successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to delete menu item");
        },
    });

    const toggleAvailabilityMutation = useMutation({
        mutationFn: menuAPI.toggleAvailability,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["menu"] });
            toast.success("Availability updated");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update availability");
        },
    });

    const resetForm = () => {
        setFormData({
            name: "",
            category: "Main Course",
            price: 0,
            description: "",
            available: true,
        });
    };

    const handleCreate = () => {
        if (!formData.name || formData.price <= 0) {
            toast.error("Please fill all required fields");
            return;
        }
        createMutation.mutate(formData);
    };

    const handleEdit = (item: MenuItem) => {
        setSelectedItem(item);
        setFormData({
            name: item.name,
            category: item.category,
            price: item.price,
            description: item.description || "",
            available: item.available,
        });
        setIsEditDialogOpen(true);
    };

    const handleUpdate = () => {
        if (!selectedItem) return;
        updateMutation.mutate({
            id: selectedItem._id || selectedItem.id || "",
            data: formData,
        });
    };

    const filteredItems = menuItems.filter((item: MenuItem) => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    if (isLoading) {
        return <div className="text-center py-8">Loading menu...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-bold">Food Menu Management</h3>
                    <p className="text-muted-foreground">Manage menu items and pricing</p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Menu Item
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Menu Item</DialogTitle>
                            <DialogDescription>Add a new item to the menu</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>Item Name *</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Butter Chicken"
                                />
                            </div>
                            <div>
                                <Label>Category *</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map((cat) => (
                                            <SelectItem key={cat} value={cat}>
                                                {cat}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Price (₹) *</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) =>
                                        setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                                    }
                                    placeholder="250"
                                />
                            </div>
                            <div>
                                <Label>Description</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Delicious butter chicken..."
                                    rows={3}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreate} disabled={createMutation.isPending}>
                                {createMutation.isPending ? "Creating..." : "Create Item"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <Input
                    placeholder="Search menu items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="md:w-1/3"
                />
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="md:w-1/4">
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                                {cat}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Menu Items Grid */}
            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
                {filteredItems.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        No menu items found
                    </div>
                ) : (
                    filteredItems.map((item: MenuItem) => (
                        <motion.div key={item._id || item.id} variants={staggerItem}>
                            <Card>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg">{item.name}</CardTitle>
                                            <Badge variant="outline" className="mt-2">
                                                {item.category}
                                            </Badge>
                                        </div>
                                        {!item.available && (
                                            <Badge variant="destructive">Unavailable</Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {item.description && (
                                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                            {item.description}
                                        </p>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <span className="text-xl font-bold">₹{item.price.toFixed(2)}</span>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(item)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    toggleAvailabilityMutation.mutate(item._id || item.id || "")
                                                }
                                            >
                                                {item.available ? (
                                                    <PowerOff className="h-4 w-4 text-destructive" />
                                                ) : (
                                                    <Power className="h-4 w-4 text-success" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => {
                                                    if (confirm(`Delete ${item.name}?`)) {
                                                        deleteMutation.mutate(item._id || item.id || "");
                                                    }
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))
                )}
            </motion.div>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Menu Item</DialogTitle>
                        <DialogDescription>Update menu item details</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Item Name *</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Category *</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData({ ...formData, category: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Price (₹) *</Label>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) =>
                                    setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                                }
                            />
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsEditDialogOpen(false);
                                setSelectedItem(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? "Updating..." : "Update Item"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
