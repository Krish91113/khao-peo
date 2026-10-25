import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChefHat, CheckCircle2, Clock3, Flame, LogOut, RefreshCw, Timer, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { authAPI } from "@/api/auth";
import { kitchenAPI, type KitchenItemStatus, type KitchenTicket } from "@/api/kitchen";
import { onKitchenEvent } from "@/lib/realtime";
import ShiftTracker from "@/components/ShiftTracker";

const STATUS_LABELS: Record<string, string> = {
  received: "New",
  preparing: "Preparing",
  partially_ready: "Partially ready",
  ready: "Ready",
};

function elapsedMinutes(createdAt: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000));
}

function nextStatus(item: KitchenItemStatus): KitchenItemStatus | null {
  if (item === "received") return "preparing";
  if (item === "preparing") return "ready";
  if (item === "partially_ready") return "ready";
  return null;
}

const CookDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<{ fullName?: string; full_name?: string; role?: string } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      const user = stored ? JSON.parse(stored) : null;
      if (!localStorage.getItem("token") || user?.role !== "cook") {
        navigate("/auth", { replace: true });
        return;
      }
      setProfile(user);
    } catch {
      navigate("/auth", { replace: true });
    }
  }, [navigate]);

  const dashboard = useQuery({
    queryKey: ["kitchen", "cook-dashboard"],
    queryFn: kitchenAPI.getDashboard,
    refetchInterval: 15000,
    enabled: Boolean(profile),
  });

  useEffect(() => onKitchenEvent(() => {
    void queryClient.invalidateQueries({ queryKey: ["kitchen", "cook-dashboard"] });
  }), [queryClient]);

  const transition = useMutation({
    mutationFn: ({ itemId, status }: { itemId: string; status: KitchenItemStatus }) => kitchenAPI.updateItemStatus(itemId, status),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["kitchen", "cook-dashboard"] }),
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Kitchen status update failed"),
  });

  const priority = useMutation({
    mutationFn: ({ ticketId, value }: { ticketId: string; value: number }) => kitchenAPI.setPriority(ticketId, value),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["kitchen", "cook-dashboard"] }),
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Priority update failed"),
  });

  const columns = useMemo(() => {
    const tickets = dashboard.data?.tickets ?? [];
    return {
    received: tickets.filter((ticket) => ticket.status === "received"),
    preparing: tickets.filter((ticket) => ticket.status === "preparing"),
    partially_ready: tickets.filter((ticket) => ticket.status === "partially_ready"),
    ready: tickets.filter((ticket) => ticket.status === "ready"),
    };
  }, [dashboard.data?.tickets]);

  const signOut = () => {
    authAPI.logout();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#261814] text-[#261814]">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-[#3c2d28] px-4 py-4 text-white sm:px-6">
        <div className="flex items-center gap-3"><ChefHat className="h-7 w-7 text-[#ffb59b]" /><div><h1 className="font-bold">Cook Dashboard</h1><p className="text-xs text-[#ffb59b]">Kitchen operations command center</p></div></div>
        <div className="flex items-center gap-3"><span className="hidden text-sm text-[#f7ddd5] sm:inline">{profile?.fullName || profile?.full_name || "Cook"}</span><button onClick={signOut} className="flex items-center gap-2 rounded-md border border-white/20 px-3 py-2 text-sm"><LogOut className="h-4 w-4" /> Sign out</button></div>
      </header>

      <main className="space-y-6 p-4 sm:p-6">
        <ShiftTracker />
        {dashboard.isError && <div className="flex items-center justify-between rounded-lg bg-red-100 p-4 text-red-800"><span>Unable to load the kitchen board.</span><button className="flex items-center gap-2 font-semibold" onClick={() => void dashboard.refetch()}><RefreshCw className="h-4 w-4" /> Retry</button></div>}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
          {([
            ["New", dashboard.data?.new_ticket_count ?? 0, ChefHat], ["Preparing", dashboard.data?.preparing_count ?? 0, Flame], ["Partial", dashboard.data?.partially_ready_count ?? 0, UtensilsCrossed], ["Ready", dashboard.data?.ready_count ?? 0, CheckCircle2], ["Delayed", dashboard.data?.delayed_count ?? 0, Timer], ["Completed", dashboard.data?.completed_today ?? 0, CheckCircle2], ["Avg prep", `${dashboard.data?.average_prep_time_minutes ?? 0}m`, Clock3], ["On time", `${dashboard.data?.on_time_rate ?? 0}%`, CheckCircle2],
          ] as Array<[string, string | number, LucideIcon]>).map(([label, value, Icon]) => <div key={label} className="rounded-xl bg-white p-4 shadow-sm"><Icon className="mb-2 h-5 w-5 text-[#E85D25]" /><p className="text-xs uppercase tracking-wide text-[#8d7167]">{label}</p><p className="text-2xl font-bold">{String(value)}</p></div>)}
        </section>

        <section className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-bold">Live Kitchen</h2><p className="text-sm text-[#8d7167]">Load: <span className="font-semibold capitalize">{dashboard.data?.kitchen_load ?? "—"}</span></p></div><button onClick={() => void dashboard.refetch()} className="rounded-md border p-2" aria-label="Refresh kitchen"><RefreshCw className="h-4 w-4" /></button></div>
          <div className="grid gap-4 lg:grid-cols-4">
            {(["received", "preparing", "partially_ready", "ready"] as const).map((status) => <div key={status} className="min-h-48 rounded-lg bg-[#fff8f6] p-3"><h3 className="mb-3 flex items-center justify-between font-semibold">{STATUS_LABELS[status]} <span className="rounded-full bg-[#E85D25] px-2 py-0.5 text-xs text-white">{columns[status].length}</span></h3>{columns[status].length === 0 ? <p className="py-8 text-center text-sm text-[#8d7167]">No active tickets</p> : <div className="space-y-3">{columns[status].map((ticket) => <TicketCard key={ticket._id} ticket={ticket} busy={transition.isPending} onTransition={(itemId, next) => transition.mutate({ itemId, status: next })} onPriority={(value) => priority.mutate({ ticketId: ticket._id, value })} />)}</div>}</div>)}
          </div>
        </section>
      </main>
    </div>
  );
};

