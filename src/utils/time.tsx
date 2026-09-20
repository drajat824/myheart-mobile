// Mengubah timestamp ms menjadi ISO 8601 dengan 6 digit fraksi detik
// Contoh output ISO: "2026-09-19T10:00:00.000000Z"
export const formatTimestamp6 = (timestampMs: number): string => {
  const date = new Date(timestampMs);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const milliseconds = String(date.getMilliseconds()).padStart(3, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}000`;
};

// Jika backend/MySQL mengharuskan format tanpa 'T' dan 'Z' ("YYYY-MM-DD HH:mm:ss.ffffff"):
export const formatTimestamp6MySQL = (timestampMs: number): string => {
  return new Date(timestampMs).toISOString().replace("T", " ").replace("Z", "000");
};
