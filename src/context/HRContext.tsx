import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useReducer, useState, type Dispatch, type ReactNode } from "react";

type HeartRateItem = {
  value: number;
  timestamp: number;
};

type AggregateItem = {
  startTime: number;
  endTime: number;
  averageHR: number;
  count: number;
};

type HRState = {
  HeartRate: HeartRateItem[];
  HeartRateAgregate: AggregateItem[];
  lastAggregatedTimestamp: number;
  devices: WearableDevice[];
};

// DEVICES

type WearableDevice = {
  mac: string;
  name: string;
};

type HRAction =
  | {
      type: "ADD_HR";
      payload: number;
    }
  | {
      type: "AGGREGATE";
      payload: number;
    }
  | {
      type: "RESET";
    }
  | {
      type: "INITIALIZE_STATE";
      payload: HRState;
    }
  | {
      type: "CONNECT_DEVICES";
      payload: WearableDevice[];
    };

type HRContextType = {
  hrContext: HRState;
  dispatch: Dispatch<HRAction>;
};

const initialState: HRState = {
  HeartRate: [],
  HeartRateAgregate: [],
  lastAggregatedTimestamp: 0,
  devices: [],
};

const STORAGE_KEY = "@myheartz_data_key";

function HReducer(state: HRState, action: HRAction): HRState {
  switch (action.type) {
    case "ADD_HR":
      return {
        ...state,

        HeartRate: [
          ...state.HeartRate,
          {
            value: action.payload,
            timestamp: Date.now(),
          },
        ],
      };

    case "AGGREGATE": {
      const currentTimestamp = action.payload;
      const lastTime = state.lastAggregatedTimestamp;
      const unprocessedData = state.HeartRate.filter((item) => item.timestamp > lastTime && item.timestamp <= currentTimestamp);
      if (unprocessedData.length === 0) {
        return state;
      }

      const sum = unprocessedData.reduce((acc, curr) => acc + curr.value, 0);
      const average = Math.round(sum / unprocessedData.length);

      const newAggregateItem: AggregateItem = {
        startTime: lastTime === 0 ? unprocessedData[0].timestamp : lastTime,
        endTime: currentTimestamp,
        averageHR: average,
        count: unprocessedData.length,
      };

      return {
        ...state,
        HeartRateAgregate: [...state.HeartRateAgregate, newAggregateItem],
        lastAggregatedTimestamp: currentTimestamp,
      };
    }

    case "CONNECT_DEVICES":
      return {
        ...state,
        devices: action.payload,
      };

    case "INITIALIZE_STATE":
      return action.payload;

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

const HRContext = createContext<HRContextType | null>(null);

export function HRProvider({ children }: { children: ReactNode }) {
  const [hrContext, realDispatch] = useReducer(HReducer, initialState);
  const [isReady, setIsReady] = useState(false);

  const dispatch: Dispatch<HRAction> = useCallback((action) => {
    if (action.type === "RESET") {
      AsyncStorage.removeItem(STORAGE_KEY).catch((error) => {
        console.error("Gagal menghapus data HR:", error);
      });
    }
    realDispatch(action);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedData = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedData) {
          const parsedData: HRState = JSON.parse(storedData);
          dispatch({
            type: "INITIALIZE_STATE",
            payload: parsedData,
          });
        }
      } catch (error) {
        console.error("Gagal memuat data HR:", error);
      } finally {
        setIsReady(true);
      }
    };

    loadData();
  }, [dispatch]);

  // UNTUK DEBUG
  const debugAsyncStorage = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const entries = await Promise.all(keys.map(async (key) => [key, await AsyncStorage.getItem(key)] as const));

      console.log("========== ASYNC STORAGE ==========");

      entries.forEach(([key, value]) => {
        console.log(`KEY: ${key}`);
        console.log("VALUE:", value);
        console.log("-----------------------------------");
        // if (value) {
        //   const parsed: HRState = JSON.parse(value);
        //   console.log(parsed?.HeartRate[parsed?.HeartRate?.length - 1].value);
        // }
      });

      console.log("===================================");
    } catch (error) {
      console.error("Gagal membaca AsyncStorage:", error);
    }
  };

  useEffect(() => {
    if (!isReady) return;

    const saveData = async () => {
      try {
        const stringifiedData = JSON.stringify(hrContext);
        await AsyncStorage.setItem(STORAGE_KEY, stringifiedData);
        await debugAsyncStorage();
      } catch (error) {
        console.error("Gagal menyimpan data HR:", error);
      }
    };

    saveData();
  }, [hrContext, isReady]);

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

  return (
    <HRContext.Provider
      value={{
        hrContext,
        dispatch,
      }}
    >
      {children}
    </HRContext.Provider>
  );
}

export const useHR = () => {
  const context = useContext(HRContext);
  if (!context) {
    throw new Error("useHR must be used within a HRProvider");
  }
  return context;
};
