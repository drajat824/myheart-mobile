import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Easing, InteractionManager, Linking, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { MedicalRecord } from "../(tabs)/records";
import { Cards, DatePicker, RouterSub, WrapperMain } from "../../component";
import { apiService } from "../../utils/apiService";

const CACHE_KEY_MEDICAL = "@myheartz_medical_cache";
const API_BASE_URL = "http://10.33.9.77:3000";

// Helper untuk format URL file PDF backend
const getFileUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith("../file")) {
    return `${API_BASE_URL}/api/medical-records/view?path=${path}`;
  }
  return path;
};

// Fungsi bantuan untuk mengecek apakah tanggal data adalah hari ini
const checkIsToday = (dateValue?: string) => {
  if (!dateValue) return false;
  const itemDate = new Date(dateValue);
  const today = new Date();

  return itemDate.getDate() === today.getDate() && itemDate.getMonth() === today.getMonth() && itemDate.getFullYear() === today.getFullYear();
};

export default function RecordsMedical() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Mengubah state dateRange menjadi selectedDate dan selectedRange seperti di Demographic
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

  // Fungsi helper untuk memformat tanggal
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

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

        let formattedStart, formattedEnd;
        if (rangeFilter) {
          formattedStart = formatDate(rangeFilter.start);
          formattedEnd = formatDate(rangeFilter.end);
        } else {
          formattedStart = formatDate(dateFilter);
          formattedEnd = formatDate(dateFilter);
        }

        const data = await apiService.get<MedicalRecord[]>(`/medical-records?user_id=${userData.id}&start_time=${formattedStart}&end_time=${formattedEnd}`);

        setRecords(data);
        await AsyncStorage.setItem(CACHE_KEY_MEDICAL, JSON.stringify(data));
      } catch (error) {
        console.error("Gagal menarik rekam medis:", error);
        const cached = await AsyncStorage.getItem(CACHE_KEY_MEDICAL);
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

  const handleOpenDoc = async (url: string | null) => {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.error("Tidak dapat membuka URL ini: " + url);
      }
    } catch (error) {
      console.error("Terjadi kesalahan saat membuka link:", error);
    }
  };

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      fetchRecords({ date: new Date(), range: null });
    });
  }, []);

  return (
    <WrapperMain>
      <View className="flex-col pb-8">
        <RouterSub title="MEDICAL RECORDS" subTitle="MEDICAL RECORDS" />
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
                <Text className="text-gray-500 font-medium mt-4">Loading medical records...</Text>
              </Cards>
            ) : records.length === 0 ? (
              <Cards className="py-6 items-center justify-center">
                <Text className="text-gray-500 font-medium">No medical records available.</Text>
              </Cards>
            ) : (
              records.map((item, index) => {
                const labResultUrl = getFileUrl(item.lab_result);
                const medicalImageUrl = getFileUrl(item.medical_image);
                const diagnosisUrl = getFileUrl(item.diagnosis);

                // Evaluasi apakah tanggal pada item adalah hari ini
                const dateStringToUse = item.check_date || item.created_at;
                const isItemToday = checkIsToday(dateStringToUse);

                return (
                  <Cards key={item.id || index} className="flex flex-col gap-2 mb-3" color={isItemToday ? "#FFFFFF" : "#FFDD78"}>
                    <View className="flex-row justify-between items-center border-b border-gray-100 pb-2">
                      <Text className="text-normal font-bold border-gray-100 pb-2">
                        {isItemToday
                          ? `Today, ${new Date(dateStringToUse || "").toLocaleDateString("id-ID", {
                              dateStyle: "long",
                            })}`
                          : new Date(dateStringToUse || "").toLocaleDateString("id-ID", {
                              dateStyle: "long",
                            })}
                      </Text>
                      <MaterialDesignIcons name="folder-account-outline" size={24} color="#DB3546" />
                    </View>

                    <View className="flex-col gap-2 mt-2">
                      <View className="flex-row justify-between items-center">
                        <Text className="text-gray-600">Lab Result:</Text>
                        {labResultUrl ? (
                          <TouchableOpacity onPress={() => handleOpenDoc(labResultUrl)}>
                            <Text className="font-semibold text-theme-green underline">View Document</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text className="font-semibold text-gray-400">Not Available</Text>
                        )}
                      </View>

                      <View className="flex-row justify-between items-center">
                        <Text className="text-gray-600">Medical Images:</Text>
                        {medicalImageUrl ? (
                          <TouchableOpacity onPress={() => handleOpenDoc(medicalImageUrl)}>
                            <Text className="font-semibold text-theme-green underline">View Document</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text className="font-semibold text-gray-400">Not Available</Text>
                        )}
                      </View>

                      <View className="flex-row justify-between items-center">
                        <Text className="text-gray-600">Diagnosis:</Text>
                        {diagnosisUrl ? (
                          <TouchableOpacity onPress={() => handleOpenDoc(diagnosisUrl)}>
                            <Text className="font-semibold text-theme-green underline">View Document</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text className="font-semibold text-gray-400">Not Available</Text>
                        )}
                      </View>
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
