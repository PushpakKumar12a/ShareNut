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

export function loadSettings(): ShareNutSettings {
  return DEFAULT_SETTINGS;
}

export function saveSettings(): ShareNutSettings {
  return DEFAULT_SETTINGS;
}

export function getIceServers(): RTCIceServer[] {
  return DEFAULT_SETTINGS.stunServers.map((url) => ({ urls: url }));
}

export function getConfiguredChunkSize(): number {
  return BEST_CHUNK_SIZE;
}

export function getConfiguredConcurrency(): number {
  return BEST_CONCURRENCY;
}

export function getConfiguredBackpressureLimit(): number {
  return BEST_BACKPRESSURE_LIMIT;
}

export function getTransportMode(): TransportModeSetting {
  return DEFAULT_SETTINGS.transportMode;
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
