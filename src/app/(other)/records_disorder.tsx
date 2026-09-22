import { HeartIssueRecord } from "@/context/hr";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, InteractionManager, RefreshControl, ScrollView, Text, View } from "react-native";
import { Cards, DatePicker, RouterSub, WrapperMain } from "../../component";
import { apiService } from "../../utils/apiService";

const CACHE_KEY_ISSUES = "@myheartz_disorder_cache";

// Helpers format tanggal
const formatDateToParam = (date: Date): string => {
  if (isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

const parseToDate = (dateVal: string | number | undefined): Date => {
  if (!dateVal) return new Date(NaN);
  if (typeof dateVal === "number") return new Date(dateVal);

  if (typeof dateVal === "string") {
    // Ubah spasi dari MySQL menjadi "T" (misal: "2026-09-22 22:18:00" -> "2026-09-22T22:18:00")
    let formattedStr = dateVal.includes(" ") ? dateVal.replace(" ", "T") : dateVal;

    // Jika belum ada penanda UTC (Z) atau Offset (+/-), tambahkan "Z"
    if (!formattedStr.endsWith("Z") && !formattedStr.includes("+") && !formattedStr.includes("-", 10)) {
      formattedStr += "Z"; // Menginformasikan ke JS bahwa ini adalah waktu UTC
    }

    return new Date(formattedStr);
  }

  return new Date(dateVal);
};

const formatDisplayDate = (dateKey: string): string => {
  const [year, month, day] = dateKey.split("-");
  if (!year || !month || !day) return dateKey;

  const parsedDate = new Date(Number(year), Number(month) - 1, Number(day));
  if (isNaN(parsedDate.getTime())) return dateKey;

  const formattedDate = parsedDate.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (isDateToday(dateKey)) {
    return `Hari ini, ${formattedDate}`;
  }

  return formattedDate;
};

const isDateToday = (dateKey: string): boolean => {
  if (!dateKey) return false;
  // Bandingkan kunci tanggal dengan tanggal hari ini dalam format Asia/Jakarta
  return dateKey === formatDateToParam(new Date());
};

// Helper untuk menyaring data cache berdasarkan parameter filter yang aktif
const filterRecordsByParams = (records: HeartIssueRecord[], date: Date, range: { start: Date; end: Date } | null): HeartIssueRecord[] => {
  if (!Array.isArray(records)) return [];

  if (range) {
    const startStr = formatDateToParam(range.start);
    const endStr = formatDateToParam(range.end);
    return records.filter((item) => {
      const itemDate = parseToDate(item.recorded_at);
      if (isNaN(itemDate.getTime())) return false;
      const itemDateStr = formatDateToParam(itemDate);
      return itemDateStr >= startStr && itemDateStr <= endStr;
    });
  } else {
    const dateStr = formatDateToParam(date);
    return records.filter((item) => {
      const itemDate = parseToDate(item.recorded_at);
      if (isNaN(itemDate.getTime())) return false;
      return formatDateToParam(itemDate) === dateStr;
    });
  }
};

const getUserTimezoneOffset = (): string => {
  const offsetMinutes = -new Date().getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const hours = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, "0");
  const minutes = String(Math.abs(offsetMinutes) % 60).padStart(2, "0");
  return `${sign}${hours}:${minutes}`;
};

export default function RecordsDisorder() {
  const [groupedByDay, setGroupedByDay] = useState<Record<string, HeartIssueRecord[]>>({});

  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | null>(null);

  const groupData = useCallback((data: HeartIssueRecord[]) => {
    if (!Array.isArray(data)) return {};
    return data.reduce(
      (result, item) => {
        const date = parseToDate(item.recorded_at);
        if (isNaN(date.getTime())) return result;

        const dateKey = formatDateToParam(date);
        if (!result[dateKey]) result[dateKey] = [];
        result[dateKey].push(item);
        return result;
      },
      {} as Record<string, HeartIssueRecord[]>,
    );
  }, []);

  const fetchRecords = useCallback(
    async (filterParams?: { date?: Date; range?: { start: Date; end: Date } | null; isPullRefresh?: boolean }) => {
      const rangeFilter = filterParams?.range !== undefined ? filterParams.range : selectedRange;
      const dateFilter = filterParams?.date || selectedDate;

      try {
        if (filterParams?.isPullRefresh) {
          setRefreshing(true);
        } else {
          setIsLoading(true);
        }

        const userTz = getUserTimezoneOffset();
        let endpoint = `/hr-issues?user_id=1&timezone=${encodeURIComponent(userTz)}`;

        if (rangeFilter) {
          const startStr = formatDateToParam(rangeFilter.start);
          const endStr = formatDateToParam(rangeFilter.end);
          endpoint += `&start_time=${startStr}&end_time=${endStr}`;
        } else {
          // WIB Hari H (00:00:00 - 23:59:59) sama dengan UTC (H-1 17:00:00 - H 16:59:59)
          const selectedStr = formatDateToParam(dateFilter);

          const startWIB = new Date(`${selectedStr}T00:00:00+07:00`);
          const endWIB = new Date(`${selectedStr}T23:59:59+07:00`);

          // Format ke UTC ISO string untuk query
          const startUTC = startWIB.toISOString();
          const endUTC = endWIB.toISOString();

          endpoint += `&start_time=${startUTC}&end_time=${endUTC}`;
        }

        const data = await apiService.get<HeartIssueRecord[]>(endpoint);
        setGroupedByDay(groupData(data));

        // Simpan data terbaru ke cache
        await AsyncStorage.setItem(CACHE_KEY_ISSUES, JSON.stringify(data));
      } catch (error) {
        console.error("Gagal menarik riwayat gangguan, mencoba memuat dari cache:", error);

        // Fallback: Tampilkan data dari AsyncStorage jika server error/offline
        try {
          const cached = await AsyncStorage.getItem(CACHE_KEY_ISSUES);
          if (cached) {
            const parsedCache: HeartIssueRecord[] = JSON.parse(cached);
            const filteredCache = filterRecordsByParams(parsedCache, dateFilter, rangeFilter);
            setGroupedByDay(groupData(filteredCache));
          } else {
            setGroupedByDay({});
          }
        } catch (e) {
          console.error("Gagal membaca cache:", e);
          setGroupedByDay({});
        }
      } finally {
        setRefreshing(false);
        setIsLoading(false);
      }
    },
    [selectedDate, selectedRange, groupData],
  );

  const handleDateChange = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      setSelectedRange(null);
      setGroupedByDay({});
      fetchRecords({ date, range: null, isPullRefresh: false });
    },
    [fetchRecords],
  );

  const handleRangeChange = useCallback(
    (startDate: Date, endDate: Date) => {
      const range = { start: startDate, end: endDate };
      setSelectedRange(range);
      setGroupedByDay({});
      fetchRecords({ range, isPullRefresh: false });
    },
    [fetchRecords],
  );

  const onRefresh = useCallback(async () => {
    await fetchRecords({ isPullRefresh: true });
  }, [fetchRecords]);

  // Initial load saat komponen di-mount
  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      const loadInitialData = async () => {
        const today = new Date();
        setSelectedDate(today);
        setSelectedRange(null);
        setIsLoading(true);

        // Muat cache awal (difilter khusus tanggal hari ini agar tidak flicker jika cache berisi range sebelumnya)
        try {
          const cached = await AsyncStorage.getItem(CACHE_KEY_ISSUES);
          if (cached) {
            const parsedCache: HeartIssueRecord[] = JSON.parse(cached);
            const filteredCache = filterRecordsByParams(parsedCache, today, null);
            setGroupedByDay(groupData(filteredCache));
          }
        } catch (e) {
          console.error("Gagal membaca cache awal:", e);
        }

        // Ambil data terbaru dari server
        await fetchRecords({ date: today, range: null, isPullRefresh: false });
      };

      loadInitialData();
    });
  }, []);

  // Optimasi Memoization untuk pengurutan tanggal & waktu kejadian
  const sortedGroupedEntries = useMemo(() => {
    return Object.entries(groupedByDay)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, data]) => {
        const sortedData = [...data].sort((a, b) => parseToDate(a.recorded_at).getTime() - parseToDate(b.recorded_at).getTime());
        return { date, data: sortedData };
      });
  }, [groupedByDay]);

  return (
    <WrapperMain>
      <View className="flex-col pb-8">
        <RouterSub title="REKAM MEDIS" subTitle="RIWAYAT GANGGUAN" />

        <View className="flex flex-col gap-4 flex-1 mt-4">
          <View className="flex flex-1">
            <DatePicker disable={isLoading || refreshing} initialDate={selectedDate} onDateChange={handleDateChange} onRangeChange={handleRangeChange} />
          </View>

          <ScrollView className="flex flex-1 flex-col gap-2 pb-3" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#DB3546"]} tintColor="#DB3546" />}>
            {isLoading && sortedGroupedEntries.length === 0 ? (
              <Cards className="py-10 items-center justify-center">
                <ActivityIndicator size="large" color="#DB3546" />
                <Text className="text-gray-500 font-medium mt-4">Memuat data riwayat gangguan...</Text>
              </Cards>
            ) : sortedGroupedEntries.length === 0 ? (
              <Cards className="py-6 items-center justify-center">
                <Text className="text-gray-500 font-medium">Tidak ada riwayat gangguan pada tanggal ini.</Text>
              </Cards>
            ) : (
              sortedGroupedEntries.map(({ date, data }) => {
                const isToday = isDateToday(date);
                return (
                  <Cards key={date} className="flex flex-col gap-2 mb-3">
                    <Text className="text-normal font-bold">{formatDisplayDate(date)}</Text>

                    <View className="flex-col gap-3 mt-2">
                      {data.map((item, index) => {
                        const itemDate = parseToDate(item.recorded_at);
                        const timeFormatted = !isNaN(itemDate.getTime())
                          ? itemDate.toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                              timeZone: "Asia/Jakarta",
                            })
                          : "--:--";

                        return (
                          <View key={`${item.recorded_at}-${index}`} className="flex-row items-start gap-4 justify-between">
                            <View className="w-2 h-2 rounded-full bg-black mt-2" />
                            <View className="flex flex-col gap-2 item-start self-start flex-1">
                              <Text className="text-xl capitalize">{item.issue_type}:</Text>
                              <Text className="text-lg font-light">{timeFormatted} WIB</Text>
                            </View>
                            <Text className="text-xl font-semibold">{item.bpm_recorded} BPM</Text>
                          </View>
                        );
                      })}
                    </View>
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
