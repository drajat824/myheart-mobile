import { HeartIssueRecord } from "@/context/hr"; // Sesuaikan path
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { Cards, DatePicker, RouterSub, WrapperMain } from "../../component";
import { apiService } from "../../utils/apiService";

const CACHE_KEY_ISSUES = "@myheartz_disorder_cache";

// Helpers format tanggal
const formatDateToParam = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseToDate = (dateVal: string | number | undefined): Date => {
  if (!dateVal) return new Date(NaN);
  if (typeof dateVal === "number") return new Date(dateVal);
  const formattedStr = typeof dateVal === "string" && dateVal.includes(" ") ? dateVal.replace(" ", "T") : dateVal;
  return new Date(formattedStr);
};

const formatDisplayDate = (dateKey: string): string => {
  const [year, month, day] = dateKey.split("-");
  if (!year || !month || !day) return dateKey;
  const parsedDate = new Date(Number(year), Number(month) - 1, Number(day));
  if (isNaN(parsedDate.getTime())) return dateKey;
  return parsedDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
};

export default function RecordsDisorder() {
  const [groupedByDay, setGroupedByDay] = useState<Record<string, HeartIssueRecord[]>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | null>(null);

  const groupData = (data: HeartIssueRecord[]) => {
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
  };

  const fetchRecords = useCallback(
    async (filterParams?: { date?: Date; range?: { start: Date; end: Date } | null }) => {
      try {
        setRefreshing(true);
        let endpoint = "/hr-issues";

        const rangeFilter = filterParams?.range !== undefined ? filterParams.range : selectedRange;
        const dateFilter = filterParams?.date || selectedDate;

        if (rangeFilter) {
          const startStr = formatDateToParam(rangeFilter.start);
          const endStr = formatDateToParam(rangeFilter.end);
          endpoint = `/hr-issues?start_time=${startStr}&end_time=${endStr}`;
        } else {
          const dateStr = formatDateToParam(dateFilter);
          endpoint = `/hr-issues?date=${dateStr}`;
        }

        const data = await apiService.get<HeartIssueRecord[]>(endpoint);
        setGroupedByDay(groupData(data));
        await AsyncStorage.setItem(CACHE_KEY_ISSUES, JSON.stringify(data));
      } catch (error) {
        console.error("Gagal menarik riwayat gangguan:", error);
        setGroupedByDay({});
      } finally {
        setRefreshing(false);
      }
    },
    [selectedDate, selectedRange],
  );

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setSelectedRange(null);
    setGroupedByDay({});
    fetchRecords({ date, range: null });
  };

  const handleRangeChange = (startDate: Date, endDate: Date) => {
    setSelectedRange({ start: startDate, end: endDate });
    setGroupedByDay({});
    fetchRecords({ range: { start: startDate, end: endDate } });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRecords();
    setRefreshing(false);
  }, [fetchRecords]);

  useEffect(() => {
    const loadCacheAndFetch = async () => {
      const cached = await AsyncStorage.getItem(CACHE_KEY_ISSUES);
      if (cached) {
        try {
          setGroupedByDay(groupData(JSON.parse(cached)));
        } catch (e) {
          console.error("Gagal parse cache", e);
        }
      }
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
        <RouterSub title="REKAM MEDIS" subTitle="RIWAYAT GANGGUAN" />

        <View className="flex flex-col gap-4 flex-1 mt-4">
          <View className="flex flex-1">
            <DatePicker initialDate={selectedDate} onDateChange={handleDateChange} onRangeChange={handleRangeChange} />
          </View>

          <ScrollView className="flex-1 flex h-screen" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#DB3546"]} tintColor="#DB3546" />}>
            {Object.keys(groupedByDay).length === 0 ? (
              <Cards className="py-6 items-center justify-center">
                <Text className="text-gray-500 font-medium">Tidak ada riwayat gangguan pada tanggal ini.</Text>
              </Cards>
            ) : (
              Object.entries(groupedByDay).map(([date, data]) => (
                <Cards key={date} className="flex flex-col gap-2 mb-3">
                  <Text className="text-normal font-bold">{formatDisplayDate(date)}</Text>

                  <View className="flex-col gap-3 mt-2">
                    {data
                      .sort((a, b) => parseToDate(b.recorded_at).getTime() - parseToDate(a.recorded_at).getTime())
                      .map((item, index) => {
                        const itemDate = parseToDate(item.recorded_at);
                        const timeFormatted = !isNaN(itemDate.getTime()) ? itemDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "--:--";

                        return (
                          <View key={`${item.recorded_at}-${index}`} className="flex-row items-start gap-4 justify-between">
                            <View className="w-2 h-2 rounded-full bg-black mt-2" />
                            <View className="flex flex-col gap-2 item-start self-start flex-1">
                              <Text className="text-xl">{item.issue_type}:</Text>
                              <Text className="text-lg font-light">{timeFormatted} WIB</Text>
                            </View>
                            <Text className="text-xl font-semibold">{item.bpm_recorded} BPM</Text>
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
