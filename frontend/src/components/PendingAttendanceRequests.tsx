import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { attendanceAPI, type ActionRequest } from "@/api/attendance";
import { errorMessage } from "@/lib/utils";
import { toast } from "sonner";
import { useAttendanceRealtime } from "@/hooks/useAttendanceRealtime";
import { Check, X, Bell, Loader2 } from "lucide-react";

function formatActionLabel(action: string): string {
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

export function PendingAttendanceRequests() {
    const queryClient = useQueryClient();

    // Auto-refetch on any realtime event
    useAttendanceRealtime();

    const { data: requests = [], isLoading } = useQuery({
        queryKey: ["attendance", "pendingRequests"],
        queryFn: attendanceAPI.getPendingRequests,
        refetchInterval: 10000,
    });

    const confirmMutation = useMutation({
        mutationFn: (id: string) => attendanceAPI.confirmRequest(id),
        onSuccess: (_data, _id) => {
            toast.success("Attendance request confirmed!");
            queryClient.invalidateQueries({ queryKey: ["attendance"] });
        },
        onError: (err) => {
            toast.error(errorMessage(err, "Failed to confirm request"));
        },
    });

    const declineMutation = useMutation({
        mutationFn: (id: string) => attendanceAPI.declineRequest(id),
        onSuccess: (_data, _id) => {
            toast.info("Attendance request declined");
            queryClient.invalidateQueries({ queryKey: ["attendance"] });
        },
        onError: (err) => {
            toast.error(errorMessage(err, "Failed to decline request"));
        },
    });

    if (isLoading || requests.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3 mb-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#E85D25]">
                <Bell className="h-4 w-4 animate-bounce" />
                <span>Pending Attendance Requests ({requests.length})</span>
            </div>

            <div className="space-y-2.5">
                {requests.map((req: ActionRequest) => {
                    const isPending = confirmMutation.isPending || declineMutation.isPending;

                    return (
                        <div
                            key={req.id}
                            className="flex items-center justify-between gap-4 p-4 rounded-xl border border-amber-200 bg-amber-50 shadow-sm animate-fade-in"
                        >
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-amber-900">
                                    Action Requested: {formatActionLabel(req.action)}
                                </p>
                                <p className="text-xs text-amber-700 mt-0.5">
                                    An owner/admin requested you to {formatActionLabel(req.action).toLowerCase()}. Please confirm or decline.
                                </p>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                    disabled={isPending}
                                    onClick={() => confirmMutation.mutate(req.id)}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all"
                                >
                                    {confirmMutation.isPending ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Check className="h-3.5 w-3.5" />
                                    )}
                                    Confirm
                                </button>
                                <button
                                    disabled={isPending}
                                    onClick={() => declineMutation.mutate(req.id)}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 border border-rose-300 disabled:opacity-50 transition-all"
                                >
                                    {declineMutation.isPending ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <X className="h-3.5 w-3.5" />
                                    )}
                                    Decline
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default PendingAttendanceRequests;
