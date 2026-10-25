import { useEffect, useState } from "react";
import { toast } from "sonner";
import { inventoryAPI, type InventoryItem } from "@/api/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function InventoryManagement() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try { const result = await inventoryAPI.list(); setItems((result as unknown as InventoryItem[]) || []); }
    catch { toast.error("Unable to load inventory"); }
  };
  useEffect(() => { void load(); }, []);

  const create = async () => {
    if (!name.trim()) return toast.error("Enter an item name");
    setBusy(true);
    try { await inventoryAPI.create({ name: name.trim(), unit }); setName(""); await load(); toast.success("Inventory item created"); }
    catch { toast.error("Unable to create inventory item"); }
    finally { setBusy(false); }
  };

  const move = async (item: InventoryItem, type: "stock_in" | "stock_out") => {
    const value = window.prompt(`${type === "stock_in" ? "Add" : "Remove"} quantity for ${item.name}`);
    const quantity = Number(value);
    if (!Number.isFinite(quantity) || quantity <= 0) return;
    try { await inventoryAPI.transaction(item._id, { type, quantity }); await load(); toast.success("Stock updated"); }
    catch { toast.error("Unable to update stock"); }
  };

  return <div className="space-y-5">
    <div className="flex gap-2"><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Item name" /><Input className="max-w-28" value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="Unit" /><Button disabled={busy} onClick={() => void create()}>Add item</Button></div>
    <div className="grid gap-3">{items.map((item) => <div key={item._id} className="flex items-center justify-between rounded-lg border bg-white p-4"><div><p className="font-medium">{item.name}</p><p className="text-sm text-muted-foreground">{item.quantity} {item.unit}{item.quantity <= item.lowStockThreshold ? " · Low stock" : ""}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => void move(item, "stock_in")}>Stock in</Button><Button size="sm" variant="outline" onClick={() => void move(item, "stock_out")}>Stock out</Button></div></div>)}</div>
  </div>;
}
