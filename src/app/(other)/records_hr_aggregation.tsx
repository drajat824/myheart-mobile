import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, InteractionManager, RefreshControl, ScrollView, Text, View } from "react-native";
import { Cards, DatePicker, RouterSub, WrapperMain } from "../../component";
import { apiService } from "../../utils/apiService";

const CACHE_KEY = "@myheartz_aggregation_cache";

export type AggregateRecord = {
  id?: number;
  user_id?: number;
  bpm?: number;
  averageHR?: number;
  start_time?: string | number;
  startTime?: number;
  end_time?: string | number;
};

// 1. Helper timezone offset dinamis
const getUserTimezoneOffset = (): string => {
  const offsetMinutes = -new Date().getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const hours = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, "0");
  const minutes = String(Math.abs(offsetMinutes) % 60).padStart(2, "0");
  return `${sign}${hours}:${minutes}`;
};

// 2. Format tanggal lokal menjadi YYYY-MM-DD tanpa hardcode timezone
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
    if (!formattedStr.endsWith("Z") && !formattedStr.includes("+") && !formattedStr.includes("-", 10)) {
      formattedStr += "Z";
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
  return dateKey === formatDateToParam(new Date());
};

const filterRecordsByParams = (records: AggregateRecord[], date: Date, range: { start: Date; end: Date } | null): AggregateRecord[] => {
  if (!Array.isArray(records)) return [];

  if (range) {
    const startStr = formatDateToParam(range.start);
    const endStr = formatDateToParam(range.end);
    return records.filter((item) => {
      const itemDate = parseToDate(item.start_time || item.startTime);
      if (isNaN(itemDate.getTime())) return false;
      const itemDateStr = formatDateToParam(itemDate);
      return itemDateStr >= startStr && itemDateStr <= endStr;
    });
  } else {
    const dateStr = formatDateToParam(date);
    return records.filter((item) => {
      const itemDate = parseToDate(item.start_time || item.startTime);
      if (isNaN(itemDate.getTime())) return false;
      return formatDateToParam(itemDate) === dateStr;
    });
  }
};

export default function RecordsHRAggregation() {
  const [groupedByDay, setGroupedByDay] = useState<Record<string, AggregateRecord[]>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | null>(null);

  const groupData = useCallback((data: AggregateRecord[]) => {
    if (!Array.isArray(data)) return {};

    return data.reduce(
      (result, item) => {
        const rawStartTime = item.start_time || item.startTime;
        const date = parseToDate(rawStartTime);

        if (isNaN(date.getTime())) return result;

        const dateKey = formatDateToParam(date);

        if (!result[dateKey]) result[dateKey] = [];
        result[dateKey].push(item);
        return result;
      },
      {} as Record<string, AggregateRecord[]>,
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

        // 3. Kirim timezone dinamis HP ke backend
        const userTz = getUserTimezoneOffset();
        let endpoint = `/hr-aggregation?user_id=1&timezone=${encodeURIComponent(userTz)}`;

        if (rangeFilter) {
          const startStr = formatDateToParam(rangeFilter.start);
          const endStr = formatDateToParam(rangeFilter.end);
          endpoint += `&start_time=${startStr}&end_time=${endStr}`;
        } else {
          // Cukup kirimkan date string YYYY-MM-DD
          const selectedStr = formatDateToParam(dateFilter);
          endpoint += `&date=${selectedStr}`;
        }

        const data = await apiService.get<AggregateRecord[]>(endpoint);
        setGroupedByDay(groupData(data));

        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
      } catch (error) {
        console.error("Gagal menarik riwayat HR, mencoba memuat dari cache:", error);

        try {
          const cached = await AsyncStorage.getItem(CACHE_KEY);
          if (cached) {
            const parsedCache: AggregateRecord[] = JSON.parse(cached);
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

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      const loadInitialData = async () => {
        const today = new Date();
        setSelectedDate(today);
        setSelectedRange(null);
        setIsLoading(true);

        try {
          const cached = await AsyncStorage.getItem(CACHE_KEY);
          if (cached) {
            const parsedCache: AggregateRecord[] = JSON.parse(cached);
            const filteredCache = filterRecordsByParams(parsedCache, today, null);
            setGroupedByDay(groupData(filteredCache));
          }
        } catch (e) {
          console.error("Gagal membaca cache awal:", e);
        }

        await fetchRecords({ date: today, range: null, isPullRefresh: false });
      };

      loadInitialData();
    });
  }, []);

  const sortedGroupedEntries = useMemo(() => {
    return Object.entries(groupedByDay)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, data]) => {
        const sortedData = [...data].sort((a, b) => {
          const timeA = parseToDate(a.start_time || a.startTime).getTime();
          const timeB = parseToDate(b.start_time || b.startTime).getTime();
          return timeA - timeB;
        });
        return { date, data: sortedData };
      });
  }, [groupedByDay]);

  return (
    <WrapperMain>
      <View className="flex-col pb-8">
        <RouterSub title="REKAM MEDIS" subTitle="RIWAYAT AGREGASI HR" />

        <View className="flex flex-col gap-4 flex-1 mt-4">
          <View className="flex flex-1">
            <DatePicker disable={isLoading || refreshing} initialDate={selectedDate} onDateChange={handleDateChange} onRangeChange={handleRangeChange} />
          </View>

          <ScrollView className="flex flex-1 flex-col gap-2 pb-3" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#DB3546"]} tintColor="#DB3546" />}>
            {isLoading && sortedGroupedEntries.length === 0 ? (
              <Cards className="py-10 items-center justify-center">
                <ActivityIndicator size="large" color="#DB3546" />
                <Text className="text-gray-500 font-medium mt-4">Memuat data...</Text>
              </Cards>
            ) : sortedGroupedEntries.length === 0 ? (
              <Cards className="py-6 items-center justify-center">
                <Text className="text-gray-500 font-medium">Tidak ada data riwayat heart rate pada tanggal ini.</Text>
              </Cards>
            ) : (
              sortedGroupedEntries.map(({ date, data }) => {
                const isToday = isDateToday(date);
                return (
                  <Cards color={isToday ? "#FFFFFF" : "#FFDD78"} key={date} className="flex flex-col gap-2 mb-3">
                    <Text className="text-normal font-bold">{formatDisplayDate(date)}.</Text>

                    <View className="flex-col gap-3 mt-2">
                      {data.map((item, index) => {
                        const rawStartTime = item.start_time || item.startTime;
                        const itemDate = parseToDate(rawStartTime);
                        const bpmValue = item.bpm ?? item.averageHR ?? 0;

                        // 4. Hapus timeZone: "Asia/Jakarta" agar otomatis menyesuaikan jam HP/perangkat
                        const timeFormatted = !isNaN(itemDate.getTime())
                          ? itemDate.toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "--:--";

                        return (
                          <View key={`${rawStartTime}-${index}`} className="flex-row items-center gap-4 justify-between">
                            <View className="flex flex-row gap-3 items-center">
                              <View className="w-2 h-2 rounded-full bg-black" />
                              <Text className="text-xl">{timeFormatted}:</Text>
                            </View>
                            <Text className="text-xl font-semibold">{bpmValue} BPM</Text>
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
