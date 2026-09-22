import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { apiService } from "../../utils/apiService";
import { ChartPoint, HeartRateItem, HRContextType, SimulateStatus } from "./hr.type";

const STORAGE_KEY_REALTIME_CACHE = "@myheartz_realtime_cache_24h";
const STORAGE_KEY_AGGREGATE_CACHE = "@myheartz_aggregate_cache";
const STORAGE_KEY_LATEST_HR = "@myheartz_latest_hr";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const FIVE_MINUTES_MS = 5 * 60 * 1000;

export const HRContext = createContext<HRContextType | null>(null);

export function HRProvider({ children }: { children: ReactNode }) {
  const isPostingIssueRef = useRef<boolean>(false);

  const [rawHR, setRawHR] = useState(0);
  const [simulateStatus, setSimulateStatusState] = useState<SimulateStatus>("NORMAL");

  const [realtimeChartData, setRealtimeChartData] = useState<ChartPoint[]>([]);
  const [aggregateChartData, setAggregateChartData] = useState<ChartPoint[]>([]);

  const simulateStatusRef = useRef<SimulateStatus>("NORMAL");
  const rawHRRef = useRef<number>(0);

  // Buffer untuk API Background Task
  const realtimeBuffer = useRef<HeartRateItem[]>([]);
  const aggregateBuffer = useRef<{ value: number; timestamp: number }[]>([]);

  // Tracking Gangguan HR
  const issueTracking = useRef<{
    active: boolean;
    lastPostTime: number;
    status: SimulateStatus;
  }>({
    active: false,
    lastPostTime: 0,
    status: "NORMAL",
  });

  const getOffset = (status: SimulateStatus) => {
    if (status === "TAKIKARDIA") return 100;
    if (status === "BRADIKARDIA") return -50;
    return 0;
  };

  const formatTimeLabel = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Asia/Jakarta",
    });
  };

  // ----------------------------------------------------
  // LOGIKA DETEKSI GANGGUAN HR (/hr-issues)
  // ----------------------------------------------------
  const evaluateAndPostIssue = useCallback(async (status: SimulateStatus, currentBpm: number, isInitial = false) => {
    if (status === "NORMAL" || currentBpm <= 0) {
      issueTracking.current = { active: false, lastPostTime: 0, status: "NORMAL" };
      isPostingIssueRef.current = false;
      return;
    }

    const now = Date.now();
    const { active, lastPostTime } = issueTracking.current;

    // Cek apakah sedang ada proses POST yang menggantung
    if (isPostingIssueRef.current) return;

    if (!active || isInitial || now - lastPostTime >= FIVE_MINUTES_MS) {
      // 1. KUNCI DULUAN SECARA SINKRONUS sebelum dipanggil 'await'
      isPostingIssueRef.current = true;

      // Simpan timestamp sebelumnya untuk rollback jika gagal
      const previousTracking = { ...issueTracking.current };

      // Set status active & lastPostTime LANGSUNG di awal
      issueTracking.current = { active: true, lastPostTime: now, status };

      const payload = {
        user_id: 1,
        issue_type: status.toUpperCase(), // "TAKIKARDIA" atau "BRADIKARDIA"
        bpm_recorded: currentBpm,
        recorded_at: new Date(now).toISOString(),
      };

      try {
        await apiService.post("/hr-issues", payload);
      } catch (err) {
        console.error("[HR-Issues] Gagal POST issue:", err);
        // Jika request network gagal, rollback status agar bisa mencoba lagi nanti
        issueTracking.current = previousTracking;
      } finally {
        // 2. Buka kunci posting setelah request selesai
        isPostingIssueRef.current = false;
      }
    }
  }, []);
  const setSimulateStatus = useCallback(
    (status: SimulateStatus) => {
      simulateStatusRef.current = status;
      setSimulateStatusState(status);

      const offset = getOffset(status);
      const effectiveHR = rawHRRef.current <= 0 ? 0 : Math.max(0, rawHRRef.current + offset);

      evaluateAndPostIssue(status, effectiveHR, true);
    },
    [evaluateAndPostIssue],
  );

  const currentHR = rawHR <= 0 ? 0 : Math.max(0, rawHR + getOffset(simulateStatus));
  const displayStatus: SimulateStatus | "-" = rawHR <= 0 ? "-" : simulateStatus;

  // ----------------------------------------------------
  // PENAMBAHAN HR REALTIME (PER DATA / PER DETIK)
  // ----------------------------------------------------
  const addHR = useCallback(
    (value: number) => {
      // Abaikan jika nilai yang masuk sama persis dengan yang sedang aktif (mencegah re-render tak perlu)
      if (value === rawHRRef.current && value === 0) return;

      setRawHR(value);
      rawHRRef.current = value;

      const status = simulateStatusRef.current;
      const offset = value <= 0 ? 0 : getOffset(status);
      const effectiveHR = value <= 0 ? 0 : Math.max(0, value + offset);

      if (effectiveHR > 0) {
        const timestamp = Date.now();
        const newPoint: ChartPoint = {
          value: effectiveHR,
          label: formatTimeLabel(timestamp),
          timestamp,
        };

        realtimeBuffer.current.push({ value: effectiveHR, timestamp });
        aggregateBuffer.current.push({ value: effectiveHR, timestamp });

        setRealtimeChartData((prevData) => [...prevData, newPoint].slice(-15));

        evaluateAndPostIssue(status, effectiveHR);
      }

      AsyncStorage.setItem(STORAGE_KEY_LATEST_HR, effectiveHR.toString()).catch(() => {});
    },
    [evaluateAndPostIssue],
  );

  // ----------------------------------------------------
  // INITIAL LOAD & BACKGROUND TIMERS
  // ----------------------------------------------------
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const latestVal = await AsyncStorage.getItem(STORAGE_KEY_LATEST_HR);
        if (latestVal) {
          const parsedVal = Number(latestVal);
          setRawHR(parsedVal);
          rawHRRef.current = parsedVal;
        }

        const cachedRealtime = await AsyncStorage.getItem(STORAGE_KEY_REALTIME_CACHE);
        if (cachedRealtime) {
          const items: HeartRateItem[] = JSON.parse(cachedRealtime);
          const now = Date.now();
          const validItems = items.filter((item) => now - item.timestamp <= TWENTY_FOUR_HOURS_MS);

          setRealtimeChartData(
            validItems.slice(-15).map((d) => ({
              value: d.value,
              label: formatTimeLabel(d.timestamp),
              timestamp: d.timestamp,
            })),
          );
        }

        const cachedAggregate = await AsyncStorage.getItem(STORAGE_KEY_AGGREGATE_CACHE);
        if (cachedAggregate) {
          const items: { value: number; timestamp: number }[] = JSON.parse(cachedAggregate);
          setAggregateChartData(
            items.slice(-10).map((d) => ({
              value: d.value,
              label: formatTimeLabel(d.timestamp),
              timestamp: d.timestamp,
            })),
          );
        }
      } catch (error) {
        console.error("[Init] Gagal membaca cache awal:", error);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    // Background Task 1: Upload Realtime Data ke Backend per 1 Menit (/hr)
    const realtimeInterval = setInterval(async () => {
      const buffer = [...realtimeBuffer.current];
      if (buffer.length === 0) return;

      realtimeBuffer.current = [];

      try {
        // Cache lokal
        const cached = await AsyncStorage.getItem(STORAGE_KEY_REALTIME_CACHE);
        let existing: HeartRateItem[] = cached ? JSON.parse(cached) : [];
        const now = Date.now();
        existing = existing.filter((item) => now - item.timestamp <= TWENTY_FOUR_HOURS_MS);
        await AsyncStorage.setItem(STORAGE_KEY_REALTIME_CACHE, JSON.stringify([...existing, ...buffer]));

        // Kirim entri per objek sesuai skema POST /hr
        await Promise.all(
          buffer.map((item) =>
            apiService.post("/hr", {
              user_id: 1,
              bpm: item.value,
              start_time: new Date(item.timestamp).toISOString(),
              end_time: new Date(item.timestamp).toISOString(),
            }),
          ),
        );
      } catch (error) {
        console.error("[POST /hr] Gagal mengunggah:", error);
      }
    }, 60000);

    // Background Task 2: Agregasi per 10 Menit ke Backend (/hr-aggregation)
    const aggregateInterval = setInterval(async () => {
      const buffer = [...aggregateBuffer.current];
      if (buffer.length === 0) return;

      aggregateBuffer.current = [];
      const sumHR = buffer.reduce((acc, curr) => acc + curr.value, 0);
      const averageHR = Math.round(sumHR / buffer.length);
      const startTime = buffer[0].timestamp;
      const endTime = buffer[buffer.length - 1].timestamp;

      const aggregatePoint = { value: averageHR, timestamp: endTime };

      try {
        const cached = await AsyncStorage.getItem(STORAGE_KEY_AGGREGATE_CACHE);
        let existing: { value: number; timestamp: number }[] = cached ? JSON.parse(cached) : [];
        existing = [...existing, aggregatePoint].slice(-50);
        await AsyncStorage.setItem(STORAGE_KEY_AGGREGATE_CACHE, JSON.stringify(existing));

        setAggregateChartData(
          existing.slice(-10).map((d) => ({
            value: d.value,
            label: formatTimeLabel(d.timestamp),
            timestamp: d.timestamp,
          })),
        );

        // Kirim agregasi ke /hr-aggregation
        await apiService.post("/hr-aggregation", {
          user_id: 1,
          bpm: averageHR,
          start_time: new Date(startTime).toISOString(),
          end_time: new Date(endTime).toISOString(),
        });
      } catch (error) {
        console.error("[POST /hr-aggregation] Error:", error);
      }
    }, 10 * 60000);

    return () => {
      clearInterval(realtimeInterval);
      clearInterval(aggregateInterval);
    };
  }, []);

  const resetStorage = useCallback(async () => {
    await AsyncStorage.clear();
    setRawHR(0);
    rawHRRef.current = 0;
    realtimeBuffer.current = [];
    aggregateBuffer.current = [];
    setRealtimeChartData([]);
    setAggregateChartData([]);
  }, []);

  return (
    <HRContext.Provider
      value={{
        currentHR,
        rawHR,
        simulateStatus,
        displayStatus,
        realtimeChartData,
        aggregateChartData,
        setSimulateStatus,
        addHR,
        resetStorage,
      }}
    >
      {children}
    </HRContext.Provider>
  );
}
