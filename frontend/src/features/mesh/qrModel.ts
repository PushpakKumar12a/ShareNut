"use client";

import { create } from "zustand";

interface QrModel {
  showQr: boolean;
  revealQr: () => void;
}

export const useQrModel = create<QrModel>((set) => ({
  showQr: false,
  revealQr: () => set({ showQr: true }),
}));
