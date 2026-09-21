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

  const setSimulateStatus = useCallback((status: SimulateStatus) => {
    simulateStatusRef.current = status;
    setSimulateStatusState(status);
  }, []);

  const getOffset = (status: SimulateStatus) => {
    if (status === "TAKIKARDIA") return 100;
    if (status === "BRADIKARDIA") return -50;
    return 0;
  };

  // Jika rawHR <= 0 maka currentHR = 0
  const currentHR = rawHR <= 0 ? 0 : Math.max(0, rawHR + getOffset(simulateStatus));

  // Jika rawHR <= 0 maka status tampilan bernilai "-"
  const displayStatus: SimulateStatus | "-" = rawHR <= 0 ? "-" : simulateStatus;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY_LATEST_HR).then((val) => {
      if (val) setRawHR(Number(val));
    });
  }, []);

  const addHR = useCallback((value: number) => {
    setRawHR(value);

    const status = simulateStatusRef.current;
    const offset = value <= 0 ? 0 : status === "TAKIKARDIA" ? 100 : status === "BRADIKARDIA" ? -50 : 0;
    const effectiveHR = value <= 0 ? 0 : Math.max(0, value + offset);

    hrBuffer.current.push({ value: effectiveHR, timestamp: Date.now() });

    AsyncStorage.setItem(STORAGE_KEY_LATEST_HR, effectiveHR.toString()).catch(() => {});
  }, []);

  const resetStorage = useCallback(async () => {
    await AsyncStorage.clear();
    setRawHR(0);
    hrBuffer.current = [];
  }, []);

  useEffect(() => {
    const intervalId = setInterval(async () => {
      const buffer = [...hrBuffer.current];
      if (buffer.length === 0) return;

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
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <HRContext.Provider
      value={{
        currentHR,
        rawHR,
        simulateStatus,
        displayStatus,
        setSimulateStatus,
        addHR,
        resetStorage,
      }}
    >
      {children}
    </HRContext.Provider>
  );
}
