import { formatTimestamp6 } from "@/utils/time";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { apiService } from "../../utils/apiService"; // Sesuaikan path
import { HeartRateItem, HRContextType } from "./hr.type";

const STORAGE_KEY_LATEST_HR = "@myheartz_latest_hr";

export const HRContext = createContext<HRContextType | null>(null);

export function HRProvider({ children }: { children: ReactNode }) {
  const [currentHR, setCurrentHR] = useState(0);
  const hrBuffer = useRef<HeartRateItem[]>([]);

  // Load cache HR terakhir saat aplikasi dibuka
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY_LATEST_HR).then((val) => {
      if (val) setCurrentHR(Number(val));
    });
  }, []);

  const addHR = useCallback((value: number) => {
    setCurrentHR(value);
    hrBuffer.current.push({ value, timestamp: Date.now() });

    // Hanya simpan data terakhir ke AsyncStorage
    AsyncStorage.setItem(STORAGE_KEY_LATEST_HR, value.toString()).catch(() => {});
  }, []);

  const resetStorage = useCallback(async () => {
    await AsyncStorage.clear();
    setCurrentHR(0);
    hrBuffer.current = [];
  }, []);

  // Interval agregasi 10 detik dan POST API
  useEffect(() => {
    const intervalId = setInterval(async () => {
      const buffer = [...hrBuffer.current];
      if (buffer.length === 0) return;

      // Kosongkan buffer memori setelah data diambil
      hrBuffer.current = [];

      const sum = buffer.reduce((acc, curr) => acc + curr.value, 0);
      const averageHR = Math.round(sum / buffer.length);

      const payload = {
        user_id: 1,
        bpm: averageHR,
        start_time: formatTimestamp6(buffer[0].timestamp),
        end_time: formatTimestamp6(buffer[buffer.length - 1].timestamp),
      };

      try {
        await apiService.post("/hr", payload);
      } catch (error) {
        console.error("Gagal post agregasi HR:", error);
      }
    }, 10000); // 10 Detik

    return () => clearInterval(intervalId);
  }, []);

  return <HRContext.Provider value={{ currentHR, addHR, resetStorage }}>{children}</HRContext.Provider>;
}
