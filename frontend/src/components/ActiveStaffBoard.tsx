import { useQuery } from "@tanstack/react-query";
import { attendanceAPI } from "@/api/attendance";
import { useAttendanceRealtime } from "@/hooks/useAttendanceRealtime";
import { Coffee, Users, RefreshCw } from "lucide-react";

function formatClock(iso: string | null): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
    checked_in: { label: "On Floor", bg: "#e8f5e9", color: "#22C55E" },
    on_break: { label: "On Break", bg: "#fdf4e3", color: "#F59E0B" },
};

const ActiveStaffBoard = () => {
    // Realtime: refetch the active board the moment anyone checks in/out.
    useAttendanceRealtime();

    const { data: records = [], refetch, isFetching } = useQuery({
        queryKey: ["attendance", "active"],
        queryFn: attendanceAPI.listActive,
        refetchInterval: 15000,
        refetchIntervalInBackground: true,
    });

    return (
        <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #e1bfb4", boxShadow: "0 2px 8px rgba(38,24,20,0.04)" }}>
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#fce3db" }}>
                        <Users className="h-5 w-5" style={{ color: "#E85D25" }} />
                    </div>
                    <div>
                        <h3 className="font-bold" style={{ fontFamily: "Sora, sans-serif", color: "#261814" }}>
                            Staff on Shift
                        </h3>
                        <p className="text-xs" style={{ color: "#8d7167" }}>
                            {records.length} active {records.length === 1 ? "record" : "records"}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => refetch()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all hover:opacity-80"
                    style={{ color: "#594139", border: "1px solid #e1bfb4" }}
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            {records.length === 0 ? (
                <div className="text-center py-10 rounded-xl" style={{ backgroundColor: "#fff8f6" }}>
                    <p className="text-sm" style={{ color: "#8d7167" }}>No staff currently checked in</p>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {records.map((record) => {
                        const meta = STATUS_META[record.status] ?? STATUS_META.checked_in;
                        return (
                            <div
                                key={record.id}
                                className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
                                style={{ backgroundColor: "#fff8f6", border: "1px solid #f0ddd5" }}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div
                                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: meta.bg }}
                                    >
                                        {record.status === "on_break" ? (
                                            <Coffee className="h-4 w-4" style={{ color: meta.color }} />
                                        ) : (
                                            <span className="w-2 h-2 rounded-full status-dot-pulse" style={{ backgroundColor: meta.color }} />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold truncate" style={{ color: "#261814" }}>
                                            {record.user?.full_name || "Staff"}
                                        </p>
                                        <p className="text-xs truncate" style={{ color: "#8d7167" }}>
                                            {record.user?.employee_code || "—"} · {record.user?.role || "—"} · since {formatClock(record.checked_in_at)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span
                                        className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full"
                                        style={{ backgroundColor: meta.bg, color: meta.color }}
                                    >
                                        {meta.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ActiveStaffBoard;
