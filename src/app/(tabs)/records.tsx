import { HeartIssueRecord } from "@/context/hr";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Cards, Header, WrapperMain } from "../../component";

const CACHE_KEY = "@myheartz_aggregation_cache";
const CACHE_KEY_REALTIME = "@myheartz_realtime_cache";
const CACHE_KEY_ISSUES = "@myheartz_disorder_cache";
const CACHE_KEY_DEMOGRAPHIC = "@myheartz_demographic_cache";
const CACHE_KEY_MEDICAL = "@myheartz_medical_cache";

export type DemographicRecord = {
  id?: number;
  user_id?: number;
  check_date?: string;
  date_of_birth?: string;
  gender?: string;
  age?: number;
  height?: number;
  weight?: number;
  bmi?: number;
  blood_sugar?: number;
  cholesterol?: number;
  created_at?: string;
};

export type MedicalRecord = {
  id?: number;
  user_id?: number;
  lab_result?: string;
  medical_image?: string;
  diagnosis?: string;
  check_date?: string;
  created_at?: string;
};

type AggregateRecord = {
  id?: number;
  user_id?: number;
  bpm?: number;
  averageHR?: number;
  start_time?: string | number;
  startTime?: number;
  end_time?: string | number;
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

// --- Helper untuk mengelompokkan data berdasarkan tanggal ---
const groupByDate = <T,>(data: T[], getDateFn: (item: T) => Date) => {
  const grouped = data.reduce((acc: Record<string, T[]>, item) => {
    const dateObj = getDateFn(item);
    const dateFormatted = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString("id-ID", { dateStyle: "long" }) : "-";
    if (!acc[dateFormatted]) {
      acc[dateFormatted] = [];
    }
    acc[dateFormatted].push(item);
    return acc;
  }, {});

  // Ubah ke array agar urutannya tetap terjaga dari input (karena key object bisa terurut secara acak/alfabet)
  // Input list sudah diurutkan desc, jadi kita pertahankan urutannya
  const result: { date: string; items: T[] }[] = [];
  const addedDates = new Set<string>();

  for (const item of data) {
    const dateObj = getDateFn(item);
    const dateFormatted = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString("id-ID", { dateStyle: "long" }) : "-";
    if (!addedDates.has(dateFormatted)) {
      addedDates.add(dateFormatted);
      result.push({ date: dateFormatted, items: grouped[dateFormatted] });
    }
  }
  return result;
};

export default function Records() {
  const router = useRouter();

  type TabMenu = "REALTIME" | "DEMOGRAPHIC" | "MEDICAL";
  const [activeTab, setActiveTab] = useState<TabMenu>("REALTIME");

  const [latestHRRecords, setLatestHRRecords] = useState<AggregateRecord[]>([]);
  const [latestHRAggregation, setLatestHRAggregation] = useState<AggregateRecord[]>([]);
  const [latestIssueRecords, setLatestIssueRecords] = useState<HeartIssueRecord[]>([]);
  const [latestDemographics, setLatestDemographics] = useState<DemographicRecord[]>([]);
  const [latestMedicals, setLatestMedicals] = useState<MedicalRecord[]>([]);

  const loadCachedHR = useCallback(async () => {
    try {
      // 1. Load HR Cache & Issues Cache
      const cachedAggregation = await AsyncStorage.getItem(CACHE_KEY);
      const cachedRealtime = await AsyncStorage.getItem(CACHE_KEY_REALTIME);
      const cachedIssues = await AsyncStorage.getItem(CACHE_KEY_ISSUES);

      if (cachedAggregation) {
        const parsedData: AggregateRecord[] = JSON.parse(cachedAggregation);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          const sorted = [...parsedData].sort((a, b) => parseToDate(b.start_time || b.startTime).getTime() - parseToDate(a.start_time || a.startTime).getTime());
          const preview = sorted.slice(0, 3);
          setLatestHRAggregation(preview);
        }
      }

      if (cachedRealtime) {
        const parsedData: AggregateRecord[] = JSON.parse(cachedRealtime);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          const sorted = [...parsedData].sort((a, b) => parseToDate(b.start_time || b.startTime).getTime() - parseToDate(a.start_time || a.startTime).getTime());
          const preview = sorted.slice(0, 3);
          setLatestHRRecords(preview);
        }
      }

      if (cachedIssues) {
        const parsedIssues: HeartIssueRecord[] = JSON.parse(cachedIssues);
        if (Array.isArray(parsedIssues) && parsedIssues.length > 0) {
          const sortedIssues = [...parsedIssues].sort((a, b) => parseToDate(b.recorded_at).getTime() - parseToDate(a.recorded_at).getTime());
          const previewIssues = sortedIssues.slice(0, 3);
          setLatestIssueRecords(previewIssues);
        }
      }

      // 2. Load Demographic Cache
      const cachedDemographic = await AsyncStorage.getItem(CACHE_KEY_DEMOGRAPHIC);
      if (cachedDemographic) {
        const parsedDemographic: DemographicRecord[] = JSON.parse(cachedDemographic);
        if (Array.isArray(parsedDemographic) && parsedDemographic.length > 0) {
          const sorted = [...parsedDemographic].sort((a, b) => parseToDate(b.check_date || b.created_at).getTime() - parseToDate(a.check_date || a.created_at).getTime());
          const preview = sorted.slice(0, 3);
          setLatestDemographics(preview);
        }
      }

      // 3. Load Medical Cache
      const cachedMedical = await AsyncStorage.getItem(CACHE_KEY_MEDICAL);
      if (cachedMedical) {
        const parsedMedical: MedicalRecord[] = JSON.parse(cachedMedical);
        if (Array.isArray(parsedMedical) && parsedMedical.length > 0) {
          const sorted = [...parsedMedical].sort((a, b) => parseToDate(b.check_date || b.created_at).getTime() - parseToDate(a.check_date || a.created_at).getTime());
          const preview = sorted.slice(0, 3);
          setLatestMedicals(preview);
        }
      }
    } catch (error) {
      console.error("Gagal membaca cache di Records:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCachedHR();
    }, [loadCachedHR]),
  );

  const renderDescriptionText = () => <Text className="text-sm text-gray-500 mb-1">Showing the 3 recent records. Open the page to update and view more data.</Text>;
  const renderNoData = () => <Text className="text-gray-400 italic">No data has been saved yet. Open the page to update your data.</Text>;

  return (
    <WrapperMain>
      <View className="flex-col">
        <Header>
          <Text className="text-title text-white">HEALTH RECORDS</Text>
          <Text className="text-normal text-white font-light">Riwayat pemeriksaan, grafik detak jantung, dan riwayat kesehatan harian.</Text>
        </Header>

        <View className="flex flex-col gap-4 mt-4">
          <View className="flex-row flex-wrap justify-between gap-y-3 my-4 px-1">
            <Pressable className={`active:opacity-40 py-3 shadow-sm rounded-full border w-[48%] justify-center items-center ${activeTab === "REALTIME" ? "bg-theme-green border-theme-green" : "bg-white border-gray-200"}`} onPress={() => setActiveTab("REALTIME")}>
              <Text className={`text-normal font-semibold ${activeTab === "REALTIME" ? "text-white" : "text-black"}`}>REALTIME</Text>
            </Pressable>
            <Pressable className={`active:opacity-40 py-3 shadow-sm rounded-full border w-[48%] justify-center items-center ${activeTab === "DEMOGRAPHIC" ? "bg-theme-green border-theme-green" : "bg-white border-gray-200"}`} onPress={() => setActiveTab("DEMOGRAPHIC")}>
              <Text className={`text-normal font-semibold ${activeTab === "DEMOGRAPHIC" ? "text-white" : "text-black"}`}>DEMOGRAPHIC</Text>
            </Pressable>
            <Pressable className={`active:opacity-40 py-3 shadow-sm rounded-full border w-full justify-center items-center ${activeTab === "MEDICAL" ? "bg-theme-green border-theme-green" : "bg-white border-gray-200"}`} onPress={() => setActiveTab("MEDICAL")}>
              <Text className={`text-normal font-semibold ${activeTab === "MEDICAL" ? "text-white" : "text-black"}`}>MEDICAL RECORDS</Text>
            </Pressable>
          </View>

          {activeTab == "DEMOGRAPHIC" && (
            <Cards className="flex flex-col gap-2">
              <Text className="text-normal font-bold">DEMOGRAPHIC DATA</Text>
              {latestDemographics.length > 0 && renderDescriptionText()}

              <View className="flex-col gap-3 mt-2">
                {latestDemographics.length > 0
                  ? groupByDate(latestDemographics, (item) => parseToDate(item.check_date || item.created_at)).map((group, groupIdx) => (
                      <View key={`demo-group-${groupIdx}`} className="flex-col gap-1 border-b border-gray-200 pb-3">
                        <Text className="font-semibold text-gray-800 mb-1">{group.date}</Text>

                        {group.items.map((item, itemIdx) => {
                          const itemDate = parseToDate(item.check_date || item.created_at);
                          const timeFormatted = !isNaN(itemDate.getTime()) ? itemDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).replace(/\./g, ":") : "--:--:--";

                          return (
                            <View key={`demo-item-${itemIdx}`} className="mb-2">
                              <View className="flex-row justify-between pl-2">
                                <Text className="text-gray-600">Pukul:</Text>
                                <Text className="font-semibold">{timeFormatted} WIB</Text>
                              </View>
                              <View className="flex-row justify-between pl-2">
                                <Text className="text-gray-600">BB / TB:</Text>
                                <Text className="font-semibold">
                                  {item.weight} kg / {item.height} cm
                                </Text>
                              </View>
                              <View className="flex-row justify-between pl-2">
                                <Text className="text-gray-600">BMI / Gula Darah:</Text>
                                <Text className="font-semibold">
                                  {item.bmi} / {item.blood_sugar} mg/dL
                                </Text>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    ))
                  : renderNoData()}
              </View>

              <Pressable className="flex flex-row items-center active:opacity-40 pt-4" onPress={() => router.push("/records_demographic")}>
                <Text className="text-theme-red text-xl">Lihat Selengkapnya</Text>
                <MaterialDesignIcons name="chevron-right" className="mr-[-10]" size={30} color="#DB3546" />
              </Pressable>
            </Cards>
          )}

          {activeTab == "MEDICAL" && (
            <Cards className="flex flex-col gap-2">
              <Text className="text-normal font-bold">MEDICAL RECORDS DATA</Text>
              {latestMedicals.length > 0 && renderDescriptionText()}

              <View className="flex-col gap-3 mt-2">
                {latestMedicals.length > 0
                  ? groupByDate(latestMedicals, (item) => parseToDate(item.check_date || item.created_at)).map((group, groupIdx) => (
                      <View key={`med-group-${groupIdx}`} className="flex-col gap-1 border-b border-gray-200 pb-3">
                        <Text className="font-semibold text-gray-800 mb-1">{group.date}</Text>

                        {group.items.map((item, itemIdx) => {
                          const itemDate = parseToDate(item.check_date || item.created_at);
                          const timeFormatted = !isNaN(itemDate.getTime()) ? itemDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).replace(/\./g, ":") : "--:--:--";

                          return (
                            <View key={`med-item-${itemIdx}`} className="mb-2">
                              <View className="flex-row justify-between pl-2">
                                <Text className="text-gray-600">Pukul:</Text>
                                <Text className="font-semibold">{timeFormatted} WIB</Text>
                              </View>
                              <View className="flex-row justify-between pl-2">
                                <Text className="text-gray-600">Lab Result:</Text>
                                <Text className="font-semibold">{item.lab_result ? "Tersedia" : "Tidak Tersedia"}</Text>
                              </View>
                              <View className="flex-row justify-between pl-2">
                                <Text className="text-gray-600">Medical Images:</Text>
                                <Text className="font-semibold">{item.medical_image ? "Tersedia" : "Tidak Tersedia"}</Text>
                              </View>
                              <View className="flex-row justify-between pl-2">
                                <Text className="text-gray-600">Diagnosis:</Text>
                                <Text className="font-semibold">{item.diagnosis ? "Tersedia" : "Tidak Tersedia"}</Text>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    ))
                  : renderNoData()}
              </View>

              <Pressable className="flex flex-row items-center active:opacity-40 pt-4" onPress={() => router.push("/records_medical")}>
                <Text className="text-theme-red text-xl">Lihat Selengkapnya</Text>
                <MaterialDesignIcons name="chevron-right" className="mr-[-10]" size={30} color="#DB3546" />
              </Pressable>
            </Cards>
          )}

          {activeTab == "REALTIME" && (
            <View className="flex flex-col gap-4">
              {/* CARDS RIWAYAT GANGGUAN JANTUNG */}
              <Cards className="flex flex-col gap-2">
                <Text className="text-normal font-bold">RIWAYAT GANGGUAN JANTUNG</Text>
                {latestIssueRecords.length > 0 && renderDescriptionText()}

                <View className="flex-col gap-3 mt-2">
                  {latestIssueRecords.length > 0
                    ? groupByDate(latestIssueRecords, (item) => parseToDate(item.recorded_at)).map((group, groupIdx) => (
                        <View key={`issue-group-${groupIdx}`} className="flex-col gap-1 border-b border-gray-200 pb-3">
                          <Text className="font-semibold text-gray-800 mb-1">{group.date}</Text>

                          {group.items.map((item, itemIdx) => {
                            const itemDate = parseToDate(item.recorded_at);
                            const timeFormatted = !isNaN(itemDate.getTime())
                              ? itemDate
                                  .toLocaleTimeString("id-ID", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                  })
                                  .replace(/\./g, ":")
                              : "--:--:--";

                            return (
                              <View key={`issue-item-${itemIdx}`} className="flex-row justify-between pl-2 items-center mb-1">
                                <Text className="text-gray-600 capitalize flex-1">{item.issue_type}:</Text>
                                <Text className="font-semibold">{timeFormatted} WIB</Text>
                              </View>
                            );
                          })}
                        </View>
                      ))
                    : renderNoData()}
                </View>

                <Pressable className="flex flex-row items-center active:opacity-40 pt-4" onPress={() => router.push("/records_disorder")}>
                  <Text className="text-theme-red text-xl">Lihat Selengkapnya</Text>
                  <MaterialDesignIcons name="chevron-right" className="mr-[-10]" size={30} color="#DB3546" />
                </Pressable>
              </Cards>

              {/* CARDS RIWAYAT HR AGREGASI */}
              <Cards className="flex flex-col gap-2">
                <Text className="text-normal font-bold">RIWAYAT AGREGASI HR</Text>
                {latestHRAggregation.length > 0 && renderDescriptionText()}

                <View className="flex-col gap-3 mt-2">
                  {latestHRAggregation.length > 0
                    ? groupByDate(latestHRAggregation, (item) => parseToDate(item.start_time || item.startTime)).map((group, groupIdx) => (
                        <View key={`agg-group-${groupIdx}`} className="flex-col gap-1 border-b border-gray-200 pb-3">
                          <Text className="font-semibold text-gray-800 mb-1">{group.date}</Text>

                          {group.items.map((item, itemIdx) => {
                            const rawTime = item.start_time || item.startTime;
                            const itemDate = parseToDate(rawTime);
                            const bpmValue = item.bpm ?? item.averageHR ?? 0;

                            const timeFormatted = !isNaN(itemDate.getTime())
                              ? itemDate
                                  .toLocaleTimeString("id-ID", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                  })
                                  .replace(/\./g, ":")
                              : "--:--:--";

                            return (
                              <View key={`agg-item-${itemIdx}`} className="flex-row justify-between pl-2 items-center mb-1">
                                <Text className="text-gray-600 flex-1">Pukul {timeFormatted} WIB:</Text>
                                <Text className="font-semibold">{bpmValue} BPM</Text>
                              </View>
                            );
                          })}
                        </View>
                      ))
                    : renderNoData()}
                </View>

                <Pressable className="flex flex-row items-center active:opacity-40 pt-4" onPress={() => router.push("/records_hr_aggregation")}>
                  <Text className="text-theme-red text-xl">Lihat Selengkapnya</Text>
                  <MaterialDesignIcons name="chevron-right" className="mr-[-10]" size={30} color="#DB3546" />
                </Pressable>
              </Cards>

              {/* CARDS RIWAYAT HR REALTIME */}
              <Cards className="flex flex-col gap-2">
                <Text className="text-normal font-bold">RIWAYAT HR REALTIME</Text>
                {latestHRRecords.length > 0 && renderDescriptionText()}

                <View className="flex-col gap-3 mt-2">
                  {latestHRRecords.length > 0
                    ? groupByDate(latestHRRecords, (item) => parseToDate(item.start_time || item.startTime)).map((group, groupIdx) => (
                        <View key={`rt-group-${groupIdx}`} className="flex-col gap-1 border-b border-gray-200 pb-3">
                          <Text className="font-semibold text-gray-800 mb-1">{group.date}</Text>

                          {group.items.map((item, itemIdx) => {
                            const rawTime = item.start_time || item.startTime;
                            const itemDate = parseToDate(rawTime);
                            const bpmValue = item.bpm ?? item.averageHR ?? 0;

                            const timeFormatted = !isNaN(itemDate.getTime())
                              ? itemDate
                                  .toLocaleTimeString("id-ID", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                  })
                                  .replace(/\./g, ":")
                              : "--:--:--";

                            return (
                              <View key={`rt-item-${itemIdx}`} className="flex-row justify-between pl-2 items-center mb-1">
                                <Text className="text-gray-600 flex-1">Pukul {timeFormatted} WIB:</Text>
                                <Text className="font-semibold">{bpmValue} BPM</Text>
                              </View>
                            );
                          })}
                        </View>
                      ))
                    : renderNoData()}
                </View>

                <Pressable className="flex flex-row items-center active:opacity-40 pt-4" onPress={() => router.push("/records_hr_realtime")}>
                  <Text className="text-theme-red text-xl">Lihat Selengkapnya</Text>
                  <MaterialDesignIcons name="chevron-right" className="mr-[-10]" size={30} color="#DB3546" />
                </Pressable>
              </Cards>
            </View>
          )}
        </View>
      </View>
    </WrapperMain>
  );
}
