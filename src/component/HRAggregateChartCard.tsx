import React from "react";
import { Dimensions, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { ChartPoint } from "../context/hr/hr.type";
import { Cards } from "./";

const screenWidth = Dimensions.get("window").width;

type Props = {
  data: ChartPoint[];
};

export const HRAggregateChartCard: React.FC<Props> = ({ data }) => {
  const chartData = data.length > 0 ? data : [{ value: 0, label: "--:--" }];

  // 1. REVISI: Kalkulasi maxValue dinamis
  const maxDataValue = Math.max(...chartData.map((d) => d.value), 0);
  const computedMaxValue = maxDataValue > 0 ? Math.ceil((maxDataValue + 15) / 10) * 10 : 100;

  return (
    <Cards className="flex flex-col gap-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="w-3 h-3 rounded-full bg-theme-green" />
          <Text className="text-label text-theme-green font-bold">AGREGASI HR (10 MNT)</Text>
        </View>
        {/* <Text className="text-xs text-gray-400">Rata-rata 10 Mnt</Text> */}
      </View>

      <View className="overflow-hidden mt-1">
        <LineChart
          data={chartData}
          width={screenWidth - 80}
          height={140}
          thickness={2}
          color="#038175"
          startFillColor="rgba(3, 129, 117, 0.25)"
          endFillColor="rgba(3, 129, 117, 0.0)"
          startOpacity={0.3}
          endOpacity={0.0}
          areaChart
          curved
          hideRules
          // Value Text pada Dot
          showValuesAsDataPointsText
          textFontSize={8}
          textColor="#038175"
          textShiftY={-10}
          textShiftX={-4}
          dataPointsColor="#038175"
          dataPointsRadius={3}
          yAxisTextStyle={{ color: "#888888", fontSize: 10 }}
          xAxisLabelTextStyle={{ color: "#888888", fontSize: 8 }}
          noOfSections={3}
          // REVISI 1: maxValue Dinamis
          maxValue={computedMaxValue}
          // REVISI 2: Auto Scroll ke Kanan
          scrollToEnd={true}
          scrollAnimation={true}
        />
      </View>
    </Cards>
  );
};
