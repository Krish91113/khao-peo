import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { attendanceAPI, type ActionRequestAction, type DashboardStaffItem } from "@/api/attendance";
import { errorMessage } from "@/lib/utils";
import { toast } from "sonner";
import { useAttendanceRealtime } from "@/hooks/useAttendanceRealtime";
import {
    Search,
    RefreshCw,
    Users,
    Clock,
    Coffee,
    LogOut,
    LogIn,
    Hourglass,
} from "lucide-react";
import AttendanceHistory from "./AttendanceHistory";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(iso: string | null): string {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function roleLabel(role: string): string {
    return role
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

function initials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");
}

function actionLabel(action: string): string {
    switch (action) {
        case "CHECK_IN":
            return "Check In";
        case "START_BREAK":
            return "Start Break";
        case "END_BREAK":
            return "End Break";
        case "CHECK_OUT":
            return "Check Out";
        default:
            return action;
    }
}

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
    OFF_DUTY: { label: "OFF DUTY", bg: "#f3f4f6", color: "#6b7280" },
    CHECKED_IN: { label: "ON FLOOR", bg: "#e8f5e9", color: "#22C55E" },
    ON_BREAK: { label: "ON BREAK", bg: "#fdf4e3", color: "#F59E0B" },
    CHECKED_OUT: { label: "OFF DUTY", bg: "#f3f4f6", color: "#6b7280" },
};

// ─── Sub-Component: Staff Card ───────────────────────────────────────────────

interface StaffCardProps {
    staff: DashboardStaffItem;
    onRequestAction: (userId: string, action: ActionRequestAction) => void;
    isLoadingAction: boolean;
}

