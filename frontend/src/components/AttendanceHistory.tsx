import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { attendanceAPI, type Attendance } from "@/api/attendance";
import { staffAPI, type StaffMember } from "@/api/staff";
import { useAttendanceRealtime } from "@/hooks/useAttendanceRealtime";
import {
    CalendarDays,
    RefreshCw,
    Users,
    Coffee,
    LogIn,
    LogOut,
    CheckCircle2,
    PencilLine,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

type DayFilter = "today" | "yesterday" | "custom";

// Restaurant-local business timezone (matches the backend default).
const BUSINESS_TZ = "Asia/Kolkata";

function pad2(n: number): string {
    return String(n).padStart(2, "0");
}

function todayInputValue(): string {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/**
 * Business date (YYYY-MM-DD) in the restaurant's timezone, offset by days.
 * The backend filters attendance_records by this stored business_date, so the
 * query is correct regardless of the browser's timezone.
 */
function businessDateString(offsetDays = 0): string {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: BUSINESS_TZ,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(new Date());
    const y = Number(parts.find((p) => p.type === "year")?.value ?? 0);
    const m = Number(parts.find((p) => p.type === "month")?.value ?? 0);
    const d = Number(parts.find((p) => p.type === "day")?.value ?? 0);
    const shifted = new Date(Date.UTC(y, m - 1, d + offsetDays));
    return shifted.toISOString().slice(0, 10);
}

function formatBusinessDate(date: string): string {
    const [y, m, d] = date.split("-").map(Number);
    const label = new Date(y ?? 0, (m ?? 1) - 1, d ?? 1).toLocaleDateString([], {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
    });
    return label;
}

function fmtTime(iso: string | null): string {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtDuration(min: number | null | undefined): string {
    const value = Math.max(0, Math.round(min ?? 0));
    const h = Math.floor(value / 60);
    const m = value % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
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

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
    checked_in: { label: "On Floor", bg: "#e8f5e9", color: "#22C55E" },
    on_break: { label: "On Break", bg: "#fdf4e3", color: "#F59E0B" },
    checked_out: { label: "Checked Out", bg: "#eef2ff", color: "#6366F1" },
};

interface MemberOption {
    id: string;
    name: string;
    role: string;
    employee_code: string | null;
}

// Role filters for the history view (stored roles, with legacy aliases).
const ROLE_FILTERS: { value: string; label: string; roles: string[] }[] = [
    { value: "all", label: "All Staff", roles: [] },
    { value: "owner", label: "Owner", roles: ["restaurant_owner", "owner"] },
    { value: "admin", label: "Admin", roles: ["restaurant_admin", "admin"] },
    { value: "manager", label: "Manager", roles: ["manager"] },
    { value: "waiter", label: "Waiter", roles: ["waiter"] },
    { value: "cook", label: "Cook", roles: ["cook"] },
    { value: "cashier", label: "Cashier", roles: ["cashier"] },
];

const AttendanceHistory = () => {
    // Realtime: refetch history when anyone checks in/out or is corrected.
    useAttendanceRealtime();

    const [dayFilter, setDayFilter] = useState<DayFilter>("today");
    const [customDate, setCustomDate] = useState<string>(todayInputValue);
    const [memberFilter, setMemberFilter] = useState<string>("all");
    const [roleFilter, setRoleFilter] = useState<string>("all");

    const currentRole = (() => {
        try {
            const stored = localStorage.getItem('user');
            const parsed = stored ? JSON.parse(stored) : null;
            return parsed?.role ?? null;
        } catch {
            return null;
        }
    })();
    const canReadStaff =
        !!currentRole &&
        ["restaurant_owner", "restaurant_admin", "manager", "platform_superadmin", "admin", "owner"].includes(currentRole);

    const date =
        dayFilter === "today"
            ? businessDateString(0)
            : dayFilter === "yesterday"
                ? businessDateString(-1)
                : customDate;

    const { data: records = [], refetch, isFetching } = useQuery({
        queryKey: ["attendance", "history", { date, memberFilter }],
        queryFn: () =>
            attendanceAPI
                .list({
                    date,
                    limit: 100,
                    ...(memberFilter !== "all" ? { user_id: memberFilter } : {}),
                })
                .then((res) => res.data),
        refetchInterval: dayFilter === "today" ? 30000 : false,
        refetchIntervalInBackground: dayFilter === "today",
    });

    const { data: staffList = [] } = useQuery({
        queryKey: ["staff"],
        queryFn: () => staffAPI.getAll({ limit: 100 }).then((res) => res.data),
        enabled: canReadStaff,
    });

    const memberOptions = useMemo<MemberOption[]>(() => {
        const map = new Map<string, MemberOption>();
        for (const s of staffList) {
            map.set(s.id, {
                id: s.id,
                name: s.full_name || s.email,
                role: s.role,
                employee_code: s.employee_code,
            });
        }
        for (const r of records) {
            if (r.user) {
                map.set(r.user.id, {
                    id: r.user.id,
                    name: r.user.full_name || "Staff",
                    role: r.user.role,
                    employee_code: r.user.employee_code,
                });
            }
        }
        return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [staffList, records]);

    const activeMemberId = useMemo(() => {
        if (memberFilter === "all") return null;
        return memberOptions.some((m) => m.id === memberFilter) ? memberFilter : null;
    }, [memberFilter, memberOptions]);

    const visibleMembers = useMemo<MemberOption[]>(() => {
        if (activeMemberId) {
            return memberOptions.filter((m) => m.id === activeMemberId);
        }
        const allowedRoles = ROLE_FILTERS.find((r) => r.value === roleFilter)?.roles ?? [];
        if (allowedRoles.length > 0) {
            return memberOptions.filter((m) => allowedRoles.includes(m.role));
        }
        return memberOptions;
    }, [memberOptions, activeMemberId, roleFilter]);

    const recordsByMember = useMemo(() => {
        const map = new Map<string, Attendance[]>();
        for (const r of records) {
            const key = r.user_id;
            const list = map.get(key) ?? [];
            list.push(r);
            map.set(key, list);
        }
        return map;
    }, [records]);

    const memberCount = new Set(records.map((r) => r.user_id)).size;

    return (
        <div
            className="bg-white rounded-xl p-6"
            style={{ border: "1px solid #e1bfb4", boxShadow: "0 2px 8px rgba(38,24,20,0.04)" }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#fce3db" }}>
                        <CalendarDays className="h-5 w-5" style={{ color: "#E85D25" }} />
                    </div>
                    <div>
                        <h3 className="font-bold" style={{ fontFamily: "Sora, sans-serif", color: "#261814" }}>
                            Attendance History
                        </h3>
                        <p className="text-xs" style={{ color: "#8d7167" }}>
                            {records.length} shift{records.length === 1 ? "" : "s"} · {memberCount} member{memberCount === 1 ? "" : "s"} on {formatBusinessDate(date)}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                    style={{ color: "#594139", border: "1px solid #e1bfb4" }}
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
                <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid #e1bfb4" }}>
                    {(["today", "yesterday", "custom"] as const).map((key) => (
                        <button
                            key={key}
                            onClick={() => setDayFilter(key)}
                            className="px-3.5 py-2 text-xs font-semibold capitalize transition-all"
                            style={{
                                color: dayFilter === key ? "#ffffff" : "#594139",
                                backgroundColor: dayFilter === key ? "#E85D25" : "#ffffff",
                            }}
                        >
                            {key}
                        </button>
                    ))}
                </div>

                {dayFilter === "custom" && (
                    <Input
                        type="date"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        className="w-full sm:w-44 h-9"
                    />
                )}

                <div className="flex-1" />

                <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value)}>
                    <SelectTrigger className="w-full sm:w-36 h-9">
                        <SelectValue placeholder="All staff" />
                    </SelectTrigger>
                    <SelectContent>
                        {ROLE_FILTERS.map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                                {r.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={memberFilter} onValueChange={(value) => setMemberFilter(value)}>
                    <SelectTrigger className="w-full sm:w-56 h-9">
                        <SelectValue placeholder="All staff" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All staff</SelectItem>
                        {memberOptions.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                                {m.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Member cards */}
            {visibleMembers.length === 0 ? (
                <div className="text-center py-10 rounded-xl" style={{ backgroundColor: "#fff8f6" }}>
                    <Users className="h-8 w-8 mx-auto mb-2" style={{ color: "#d8b7ab" }} />
                    <p className="text-sm" style={{ color: "#8d7167" }}>
                        No staff found for {formatBusinessDate(date)}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {visibleMembers.map((member) => {
                        const memberRecords = recordsByMember.get(member.id) ?? [];
                        const totalWork = memberRecords.reduce((sum, r) => sum + (r.total_working_minutes ?? 0), 0);
                        const totalBreak = memberRecords.reduce((sum, r) => sum + (r.total_break_minutes ?? 0), 0);

                        return (
                            <div
                                key={member.id}
                                className="rounded-xl overflow-hidden"
                                style={{ border: "1px solid #f0ddd5", backgroundColor: "#fff8f6" }}
                            >
                                {/* Member header */}
                                <div className="flex flex-wrap items-center gap-3 px-4 py-3" style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #f0ddd5" }}>
                                    <div
                                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                                        style={{ backgroundColor: "#fce3db", color: "#E85D25" }}
                                    >
                                        {initials(member.name)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold truncate" style={{ color: "#261814" }}>
                                            {member.name}
                                        </p>
                                        <p className="text-xs truncate" style={{ color: "#8d7167" }}>
                                            {roleLabel(member.role)}
                                            {member.employee_code ? ` · ${member.employee_code}` : ""}
                                        </p>
                                    </div>
                                    {memberRecords.length > 0 && (
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: "#eef2ff", color: "#6366F1" }}>
                                                Worked {fmtDuration(totalWork)}
                                            </span>
                                            {totalBreak > 0 && (
                                                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: "#fdf4e3", color: "#F59E0B" }}>
                                                    Break {fmtDuration(totalBreak)}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {memberRecords.length === 0 ? (
                                    <div className="px-4 py-5 text-center">
                                        <p className="text-xs" style={{ color: "#bda398" }}>
                                            No attendance record on this day
                                        </p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Check-in</TableHead>
                                                <TableHead>Check-out</TableHead>
                                                <TableHead className="hidden md:table-cell">Breaks</TableHead>
                                                <TableHead className="hidden sm:table-cell">Break time</TableHead>
                                                <TableHead>Worked</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {memberRecords.map((r) => {
                                                const meta = STATUS_META[r.status] ?? STATUS_META.checked_out;
                                                return (
                                                    <TableRow key={r.id}>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1.5">
                                                                <LogIn className="h-3.5 w-3.5" style={{ color: "#22C55E" }} />
                                                                <span className="text-sm font-medium" style={{ color: "#261814" }}>
                                                                    {fmtTime(r.checked_in_at)}
                                                                </span>
                                                            </div>
                                                            {r.note && (
                                                                <p className="text-[11px] truncate max-w-[140px]" style={{ color: "#8d7167" }}>
                                                                    {r.note}
                                                                </p>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {r.checked_out_at ? (
                                                                <div className="flex items-center gap-1.5">
                                                                    <LogOut className="h-3.5 w-3.5" style={{ color: "#594139" }} />
                                                                    <span className="text-sm" style={{ color: "#594139" }}>
                                                                        {fmtTime(r.checked_out_at)}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-sm" style={{ color: "#bda398" }}>
                                                                    Still active
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="hidden md:table-cell">
                                                            {r.breaks.length === 0 ? (
                                                                <span style={{ color: "#bda398" }}>—</span>
                                                            ) : (
                                                                <div className="flex flex-col gap-1">
                                                                    {r.breaks.map((b, i) => (
                                                                        <span
                                                                            key={i}
                                                                            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full w-fit"
                                                                            style={{ backgroundColor: "#fdf4e3", color: "#a16207" }}
                                                                        >
                                                                            <Coffee className="h-3 w-3" />
                                                                            {fmtTime(b.started_at)} → {fmtTime(b.ended_at)}
                                                                            {b.duration_minutes != null ? ` · ${fmtDuration(b.duration_minutes)}` : ""}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="hidden sm:table-cell">
                                                            <span className="text-sm" style={{ color: "#594139" }}>
                                                                {fmtDuration(r.total_break_minutes)}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-sm font-medium" style={{ color: "#261814" }}>
                                                                    {fmtDuration(r.total_working_minutes)}
                                                                </span>
                                                                {r.corrected_at && (
                                                                    <PencilLine className="h-3 w-3" aria-label={`Corrected: ${r.correction_note ?? ""}`} style={{ color: "#F59E0B" }} />
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span
                                                                className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full"
                                                                style={{ backgroundColor: meta.bg, color: meta.color }}
                                                            >
                                                                {meta.label}
                                                            </span>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {isFetching && (
                <div className="mt-4 flex items-center justify-center gap-2 text-xs" style={{ color: "#8d7167" }}>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Loading…
                </div>
            )}

            <div className="mt-4 flex items-center gap-4 text-[11px]" style={{ color: "#8d7167" }}>
                <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#22C55E" }} />
                    On floor
                </span>
                <span className="inline-flex items-center gap-1">
                    <Coffee className="h-3.5 w-3.5" style={{ color: "#F59E0B" }} />
                    On break
                </span>
                <span className="inline-flex items-center gap-1">
                    <PencilLine className="h-3.5 w-3.5" style={{ color: "#F59E0B" }} />
                    Corrected entry
                </span>
            </div>
        </div>
    );
};

export default AttendanceHistory;
