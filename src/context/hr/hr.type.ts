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

export type HRContextType = {
  currentHR: number | "-";
  addHR: (value: number) => void;
  resetStorage: () => Promise<void>;
};
