import type { Dispatch } from "react";

export type HeartRateItem = {
  value: number;
  timestamp: number;
};

export type AggregateItem = {
  startTime: number;
  endTime: number;
  averageHR: number;
  count: number;
};

export type HRState = {
  HeartRate: HeartRateItem[];
  HeartRateAgregate: AggregateItem[];
  lastAggregatedTimestamp: number;
};

export type HRAction = { type: "ADD_HR"; payload: number } | { type: "AGGREGATE"; payload: number } | { type: "RESET" } | { type: "INITIALIZE_STATE"; payload: HRState };

export type HRContextType = {
  hrContext: HRState;
  dispatch: Dispatch<HRAction>;
};
