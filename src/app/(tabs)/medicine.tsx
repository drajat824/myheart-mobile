import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, View } from "react-native";
import { Button, Cards, DatePicker, Header, WrapperMain } from "../../component";
import { apiService } from "../../utils/apiService";

export type MedicationSchedule = {
  id: number;
  medication_id: number;
  schedule_date: string;
  status: "pending" | "taken" | "missed";
  takenAt?: string | null;
  late?: number;
  user_id?: number;
  generic_name?: string;
  brand_name?: string;
  dosage_form?: string;
  strength?: string;
  route?: string;
  meal_relation?: string;
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

const parseToDate = (dateVal: string | number | undefined): Date => {
  if (!dateVal) return new Date(NaN);
  if (typeof dateVal === "number") return new Date(dateVal);

  if (typeof dateVal === "string") {
    let formattedStr = dateVal.includes(" ") ? dateVal.replace(" ", "T") : dateVal;

    // PENTING: Tambahkan "Z" karena string yang datang dari database adalah murni waktu UTC.
    // Dengan menambah Z, JavaScript akan otomatis melakukan +7 jam (jika user di WIB) saat menampilkannya di UI.
    if (!formattedStr.endsWith("Z") && !formattedStr.includes("+") && !formattedStr.includes("-", 10)) {
      formattedStr += "Z";
    }
    return new Date(formattedStr);
  }

  return new Date(dateVal);
};

const formatDisplayDate = (dateVal: string): string => {
  const parsedDate = parseToDate(dateVal);
  if (isNaN(parsedDate.getTime())) return dateVal;

  return parsedDate.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatDisplayTime = (dateVal: string): string => {
  const parsedDate = parseToDate(dateVal);
  if (isNaN(parsedDate.getTime())) return "--:--";

  return (
    parsedDate.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }) + " WIB"
  );
};

const formatMealRelationLabel = (mealRelation?: string): string => {
  const labels: Record<string, string> = {
    before_meal: "Sebelum Makan",
    with_meal: "Saat Makan",
    after_meal: "Setelah Makan",
    any_time: "Kapan Saja",
  };

  return mealRelation ? (labels[mealRelation] ?? mealRelation) : "";
};

