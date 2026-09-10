import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useEffect, useReducer, useState, type Dispatch, type ReactNode } from "react";
import { HRAction, HRContextType, HRState } from "./hr.type";
import { hrReducer, initialState } from "./hrReducer";

// 1. Pemisahan STORAGE_KEY
const STORAGE_KEY_RAW = "@myheartz_raw_hr";
const STORAGE_KEY_AGGREGATE = "@myheartz_aggregate_hr";

export const HRContext = createContext<HRContextType | null>(null);

// Helper function untuk debugging spesifik ke dua key baru
const debugAsyncStorage = async () => {
  try {
    const rawData = await AsyncStorage.getItem(STORAGE_KEY_RAW);
    const aggData = await AsyncStorage.getItem(STORAGE_KEY_AGGREGATE);

    const parsedRaw = rawData ? JSON.parse(rawData) : [];
    const parsedAgg = aggData ? JSON.parse(aggData) : { HeartRateAgregate: [], lastAggregatedTimestamp: 0 };

    const latestHR = parsedRaw.length > 0 ? parsedRaw[parsedRaw.length - 1] : null;

    console.log("========== DEBUG ASYNC STORAGE ==========");
    console.log(`[RAW HR] Total Items: ${parsedRaw.length}`);
    if (latestHR) {
      console.log(`[RAW HR] Latest Value: ${latestHR.value} BPM | Time: ${new Date(latestHR.timestamp).toLocaleTimeString()}`);
    }
    // console.log(`[AGGREGATE] Total Buckets: ${parsedAgg.HeartRateAgregate.length}`);
    // console.log(`[AGGREGATE] Last Timestamp: ${parsedAgg.lastAggregatedTimestamp}`);
    console.log("=========================================");
  } catch (error) {
    console.error("Gagal membaca AsyncStorage:", error);
  }
};

export function HRProvider({ children }: { children: ReactNode }) {
  const [hrContext, realDispatch] = useReducer(hrReducer, initialState);
  const [isReady, setIsReady] = useState(false);

  const dispatch: Dispatch<HRAction> = useCallback((action) => {
    realDispatch(action);
  }, []);

  // 2. Memuat data dari dua key terpisah saat awal
  useEffect(() => {
    const loadData = async () => {
      try {
        const [storedRaw, storedAgg] = await Promise.all([AsyncStorage.getItem(STORAGE_KEY_RAW), AsyncStorage.getItem(STORAGE_KEY_AGGREGATE)]);

        const rawList = storedRaw ? JSON.parse(storedRaw) : initialState.HeartRate;
        const aggData = storedAgg
          ? JSON.parse(storedAgg)
          : {
              HeartRateAgregate: initialState.HeartRateAgregate,
              lastAggregatedTimestamp: initialState.lastAggregatedTimestamp,
            };

        // Gabungkan kembali menjadi satu HRState untuk Reducer
        const restoredState: HRState = {
          HeartRate: rawList,
          HeartRateAgregate: aggData.HeartRateAgregate,
          lastAggregatedTimestamp: aggData.lastAggregatedTimestamp,
        };

        dispatch({
          type: "INITIALIZE_STATE",
          payload: restoredState,
        });
      } catch (error) {
        console.error("Gagal memuat data HR:", error);
      } finally {
        setIsReady(true);
      }
    };

    loadData();
  }, [dispatch]);

  // 3. Menyimpan data secara terpisah ke dua key
  useEffect(() => {
    if (!isReady) return;

    const saveData = async () => {
      try {
        // Objek gabungan untuk data agregat
        const aggregatePayload = {
          HeartRateAgregate: hrContext.HeartRateAgregate,
          lastAggregatedTimestamp: hrContext.lastAggregatedTimestamp,
        };

        await Promise.all([AsyncStorage.setItem(STORAGE_KEY_RAW, JSON.stringify(hrContext.HeartRate)), AsyncStorage.setItem(STORAGE_KEY_AGGREGATE, JSON.stringify(aggregatePayload))]);

        await debugAsyncStorage();
      } catch (error) {
        console.error("Gagal menyimpan data HR:", error);
      }
    };

    saveData();
  }, [hrContext, isReady]);

  // Running interval agregasi per 5 detik
  useEffect(() => {
    if (!isReady) return;

    const intervalId = setInterval(() => {
      const currentTimestamp = Date.now();
      dispatch({
        type: "AGGREGATE",
        payload: currentTimestamp,
      });
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [dispatch, isReady]);

  return <HRContext.Provider value={{ hrContext, dispatch }}>{children}</HRContext.Provider>;
}
