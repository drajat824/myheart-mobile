import { useContext } from "react";
import { BleContext } from "./BleContext";

export const useBle = () => {
  const context = useContext(BleContext);
  if (!context) {
    throw new Error("useBle must be used within a BleProvider");
  }
  return context;
};
