import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Easing, InteractionManager, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { DemographicRecord } from "../(tabs)/records";
import { Cards, DatePicker, RouterSub, WrapperMain } from "../../component";
import { apiService } from "../../utils/apiService";

const CACHE_KEY_DEMOGRAPHIC = "@myheartz_demographic_cache";

const formatDateToParam = (date: Date): string => {
  if (isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function RecordsDemographic() {
  const [records, setRecords] = useState<DemographicRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | null>(null);

  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (refreshing) {
      Animated.loop(Animated.timing(rotateAnim, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: true })).start();
    } else {
      rotateAnim.stopAnimation();
      rotateAnim.setValue(0);
    }
  }, [refreshing, rotateAnim]);

  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  const fetchRecords = useCallback(
    async (filterParams?: { date?: Date; range?: { start: Date; end: Date } | null; isPullRefresh?: boolean }) => {
      const rangeFilter = filterParams?.range !== undefined ? filterParams.range : selectedRange;
      const dateFilter = filterParams?.date || selectedDate;

      try {
        filterParams?.isPullRefresh ? setRefreshing(true) : setIsLoading(true);

        const token = await AsyncStorage.getItem("userToken");
        const userDataStr = await AsyncStorage.getItem("userData");
        if (!token || !userDataStr) return;

        const userData = JSON.parse(userDataStr);
        let endpoint = `/demographic?user_id=${userData.id}`;

        if (rangeFilter) {
          endpoint += `&start_date=${formatDateToParam(rangeFilter.start)}&end_date=${formatDateToParam(rangeFilter.end)}`;
        } else {
          endpoint += `&date=${formatDateToParam(dateFilter)}`;
        }

        const data = await apiService.get<DemographicRecord[]>(endpoint);
        setRecords(data);
        await AsyncStorage.setItem(CACHE_KEY_DEMOGRAPHIC, JSON.stringify(data));
      } catch (error) {
        console.error("Gagal menarik riwayat demografi:", error);
        const cached = await AsyncStorage.getItem(CACHE_KEY_DEMOGRAPHIC);
        if (cached) setRecords(JSON.parse(cached));
      } finally {
        setRefreshing(false);
        setIsLoading(false);
      }
    },
    [selectedDate, selectedRange],
  );

  const handleDateChange = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      setSelectedRange(null);
      fetchRecords({ date, range: null });
    },
    [fetchRecords],
  );

  const handleRangeChange = useCallback(
    (startDate: Date, endDate: Date) => {
      const range = { start: startDate, end: endDate };
      setSelectedRange(range);
      fetchRecords({ range });
    },
    [fetchRecords],
  );

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      fetchRecords({ date: new Date(), range: null });
    });
  }, []);

  return (
    <WrapperMain>
      <View className="flex-col pb-8">
        <RouterSub title="REKAM MEDIS" subTitle="RIWAYAT DEMOGRAFI" />
        <View className="flex flex-col gap-4 flex-1 mt-4">
          <View className="flex-row items-center gap-2">
            <TouchableOpacity onPress={() => fetchRecords({ isPullRefresh: true })} disabled={isLoading || refreshing} className="self-end bg-white p-3 shadow-md rounded-xl justify-center items-center">
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <MaterialDesignIcons name="refresh" size={36} color={isLoading || refreshing ? "#A0C4FF" : "#017BFE"} />
              </Animated.View>
            </TouchableOpacity>
            <View className="flex-1">
              <DatePicker disable={isLoading || refreshing} initialDate={selectedDate} onDateChange={handleDateChange} onRangeChange={handleRangeChange} />
            </View>
          </View>

          <ScrollView className="flex flex-1 flex-col gap-2 pb-3">
            {isLoading && records.length === 0 ? (
              <Cards className="py-10 items-center justify-center">
                <ActivityIndicator size="large" color="#DB3546" />
                <Text className="text-gray-500 font-medium mt-4">Memuat data...</Text>
              </Cards>
            ) : records.length === 0 ? (
              <Cards className="py-6 items-center justify-center">
                <Text className="text-gray-500 font-medium">Tidak ada data demografi pada tanggal ini.</Text>
              </Cards>
            ) : (
              records.map((item, index) => (
                <Cards key={item.id || index} className="flex flex-col gap-2 mb-3">
                  {/* Gunakan item.check_date dengan fallback ke created_at jika cache lama masih terbaca */}
                  <Text className="text-normal font-bold border-b border-gray-100 pb-2">{new Date(item.check_date || item.created_at || "").toLocaleDateString("id-ID", { dateStyle: "long" })}</Text>
                  <View className="flex-col gap-2 mt-2">
                    <View className="flex-row justify-between">
                      <Text className="text-gray-600">Umur / Gender:</Text>
                      <Text className="font-semibold">
                        {item.age} Thn / {item.gender}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-gray-600">Berat Badan:</Text>
                      <Text className="font-semibold">{item.weight} kg</Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-gray-600">Tinggi Badan:</Text>
                      <Text className="font-semibold">{item.height} cm</Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-gray-600">BMI:</Text>
                      <Text className="font-semibold">{item.bmi}</Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-gray-600">Gula Darah:</Text>
                      <Text className="font-semibold">{item.blood_sugar} mg/dL</Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-gray-600">Kolesterol:</Text>
                      <Text className="font-semibold">{item.cholesterol} mg/dL</Text>
                    </View>
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
