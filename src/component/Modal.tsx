import React, { ReactNode, useEffect, useRef, useState } from "react";
import { Animated } from "react-native";
import { Modal as PaperModal, Portal } from "react-native-paper";
import { useModal } from "../context";

type Props = {
  children: ReactNode;
  contentContainerStyle?: any;
  id?: string;
};

const Modal: React.FC<Props> = ({ children, contentContainerStyle, id }) => {
  const modal = useModal();
  const activeModalId = modal?.activeModalId;
  const isVisible = activeModalId === id;

  const [renderModal, setRenderModal] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const childrenRef = useRef(children);

  if (isVisible) {
    childrenRef.current = children;
  }

  useEffect(() => {
    if (isVisible) {
      setRenderModal(true);
      anim.setValue(0);
      Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    } else {
      Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(({ finished }: { finished: boolean }) => {
        if (finished) setRenderModal(false);
      });
    }
  }, [isVisible, anim]);

  if (!renderModal) return null;

  return (
    <Portal>
      <PaperModal visible={renderModal} contentContainerStyle={contentContainerStyle}>
        <Animated.View style={{ opacity: anim, transform: [{ scale: anim }] }}>
          {/* Gunakan referensi children yang dibekukan */}
          {childrenRef.current}
        </Animated.View>
      </PaperModal>
    </Portal>
  );
};

export default Modal;
