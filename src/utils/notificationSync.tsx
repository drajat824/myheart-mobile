import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { apiService } from "./apiService";

const BACKGROUND_NOTIFICATION_TASK = "BACKGROUND-NOTIFICATION-TASK";

type MedicationSchedule = {
  id: number;
  schedule_date: string;
  brand_name?: string;
  generic_name?: string;
  dosage_form?: string;
};

const getUserTimezoneOffset = (): string => {
  const offsetMinutes = -new Date().getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const hours = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, "0");
  const minutes = String(Math.abs(offsetMinutes) % 60).padStart(2, "0");
  return `${sign}${hours}:${minutes}`;
};

const formatDateToParam = (date: Date): string => {
  if (isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper krusial agar string UTC dari backend dibaca dengan benar oleh HP
const parseToDate = (dateVal: string): Date => {
  let formattedStr = dateVal.includes(" ") ? dateVal.replace(" ", "T") : dateVal;
  if (!formattedStr.endsWith("Z") && !formattedStr.includes("+") && !formattedStr.includes("-", 10)) {
    formattedStr += "Z";
  }
  return new Date(formattedStr);
};

// 1. Ekstrak logika sinkronisasi menjadi fungsi yang bisa digunakan ulang (reusable)
export const syncAlarmsForeground = async () => {
  try {
    const userTz = getUserTimezoneOffset();

    // Ambil data dari hari ini sampai 7 hari ke depan untuk didaftarkan ke OS HP
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const startStr = formatDateToParam(today);
    const endStr = formatDateToParam(nextWeek);

    const schedules = (await apiService.get(`/medication-schedules?user_id=1&timezone=${encodeURIComponent(userTz)}&start_date=${startStr}&end_date=${endStr}&status=pending`)) as MedicationSchedule[];

    // Bersihkan alarm lokal lama agar tidak numpuk/duplikat
    await Notifications.cancelAllScheduledNotificationsAsync();

    const now = Date.now();

    // Daftarkan ulang alarm
    for (const schedule of schedules) {
      const scheduleDate = parseToDate(schedule.schedule_date);

      // Hanya jadwalkan jika waktunya di masa depan
      if (!Number.isNaN(scheduleDate.getTime()) && scheduleDate.getTime() > now) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Waktunya Minum Obat! 💊",
            body: `${schedule.brand_name || schedule.generic_name || "Obat"} - ${schedule.dosage_form || ""}`.trim(),
            data: { scheduleId: schedule.id, medicationData: schedule },
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: scheduleDate,
          },
        });
      }
    }
    console.log("Sinkronisasi alarm jadwal obat berhasil!");
  } catch (e) {
    console.error("Sinkronisasi alarm gagal:", e);
  }
};

// 2. Definisikan Task Background untuk merespons Silent Push dari Backend
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error("Background task error:", error);
    return;
  }
  if (data) {
    // Jalankan fungsi sinkronisasi yang sama secara diam-diam
    await syncAlarmsForeground();
  }
});

// 3. Daftarkan Task ini (Dipanggil di paling atas _layout.tsx)
export const registerBackgroundSync = () => {
  Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK).catch((err) => console.error("Gagal mendaftarkan background task:", err));
};
