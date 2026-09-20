import DateTimePicker from "@react-native-community/datetimepicker";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";
import { useModal } from "../context";
import Cards from "./Cards";
import Modal from "./Modal";

type DatePickerProps = {
  initialDate?: Date;
  initialRangeEndDate?: Date;
  initialRangePicker?: boolean;
  onDateChange?: (date: Date) => void;
  onRangeChange?: (startDate: Date, endDate: Date) => void;
};

export default function DatePicker({ initialDate, initialRangeEndDate, initialRangePicker = false, onDateChange, onRangeChange }: DatePickerProps) {
  const { openModal, closeModal } = useModal();

  const [isRangePicker, setIsRangePicker] = useState(initialRangePicker);

  // 1. Lazy Initialization: Hanya buat objek Date baru 1x saat komponen dipasang
  const [date, setDate] = useState(() => initialDate || new Date());
  const [rangeStartDate, setRangeStartDate] = useState(() => initialDate || new Date());
  const [rangeEndDate, setRangeEndDate] = useState(() => initialRangeEndDate || new Date((initialDate || new Date()).getTime() + 7 * 24 * 60 * 60 * 1000));

  // 2. Ref untuk mencatat timestamp prop sebelumnya
  const prevInitialTimeRef = useRef<number | undefined>(initialDate?.getTime());
  const prevInitialEndTimeRef = useRef<number | undefined>(initialRangeEndDate?.getTime());

  // 3. Sync HANYA JIKA prop initialDate dari Parent BENAR-BENAR BERUBAH secara eksternal
  useEffect(() => {
    const currentInitialTime = initialDate?.getTime();
    if (currentInitialTime && currentInitialTime !== prevInitialTimeRef.current) {
      prevInitialTimeRef.current = currentInitialTime;
      setDate(initialDate!);
      setRangeStartDate(initialDate!);
    }
  }, [initialDate]);

  useEffect(() => {
    const currentEndTime = initialRangeEndDate?.getTime();
    if (currentEndTime && currentEndTime !== prevInitialEndTimeRef.current) {
      prevInitialEndTimeRef.current = currentEndTime;
      setRangeEndDate(initialRangeEndDate!);
    }
  }, [initialRangeEndDate]);

  const formatDate = (value: Date) =>
    value.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const formatDateRange = (value: Date) =>
    value.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });

  const formattedDate = useMemo(() => formatDate(date), [date]);
  const formattedRangeStartDate = useMemo(() => formatDateRange(rangeStartDate), [rangeStartDate]);
  const formattedRangeEndDate = useMemo(() => formatDateRange(rangeEndDate), [rangeEndDate]);

  const handleSingleDateChange = (event: any, selectedDate?: Date) => {
    closeModal("single-date-picker");
    if (event.type === "set" && selectedDate) {
      setDate(selectedDate);

      const defaultEndDate = new Date(selectedDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      setRangeStartDate(selectedDate);
      setRangeEndDate(defaultEndDate);

      onDateChange?.(selectedDate);
    }
  };

  const handleRangeStartChange = (event: any, selectedDate?: Date) => {
    closeModal("range-start-picker");
    if (event.type === "set" && selectedDate) {
      let updatedEnd = rangeEndDate;
      if (selectedDate > rangeEndDate) {
        updatedEnd = selectedDate;
        setRangeEndDate(selectedDate);
      }
      setRangeStartDate(selectedDate);
      onRangeChange?.(selectedDate, updatedEnd);
    }
  };

  const handleRangeEndChange = (event: any, selectedDate?: Date) => {
    closeModal("range-end-picker");
    if (event.type === "set" && selectedDate) {
      let updatedStart = rangeStartDate;
      if (selectedDate < rangeStartDate) {
        updatedStart = selectedDate;
        setRangeStartDate(selectedDate);
      }
      setRangeEndDate(selectedDate);
      onRangeChange?.(updatedStart, selectedDate);
    }
  };

  const onToggleSwitch = () => {
    const nextState = !isRangePicker;
    setIsRangePicker(nextState);

    if (nextState) {
      onRangeChange?.(rangeStartDate, rangeEndDate);
    } else {
      onDateChange?.(date);
    }
  };

  return (
    <View className="flex flex-col gap-2">
      <View className="-mb-4 flex-1 flex flex-row items-center justify-end gap-2">
        <Text className="text-label">Range Picker</Text>
        <Switch value={isRangePicker} onValueChange={onToggleSwitch} trackColor={{ true: "#017BFE", false: "#767577" }} thumbColor={isRangePicker ? "#ffffff" : "#f4f3f4"} />
      </View>

      {!isRangePicker && (
        <Pressable className="active:opacity-50" onPress={() => openModal("single-date-picker")}>
          <Cards className="mt-4 flex flex-row items-center py-[15] gap-4">
            <MaterialDesignIcons className="ml-[-2]" name="calendar-range" size={30} color="#DB3546" />
            <Text className="text-normal">{formattedDate}</Text>
          </Cards>
        </Pressable>
      )}

      {!!isRangePicker && (
        <View className="mt-6 flex flex-row items-center justify-between gap-2">
          <Pressable className="flex-1 active:opacity-50" onPress={() => openModal("range-start-picker")}>
            <Cards className="flex flex-row items-center justify-center py-[15] gap-2">
              <MaterialDesignIcons name="calendar-import" size={24} color="#DB3546" />
              <Text className="text-normal">{formattedRangeStartDate}</Text>
            </Cards>
          </Pressable>

          <Text className="text-4xl font-bold text-gray-400">-</Text>

          <Pressable className="flex-1 active:opacity-50" onPress={() => openModal("range-end-picker")}>
            <Cards className="flex flex-row items-center justify-center py-[15] gap-2">
              <MaterialDesignIcons name="calendar-export" size={24} color="#DB3546" />
              <Text className="text-normal">{formattedRangeEndDate}</Text>
            </Cards>
          </Pressable>
        </View>
      )}

      <Modal id="single-date-picker">
        <DateTimePicker value={date} onChange={handleSingleDateChange} onDismiss={() => closeModal()} mode="date" />
      </Modal>

      <Modal id="range-start-picker">
        <DateTimePicker value={rangeStartDate} maximumDate={rangeEndDate} onChange={handleRangeStartChange} onDismiss={() => closeModal()} mode="date" />
      </Modal>

      <Modal id="range-end-picker">
        <DateTimePicker value={rangeEndDate} minimumDate={rangeStartDate} onChange={handleRangeEndChange} onDismiss={() => closeModal()} mode="date" />
      </Modal>
    </View>
  );
}

export { DatePicker };
