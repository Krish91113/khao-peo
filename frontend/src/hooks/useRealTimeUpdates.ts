import { useEffect, useRef, useCallback } from "react";

interface UseRealTimeUpdatesOptions {
    onUpdate: () => void | Promise<void>;
    interval?: number; // in milliseconds
    enabled?: boolean;
}

/**
 * Custom hook for polling-based real-time updates
 * Provides automatic cleanup and configurable polling interval
 */
export function useRealTimeUpdates({
    onUpdate,
    interval = 3000,
    enabled = true,
}: UseRealTimeUpdatesOptions) {
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const isMountedRef = useRef(true);

    const startPolling = useCallback(() => {
        if (!enabled || intervalRef.current) return;

        intervalRef.current = setInterval(async () => {
            if (isMountedRef.current) {
                try {
                    await onUpdate();
                } catch (error) {
                    console.error("Real-time update error:", error);
                }
            }
        }, interval);
    }, [onUpdate, interval, enabled]);

    const stopPolling = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    useEffect(() => {
        isMountedRef.current = true;

        if (enabled) {
            startPolling();
        }

        return () => {
            isMountedRef.current = false;
            stopPolling();
        };
    }, [enabled, startPolling, stopPolling]);

    return { startPolling, stopPolling };
}
