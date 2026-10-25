import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { onAttendanceEvent } from "@/lib/realtime";

/**
 * Invalidates all attendance queries when a realtime attendance event arrives
 * (check-in, break start/end, checkout, correction). This keeps the UI in sync
 * across different logged-in users without a manual refresh.
 */
export function useAttendanceRealtime(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    return onAttendanceEvent(() => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    });
  }, [queryClient]);
}
