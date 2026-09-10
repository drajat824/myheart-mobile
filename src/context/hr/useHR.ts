import { useContext } from "react";
import { HRContext } from "./HRContext";

export const useHR = () => {
  const context = useContext(HRContext);
  if (!context) {
    throw new Error("useHR must be used within a HRProvider");
  }
  return context;
};
