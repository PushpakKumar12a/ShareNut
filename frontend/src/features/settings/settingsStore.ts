"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  NetworkRouteDetector,
  type TransportRoute,
} from "@/features/transfer/engine/lan/NetworkRouteDetector";

export type TransportModeSetting = "auto" | "lan" | "webrtc";

export interface ShareNutSettings {
  stunServers: string[];
  chunkSize: number;
  concurrency: number;
  backpressureLimit: number;
  lanDirectMode?: boolean;
  transportMode: TransportModeSetting;
}

export const BEST_CHUNK_SIZE = 65504;
export const BEST_CONCURRENCY = 16;
export const BEST_BACKPRESSURE_LIMIT = 2097152;

export const DEFAULT_STUN_SERVERS = [
  "stun:stun.l.google.com:19302",
  "stun:stun1.l.google.com:19302",
  "stun:stun2.l.google.com:19302",
];

export const DEFAULT_SETTINGS: ShareNutSettings = {
  stunServers: DEFAULT_STUN_SERVERS,
  chunkSize: BEST_CHUNK_SIZE,
  concurrency: BEST_CONCURRENCY,
  backpressureLimit: BEST_BACKPRESSURE_LIMIT,
  transportMode: "auto",
};

export interface SettingsStoreState extends ShareNutSettings {
  setTransportMode: (mode: TransportModeSetting) => void;
  setConcurrency: (concurrency: number) => void;
  setChunkSize: (chunkSize: number) => void;
  setStunServers: (servers: string[]) => void;
  setLanDirectMode: (enabled: boolean) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStoreState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      setTransportMode: (mode) => set({ transportMode: mode }),
      setConcurrency: (concurrency) => set({ concurrency }),
      setChunkSize: (chunkSize) => set({ chunkSize }),
      setStunServers: (servers) => set({ stunServers: servers }),
      setLanDirectMode: (enabled) => set({ lanDirectMode: enabled }),
      resetSettings: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: "ShareNut_settings",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            },
      ),
    },
  ),
);

export function loadSettings(): ShareNutSettings {
  return useSettingsStore.getState();
}

export function saveSettings(settings: Partial<ShareNutSettings>): ShareNutSettings {
  useSettingsStore.setState(settings);
  return useSettingsStore.getState();
}

export function getIceServers(): RTCIceServer[] {
  return useSettingsStore.getState().stunServers.map((url) => ({ urls: url }));
}

export function getConfiguredChunkSize(): number {
  return useSettingsStore.getState().chunkSize || BEST_CHUNK_SIZE;
}

export function getConfiguredConcurrency(): number {
  return useSettingsStore.getState().concurrency || BEST_CONCURRENCY;
}

export function getConfiguredBackpressureLimit(): number {
  return useSettingsStore.getState().backpressureLimit || BEST_BACKPRESSURE_LIMIT;
}

export function getTransportMode(): TransportModeSetting {
  return useSettingsStore.getState().transportMode;
}

export function getEffectiveTransportRoute(): TransportRoute {
  const mode = getTransportMode();
  if (mode === "lan" || mode === "webrtc") {
    return mode;
  }

  const cached = NetworkRouteDetector.getCachedDetection();
  if (cached) {
    return cached.recommended;
  }

  return "lan";
}

export async function detectEffectiveTransportRoute(): Promise<TransportRoute> {
  const mode = getTransportMode();
  if (mode === "lan" || mode === "webrtc") {
    return mode;
  }

  const detection = await NetworkRouteDetector.detect();
  return detection.recommended;
}

export function isLanDirectMode(): boolean {
  return getEffectiveTransportRoute() === "lan";
}
