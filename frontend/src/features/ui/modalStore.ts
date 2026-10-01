"use client";

import { create } from "zustand";

export interface ModalState {
  isShareOpen: boolean;
  isQrScannerOpen: boolean;
  activeSessionCode: string;
  openShare: (sessionCode?: string) => void;
  closeShare: () => void;
  openQrScanner: () => void;
  closeQrScanner: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isShareOpen: false,
  isQrScannerOpen: false,
  activeSessionCode: "",
  openShare: (sessionCode) =>
    set((state) => ({
      isShareOpen: true,
      activeSessionCode: sessionCode ?? state.activeSessionCode,
    })),
  closeShare: () => set({ isShareOpen: false }),
  openQrScanner: () => set({ isQrScannerOpen: true }),
  closeQrScanner: () => set({ isQrScannerOpen: false }),
}));
