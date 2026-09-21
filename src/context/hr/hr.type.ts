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

export type SimulateStatus = "NORMAL" | "TAKIKARDIA" | "BRADIKARDIA";

export type HRContextType = {
  currentHR: number;
  rawHR: number;
  simulateStatus: SimulateStatus;
  displayStatus: SimulateStatus | "-";
  setSimulateStatus: (status: SimulateStatus) => void;
  addHR: (value: number) => void;
  resetStorage: () => Promise<void>;
};
