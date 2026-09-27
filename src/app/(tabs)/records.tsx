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
  check_date?: string; // Ditambahkan untuk penyesuaian database baru
  date_of_birth?: string;
  gender?: string;
  age?: number;
  height?: number;
  weight?: number;
  bmi?: number;
  blood_sugar?: number;
  cholesterol?: number;
  created_at?: string; // Dipertahankan untuk fallback data cache lama
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

export default function Records() {
  const router = useRouter();

  type TabMenu = "REALTIME" | "DEMOGRAPHIC" | "MEDICAL";
  const [activeTab, setActiveTab] = useState<TabMenu>("REALTIME");

  const [latestHRRecords, setLatestHRRecords] = useState<AggregateRecord[]>([]);
  const [latesetHRDateText, setLatesetHRDateText] = useState<string>("");

  const [latestHRAggregation, setLatestHRAggregation] = useState<AggregateRecord[]>([]);
  const [latestHRAggregationDateText, setLatestHRAggregationDateText] = useState<string>("");

  const [latestIssueRecords, setLatestIssueRecords] = useState<HeartIssueRecord[]>([]);
  const [latestIssueDateText, setLatestIssueDateText] = useState<string>("");

  const [latestDemographics, setLatestDemographics] = useState<DemographicRecord[]>([]);
  const [latestDemographicDateText, setLatestDemographicDateText] = useState<string>("");

  const [latestMedicals, setLatestMedicals] = useState<MedicalRecord[]>([]);
  const [latestMedicalDateText, setLatestMedicalDateText] = useState<string>("");

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
          const topDate = parseToDate(preview[0].start_time || preview[0].startTime);
          if (!isNaN(topDate.getTime())) setLatestHRAggregationDateText(topDate.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
        }
      }

      if (cachedRealtime) {
        const parsedData: AggregateRecord[] = JSON.parse(cachedRealtime);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          const sorted = [...parsedData].sort((a, b) => parseToDate(b.start_time || b.startTime).getTime() - parseToDate(a.start_time || a.startTime).getTime());
          const preview = sorted.slice(0, 3);
          setLatestHRRecords(preview);
          const topDate = parseToDate(preview[0].start_time || preview[0].startTime);
          if (!isNaN(topDate.getTime())) setLatesetHRDateText(topDate.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
        }
      }

      if (cachedIssues) {
        const parsedIssues: HeartIssueRecord[] = JSON.parse(cachedIssues);
        if (Array.isArray(parsedIssues) && parsedIssues.length > 0) {
          const sortedIssues = [...parsedIssues].sort((a, b) => parseToDate(b.recorded_at).getTime() - parseToDate(a.recorded_at).getTime());
          const previewIssues = sortedIssues.slice(0, 3);
          setLatestIssueRecords(previewIssues);
          const topIssueDate = parseToDate(previewIssues[0].recorded_at);
          if (!isNaN(topIssueDate.getTime())) setLatestIssueDateText(topIssueDate.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
        }
      }

      // 2. Load Demographic Cache (Menggunakan check_date)
      const cachedDemographic = await AsyncStorage.getItem(CACHE_KEY_DEMOGRAPHIC);
      if (cachedDemographic) {
        const parsedDemographic: DemographicRecord[] = JSON.parse(cachedDemographic);
        if (Array.isArray(parsedDemographic) && parsedDemographic.length > 0) {
          const sorted = [...parsedDemographic].sort((a, b) => parseToDate(b.check_date || b.created_at).getTime() - parseToDate(a.check_date || a.created_at).getTime());
          const preview = sorted.slice(0, 2);
          setLatestDemographics(preview);
          const topDate = parseToDate(preview[0].check_date || preview[0].created_at);
          if (!isNaN(topDate.getTime())) setLatestDemographicDateText(topDate.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
        }
      }

      // 3. Load Medical Cache
      const cachedMedical = await AsyncStorage.getItem(CACHE_KEY_MEDICAL);
      if (cachedMedical) {
        const parsedMedical: MedicalRecord[] = JSON.parse(cachedMedical);
        if (Array.isArray(parsedMedical) && parsedMedical.length > 0) {
          const sorted = [...parsedMedical].sort((a, b) => parseToDate(b.check_date || b.created_at).getTime() - parseToDate(a.check_date || a.created_at).getTime());
          const preview = sorted.slice(0, 2);
          setLatestMedicals(preview);
          const topDate = parseToDate(preview[0].check_date || preview[0].created_at);
          if (!isNaN(topDate.getTime())) setLatestMedicalDateText(topDate.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
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
              <Text className="text-normal font-bold">DATA DEMOGRAFI TERAKHIR</Text>
              <Text className="text-normal text-gray-500">{latestDemographicDateText || "Belum ada riwayat"}</Text>
              <View className="flex-col gap-3 mt-2">
                {latestDemographics.length > 0 ? (
                  latestDemographics.map((item, index) => (
                    <View key={`demo-${index}`} className="flex-col gap-1 border-b border-gray-200 pb-2">
                      <View className="flex-row justify-between">
                        <Text>BB / TB:</Text>
                        <Text className="font-semibold">
                          {item.weight} kg / {item.height} cm
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text>BMI / Gula Darah:</Text>
                        <Text className="font-semibold">
                          {item.bmi} / {item.blood_sugar} mg/dL
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text className="text-gray-400 italic">Belum ada data tersimpan</Text>
                )}
              </View>
              <Pressable className="flex flex-row items-center justify-end active:opacity-40 pt-4" onPress={() => router.push("/records_demographic")}>
                <Text className="text-theme-red text-xl">Lihat Selengkapnya</Text>
                <MaterialDesignIcons name="chevron-right" className="mr-[-10]" size={30} color="#DB3546" />
              </Pressable>
            </Cards>
          )}

          {activeTab == "MEDICAL" && (
            <Cards className="flex flex-col gap-2">
              <Text className="text-normal font-bold">REKAM MEDIS TERAKHIR</Text>
              <Text className="text-normal text-gray-500">{latestMedicalDateText || "Belum ada riwayat"}</Text>
              <View className="flex-col gap-3 mt-2">
                {latestMedicals.length > 0 ? (
                  latestMedicals.map((item, index) => (
                    <View key={`med-${index}`} className="flex-col gap-1 border-b border-gray-200 pb-2">
                      <View className="flex-row items-center gap-2">
                        <MaterialDesignIcons name="file-document-outline" size={20} color="#000" />
                        <Text className="flex-1 font-semibold">{item.diagnosis ? "Diagnosis Tersedia" : "Rekam Medis"}</Text>
                      </View>
                      {item.lab_result && <Text className="text-gray-500 ml-7">- Lab Result terlampir</Text>}
                    </View>
                  ))
                ) : (
                  <Text className="text-gray-400 italic">Belum ada data tersimpan</Text>
                )}
              </View>
              <Pressable className="flex flex-row items-center justify-end active:opacity-40 pt-4" onPress={() => router.push("/records_medical")}>
                <Text className="text-theme-red text-xl">Lihat Selengkapnya</Text>
                <MaterialDesignIcons name="chevron-right" className="mr-[-10]" size={30} color="#DB3546" />
              </Pressable>
            </Cards>
          )}

          {/* CARDS RIWAYAT GANGGUAN & HR */}
          {activeTab == "REALTIME" && (
            <View className="flex flex-col gap-4">
              <Cards className="flex flex-col gap-2">
                <Text className="text-normal font-bold">RIWAYAT GANGGUAN JANTUNG</Text>
                <Text className="text-normal text-gray-500">{latestIssueDateText || "Belum ada riwayat"}</Text>

                <View className="flex-col gap-3 mt-2">
                  {latestIssueRecords.length > 0 ? (
                    latestIssueRecords.map((item, index) => {
                      const itemDate = parseToDate(item.recorded_at);
                      const timeFormatted = !isNaN(itemDate.getTime())
                        ? itemDate.toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit", // Tambahkan baris ini
                          })
                        : "--:--";

                      return (
                        <View key={`${item.recorded_at}-${index}`} className="flex-row items-center gap-4 justify-between">
                          <View className="w-2 h-2 rounded-full bg-black" />
                          <Text className="text-xl capitalize flex-1">{item.issue_type}:</Text>
                          <Text className="text-xl font-semibold">{timeFormatted} WIB</Text>
                        </View>
                      );
                    })
                  ) : (
                    <Text className="text-gray-400 italic">Belum ada gangguan tersimpan</Text>
                  )}
                </View>

                <Pressable className="flex flex-row items-center justify-end active:opacity-40 pt-4" onPress={() => router.push("/records_disorder")}>
                  <Text className="text-theme-red text-xl">Lihat Selengkapnya</Text>
                  <MaterialDesignIcons name="chevron-right" className="mr-[-10]" size={30} color="#DB3546" />
                </Pressable>
              </Cards>

              {/* CARDS RIWAYAT HR AGREGASI */}
              <Cards className="flex flex-col gap-2">
                <Text className="text-normal font-bold">RIWAYAT AGREGASI HR</Text>
                <Text className="text-normal text-gray-500">{latestHRAggregationDateText || "Belum ada riwayat"}</Text>

                <View className="flex-col gap-3 mt-2">
                  {latestHRAggregation.length > 0 ? (
                    latestHRAggregation.map((item, index) => {
                      const rawTime = item.start_time || item.startTime;
                      const itemDate = parseToDate(rawTime);
                      const bpmValue = item.bpm ?? item.averageHR ?? 0;

                      const timeFormatted = !isNaN(itemDate.getTime())
                        ? itemDate.toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit", // Tambahkan baris ini
                          })
                        : "--:--";

                      return (
                        <View key={`${rawTime}-${index}`} className="flex-row items-center gap-4 justify-between">
                          <View className="w-2 h-2 rounded-full bg-black" />
                          <Text className="text-xl flex-1">{timeFormatted} WIB:</Text>
                          <Text className="text-xl font-semibold">{bpmValue} BPM</Text>
                        </View>
                      );
                    })
                  ) : (
                    <Text className="text-gray-400 italic">Belum ada data tersimpan</Text>
                  )}
                </View>

                <Pressable className="flex flex-row items-center justify-end active:opacity-40 pt-4" onPress={() => router.push("/records_hr_aggregation")}>
                  <Text className="text-theme-red text-xl">Lihat Selengkapnya</Text>
                  <MaterialDesignIcons name="chevron-right" className="mr-[-10]" size={30} color="#DB3546" />
                </Pressable>
              </Cards>

              {/* CARDS RIWAYAT HR REALTIME */}
              <Cards className="flex flex-col gap-2">
                <Text className="text-normal font-bold">RIWAYAT HR REALTIME</Text>
                <Text className="text-normal text-gray-500">{latesetHRDateText || "Belum ada riwayat"}</Text>

                <View className="flex-col gap-3 mt-2">
                  {latestHRRecords.length > 0 ? (
                    latestHRRecords.map((item, index) => {
                      const rawTime = item.start_time || item.startTime;
                      const itemDate = parseToDate(rawTime);
                      const bpmValue = item.bpm ?? item.averageHR ?? 0;

                      const timeFormatted = !isNaN(itemDate.getTime())
                        ? itemDate.toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit", // Tambahkan baris ini
                          })
                        : "--:--";

                      return (
                        <View key={`${rawTime}-${index}`} className="flex-row items-center gap-4 justify-between">
                          <View className="w-2 h-2 rounded-full bg-black" />
                          <Text className="text-xl flex-1">{timeFormatted} WIB:</Text>
                          <Text className="text-xl font-semibold">{bpmValue} BPM</Text>
                        </View>
                      );
                    })
                  ) : (
                    <Text className="text-gray-400 italic">Belum ada data tersimpan</Text>
                  )}
                </View>

                <Pressable className="flex flex-row items-center justify-end active:opacity-40 pt-4" onPress={() => router.push("/records_hr_realtime")}>
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
