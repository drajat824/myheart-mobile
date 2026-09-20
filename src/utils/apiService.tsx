import { fetch } from "expo/fetch";

const BASE_URL = "http://192.168.1.7:3000/api";

export const apiService = {
  async post<T>(endpoint: string, body: Record<string, any>): Promise<T> {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
      }

      return responseData as T;
    } catch (error) {
      console.error(`[POST ${endpoint}] Error:`, error);
      throw error;
    }
  },

  async get<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
      }

      return responseData as T;
    } catch (error) {
      console.error(`[GET ${endpoint}] Error:`, error);
      throw error;
    }
  },
};
