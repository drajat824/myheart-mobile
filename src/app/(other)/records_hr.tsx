import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { Cards, DatePicker, RouterSub, WrapperMain } from "../../component";
import { apiService } from "../../utils/apiService";

const CACHE_KEY = "@myheartz_records_cache";

export type AggregateRecord = {
  id?: number;
  user_id?: number;
  bpm?: number;
  averageHR?: number;
  start_time?: string | number;
  startTime?: number;
  end_time?: string | number;
};

// Helper untuk format objek Date ke string YYYY-MM-DD berdasarkan waktu lokal
const formatDateToParam = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper aman mengonversi tanggal/timestamp ke Date objek
const parseToDate = (dateVal: string | number | undefined): Date => {
  if (!dateVal) return new Date(NaN);
  if (typeof dateVal === "number") return new Date(dateVal);
  const formattedStr = typeof dateVal === "string" && dateVal.includes(" ") ? dateVal.replace(" ", "T") : dateVal;
  return new Date(formattedStr);
};

export default function RecordsHR() {
  const [groupedByDay, setGroupedByDay] = useState<Record<string, AggregateRecord[]>>({});
  const [refreshing, setRefreshing] = useState(false);

  // State penyimpan filter tanggal yang sedang aktif
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | null>(null);

  // Grouping data berdasarkan tanggal
  const groupData = (data: AggregateRecord[]) => {
    if (!Array.isArray(data)) return {};

    return data.reduce(
      (result, item) => {
        const rawStartTime = item.start_time || item.startTime;
        const date = parseToDate(rawStartTime);

        if (isNaN(date.getTime())) return result;

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

  // Fungsi Fetch Data berdasarkan parameter single date atau range
  const fetchRecords = useCallback(
    async (filterParams?: { date?: Date; range?: { start: Date; end: Date } | null }) => {
      try {
        setRefreshing(true);
        let endpoint = "/hr";

        const rangeFilter = filterParams?.range !== undefined ? filterParams.range : selectedRange;
        const dateFilter = filterParams?.date || selectedDate;

        if (rangeFilter) {
          // Mode Range: /hr?start_time=YYYY-MM-DD&end_time=YYYY-MM-DD
          const startStr = formatDateToParam(rangeFilter.start);
          const endStr = formatDateToParam(rangeFilter.end);
          endpoint = `/hr?start_time=${startStr}&end_time=${endStr}`;
        } else {
          // Mode Single Date (Default Hari ini): /hr?date=YYYY-MM-DD
          const dateStr = formatDateToParam(dateFilter);
          endpoint = `/hr?date=${dateStr}`;
        }

        const data = await apiService.get<AggregateRecord[]>(endpoint);
        setGroupedByDay(groupData(data));

        // Cache hasil
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
      } catch (error) {
        console.error("Gagal menarik riwayat HR:", error);
      } finally {
        setRefreshing(false);
      }
    },
    [selectedDate, selectedRange],
  );

  // Trigger Handler untuk Single Date Picker
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setSelectedRange(null); // Reset mode range
    fetchRecords({ date, range: null });
  };

  // Trigger Handler untuk Range Date Picker
  const handleRangeChange = (startDate: Date, endDate: Date) => {
    const range = { start: startDate, end: endDate };
    setSelectedRange(range);
    fetchRecords({ range });
  };

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRecords();
    setRefreshing(false);
  }, [fetchRecords]);

  // Initial Load (Default Load Data Hari Ini)
  useEffect(() => {
    const loadCacheAndFetch = async () => {
      // 1. Tampilkan cache jika ada
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          setGroupedByDay(groupData(JSON.parse(cached)));
        } catch (e) {
          console.error("Gagal parse cache", e);
        }
      }

      // 2. Fetch data terbaru untuk HARI INI
      const today = new Date();
      setSelectedDate(today);
      setSelectedRange(null);
      await fetchRecords({ date: today, range: null });
    };

    loadCacheAndFetch();
  }, []);

  return (
    <WrapperMain>
      <View className="flex-col pb-8">
        <RouterSub title="REKAM MEDIS" subTitle="RIWAYAT HEART RATE" />

        <View className="flex flex-col gap-4 flex-1 mt-4">
          <View className="flex flex-1">
            <DatePicker initialDate={selectedDate} onDateChange={handleDateChange} onRangeChange={handleRangeChange} />
          </View>

          <ScrollView className="flex-1 flex h-screen" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#DB3546"]} tintColor="#DB3546" />}>
            {Object.keys(groupedByDay).length === 0 ? (
              <Cards className="py-6 items-center justify-center">
                <Text className="text-gray-500 font-medium">Tidak ada data rekam medis pada tanggal ini.</Text>
              </Cards>
            ) : (
              Object.entries(groupedByDay).map(([date, data]) => (
                <Cards key={date} className="flex flex-col gap-2 mb-3">
                  <Text className="text-normal font-bold">{date}</Text>

                  <View className="flex-col gap-3 mt-2">
                    {data
                      .sort((a, b) => {
                        const timeA = parseToDate(a.start_time || a.startTime).getTime();
                        const timeB = parseToDate(b.start_time || b.startTime).getTime();
                        return timeB - timeA; // Urutkan terbaru di atas
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
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </WrapperMain>
  );
}
