export type HeartRateItem = {
  value: number;
  timestamp: number;
};

export type AggregateItem = {
  value: number;
  timestamp: number;
  startTime?: number;
  endTime?: number;
  count?: number;
};

export type SimulateStatus = "NORMAL" | "TAKIKARDIA" | "BRADIKARDIA";

export type HeartIssueRecord = {
  id?: number;
  user_id?: number;
  issue_type?: string;
  bpm_recorded?: number;
  recorded_at?: string;
};

export type ChartPoint = {
  value: number;
  label?: string;
  timestamp?: number;
};

export type HRContextType = {
  currentHR: number;
  rawHR: number;
  simulateStatus: SimulateStatus;
  displayStatus: SimulateStatus | "-";
  realtimeChartData: ChartPoint[];
  aggregateChartData: ChartPoint[];
  setSimulateStatus: (status: SimulateStatus) => void;
  addHR: (value: number) => void;
  resetStorage: () => Promise<void>;
};
