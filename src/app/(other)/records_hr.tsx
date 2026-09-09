import { useHR } from "@/context";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Cards, DatePicker, RouterSub, WrapperMain } from "../../component";

export default function RecordsHR() {
  const {
    hrContext: { HeartRateAgregate },
  } = useHR();

  const [groupedByDay, setGroupedByDay] = useState<Record<string, typeof HeartRateAgregate>>({});

  function getDateKey(timestamp: number) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  useEffect(() => {
    const grouped = HeartRateAgregate.reduce(
      (result, item) => {
        const dateKey = getDateKey(item.startTime);
        if (!result[dateKey]) {
          result[dateKey] = [];
        }
        result[dateKey].push(item);
        return result;
      },
      {} as Record<string, typeof HeartRateAgregate>,
    );

    setGroupedByDay(grouped);
  }, [HeartRateAgregate]);

  return (
    <WrapperMain>
      <View className="flex-col pb-8">
        <RouterSub title="REKAM MEDIS" subTitle="RIWAYAT HEART RATE" />

        <View className="flex flex-col gap-4 flex-1 mt-4">
          <DatePicker onDateChange={(date) => console.log(date, "date")} onRangeChange={(prev, next) => console.log(prev, next, "range")} />

          {/* CARDS DATA */}
          {Object.entries(groupedByDay).map(([date, data]) => (
            <Cards key={date} className="flex flex-col gap-2">
              <Text className="text-normal font-bold">{date}</Text>

              <View className="flex-col gap-3 mt-2">
                {data.map((item, index) => (
                  <View key={`${item.startTime}-${index}`} className="flex-row items-center gap-4">
                    <View className="w-2 h-2 rounded-full bg-black" />

                    <Text className="text-xl">
                      {new Date(item.startTime).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      WIB:
                    </Text>

                    <Text className="text-xl font-semibold">{item.averageHR} BPM</Text>
                  </View>
                ))}
              </View>
            </Cards>
          ))}
        </View>
      </View>
    </WrapperMain>
  );
}
