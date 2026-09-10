import { useModal } from "@/context";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import React from "react";
import { Animated, Easing, View } from "react-native";
import Modal from "./Modal";

interface LoadingProps {
  visible: boolean;
}

const Loading: React.FC<LoadingProps> = ({ visible }) => {
  const { openModal, closeModal } = useModal();
  const rotation = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      openModal("loading");

      const animation = Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );

      animation.start();

      return () => animation.stop();
    }

    closeModal();
    rotation.setValue(0);
  }, [visible, openModal, closeModal, rotation]);

  return (
    <Modal id="loading">
      <View className="flex justify-center items-center">
        <Animated.View
          style={{
            transform: [
              {
                rotate: rotation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", "360deg"],
                }),
              },
            ],
          }}
        >
          <MaterialDesignIcons name="loading" size={100} color="#fff" />
        </Animated.View>
      </View>
    </Modal>
  );
};

export default Loading;
