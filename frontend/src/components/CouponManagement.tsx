import { useEffect, useState } from "react";
import { toast } from "sonner";
import { couponsAPI, type Coupon } from "@/api/coupons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CouponManagement() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [code, setCode] = useState("");
  const [value, setValue] = useState("10");
  const load = async () => { try { setCoupons((await couponsAPI.list()) as Coupon[]); } catch { toast.error("Unable to load coupons"); } };
  useEffect(() => { void load(); }, []);
  const create = async () => { const discountValue = Number(value); if (!code.trim() || !Number.isFinite(discountValue) || discountValue <= 0 || discountValue > 100) return toast.error("Enter a valid percentage coupon"); try { await couponsAPI.create({ code: code.trim(), discountType: "percentage", discountValue }); setCode(""); await load(); toast.success("Coupon created"); } catch { toast.error("Unable to create coupon"); } };
  return <div className="space-y-5"><div className="flex gap-2"><Input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Coupon code" /><Input className="max-w-24" type="number" value={value} onChange={(event) => setValue(event.target.value)} /><Button onClick={() => void create()}>Create coupon</Button></div><div className="grid gap-3">{coupons.map((coupon) => <div className="rounded-lg border bg-white p-4" key={coupon._id}><strong>{coupon.code}</strong><span className="ml-3 text-sm text-muted-foreground">{coupon.discountValue}% off · used {coupon.usedCount}</span></div>)}</div></div>;
}
