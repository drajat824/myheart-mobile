import { formatTimestamp6 } from "@/utils/time";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { apiService } from "../../utils/apiService";
import { HeartRateItem, HRContextType, SimulateStatus } from "./hr.type";

const STORAGE_KEY_LATEST_HR = "@myheartz_latest_hr";

export const HRContext = createContext<HRContextType | null>(null);

export function HRProvider({ children }: { children: ReactNode }) {
  const [rawHR, setRawHR] = useState(0);
  const [simulateStatus, setSimulateStatusState] = useState<SimulateStatus>("NORMAL");

  const simulateStatusRef = useRef<SimulateStatus>("NORMAL");
  const hrBuffer = useRef<HeartRateItem[]>([]);
  const rawHRRef = useRef<number>(0); // Ref untuk membaca current rawHR tanpa re-render trap

  const getOffset = (status: SimulateStatus) => {
    if (status === "TAKIKARDIA") return 100;
    if (status === "BRADIKARDIA") return -50;
    return 0;
  };

  const setSimulateStatus = useCallback((status: SimulateStatus) => {
    simulateStatusRef.current = status;
    setSimulateStatusState(status);

    // POST langsung saat user menekan aksi simulasi (dan HR > 0)
    if (status !== "NORMAL" && rawHRRef.current > 0) {
      const offset = getOffset(status);
      const currentHeartRate = Math.max(0, rawHRRef.current + offset);

      const payloadIssue = {
        user_id: 1,
        // Format Enum: "TAKIKARDIA" -> "Takikardia"
        issue_type: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
        bpm_recorded: currentHeartRate,
        recorded_at: formatTimestamp6(Date.now()),
      };

      apiService.post("/hr-issues", payloadIssue).catch((err) => console.error("Gagal POST immediate hr-issues:", err));
    }
  }, []);

  // Jika rawHR <= 0 maka currentHR = 0
  const currentHR = rawHR <= 0 ? 0 : Math.max(0, rawHR + getOffset(simulateStatus));
  // Jika rawHR <= 0 maka status tampilan bernilai "-"
  const displayStatus: SimulateStatus | "-" = rawHR <= 0 ? "-" : simulateStatus;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY_LATEST_HR).then((val) => {
      if (val) {
        setRawHR(Number(val));
        rawHRRef.current = Number(val);
      }
    });
  }, []);

  const addHR = useCallback((value: number) => {
    setRawHR(value);
    rawHRRef.current = value;

    const status = simulateStatusRef.current;
    const offset = value <= 0 ? 0 : getOffset(status);
    const effectiveHR = value <= 0 ? 0 : Math.max(0, value + offset);

    hrBuffer.current.push({ value: effectiveHR, timestamp: Date.now() });
    AsyncStorage.setItem(STORAGE_KEY_LATEST_HR, effectiveHR.toString()).catch(() => {});
  }, []);

  const resetStorage = useCallback(async () => {
    await AsyncStorage.clear();
    setRawHR(0);
    rawHRRef.current = 0;
    hrBuffer.current = [];
  }, []);

  useEffect(() => {
    const intervalId = setInterval(async () => {
      const buffer = [...hrBuffer.current];
      if (buffer.length === 0) return;

      hrBuffer.current = [];

      const sum = buffer.reduce((acc, curr) => acc + curr.value, 0);
      const averageHR = Math.round(sum / buffer.length);
      const lastTimestamp = formatTimestamp6(buffer[buffer.length - 1].timestamp);

      // 1. Post HR biasa
      const payloadHR = {
        user_id: 1,
        bpm: averageHR,
        start_time: formatTimestamp6(buffer[0].timestamp),
        end_time: lastTimestamp,
      };

      try {
        await apiService.post("/hr", payloadHR);

        // 2. Post Gangguan (hr-issues) 10 detik sekali bila status != NORMAL
        const status = simulateStatusRef.current;
        if (status !== "NORMAL" && averageHR > 0) {
          const payloadIssue = {
            user_id: 1,
            issue_type: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
            bpm_recorded: averageHR,
            recorded_at: lastTimestamp,
          };
          await apiService.post("/hr-issues", payloadIssue);
        }
      } catch (error) {
        console.error("Gagal post agregasi HR/Issues:", error);
      }
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  return <HRContext.Provider value={{ currentHR, rawHR, simulateStatus, displayStatus, setSimulateStatus, addHR, resetStorage }}>{children}</HRContext.Provider>;
}