function TicketCard({ ticket, busy, onTransition, onPriority }: { ticket: KitchenTicket; busy: boolean; onTransition: (itemId: string, status: KitchenItemStatus) => void; onPriority: (priority: number) => void }) {
  const minutes = elapsedMinutes(ticket.createdAt);
  const delayed = minutes >= 15 && ticket.status !== "ready";
  return <article className={`rounded-lg border bg-white p-3 shadow-sm ${delayed ? "border-red-400" : "border-[#e1bfb4]"}`}><div className="mb-2 flex items-center justify-between"><div><p className="text-xs font-bold uppercase text-[#8d7167]">Order {ticket.orderId.slice(-6)}</p><p className={`text-xs ${delayed ? "font-bold text-red-600" : "text-[#8d7167]"}`}>{minutes}m {delayed ? "· Delayed" : "elapsed"}</p></div><button onClick={() => onPriority(ticket.priority >= 10 ? 0 : 10)} className={`rounded px-2 py-1 text-xs font-bold ${ticket.priority >= 10 ? "bg-red-100 text-red-700" : "bg-[#fff1ec] text-[#E85D25]"}`}>{ticket.priority >= 10 ? "Urgent" : "Priority"}</button></div><div className="space-y-2">{ticket.items.map((item) => { const next = nextStatus(item.status); return <div key={item._id || item.itemId} className="flex items-center justify-between gap-2 border-b border-dashed border-[#e1bfb4] pb-2 text-sm last:border-0"><span><b>{item.quantity}×</b> {item.itemName}<small className="ml-1 block text-xs text-[#8d7167]">{STATUS_LABELS[item.status]}</small></span>{next && <button disabled={busy} onClick={() => item._id && onTransition(item._id, next)} className="rounded bg-[#E85D25] px-2 py-1 text-xs font-semibold text-white disabled:opacity-50">{next === "preparing" ? "Start" : "Ready"}</button>}</div>; })}</div></article>;
}

export default CookDashboard;
