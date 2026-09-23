import axios from "axios";
import { getIceServers } from "@/features/settings/settingsStore";

export type TransportRoute = "lan" | "webrtc" | "none";

export interface RouteHealthResult {
  route: TransportRoute;
  reachable: boolean;
  latencyMs: number;
  error?: string;
  checkedAt: number;
}

export interface DetectedRoute {
  recommended: TransportRoute;
  lan: RouteHealthResult;
  webrtc: RouteHealthResult;
}

const CACHE_TTL_MS = 30_000;
const PROBE_TIMEOUT_MS = 3_000;

let cachedDetection: DetectedRoute | null = null;
let cacheTimestamp = 0;
let probeInFlight: Promise<DetectedRoute> | null = null;

async function probeLan(): Promise<RouteHealthResult> {
  const start = performance.now();
  try {
    let url = "/api/v1/network/info";
    if (
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1")
    ) {
      url = "http://127.0.0.1:8000/api/v1/network/info";
    } else if (typeof window !== "undefined") {
      url = `${window.location.protocol}//${window.location.hostname}:8000/api/v1/network/info`;
    }
    let data: { lan_ip?: string } | undefined;
    try {
      const res = await axios.get<{ lan_ip?: string }>(url, {
        timeout: PROBE_TIMEOUT_MS,
        headers: { "Cache-Control": "no-cache" },
      });
      data = res.data;
    } catch (directErr) {
      if (url !== "/api/v1/network/info") {
        const res = await axios.get<{ lan_ip?: string }>(
          "/api/v1/network/info",
          {
            timeout: PROBE_TIMEOUT_MS,
            headers: { "Cache-Control": "no-cache" },
          },
        );
        data = res.data;
      } else {
        throw directErr;
      }
    }
    const latency = Math.round(performance.now() - start);
    const lanIp = data?.lan_ip;
    const hasRealLanIp = lanIp && lanIp !== "127.0.0.1" && lanIp !== "::1";
    return {
      route: "lan",
      reachable: true,
      latencyMs: latency,
      checkedAt: Date.now(),
      ...(hasRealLanIp
        ? {}
        : { error: "LAN IP is loopback — transfers limited to same machine" }),
    };
  } catch (err: unknown) {
    return {
      route: "lan",
      reachable: false,
      latencyMs: Math.round(performance.now() - start),
      error: `LAN backend unreachable: ${String(err)}`,
      checkedAt: Date.now(),
    };
  }
}

async function probeWebRTC(): Promise<RouteHealthResult> {
  const start = performance.now();

  if (typeof RTCPeerConnection === "undefined") {
    return {
      route: "webrtc",
      reachable: false,
      latencyMs: 0,
      error: "RTCPeerConnection not available in this environment",
      checkedAt: Date.now(),
    };
  }

  try {
    const iceServers = getIceServers();
    const pc = new RTCPeerConnection({
      iceServers:
        iceServers.length > 0
          ? iceServers
          : [{ urls: "stun:stun.l.google.com:19302" }],
    });

    const result = await new Promise<RouteHealthResult>((resolve) => {
      let resolved = false;

      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          pc.close();
          resolve({
            route: "webrtc",
            reachable: false,
            latencyMs: Math.round(performance.now() - start),
            error: "STUN server unreachable (timeout)",
            checkedAt: Date.now(),
          });
        }
      }, PROBE_TIMEOUT_MS);

      pc.onicecandidate = (evt) => {
        if (resolved) return;
        if (evt.candidate) {
          resolved = true;
          clearTimeout(timer);
          pc.close();
          resolve({
            route: "webrtc",
            reachable: true,
            latencyMs: Math.round(performance.now() - start),
            checkedAt: Date.now(),
          });
        }
      };

      pc.onicegatheringstatechange = () => {
        if (resolved) return;
        if (pc.iceGatheringState === "complete") {
          resolved = true;
          clearTimeout(timer);
          pc.close();

          resolve({
            route: "webrtc",
            reachable: false,
            latencyMs: Math.round(performance.now() - start),
            error: "ICE gathering completed with no candidates",
            checkedAt: Date.now(),
          });
        }
      };

      pc.createDataChannel("probe");
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .catch((err) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timer);
            pc.close();
            resolve({
              route: "webrtc",
              reachable: false,
              latencyMs: Math.round(performance.now() - start),
              error: `WebRTC offer failed: ${String(err)}`,
              checkedAt: Date.now(),
            });
          }
        });
    });

    return result;
  } catch (err: unknown) {
    return {
      route: "webrtc",
      reachable: false,
      latencyMs: Math.round(performance.now() - start),
      error: `WebRTC probe error: ${String(err)}`,
      checkedAt: Date.now(),
    };
  }
}

export class NetworkRouteDetector {
  static async detect(forceRefresh = false): Promise<DetectedRoute> {
    if (
      !forceRefresh &&
      cachedDetection &&
      Date.now() - cacheTimestamp < CACHE_TTL_MS
    ) {
      return cachedDetection;
    }

    if (probeInFlight) {
      return probeInFlight;
    }

    probeInFlight = this.runDetection();
    try {
      const result = await probeInFlight;
      return result;
    } finally {
      probeInFlight = null;
    }
  }

  private static async runDetection(): Promise<DetectedRoute> {
    console.log(
      "[NetworkRouteDetector] Probing LAN and WebRTC connectivity...",
    );

    const [lanResult, webrtcResult] = await Promise.all([
      probeLan(),
      probeWebRTC(),
    ]);

    let recommended: TransportRoute = "none";
    if (lanResult.reachable && webrtcResult.reachable) {
      recommended = "lan";
    } else if (lanResult.reachable) {
      recommended = "lan";
    } else if (webrtcResult.reachable) {
      recommended = "webrtc";
    }

    const detection: DetectedRoute = {
      recommended,
      lan: lanResult,
      webrtc: webrtcResult,
    };

    cachedDetection = detection;
    cacheTimestamp = Date.now();

    console.log(
      `[NetworkRouteDetector] Detection complete → recommended: ${recommended}`,
      `| LAN: ${lanResult.reachable ? `✓ (${lanResult.latencyMs}ms)` : `✗ (${lanResult.error})`}`,
      `| WebRTC: ${webrtcResult.reachable ? `✓ (${webrtcResult.latencyMs}ms)` : `✗ (${webrtcResult.error})`}`,
    );

    return detection;
  }

  static async probeHealth(
    route: "lan" | "webrtc",
  ): Promise<RouteHealthResult> {
    if (route === "lan") {
      return probeLan();
    }
    return probeWebRTC();
  }

  static invalidateCache(): void {
    cachedDetection = null;
    cacheTimestamp = 0;
  }

  static getCachedDetection(): DetectedRoute | null {
    if (cachedDetection && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
      return cachedDetection;
    }
    return null;
  }
}
