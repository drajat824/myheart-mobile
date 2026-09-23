import React, { useMemo } from "react";
import { Dimensions, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { ChartPoint } from "../context/hr/hr.type";

const screenWidth = Dimensions.get("window").width;

// 1. Simpan fallback data di luar komponen agar referensi memori tidak berubah saat render
const FALLBACK_DATA: ChartPoint[] = [{ value: 0, label: "--:--" }];

type Props = {
  data: ChartPoint[];
};

export const HRAggregateChartCard: React.FC<Props> = ({ data }) => {
  // 2. Memoize chartData untuk mencegah pembentukan array baru di setiap re-render
  const chartData = useMemo(() => {
    return data && data.length > 0 ? data : FALLBACK_DATA;
  }, [data]);

  // 3. Memoize nilai maksimum Y-axis
  const computedMaxValue = useMemo(() => {
    const maxDataValue = Math.max(...chartData.map((d) => d.value), 0);
    return maxDataValue > 0 ? Math.ceil((maxDataValue + 15) / 10) * 10 : 100;
  }, [chartData]);

  return (
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
        maxValue={computedMaxValue}
        scrollToEnd={true}
        scrollAnimation={false} // Matikan animasi scroll agar tidak memicu infinite loop state
      />
    </View>
  );
};
