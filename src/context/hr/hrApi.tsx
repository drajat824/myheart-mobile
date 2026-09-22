import { apiService } from "../../utils/apiService";

// Tipe Data Payload Request (POST)
export interface HeartRatePayload {
  user_id: number;
  bpm: number;
  start_time: string; // ISO String: new Date().toISOString()
  end_time: string; // ISO String: new Date().toISOString()
}

export interface HeartIssuePayload {
  user_id: number;
  issue_type: "TAKIKARDIA" | "BRADIKARDIA"; // Wajib KAPITAL sesuai ENUM Database
  bpm_recorded: number;
  recorded_at: string; // ISO String
}

// Tipe Data Response (GET)
export interface HeartRateRecord {
  id: number;
  user_id: number;
  bpm: number;
  start_time: string;
  end_time: string;
}

export interface HeartIssueRecord {
  id: number;
  user_id: number;
  issue_type: "TAKIKARDIA" | "BRADIKARDIA";
  bpm_recorded: number;
  recorded_at: string;
}

export const hrApi = {
  // 1. POST Realtime Heart Rate (/api/hr)
  postRealtimeHR: async (payload: HeartRatePayload) => {
    return await apiService.post("/api/hr", payload);
  },

  // 2. GET Realtime Heart Rate (/api/hr)
  getRealtimeHR: async (userId: number = 1, date?: string): Promise<HeartRateRecord[]> => {
    const query = date ? `?user_id=${userId}&date=${date}` : `?user_id=${userId}`;
    return await apiService.get(`/api/hr${query}`);
  },

  // 3. POST HR Aggregasi (/api/hr-aggregation)
  postHRAggregation: async (payload: HeartRatePayload) => {
    return await apiService.post("/api/hr-aggregation", payload);
  },

  // 4. GET HR Aggregasi (/api/hr-aggregation)
  getHRAggregation: async (userId: number = 1, date?: string): Promise<HeartRateRecord[]> => {
    const query = date ? `?user_id=${userId}&date=${date}` : `?user_id=${userId}`;
    return await apiService.get(`/api/hr-aggregation${query}`);
  },

  // 5. POST Heart Issue (/api/hr-issues)
  postHeartIssue: async (payload: HeartIssuePayload) => {
    return await apiService.post("/api/hr-issues", payload);
  },

  // 6. GET Heart Issues (/api/hr-issues)
  getHeartIssues: async (userId: number = 1, date?: string): Promise<HeartIssueRecord[]> => {
    const query = date ? `?user_id=${userId}&date=${date}` : `?user_id=${userId}`;
    return await apiService.get(`/api/hr-issues${query}`);
  },
};
