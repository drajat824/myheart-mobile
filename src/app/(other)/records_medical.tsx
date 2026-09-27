import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Easing, InteractionManager, Linking, ScrollView, Text, TouchableOpacity, View } from "react-native";
// import Pdf from "react-native-pdf";
import { MedicalRecord } from "../(tabs)/records";
import { Cards, DatePicker, RouterSub, WrapperMain } from "../../component";
import { apiService } from "../../utils/apiService";

const CACHE_KEY_MEDICAL = "@myheartz_medical_cache";
const API_BASE_URL = "http://10.33.9.77:3000";

// Helper untuk format URL file PDF backend
const getFileUrl = (path: string | null | undefined) => {
  if (!path) return null;

  // Jika path dimulai dengan "../file", arahkan ke endpoint view
  if (path.startsWith("../file")) {
    // Memasukkan path utuh ke dalam query parameter
    return `${API_BASE_URL}/api/medical-records/view?path=${path}`;
  }

  return path;
};

export default function RecordsMedical() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // State untuk menampung ID dokumen yang sedang dibuka PDF-nya secara inline (opsional)
  const [expandedPdfId, setExpandedPdfId] = useState<number | null>(null);

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

  const fetchRecords = useCallback(async (isPullRefresh = false) => {
    try {
      isPullRefresh ? setRefreshing(true) : setIsLoading(true);
      const token = await AsyncStorage.getItem("userToken");
      const userDataStr = await AsyncStorage.getItem("userData");
      if (!token || !userDataStr) return;

      const userData = JSON.parse(userDataStr);
      const data = await apiService.get<MedicalRecord[]>(`/medical-records?user_id=${userData.id}`);

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
  }, []);

  // Fungsi pembantu untuk membuka link
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
      fetchRecords(false);
    });
  }, []);

  return (
    <WrapperMain>
      <View className="flex-col pb-8">
        <RouterSub title="REKAM MEDIS" subTitle="MEDICAL RECORDS" />
        <View className="flex flex-col gap-4 flex-1 mt-4">
          <View className="flex-row items-center gap-2">
            <TouchableOpacity onPress={() => fetchRecords(true)} disabled={isLoading || refreshing} className="self-end bg-white p-3 shadow-md rounded-xl justify-center items-center">
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <MaterialDesignIcons name="refresh" size={36} color={isLoading || refreshing ? "#A0C4FF" : "#017BFE"} />
              </Animated.View>
            </TouchableOpacity>
            <View className="flex-1">
              <DatePicker disable={isLoading || refreshing} initialDate={selectedDate} onDateChange={(d) => setSelectedDate(d)} onRangeChange={() => {}} />
            </View>
          </View>

          <ScrollView className="flex flex-1 flex-col gap-2 pb-3">
            {isLoading && records.length === 0 ? (
              <Cards className="py-10 items-center justify-center">
                <ActivityIndicator size="large" color="#DB3546" />
                <Text className="text-gray-500 font-medium mt-4">Memuat rekam medis...</Text>
              </Cards>
            ) : records.length === 0 ? (
              <Cards className="py-6 items-center justify-center">
                <Text className="text-gray-500 font-medium">Tidak ada rekam medis tersedia.</Text>
              </Cards>
            ) : (
              records.map((item, index) => {
                const labResultUrl = getFileUrl(item.lab_result);
                const medicalImageUrl = getFileUrl(item.medical_image);
                const diagnosisUrl = getFileUrl(item.diagnosis);

                return (
                  <Cards key={item.id || index} className="flex flex-col gap-2 mb-3">
                    <View className="flex-row justify-between items-center border-b border-gray-100 pb-2">
                      <Text className="text-normal font-bold">Pemeriksaan: {new Date(item.check_date || item.created_at || "").toLocaleDateString("id-ID")}</Text>
                      <MaterialDesignIcons name="folder-account-outline" size={24} color="#DB3546" />
                    </View>

                    <View className="flex-col gap-2 mt-2">
                      {/* Status Lab Result */}
                      <View className="flex-row justify-between items-center">
                        <Text className="text-gray-600">Lab Result:</Text>
                        {labResultUrl ? (
                          <TouchableOpacity onPress={() => handleOpenDoc(labResultUrl)}>
                            <Text className="font-semibold text-theme-green underline">Lihat Dokumen</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text className="font-semibold text-gray-400">Tidak Tersedia</Text>
                        )}
                      </View>

                      {/* Status Medical Images */}
                      <View className="flex-row justify-between items-center">
                        <Text className="text-gray-600">Medical Images:</Text>
                        {medicalImageUrl ? (
                          <TouchableOpacity onPress={() => handleOpenDoc(medicalImageUrl)}>
                            <Text className="font-semibold text-theme-green underline">Lihat Dokumen</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text className="font-semibold text-gray-400">Tidak Tersedia</Text>
                        )}
                      </View>

                      {/* Status Diagnosis */}
                      <View className="flex-row justify-between items-center">
                        <Text className="text-gray-600">Diagnosis:</Text>
                        {diagnosisUrl ? (
                          <TouchableOpacity onPress={() => handleOpenDoc(diagnosisUrl)}>
                            <Text className="font-semibold text-theme-green underline">Lihat Dokumen</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text className="font-semibold text-gray-400">Tidak Tersedia</Text>
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
