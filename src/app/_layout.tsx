// _layout.tsx
import { BleProvider, HRProvider } from "@/context";
import { apiService } from "@/utils/apiService";
import { registerBackgroundSync, syncAlarmsForeground } from "@/utils/notificationSync";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Stack, usePathname, useSegments } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { PaperProvider } from "react-native-paper";
import { Cards, Modal } from "../component";
import { ModalProvider, useModal } from "../context";
import "./global.css";

// ---------------------------------------------------------------------------
// INITIALIZATION & CONFIGURATION
// ---------------------------------------------------------------------------
registerBackgroundSync();

// Konfigurasi agar notifikasi tampil pada bar (termasuk background)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------
type MedicationSchedule = {
  id: number;
  medication_id: number;
  schedule_date: string;
  status: "pending" | "taken" | "missed";
  brand_name?: string;
  generic_name?: string;
  meal_relation?: string;
  route?: string;
};

// ---------------------------------------------------------------------------
// HELPER FUNCTIONS
// ---------------------------------------------------------------------------
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

const parseToDate = (dateVal: string): Date => {
  let formattedStr = dateVal.includes(" ") ? dateVal.replace(" ", "T") : dateVal;
  if (!formattedStr.endsWith("Z") && !formattedStr.includes("+") && !formattedStr.includes("-", 10)) {
    formattedStr += "Z";
  }
  return new Date(formattedStr);
};

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------
function RootLayoutContent() {
  // Navigation Hooks
  const pathname = usePathname();
  const segments = useSegments();

  // Modal Hooks
  const { openModal, closeModal } = useModal();

  // Local State
  const [activeSchedule, setActiveSchedule] = useState<MedicationSchedule | null>(null);
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  // Refs
  const snoozedRef = useRef<Record<number, number>>({});

  // Cek segment route aktif untuk membatasi tampilan Cards
  const isAllowedScreen = segments[0] === "(tabs)" || segments[0] === "(other)";

  // ---------------------------------------------------------------------------
  // BUSINESS LOGIC
  // ---------------------------------------------------------------------------
  const checkPendingSchedules = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const userDataStr = await AsyncStorage.getItem("userData");

      if (!token || !userDataStr) return;

      const userData = JSON.parse(userDataStr);
      const userId = userData.id;

      const userTz = getUserTimezoneOffset();
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      const schedules = (await apiService.get(`/medication-schedules?user_id=${userId}&timezone=${encodeURIComponent(userTz)}&start_date=${formatDateToParam(yesterday)}&end_date=${formatDateToParam(today)}&status=pending`)) as MedicationSchedule[];

      const now = new Date().getTime();

      // Filter jadwal yang sudah waktunya dan tidak sedang di-snooze
      const dueSchedules = schedules.filter((s) => {
        const schedTime = parseToDate(s.schedule_date).getTime();
        if (schedTime > now) return false;

        const snoozeUntil = snoozedRef.current[s.id];
        if (snoozeUntil && snoozeUntil > now) return false;

        return true;
      });

      // Urutkan jadwal terlama ke terbaru
      dueSchedules.sort((a, b) => parseToDate(a.schedule_date).getTime() - parseToDate(b.schedule_date).getTime());

      if (dueSchedules.length > 0) {
        setActiveSchedule(dueSchedules[0]);
        // Tampilkan superRoot (Konfirmasi Ulang) jika lebih dari 1 antrean, jika tidak tampilkan root biasa
        if (dueSchedules.length > 1) {
          closeModal("root");
          openModal("superRoot");
        } else {
          closeModal("superRoot");
          openModal("root");
        }
      } else {
        setActiveSchedule(null);
        closeModal("root");
        closeModal("superRoot");
      }
    } catch (error) {
      console.error("Gagal memeriksa jadwal tertunda:", error);
    }
  };

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------
  const handleTaken = async () => {
    if (!activeSchedule) return;

    setIsLoadingAction(true);
    try {
      const utcTakenAt = new Date().toISOString();

      await apiService.put(`/medication-schedules/${activeSchedule.id}`, {
        status: "taken",
        takenAt: utcTakenAt,
      });

      // Hapus data snooze jika ada setelah obat diminum
      if (snoozedRef.current[activeSchedule.id]) {
        delete snoozedRef.current[activeSchedule.id];
      }

      await checkPendingSchedules();
    } catch (error) {
      console.error("Gagal memperbarui status obat:", error);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleSnooze = async () => {
    if (!activeSchedule) return;

    const snoozeDurationMs = 1 * 60 * 1000; // 15 Menit
    const snoozeUntil = new Date(Date.now() + snoozeDurationMs);

    snoozedRef.current[activeSchedule.id] = snoozeUntil.getTime();

    // Best Practice: Tambahkan identifier eksplisit agar tidak menimpa notifikasi lokal lain yang valid
    await Notifications.scheduleNotificationAsync({
      identifier: `snooze-${activeSchedule.id}-${Date.now()}`,
      content: {
        title: "Time to Take Your Medicine! 💊",
        body: `${activeSchedule.brand_name || activeSchedule.generic_name}`,
        data: { scheduleId: activeSchedule.id },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: snoozeUntil,
      },
    });

    await checkPendingSchedules();
  };

  // ---------------------------------------------------------------------------
  // EFFECTS
  // ---------------------------------------------------------------------------
  useEffect(() => {
    checkPendingSchedules();
    syncAlarmsForeground();

    const responseListener = Notifications.addNotificationResponseReceivedListener(() => {
      checkPendingSchedules();
    });

    const foregroundListener = Notifications.addNotificationReceivedListener(() => {
      checkPendingSchedules();
    });

    return () => {
      try {
        responseListener.remove?.();
      } catch (e) {
        console.error("Error removing response listener", e);
      }
      try {
        foregroundListener.remove?.();
      } catch (e) {
        console.error("Error removing foreground listener", e);
      }
    };
  }, [pathname]);

  // ---------------------------------------------------------------------------
  // RENDER HELPERS
  // ---------------------------------------------------------------------------
  const renderScheduleInfo = () => {
    if (!activeSchedule) return null;

    const dateObj = parseToDate(activeSchedule.schedule_date);
    const timeString = dateObj.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";
    const dateString = dateObj.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
    const displayName = activeSchedule.brand_name ? `${activeSchedule.brand_name} (${activeSchedule.generic_name})` : activeSchedule.generic_name;

    return (
      <View className="mt-4 w-full flex-col gap-2 border-t border-gray-200 pt-4">
        <Text className="text-center text-lg font-semibold text-gray-800">
          {dateString} - {timeString}
        </Text>

        <View className="mt-2 rounded-xl bg-gray-100 p-4">
          <Text className="text-xl font-bold text-black">{displayName}</Text>

          <View className="mt-2 flex-row flex-wrap gap-x-4 gap-y-1">
            {activeSchedule.meal_relation && <Text className="text-sm text-gray-700">Relasi Makan: {activeSchedule.meal_relation}</Text>}
            {activeSchedule.route && <Text className="text-sm text-gray-700">Rute: {activeSchedule.route}</Text>}
          </View>
        </View>

        <View className="mt-6 flex flex-row justify-between gap-3">
          <TouchableOpacity className="flex-1 items-center justify-center rounded-xl bg-[#DB3546] py-3" onPress={handleSnooze} disabled={isLoadingAction}>
            <Text className="font-bold text-white">TUNDA 15 MNT</Text>
          </TouchableOpacity>

          <TouchableOpacity className="flex-1 items-center justify-center rounded-xl bg-[#38C172] py-3" onPress={handleTaken} disabled={isLoadingAction}>
            {isLoadingAction ? <ActivityIndicator color="#fff" /> : <Text className="font-bold text-white">SUDAH DIMINUM</Text>}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <HRProvider>
      <BleProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(other)" options={{ headerShown: false }} />
        </Stack>

        {isAllowedScreen && (
          <>
            <Modal id="superRoot">
              <View className="mx-8 flex justify-center">
                <Cards>
                  <View className="items-center">
                    <Text className="text-2xl font-bold text-red-600">KONFIRMASI ULANG</Text>
                    <Text className="mt-2 text-center text-sm text-gray-600">Anda melewatkan jadwal sebelumnya. Harap konfirmasi jadwal ini terlebih dahulu:</Text>
                  </View>
                  {renderScheduleInfo()}
                </Cards>
              </View>
            </Modal>

            <Modal id="root">
              <View className="mx-8 flex justify-center">
                <Cards>
                  <View className="items-center">
                    <Text className="text-2xl font-bold">JADWAL OBAT</Text>
                    <Text className="mt-2 text-center text-sm text-gray-600">Waktunya minum obat Anda:</Text>
                  </View>
                  {renderScheduleInfo()}
                </Cards>
              </View>
            </Modal>
          </>
        )}
      </BleProvider>
    </HRProvider>
  );
}

// ---------------------------------------------------------------------------
// EXPORT COMPONENT
// ---------------------------------------------------------------------------
export default function RootLayout() {
  return (
    <ModalProvider>
      <PaperProvider>
        <RootLayoutContent />
      </PaperProvider>
    </ModalProvider>
  );
}
