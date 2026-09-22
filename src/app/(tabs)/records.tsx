import { HeartIssueRecord } from "@/context/hr";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Cards, Header, WrapperMain } from "../../component";

const CACHE_KEY = "@myheartz_records_cache";
const CACHE_KEY_ISSUES = "@myheartz_disorder_cache";

type AggregateRecord = {
  id?: number;
  user_id?: number;
  bpm?: number;
  averageHR?: number;
  start_time?: string | number;
  startTime?: number;
  end_time?: string | number;
};

// Helper untuk parse tanggal aman di Hermes JS
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

export default function Records() {
  const router = useRouter();

  const [isDevice, setDevice] = useState(true);

  const [latestHRRecords, setLatestHRRecords] = useState<AggregateRecord[]>([]);
  const [latestDateText, setLatestDateText] = useState<string>("");
  const [latestIssueRecords, setLatestIssueRecords] = useState<HeartIssueRecord[]>([]);
  const [latestIssueDateText, setLatestIssueDateText] = useState<string>("");

  // Mengambil cuplikan data terbaru dari cache
  const loadCachedHR = useCallback(async () => {
    try {
      // 1. Load HR Cache
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedData: AggregateRecord[] = JSON.parse(cached);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          const sorted = [...parsedData].sort((a, b) => parseToDate(b.start_time || b.startTime).getTime() - parseToDate(a.start_time || a.startTime).getTime());
          const preview = sorted.slice(0, 3);
          setLatestHRRecords(preview);

          const topDate = parseToDate(preview[0].start_time || preview[0].startTime);
          if (!isNaN(topDate.getTime())) {
            setLatestDateText(
              topDate.toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              }),
            );
          }
        }
      }

      // 2. Load Disorder/Issues Cache (BARU DITAMBAHKAN)
      const cachedIssues = await AsyncStorage.getItem(CACHE_KEY_ISSUES);
      if (cachedIssues) {
        const parsedIssues: HeartIssueRecord[] = JSON.parse(cachedIssues);
        if (Array.isArray(parsedIssues) && parsedIssues.length > 0) {
          const sortedIssues = [...parsedIssues].sort((a, b) => parseToDate(b.recorded_at).getTime() - parseToDate(a.recorded_at).getTime());
          const previewIssues = sortedIssues.slice(0, 3);
          setLatestIssueRecords(previewIssues);

          const topIssueDate = parseToDate(previewIssues[0].recorded_at);
          if (!isNaN(topIssueDate.getTime())) {
            setLatestIssueDateText(
              topIssueDate.toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              }),
            );
          }
        }
      }
    } catch (error) {
      console.error("Gagal membaca cache di Records:", error);
    }
  }, []);

  // Reload cache setiap kali halaman ini aktif/fokus
  useFocusEffect(
    useCallback(() => {
      loadCachedHR();
    }, [loadCachedHR]),
  );

  return (
    <WrapperMain>
      <View className="flex-col">
        {/* FLEX 1: HEADER PAGES */}
        <Header>
          <Text className="text-title text-white">REKAM MEDIS</Text>
          <Text className="text-normal text-white font-light">Riwayat pemeriksaan, grafik detak jantung, dan riwayat kesehatan harian.</Text>
        </Header>

        {/* FLEX 2: CARDS CONTENT */}
        <View className="flex flex-col gap-4 mt-4">
          {/* CARDS MENU */}
          <View className="flex-row justify-center items-center my-4">
            <Pressable className={isDevice ? "active:opacity-40 bg-theme-green p-4 shadow-md rounded-l-full w-40" : "active:opacity-40 bg-white p-4 shadow-md rounded-l-full w-40"} onPress={() => setDevice(true)}>
              <Text className={isDevice ? "text-normal text-center font-semibold text-white" : "text-normal text-center font-semibold text-black"}>DEVICE</Text>
            </Pressable>

            <Pressable className={!isDevice ? "active:opacity-40 bg-theme-green p-4 shadow-md rounded-r-full w-40" : "active:opacity-40 bg-white p-4 shadow-md rounded-r-full w-40"} onPress={() => setDevice(false)}>
              <Text className={!isDevice ? "text-normal text-center font-semibold text-white" : "text-normal text-center font-semibold text-black"}>DIAGNOSIS</Text>
            </Pressable>
          </View>

          {/* CARDS PEMERIKSAAN */}
          {!isDevice && (
            <Cards className="flex flex-col gap-2">
              <Text className="text-normal font-bold">PEMERIKSAAN BERKALA</Text>
              <Text className="text-normal text-gray-500">Rabu, 25 Agustus 2026</Text>

              <View className="flex-col gap-3 mt-2">
                <View className="flex-row items-center gap-4">
                  <View className="w-2 h-2 rounded-full bg-black" />
                  <Text className="text-xl">Berat/Tinggi Badan:</Text>
                  <Text className="text-xl font-semibold">89 kg/170 cm</Text>
                </View>
                <View className="flex-row items-center gap-4">
                  <View className="w-2 h-2 rounded-full bg-black" />
                  <Text className="text-xl">Kolestrol:</Text>
                  <Text className="text-xl font-semibold">200 mg/dL</Text>
                </View>
                <View className="flex-row items-center gap-4">
                  <View className="w-2 h-2 rounded-full bg-black" />
                  <Text className="text-xl">Gula Darah:</Text>
                  <Text className="text-xl font-semibold">100 mg/dL</Text>
                </View>
              </View>

              <Pressable className="flex flex-row items-center justify-end active:opacity-40 pt-4" onPress={() => router.push("/records_periodic")}>
                <Text className="text-theme-red text-xl">Lihat Selengkapnya</Text>
                <MaterialDesignIcons name="chevron-right" className="mr-[-10]" size={30} color="#DB3546" />
              </Pressable>
            </Cards>
          )}

          {/* CARDS RIWAYAT GANGGUAN & HR */}
          {isDevice && (
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
                          })
                        : "--:--";

                      return (
                        <View key={`${item.recorded_at}-${index}`} className="flex-row items-center gap-4">
                          <View className="w-2 h-2 rounded-full bg-black" />
                          <Text className="text-xl capitalize">{item.issue_type}:</Text>
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

              {/* CARDS RIWAYAT HR (DENGAN CUPLIKAN CACHE) */}
              <Cards className="flex flex-col gap-2">
                <Text className="text-normal font-bold">RIWAYAT HEART-RATE</Text>
                <Text className="text-normal text-gray-500">{latestDateText || "Belum ada riwayat"}</Text>

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
                          })
                        : "--:--";

                      return (
                        <View key={`${rawTime}-${index}`} className="flex-row items-center gap-4">
                          <View className="w-2 h-2 rounded-full bg-black" />
                          <Text className="text-xl">{timeFormatted} WIB:</Text>
                          <Text className="text-xl font-semibold">{bpmValue} BPM</Text>
                        </View>
                      );
                    })
                  ) : (
                    <Text className="text-gray-400 italic">Belum ada data tersimpan</Text>
                  )}
                </View>

                <Pressable className="flex flex-row items-center justify-end active:opacity-40 pt-4" onPress={() => router.push("/records_hr")}>
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
