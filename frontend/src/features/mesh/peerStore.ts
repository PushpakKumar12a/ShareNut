"use client";

import { create } from "zustand";
import type { Device, User } from "@/types/api";
import { detectDeviceName } from "./PeerManager";

export interface PeerState {
  user: User | null;
  device: Device | null;
  isLoading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  updateUsername: (username: string) => void;
  regeneratePeerId: () => { user: User; device: Device };
  logout: () => Promise<void>;
  clearError: () => void;
}

const PEER_PROFILE_KEY = "ShareNut_peer_profile";

function generateFreshProfile(): { user: User; device: Device } {
  const deviceName = detectDeviceName();
  const randomSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  const randomFp = "fp-" + Math.random().toString(36).slice(2, 10);

  const profile = {
    user: {
      id: "00000000-0000-0000-0000-000000000001",
      email: `peer_${randomSuffix.toLowerCase()}@ShareNut.local`,
      username: `Peer #${randomSuffix}`,
      is_active: true,
      created_at: new Date().toISOString(),
    },
    device: {
      id: "dev-" + randomFp,
      device_name: deviceName,
      fingerprint: randomFp,
      is_online: true,
      last_seen_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
  };

  try {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(PEER_PROFILE_KEY, JSON.stringify(profile));
    }
  } catch {}

  return profile;
}

function getStoredProfile(): { user: User; device: Device } {
  if (typeof window === "undefined") {
    return {
      user: {
        id: "00000000-0000-0000-0000-000000000001",
        email: "peer@ShareNut.local",
        username: "Peer #LOCAL",
        is_active: true,
        created_at: new Date().toISOString(),
      },
      device: {
        id: "dev-local-node",
        device_name: "Web Browser Node",
        fingerprint: "browser-fp-local",
        is_online: true,
        last_seen_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    };
  }
  try {
    const raw = sessionStorage.getItem(PEER_PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const u = parsed?.user?.username || "";
      if (u.includes("#")) {
        const code = u.split("#")[1]?.trim();
        if (
          code &&
          code.length === 4 &&
          code.toUpperCase() !== "PEER" &&
          /^[A-Za-z0-9]{4}$/.test(code) &&
          parsed?.device?.id
        ) {
          return parsed;
        }
      } else if (parsed?.user?.username && parsed?.device?.id) {
        return parsed;
      }
    }
  } catch {}
  return generateFreshProfile();
}

export const usePeerStore = create<PeerState>((set) => ({
  user: getStoredProfile().user,
  device: getStoredProfile().device,
  isLoading: false,
  error: null,

  initialize: async () => {
    const { user, device } = getStoredProfile();
    set({
      user,
      device,
      isLoading: false,
      error: null,
    });
  },

  updateUsername: (username: string) => {
    const current = getStoredProfile();
    const updated = {
      ...current,
      user: {
        ...current.user,
        username: username || current.user.username,
      },
    };
    try {
      sessionStorage.setItem(PEER_PROFILE_KEY, JSON.stringify(updated));
    } catch {}
    set({ user: updated.user, device: updated.device });
  },

  regeneratePeerId: () => {
    const newProfile = generateFreshProfile();
    set({ user: newProfile.user, device: newProfile.device });
    return newProfile;
  },

  logout: async () => {
    const newProfile = generateFreshProfile();
    set({ user: newProfile.user, device: newProfile.device });
  },

  clearError: () => set({ error: null }),
}));

export const useAuthStore = usePeerStore;
export type AuthState = PeerState;
