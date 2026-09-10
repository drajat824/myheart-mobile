import AsyncStorage from "@react-native-async-storage/async-storage";
import { AggregateItem, HRAction, HRState } from "./hr.type";

// Kalkulasi Agregasi
const aggregateActions = (
  state: HRState,
  action: Extract<HRAction, { type: "AGGREGATE" }>,
): {
  newAggregateItem: AggregateItem | null;
  currentTimestamp: number;
} => {
  const currentTimestamp = action.payload;
  const lastTime = state.lastAggregatedTimestamp;

  const unprocessedData = state.HeartRate.filter((item) => item.timestamp > lastTime && item.timestamp <= currentTimestamp);

  if (unprocessedData.length === 0) {
    return {
      newAggregateItem: null,
      currentTimestamp,
    };
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
    newAggregateItem,
    currentTimestamp,
  };
};

export const initialState: HRState = {
  HeartRate: [],
  HeartRateAgregate: [],
  lastAggregatedTimestamp: 0,
};

export function hrReducer(state: HRState, action: HRAction): HRState {
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
      const { newAggregateItem, currentTimestamp } = aggregateActions(state, action);

      if (!newAggregateItem) {
        return state;
      }

      return {
        ...state,
        HeartRateAgregate: [...state.HeartRateAgregate, newAggregateItem],
        lastAggregatedTimestamp: currentTimestamp,
      };
    }

    case "INITIALIZE_STATE":
      return action.payload;

    case "RESET":
      AsyncStorage.clear().catch(() => {
        /* ignore errors */
      });
      return initialState;

    default:
      return state;
  }
}
