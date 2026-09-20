import React, { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type ModalContextType = {
  activeModalId: string | null;
  openModal: (id: string, isRoot?: boolean) => void;
  closeModal: (targetId?: string) => void;
};

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeModalId, setActiveModalId] = useState<string | null>(null);
  const [isCurrentRoot, setIsCurrentRoot] = useState<boolean | null>(null);

  const openModal = (id: string, isRoot: boolean = false) => {
    if (activeModalId === "superRoot") return;
    if (isCurrentRoot && !isRoot && id !== "superRoot") return;
    if (activeModalId === id) return;

    // Langsung set ID modal yang baru
    setActiveModalId(id);
    setIsCurrentRoot(isRoot);
  };

  const closeModal = useCallback((targetId?: string) => {
    setActiveModalId((currentId) => {
      // Jika targetId tidak sesuai dengan modal aktif, jangan ubah apapun
      if (targetId && currentId !== targetId) {
        return currentId;
      }
      // HANYA reset isCurrentRoot jika modal benar-benar ditutup
      setIsCurrentRoot(false);
      return null;
    });
  }, []);

  // Memoisasi objek value agar tidak berubah referensi di setiap render
  const value = useMemo(() => ({ activeModalId, openModal, closeModal }), [activeModalId, openModal, closeModal]);

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};