export default function Medicine() {
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | null>(null);

  // Fetch data menggunakan parameter langsung dari state
  const fetchSchedules = useCallback(
    async (isPullRefresh: boolean = false) => {
      try {
        if (isPullRefresh) {
          setRefreshing(true);
        } else {
          setSchedules([]); // Kosongkan data lama agar tidak tampil saat sedang ganti tanggal/loading
          setIsLoading(true);
        }

        const userTz = getUserTimezoneOffset();
        let endpoint = `/medication-schedules?user_id=1&timezone=${encodeURIComponent(userTz)}`;

        if (selectedRange) {
          const startStr = formatDateToParam(selectedRange.start);
          const endStr = formatDateToParam(selectedRange.end);
          endpoint += `&start_date=${startStr}&end_date=${endStr}`;
        } else {
          const selectedStr = formatDateToParam(selectedDate);
          endpoint += `&schedule_date=${selectedStr}`;
        }

        const data = await apiService.get<MedicationSchedule[]>(endpoint);
        setSchedules(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Gagal mengambil jadwal obat:", error);
        Alert.alert("Error", "Gagal memuat daftar jadwal obat.");
        setSchedules([]);
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [selectedDate, selectedRange],
  );

  const handleUpdateStatus = async (id: number, currentStatus: "taken" | "missed" | "pending") => {
    const newStatus = currentStatus === "taken" ? "missed" : "taken";

    try {
      setUpdatingId(id);
      await apiService.put(`/medication-schedules/${id}`, { status: newStatus });
      setSchedules((prev) => prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item)));
    } catch (error) {
      console.error("Gagal memperbarui status obat:", error);
      Alert.alert("Gagal", "Gagal memperbarui status obat, silakan coba lagi.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Cukup update state saja. Efek pemanggilan API dihandle oleh useEffect
  const handleDateChange = useCallback((date: Date) => {
    setSelectedDate(date);
    setSelectedRange(null);
  }, []);

  const handleRangeChange = useCallback((startDate: Date, endDate: Date) => {
    setSelectedRange({ start: startDate, end: endDate });
  }, []);

  const onRefresh = useCallback(async () => {
    await fetchSchedules(true);
  }, [fetchSchedules]);

  // Otomatis terpicu (trigger) sekali di awal, dan setiap kali selectedDate atau selectedRange berubah
  useEffect(() => {
    fetchSchedules(false);
  }, [fetchSchedules]);

  return (
    <WrapperMain>
      <View className="flex-col pb-8">
        <Header>
          <Text className="text-title text-white">JADWAL OBAT</Text>
          <Text className="text-normal font-light text-white">Periksa jadwal pemberian obat, pastikan tidak ada yang terlewat.</Text>
        </Header>

        <View className="mt-4 flex flex-1 flex-col gap-4">
          <DatePicker disable={isLoading || refreshing} initialDate={selectedDate} onDateChange={handleDateChange} onRangeChange={handleRangeChange} />

          <ScrollView className="flex flex-1 flex-col gap-3 pb-3" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#DB3546"]} tintColor="#DB3546" />}>
            {isLoading && schedules.length === 0 ? (
              <Cards className="items-center justify-center py-10">
                <ActivityIndicator size="large" color="#DB3546" />
                <Text className="mt-4 font-medium text-gray-500">Memuat data jadwal obat...</Text>
              </Cards>
            ) : schedules.length === 0 ? (
              <Cards className="items-center justify-center py-6">
                <Text className="font-medium text-gray-500">Tidak ada jadwal obat pada tanggal atau rentang ini.</Text>
              </Cards>
            ) : (
              schedules.map((item) => {
                const isTaken = item.status === "taken";
                const isMissed = item.status === "missed";
                const isPending = item.status === "pending";

                let cardColor = "#FFFFFF";
                if (isTaken) cardColor = "#38C172";
                if (isMissed) cardColor = "#DB3546";

                const isTextColorWhite = isTaken || isMissed;
                const textColorClass = isTextColorWhite ? "text-white" : "text-black";

                const medicationName = item.brand_name ? `${item.brand_name} (${item.generic_name})` : item.generic_name;
                const dosageText = `${item.dosage_form || ""} ${item.strength || ""}`.trim();

                return (
                  <Cards color={cardColor} key={item.id} className="mb-3 flex flex-col gap-2">
                    <Text className={`text-normal font-bold ${textColorClass}`}>
                      {isTaken && "SUDAH MINUM"}
                      {isMissed && "BELUM MINUM"}
                      {isPending && "HARI INI"}
                    </Text>

                    <Text className={`text-normal ${textColorClass}`}>
                      {formatDisplayTime(item.schedule_date)}
                      {item.meal_relation ? ` - ${formatMealRelationLabel(item.meal_relation)}` : ""}
                    </Text>

                    <Text className={`text-normal ${textColorClass}`}>{formatDisplayDate(item.schedule_date)}</Text>

                    <View className="mt-2 flex-col gap-3">
                      <View className={`border-1 flex-col gap-1 rounded-xl p-3 ${isPending ? "bg-gray-50" : "bg-white"}`}>
                        <View className="flex-row items-center gap-3">
                          <View className="h-2 w-2 rounded-full bg-black" />
                          <Text className="text-xl font-bold text-black">{medicationName || "Obat Tidak Diketahui"}</Text>
                        </View>

                        <View className="ml-5 flex-col">
                          {dosageText ? <Text className="text-sm text-gray-700">Dosis: {dosageText}</Text> : null}
                          {item.route ? <Text className="text-sm text-gray-700">Rute: {item.route}</Text> : null}
                        </View>
                      </View>
                    </View>

                    {!isPending && (
                      <View className="flex flex-row items-center justify-between pt-5">
                        <Text className={`text-normal font-semibold ${textColorClass}`}>UBAH STATUS</Text>

                        <Button style={{ borderWidth: 1.5 }} buttonColor={isTaken ? "#DB3546" : "#38C172"} borderColor="#ffffff" disabled={updatingId === item.id} onPress={() => handleUpdateStatus(item.id, item.status)}>
                          {updatingId === item.id ? <ActivityIndicator size="small" color="#ffffff" /> : <Text className="font-bold text-white">{isTaken ? "BELUM" : "SUDAH"}</Text>}
                        </Button>
                      </View>
                    )}
                  </Cards>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </WrapperMain>
  );
}
