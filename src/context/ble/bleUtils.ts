import { Buffer } from "buffer";

export const parseHeartRateValue = (base64Value: string): number | null => {
  if (!base64Value) return null;

  const buffer = Buffer.from(base64Value, "base64");
  const bytes = Array.from(buffer);

  if (bytes.length > 1) {
    return bytes[1];
  }

  return null;
};
