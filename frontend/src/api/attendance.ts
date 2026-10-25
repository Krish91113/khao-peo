import apiClient from './client';

export interface AttendanceBreak {
    started_at: string;
    ended_at: string | null;
    duration_minutes: number | null;
}

export interface AttendanceUser {
    id: string;
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    employee_code: string | null;
    role: string;
}

export interface Attendance {
    _id?: string;
    id: string;
    restaurant_id: string | null;
    user_id: string;
    user: AttendanceUser | null;
    status: 'checked_in' | 'on_break' | 'checked_out';
    business_date: string | null;
    checked_in_at: string | null;
    checked_out_at: string | null;
    breaks: AttendanceBreak[];
    break_count: number;
    total_break_minutes: number;
    total_working_minutes: number;
    is_active: boolean;
    note: string | null;
    corrected_at: string | null;
    corrected_by: string | null;
    correction_note: string | null;
    reason_code: string | null;
    version: number;
    created_at: string | null;
    updated_at: string | null;
}

export interface AttendanceListResponse {
    data: Attendance[];
    meta: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
        has_next: boolean;
        has_prev: boolean;
    };
}

// ─── Action Request Types ────────────────────────────────────────────────────

export type ActionRequestAction = 'CHECK_IN' | 'START_BREAK' | 'END_BREAK' | 'CHECK_OUT';
export type ActionRequestStatus = 'PENDING' | 'CONFIRMED' | 'DECLINED' | 'EXPIRED' | 'CANCELLED';

export interface ActionRequest {
    id: string;
    restaurant_id: string;
    user_id: string;
    requested_by: string;
    action: ActionRequestAction;
    status: ActionRequestStatus;
    requested_at: string;
    responded_at: string | null;
    expires_at: string;
    created_at: string | null;
    updated_at: string | null;
}

export interface DashboardStaffAttendance {
    status: 'CHECKED_IN' | 'ON_BREAK' | 'CHECKED_OUT' | 'OFF_DUTY';
    attendance_id: string | null;
    checked_in_at: string | null;
    current_break_started_at: string | null;
}

export interface DashboardPendingRequest {
    id: string;
    action: ActionRequestAction;
    status: ActionRequestStatus;
    requested_at: string;
    expires_at: string;
}

export interface DashboardStaffItem {
    user_id: string;
    name: string;
    role: string;
    attendance: DashboardStaffAttendance;
    pending_request: DashboardPendingRequest | null;
}

export interface DashboardResponse {
    staff: DashboardStaffItem[];
}

// ─── API Functions ───────────────────────────────────────────────────────────

export const attendanceAPI = {
    // ── Action Requests ───────────────────────────────────────────────────

    createActionRequest: async (userId: string, action: ActionRequestAction): Promise<ActionRequest> => {
        const response = await apiClient.post('/attendance/action_requests', {
            user_id: userId,
            action,
        });
        return response.data.request ?? response.data;
    },

    getPendingRequests: async (): Promise<ActionRequest[]> => {
        const response = await apiClient.get('/attendance/action_requests/pending');
        return response.data.requests ?? response.data ?? [];
    },

    confirmRequest: async (id: string): Promise<ActionRequest> => {
        const response = await apiClient.post(`/attendance/action_requests/${id}/confirm`);
        return response.data.request ?? response.data;
    },

    declineRequest: async (id: string): Promise<ActionRequest> => {
        const response = await apiClient.post(`/attendance/action_requests/${id}/decline`);
        return response.data.request ?? response.data;
    },

    // ── Dashboard ─────────────────────────────────────────────────────────

    getDashboard: async (): Promise<DashboardResponse> => {
        const response = await apiClient.get('/attendance/dashboard');
        return response.data;
    },

    // ── History/Read Endpoints (kept) ─────────────────────────────────────

    correct: async (attendanceId: string, data: {
        checked_in_at?: string;
        checked_out_at?: string;
        total_working_minutes?: number;
        total_break_minutes?: number;
        note?: string;
        reason_code: string;
        reason_text: string;
    }): Promise<Attendance> => {
        const response = await apiClient.patch(`/attendance/${attendanceId}/correct`, data);
        return response.data.attendance ?? response.data;
    },

    list: async (params?: {
        page?: number;
        limit?: number;
        status?: string;
        user_id?: string;
        from?: string;
        to?: string;
        date?: string;
        date_from?: string;
        date_to?: string;
        sort?: string;
    }): Promise<AttendanceListResponse> => {
        const response = await apiClient.get('/attendance', { params });
        return { data: response.data, meta: response.data.meta };
    },

    listActive: async (): Promise<Attendance[]> => {
        const response = await apiClient.get('/attendance/active');
        return response.data.attendance ?? response.data ?? [];
    },

    listForUser: async (userId: string, params?: {
        page?: number;
        limit?: number;
        status?: string;
        from?: string;
        to?: string;
    }): Promise<AttendanceListResponse> => {
        const response = await apiClient.get(`/attendance/staff/${userId}`, { params });
        return { data: response.data, meta: response.data.meta };
    },
};
