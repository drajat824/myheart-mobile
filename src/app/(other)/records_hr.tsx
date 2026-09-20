import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { Cards, DatePicker, RouterSub, WrapperMain } from "../../component";
import { apiService } from "../../utils/apiService"; // Sesuaikan path jika berbeda

const CACHE_KEY = "@myheartz_records_cache";

// Type disesuaikan dengan response API
export type AggregateRecord = {
  id?: number;
  user_id?: number;
  bpm?: number;
  averageHR?: number;
  start_time?: string | number;
  startTime?: number;
  end_time?: string | number;
};

// Helper aman untuk mengonversi string/number tanggal ke objek Date (Kompatibel dengan Hermes)
const parseToDate = (dateVal: string | number | undefined): Date => {
  if (!dateVal) return new Date(NaN);
  if (typeof dateVal === "number") return new Date(dateVal);

  // Jika formatnya "2026-09-19 10:00:00", ganti spasi dengan 'T' agar bisa di-parse Hermes
  const formattedStr = typeof dateVal === "string" && dateVal.includes(" ") ? dateVal.replace(" ", "T") : dateVal;

  return new Date(formattedStr);
};

export default function RecordsHR() {
  const [groupedByDay, setGroupedByDay] = useState<Record<string, AggregateRecord[]>>({});
  const [refreshing, setRefreshing] = useState(false);

  // Grouping data berdasarkan tanggal
  const groupData = (data: AggregateRecord[]) => {
    if (!Array.isArray(data)) return {};

    return data.reduce(
      (result, item) => {
        const rawStartTime = item.start_time || item.startTime;
        const date = parseToDate(rawStartTime);

        if (isNaN(date.getTime())) return result; // Abaikan jika tanggal invalid

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const dateKey = `${year}-${month}-${day}`;

        if (!result[dateKey]) result[dateKey] = [];
        result[dateKey].push(item);
        return result;
      },
      {} as Record<string, AggregateRecord[]>,
    );
  };

  const fetchRecords = useCallback(async () => {
    try {
      // Ambil data dari API
      const data = await apiService.get<AggregateRecord[]>("/hr"); // Sesuaikan endpoint Anda
      setGroupedByDay(groupData(data));

      // Simpan cache
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Gagal menarik riwayat HR:", error);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRecords();
    setRefreshing(false);
  }, [fetchRecords]);

  useEffect(() => {
    const loadCacheAndFetch = async () => {
      // Load dari cache AsyncStorage dulu
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          setGroupedByDay(groupData(JSON.parse(cached)));
        } catch (e) {
          console.error("Failed to parse cache", e);
        }
      }

      // Tarik data terbaru dari API
      onRefresh();
    };

    loadCacheAndFetch();
  }, [fetchRecords]);

  return (
    <WrapperMain>
      <View className="flex-col pb-8">
        <RouterSub title="REKAM MEDIS" subTitle="RIWAYAT HEART RATE" />

        <View className="flex flex-col gap-4 flex-1 mt-4">
          <View className="flex flex-1">
            <DatePicker onDateChange={(date) => console.log(date, "date")} onRangeChange={(prev, next) => console.log(prev, next, "range")} />
          </View>
          <ScrollView className="flex-1 flex h-screen" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#DB3546"]} tintColor="#DB3546" />}>
            {Object.entries(groupedByDay).map(([date, data]) => (
              <Cards key={date} className="flex flex-col gap-2 mb-3">
                <Text className="text-normal font-bold">{date}</Text>

                <View className="flex-col gap-3 mt-2">
                  {data
                    .sort((a, b) => {
                      const timeA = parseToDate(a.start_time || a.startTime).getTime();
                      const timeB = parseToDate(b.start_time || b.startTime).getTime();
                      return timeB - timeA; // Terbaru di atas
                    })
                    .map((item, index) => {
                      const rawStartTime = item.start_time || item.startTime;
                      const itemDate = parseToDate(rawStartTime);
                      const bpmValue = item.bpm ?? item.averageHR ?? 0;

                      const timeFormatted = !isNaN(itemDate.getTime())
                        ? itemDate.toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "--:--";

                      return (
                        <View key={`${rawStartTime}-${index}`} className="flex-row items-center gap-4">
                          <View className="w-2 h-2 rounded-full bg-black" />
                          <Text className="text-xl">{timeFormatted} WIB:</Text>
                          <Text className="text-xl font-semibold">{bpmValue} BPM</Text>
                        </View>
                      );
                    })}
                </View>
              </Cards>
            ))}
          </ScrollView>
        </View>
      </View>
    </WrapperMain>
  );
}