const StaffAttendanceCard = ({ staff, onRequestAction, isLoadingAction }: StaffCardProps) => {
    const status = staff.attendance.status;
    const pending = staff.pending_request;
    const isPending = !!pending;
    const meta = STATUS_META[status] || STATUS_META.OFF_DUTY;

    // Green button logic
    const canGreen = (status === "OFF_DUTY" || status === "CHECKED_OUT" || status === "ON_BREAK") && !isPending;
    const greenAction: ActionRequestAction | null =
        status === "OFF_DUTY" || status === "CHECKED_OUT" ? "CHECK_IN" : status === "ON_BREAK" ? "END_BREAK" : null;
    const greenTooltip = status === "ON_BREAK" ? "Request End Break" : "Request Check In";

    // Grey button logic (Start Break)
    const canGrey = status === "CHECKED_IN" && !isPending;
    const greyTooltip = "Request Break";

    // Red button logic (Check Out)
    const canRed = status === "CHECKED_IN" && !isPending;
    const redTooltip = "Request Check Out";

    return (
        <div
            className="bg-white rounded-xl p-3.5 border border-[#e1bfb4] shadow-xs flex flex-col justify-between min-h-[160px] max-h-[190px] transition-all hover:border-[#E85D25]/40 hover:shadow-sm"
        >
            {/* Top Identity Row */}
            <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#fce3db] text-[#E85D25] flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {initials(staff.name)}
                </div>
                <div className="min-w-0 flex-1">
                    <h4
                        className="text-xs font-bold text-[#261814] truncate leading-tight"
                        style={{ fontFamily: "Sora, sans-serif" }}
                    >
                        {staff.name}
                    </h4>
                    <p className="text-[11px] text-[#8d7167] truncate">{roleLabel(staff.role)}</p>
                </div>
            </div>

            {/* Status / Pending Middle Section */}
            <div className="my-2 px-0.5">
                {isPending ? (
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                            PENDING {actionLabel(pending.action)}
                        </div>
                        <p className="text-[11px] text-amber-700 flex items-center gap-1">
                            <Hourglass className="h-3 w-3 animate-spin text-amber-600" />
                            <span>Waiting for {staff.name.split(" ")[0]}</span>
                        </p>
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                            <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: meta.color }}
                            />
                            <span
                                className="text-[11px] font-bold tracking-wider"
                                style={{ color: meta.color }}
                            >
                                ● {meta.label}
                            </span>
                        </div>
                        <p className="text-[11px] text-[#8d7167]">
                            {status === "CHECKED_IN" && `Since ${formatTime(staff.attendance.checked_in_at)}`}
                            {status === "ON_BREAK" && `Since ${formatTime(staff.attendance.current_break_started_at)}`}
                            {(status === "OFF_DUTY" || status === "CHECKED_OUT") && "Off Duty"}
                        </p>
                    </div>
                )}
            </div>

            {/* Circular Action Buttons */}
            <div className="flex items-center justify-around pt-2 border-t border-[#f0ddd5]">
                {/* Green Button */}
                <div className="flex flex-col items-center gap-0.5">
                    <button
                        type="button"
                        disabled={!canGreen || isLoadingAction}
                        onClick={() => greenAction && onRequestAction(staff.user_id, greenAction)}
                        title={greenTooltip}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${
                            canGreen && !isLoadingAction
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95 shadow-xs"
                                : "bg-gray-100 text-gray-300 border border-gray-200 cursor-not-allowed"
                        }`}
                    >
                        <LogIn className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-[9px] font-semibold text-[#8d7167]">In</span>
                </div>

                {/* Grey Button */}
                <div className="flex flex-col items-center gap-0.5">
                    <button
                        type="button"
                        disabled={!canGrey || isLoadingAction}
                        onClick={() => onRequestAction(staff.user_id, "START_BREAK")}
                        title={greyTooltip}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${
                            canGrey && !isLoadingAction
                                ? "bg-stone-200 hover:bg-stone-300 text-stone-700 border border-stone-300 cursor-pointer active:scale-95 shadow-xs"
                                : "bg-gray-100 text-gray-300 border border-gray-200 cursor-not-allowed"
                        }`}
                    >
                        <Coffee className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-[9px] font-semibold text-[#8d7167]">Break</span>
                </div>

                {/* Red Button */}
                <div className="flex flex-col items-center gap-0.5">
                    <button
                        type="button"
                        disabled={!canRed || isLoadingAction}
                        onClick={() => onRequestAction(staff.user_id, "CHECK_OUT")}
                        title={redTooltip}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${
                            canRed && !isLoadingAction
                                ? "bg-rose-600 hover:bg-rose-700 text-white cursor-pointer active:scale-95 shadow-xs"
                                : "bg-gray-100 text-gray-300 border border-gray-200 cursor-not-allowed"
                        }`}
                    >
                        <LogOut className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-[9px] font-semibold text-[#8d7167]">Out</span>
                </div>
            </div>
        </div>
    );
};

// ─── Main Component: AttendanceDashboard ─────────────────────────────────────

const AttendanceDashboard = () => {
    const [activeTab, setActiveTab] = useState<"live" | "history">("live");
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    const queryClient = useQueryClient();

    // Auto-refetch on any realtime socket event
    useAttendanceRealtime();

    const { data, refetch, isFetching, isLoading } = useQuery({
        queryKey: ["attendance", "dashboard"],
        queryFn: attendanceAPI.getDashboard,
        refetchInterval: 15000,
        enabled: activeTab === "live",
    });

    const staffList: DashboardStaffItem[] = useMemo(() => data?.staff ?? [], [data?.staff]);

    // Filter staff list based on search and dropdowns
    const filteredStaff = useMemo(() => {
        return staffList.filter((staff) => {
            // Search filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const nameMatch = staff.name.toLowerCase().includes(q);
                const roleMatch = staff.role.toLowerCase().replace(/_/g, " ").includes(q);
                if (!nameMatch && !roleMatch) return false;
            }

            // Role filter
            if (roleFilter !== "all") {
                if (staff.role.toLowerCase() !== roleFilter.toLowerCase()) return false;
            }

            // Status filter
            if (statusFilter !== "all") {
                const hasPending = !!staff.pending_request;
                const attStatus = staff.attendance.status;

                if (statusFilter === "pending") {
                    if (!hasPending) return false;
                } else if (statusFilter === "checked_in") {
                    if (attStatus !== "CHECKED_IN" || hasPending) return false;
                } else if (statusFilter === "on_break") {
                    if (attStatus !== "ON_BREAK" || hasPending) return false;
                } else if (statusFilter === "off_duty") {
                    if ((attStatus !== "OFF_DUTY" && attStatus !== "CHECKED_OUT") || hasPending) return false;
                }
            }

            return true;
        });
    }, [staffList, searchQuery, roleFilter, statusFilter]);

    // Live Summary Counters
    const summary = useMemo(() => {
        const onFloor = staffList.filter((s) => s.attendance.status === "CHECKED_IN" && !s.pending_request).length;
        const onBreak = staffList.filter((s) => s.attendance.status === "ON_BREAK" && !s.pending_request).length;
        const offDuty = staffList.filter(
            (s) => (s.attendance.status === "OFF_DUTY" || s.attendance.status === "CHECKED_OUT") && !s.pending_request
        ).length;
        const pending = staffList.filter((s) => !!s.pending_request).length;

        return { onFloor, onBreak, offDuty, pending };
    }, [staffList]);

    const requestMutation = useMutation({
        mutationFn: ({ userId, action }: { userId: string; action: ActionRequestAction }) =>
            attendanceAPI.createActionRequest(userId, action),
        onSuccess: (_res, variables) => {
            const staff = staffList.find((s) => s.user_id === variables.userId);
            toast.success(`Requested ${variables.action.replace("_", " ")} for ${staff?.name || "staff"}`);
            queryClient.invalidateQueries({ queryKey: ["attendance"] });
        },
        onError: (err) => {
            toast.error(errorMessage(err, "Failed to send attendance request"));
        },
    });

    return (
        <div className="space-y-4">
            {/* Top Navigation Tabs Bar */}
            <div className="flex items-center justify-between bg-white rounded-xl p-2 border border-[#e1bfb4]">
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setActiveTab("live")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            activeTab === "live"
                                ? "bg-[#E85D25] text-white shadow-xs"
                                : "text-[#594139] hover:bg-[#fff1ec]"
                        }`}
                    >
                        <Users className="h-4 w-4" />
                        Live Attendance
                    </button>
                    <button
                        onClick={() => setActiveTab("history")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            activeTab === "history"
                                ? "bg-[#E85D25] text-white shadow-xs"
                                : "text-[#594139] hover:bg-[#fff1ec]"
                        }`}
                    >
                        <Clock className="h-4 w-4" />
                        History
                    </button>
                </div>

                {activeTab === "live" && (
                    <button
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-[#594139] border border-[#e1bfb4] hover:bg-[#fff8f6] disabled:opacity-50 transition-all"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                )}
            </div>

            {/* Live Attendance Content */}
            {activeTab === "live" && (
                <div className="bg-white rounded-xl p-5 border border-[#e1bfb4] shadow-xs space-y-4">
                    {/* Live Attendance Header & Counters */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#f0ddd5]">
                        <div>
                            <h3 className="font-bold text-base text-[#261814]" style={{ fontFamily: "Sora, sans-serif" }}>
                                Staff Live Attendance
                            </h3>
                            <p className="text-xs text-[#8d7167]">
                                Centralized restaurant staff control panel
                            </p>
                        </div>

                        {/* Summary Pill Counters */}
                        <div className="flex items-center gap-2 text-xs flex-wrap">
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                {summary.onFloor} On Floor
                            </span>
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold text-[11px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                {summary.onBreak} On Break
                            </span>
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200 font-semibold text-[11px]">
                                {summary.offDuty} Off Duty
                            </span>
                            {summary.pending > 0 && (
                                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 font-semibold text-[11px]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
                                    {summary.pending} Pending
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Horizontal Toolbar: Search & Filters */}
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        {/* Search Input */}
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8d7167]" />
                            <Input
                                type="text"
                                placeholder="Search staff..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9 text-xs rounded-lg border-[#e1bfb4] focus-visible:ring-[#E85D25]"
                            />
                        </div>

                        {/* Role Filter */}
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-full sm:w-44 h-9 text-xs border-[#e1bfb4]">
                                <SelectValue placeholder="All Roles" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="restaurant_admin">Restaurant Admin</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="waiter">Waiter</SelectItem>
                                <SelectItem value="cook">Cook</SelectItem>
                                <SelectItem value="cashier">Cashier</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Status Filter */}
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-44 h-9 text-xs border-[#e1bfb4]">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="checked_in">On Floor</SelectItem>
                                <SelectItem value="on_break">On Break</SelectItem>
                                <SelectItem value="off_duty">Off Duty</SelectItem>
                                <SelectItem value="pending">Pending Confirmation</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Compact Grid: 4 Cards per row on Desktop */}
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 pt-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="bg-white rounded-xl p-3.5 border border-[#e1bfb4] h-[170px] animate-pulse flex flex-col justify-between"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-gray-200" />
                                        <div className="space-y-1.5 flex-1">
                                            <div className="h-3 bg-gray-200 rounded w-2/3" />
                                            <div className="h-2 bg-gray-100 rounded w-1/3" />
                                        </div>
                                    </div>
                                    <div className="h-4 bg-gray-100 rounded w-1/2 my-2" />
                                    <div className="flex justify-around pt-2 border-t border-gray-100">
                                        <div className="w-8 h-8 rounded-full bg-gray-200" />
                                        <div className="w-8 h-8 rounded-full bg-gray-200" />
                                        <div className="w-8 h-8 rounded-full bg-gray-200" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredStaff.length === 0 ? (
                        <div className="text-center py-12 rounded-xl bg-[#fff8f6] border border-[#f0ddd5]">
                            <p className="text-sm font-semibold text-[#261814]">No staff found</p>
                            <p className="text-xs text-[#8d7167] mt-1">Try changing your search or filters.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 pt-1">
                            {filteredStaff.map((staff) => (
                                <StaffAttendanceCard
                                    key={staff.user_id}
                                    staff={staff}
                                    onRequestAction={(userId, action) => requestMutation.mutate({ userId, action })}
                                    isLoadingAction={requestMutation.isPending && requestMutation.variables?.userId === staff.user_id}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* History Tab */}
            {activeTab === "history" && <AttendanceHistory />}
        </div>
    );
};

export default AttendanceDashboard;
