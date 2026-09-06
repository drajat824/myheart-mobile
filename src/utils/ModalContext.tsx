import React, { createContext, useContext, useState, type ReactNode } from "react";

type ModalContextType = {
  activeModalId: string | null;
  openModal: (id: string, isRoot?: boolean) => void;
  closeModal: () => void;
};

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeModalId, setActiveModalId] = useState<string | null>(null); //superRoot = highest ROOT
  const [isCurrentRoot, setIsCurrentRoot] = useState<boolean | null>(null);

  const openModal = (id: string, isRoot: boolean = false) => {
    if (activeModalId === "superRoot") {
      return;
    }

    if (isCurrentRoot && !isRoot && id !== "superRoot") {
      return;
    }

    if (activeModalId === id) return;

    if (activeModalId) {
      setActiveModalId(null);
      setTimeout(() => {
        setActiveModalId(id);
        setIsCurrentRoot(isRoot);
      }, 350);
      return;
    }

    setActiveModalId(id);
    setIsCurrentRoot(isRoot);
  };

  const closeModal = () => {
    setActiveModalId(null);
    setIsCurrentRoot(false);
  };

  return <ModalContext.Provider value={{ activeModalId, openModal, closeModal }}>{children}</ModalContext.Provider>;
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};
