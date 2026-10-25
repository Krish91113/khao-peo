import { useEffect, useState } from "react";
import { toast } from "sonner";
import { analyticsAPI, type OwnerSummary } from "@/api/analytics";

const money = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const initial: OwnerSummary = { grossSalesPaise: 0, discountsPaise: 0, netSalesPaise: 0, taxPaise: 0, collectedPaise: 0, outstandingPaise: 0, averageOrderValuePaise: 0, orderCount: 0, tableCount: 0, kitchenTicketCount: 0 };

export default function AnalyticsDashboard() {
  const [summary, setSummary] = useState(initial);
  const [kitchen, setKitchen] = useState<{ averagePreparationMinutes: number; completedCount: number }>({ averagePreparationMinutes: 0, completedCount: 0 });
  const [staff, setStaff] = useState<Array<{ fullName: string; role: string; orders: number; salesPaise: number }>>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { Promise.all([analyticsAPI.summary(), analyticsAPI.kitchen(), analyticsAPI.staff()]).then(([nextSummary, nextKitchen, nextStaff]) => { setSummary(nextSummary as OwnerSummary); setKitchen(nextKitchen); setStaff(nextStaff); }).catch(() => toast.error("Unable to load restaurant analytics")).finally(() => setLoading(false)); }, []);
  if (loading) return <p className="text-sm text-muted-foreground">Loading analytics...</p>;
  const cards = [["Gross sales", money(summary.grossSalesPaise)], ["Net sales", money(summary.netSalesPaise)], ["Discounts", money(summary.discountsPaise)], ["Tax", money(summary.taxPaise)], ["Collected", money(summary.collectedPaise)], ["Outstanding", money(summary.outstandingPaise)], ["Average order", money(summary.averageOrderValuePaise)], ["Table turnover", `${summary.orderCount} orders / ${summary.tableCount} tables`]];
  return <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label, value]) => <div className="rounded-xl border bg-white p-4" key={label}><p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-2 text-xl font-bold">{value}</p></div>)}</div><div className="grid gap-4 md:grid-cols-2"><div className="rounded-xl border bg-white p-5"><h3 className="font-semibold">Kitchen performance</h3><p className="mt-3 text-sm">Average preparation time: <strong>{kitchen.averagePreparationMinutes} minutes</strong></p><p className="text-sm text-muted-foreground">Completed tickets: {kitchen.completedCount}</p></div><div className="rounded-xl border bg-white p-5"><h3 className="font-semibold">Staff performance</h3><div className="mt-3 space-y-2">{staff.length === 0 ? <p className="text-sm text-muted-foreground">No staff order data for this period.</p> : staff.slice(0, 8).map((member) => <div className="flex justify-between text-sm" key={member.fullName + member.role}><span>{member.fullName} <small className="text-muted-foreground">({member.role})</small></span><span>{member.orders} orders · {money(member.salesPaise)}</span></div>)}</div></div></div></div>;
}
