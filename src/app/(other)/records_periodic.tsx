import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, Easing, InteractionManager, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Cards, DatePicker, RouterSub, WrapperMain } from "../../component";
import { apiService } from "../../utils/apiService";

export const CACHE_KEY_PERIODIC = "@myheartz_periodic_cache";

export type PeriodicRecord = {
  id?: number;
  user_id?: number;
  weight?: number;
  height?: number;
  cholesterol?: number;
  blood_sugar?: number;
  check_date?: string | number; // <-- Ubah dari check_date
};

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

  return parsedDate.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const getDayName = (dateKey: string): string => {
  const [year, month, day] = dateKey.split("-");
  if (!year || !month || !day) return dateKey;

  const parsedDate = new Date(Number(year), Number(month) - 1, Number(day));
  if (isNaN(parsedDate.getTime())) return "";

  return parsedDate.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
};

const isDateToday = (dateKey: string): boolean => {
  if (!dateKey) return false;
  return dateKey === formatDateToParam(new Date());
};

const filterRecordsByParams = (records: PeriodicRecord[], date: Date, range: { start: Date; end: Date } | null): PeriodicRecord[] => {
  if (!Array.isArray(records)) return [];

  if (range) {
    const startStr = formatDateToParam(range.start);
    const endStr = formatDateToParam(range.end);
    return records.filter((item) => {
      const itemDate = parseToDate(item.check_date);
      if (isNaN(itemDate.getTime())) return false;
      const itemDateStr = formatDateToParam(itemDate);
      return itemDateStr >= startStr && itemDateStr <= endStr;
    });
  } else {
    const dateStr = formatDateToParam(date);
    return records.filter((item) => {
      const itemDate = parseToDate(item.check_date);
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

export default function RecordsPeriodic() {
  const [groupedByDay, setGroupedByDay] = useState<Record<string, PeriodicRecord[]>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | null>(null);

  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (refreshing) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();
    } else {
      rotateAnim.stopAnimation();
      rotateAnim.setValue(0);
    }
  }, [refreshing, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const groupData = useCallback((data: PeriodicRecord[]) => {
    if (!Array.isArray(data)) return {};
    return data.reduce(
      (result, item) => {
        const date = parseToDate(item.check_date);
        if (isNaN(date.getTime())) return result;

        const dateKey = formatDateToParam(date);
        if (!result[dateKey]) result[dateKey] = [];
        result[dateKey].push(item);
        return result;
      },
      {} as Record<string, PeriodicRecord[]>,
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

        const token = await AsyncStorage.getItem("userToken");
        const userDataStr = await AsyncStorage.getItem("userData");

        if (!token || !userDataStr) return;

        const userData = JSON.parse(userDataStr);
        const userId = userData.id;

        const userTz = getUserTimezoneOffset();
        let endpoint = `/periodic?user_id=${userId}&timezone=${encodeURIComponent(userTz)}`;

        if (rangeFilter) {
          const startStr = formatDateToParam(rangeFilter.start);
          const endStr = formatDateToParam(rangeFilter.end);
          endpoint += `&start_time=${startStr}&end_time=${endStr}`;
        } else {
          const selectedStr = formatDateToParam(dateFilter);
          const startWIB = new Date(`${selectedStr}T00:00:00+07:00`);
          const endWIB = new Date(`${selectedStr}T23:59:59+07:00`);
          endpoint += `&start_time=${startWIB.toISOString()}&end_time=${endWIB.toISOString()}`;
        }

        const data = await apiService.get<PeriodicRecord[]>(endpoint);
        const filteredData = filterRecordsByParams(data, dateFilter, rangeFilter);
        setGroupedByDay(groupData(filteredData));
        await AsyncStorage.setItem(CACHE_KEY_PERIODIC, JSON.stringify(data));
      } catch (error) {
        console.error("Gagal menarik riwayat pemeriksaan, mencoba memuat dari cache:", error);
        try {
          const cached = await AsyncStorage.getItem(CACHE_KEY_PERIODIC);
          if (cached) {
            const parsedCache: PeriodicRecord[] = JSON.parse(cached);
            const filteredCache = filterRecordsByParams(parsedCache, dateFilter, rangeFilter);
            setGroupedByDay(groupData(filteredCache));
          } else {
            setGroupedByDay({});
          }
        } catch (e) {
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
          const cached = await AsyncStorage.getItem(CACHE_KEY_PERIODIC);
          if (cached) {
            const parsedCache: PeriodicRecord[] = JSON.parse(cached);
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
      .sort(([dateA], [dateB]) => dateB.localeCompare(dateA)) // Terlama ke terbaru atau sebaliknya (diubah ke descending)
      .map(([date, data]) => {
        const sortedData = [...data].sort((a, b) => parseToDate(b.check_date).getTime() - parseToDate(a.check_date).getTime());
        return { date, data: sortedData };
      });
  }, [groupedByDay]);

  return (
    <WrapperMain>
      <View className="flex-col pb-8">
        <RouterSub title="REKAM MEDIS" subTitle="PEMERIKSAAN BERKALA" />

        <View className="flex flex-col gap-4 flex-1 mt-4">
          <View className="flex-row items-center gap-2">
            <TouchableOpacity onPress={onRefresh} disabled={isLoading || refreshing} className="self-end bg-white p-3 shadow-md rounded-xl justify-center items-center">
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <MaterialDesignIcons name="refresh" size={36} color={isLoading || refreshing ? "#A0C4FF" : "#017BFE"} />
              </Animated.View>
            </TouchableOpacity>
            <View className="flex-1">
              <DatePicker disable={isLoading || refreshing} initialDate={selectedDate} onDateChange={handleDateChange} onRangeChange={handleRangeChange} />
            </View>
          </View>

          <ScrollView className="flex flex-1 flex-col gap-2 pb-3">
            {isLoading && sortedGroupedEntries.length === 0 ? (
              <Cards className="py-10 items-center justify-center">
                <ActivityIndicator size="large" color="#DB3546" />
                <Text className="text-gray-500 font-medium mt-4">Memuat data pemeriksaan...</Text>
              </Cards>
            ) : sortedGroupedEntries.length === 0 ? (
              <Cards className="py-6 items-center justify-center">
                <Text className="text-gray-500 font-medium">Tidak ada data pemeriksaan pada tanggal ini.</Text>
              </Cards>
            ) : (
              sortedGroupedEntries.map(({ date, data }) => {
                const isToday = isDateToday(date);

                return data.map((item, index) => (
                  <Cards key={`${date}-${index}`} className="flex flex-col gap-2 mb-3" color={isToday ? undefined : "#FFDD78"}>
                    <Text className="text-normal font-bold">{isToday ? "HARI INI" : getDayName(date)}</Text>
                    <Text className="text-normal text-gray-500">{formatDisplayDate(date)}</Text>

                    <View className="flex-col gap-3 mt-2">
                      <View className="gap-2">
                        <View className="flex-row items-center gap-4">
                          <View className="w-2 h-2 rounded-full bg-black" />
                          <Text className="text-xl">Berat/Tinggi Badan</Text>
                        </View>
                        <View className="flex-row items-center gap-4">
                          <View className="w-2 h-2" />
                          <Text className="text-xl font-semibold">
                            {item.weight ?? "--"} kg/{item.height ?? "--"} cm
                          </Text>
                        </View>
                      </View>
                      <View className="gap-2">
                        <View className="flex-row items-center gap-4">
                          <View className="w-2 h-2 rounded-full bg-black" />
                          <Text className="text-xl">Kolestrol</Text>
                        </View>
                        <View className="flex-row items-center gap-4">
                          <View className="w-2 h-2" />
                          <Text className="text-xl font-semibold">{item.cholesterol ?? "--"} mg/dL</Text>
                        </View>
                      </View>
                      <View className="gap-2">
                        <View className="flex-row items-center gap-4">
                          <View className="w-2 h-2 rounded-full bg-black" />
                          <Text className="text-xl">Gula Darah</Text>
                        </View>
                        <View className="flex-row items-center gap-4">
                          <View className="w-2 h-2" />
                          <Text className="text-xl font-semibold">{item.blood_sugar ?? "--"} mg/dL</Text>
                        </View>
                      </View>
                    </View>
                  </Cards>
                ));
              })
            )}
          </ScrollView>
        </View>
      </View>
    </WrapperMain>
  );
}
