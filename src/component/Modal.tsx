import React, { ReactNode, useEffect, useRef, useState } from "react";
import { Animated } from "react-native";
import { Modal as PaperModal, Portal } from "react-native-paper";
import { useModal } from "../utils";

type Props = {
  children: ReactNode;
  dummy?: boolean;
  contentContainerStyle?: any;
  id?: string;
};

const Modal: React.FC<Props> = ({ children, contentContainerStyle, id }) => {
  const modal = useModal();
  const activeModalId = modal?.activeModalId;
  const isVisible = activeModalId === id;

  const [renderModal, setRenderModal] = useState(false);

  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      setRenderModal(true);
      anim.setValue(0);
      Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    } else {
      Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }).start(({ finished }: { finished: boolean }) => {
        if (finished) setRenderModal(false);
      });
    }
  }, [isVisible, anim]);

  if (!renderModal) return null;

  return (
    <Portal>
      <PaperModal visible={renderModal} contentContainerStyle={contentContainerStyle}>
        <Animated.View style={{ opacity: anim, transform: [{ scale: anim }] }}>{children}</Animated.View>
      </PaperModal>
    </Portal>
  );
};

export default Modal;
