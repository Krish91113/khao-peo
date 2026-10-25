import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { attendanceAPI } from "@/api/attendance";
import { useAttendanceRealtime } from "@/hooks/useAttendanceRealtime";
import { LogIn, Coffee, Clock, TimerReset } from "lucide-react";
import PendingAttendanceRequests from "./PendingAttendanceRequests";

function formatMinutes(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
}

function formatClock(iso: string | null): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
    checked_in: { label: "Checked In", bg: "#e8f5e9", color: "#22C55E" },
    on_break: { label: "On Break", bg: "#fdf4e3", color: "#F59E0B" },
    checked_out: { label: "Checked Out", bg: "#eef0f2", color: "#8d7167" },
};

const ShiftTracker = () => {
    // Realtime: invalidate attendance queries when any attendance event arrives.
    useAttendanceRealtime();

    const currentUserId = (() => {
        try {
            const stored = localStorage.getItem('user');
            const parsed = stored ? JSON.parse(stored) : null;
            return parsed?.id ?? parsed?._id ?? null;
        } catch {
            return null;
        }
    })();

    const { data: active = [] } = useQuery({
        queryKey: ["attendance", "active"],
        queryFn: attendanceAPI.listActive,
        refetchInterval: 10000,
        refetchIntervalInBackground: true,
    });

    const record = currentUserId
        ? (active.find((a) => String(a.user_id) === String(currentUserId)) ?? null)
        : (active.find((a) => a.is_active) ?? active[0] ?? null);

    const elapsed = useMemo(() => {
        if (!record?.checked_in_at) return null;
        const now = new Date();
        const total = Math.floor(
            (now.getTime() - new Date(record.checked_in_at).getTime()) / 60000,
        );
        return Math.max(0, total - (record?.total_break_minutes ?? 0));
    }, [record]);

    const status = record?.status ?? "checked_out";
    const meta = STATUS_META[status] ?? STATUS_META.checked_out;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
        >
            {/* Pending Requests for this user */}
            <PendingAttendanceRequests />

            {/* Read-Only Shift Overview */}
            <div
                className="bg-white rounded-xl p-6"
                style={{ border: "1px solid #e1bfb4", boxShadow: "0 2px 8px rgba(38,24,20,0.04)" }}
            >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: meta.bg }}
                        >
                            {status === "on_break" ? (
                                <Coffee className="h-6 w-6" style={{ color: meta.color }} />
                            ) : status === "checked_in" ? (
                                <LogIn className="h-6 w-6" style={{ color: meta.color }} />
                            ) : (
                                <TimerReset className="h-6 w-6" style={{ color: meta.color }} />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-lg" style={{ fontFamily: "Sora, sans-serif", color: "#261814" }}>
                                    My Shift Status
                                </h3>
                                <span
                                    className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                                    style={{ backgroundColor: meta.bg, color: meta.color }}
                                >
                                    {meta.label}
                                </span>
                            </div>
                            <p className="text-sm mt-0.5" style={{ color: "#594139" }}>
                                {status === "checked_out"
                                    ? "Not currently on shift"
                                    : `Checked in at ${formatClock(record?.checked_in_at ?? null)}`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "#8d7167" }}>
                                Time Worked
                            </p>
                            <p className="text-sm font-bold" style={{ fontFamily: "Sora, sans-serif", color: "#261814" }}>
                                {status === "checked_out" ? "—" : formatMinutes(elapsed ?? 0)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "#8d7167" }}>
                                Breaks
                            </p>
                            <p className="text-sm font-bold" style={{ fontFamily: "Sora, sans-serif", color: "#261814" }}>
                                {record?.break_count ?? 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#e1bfb4] text-xs text-[#8d7167]">
                    <p className="italic">
                        Attendance actions (Check In/Out, Breaks) are managed by Admin/Owner and confirmed by you.
                    </p>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Clock className="h-3.5 w-3.5" />
                        Live sync
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ShiftTracker;
