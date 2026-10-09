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
  clearError: () => void;
}

const PEER_PROFILE_KEY = "ShareNut_peer_profile";

function generateFreshProfile(): { user: User; device: Device } {
  const randomSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();

  const profile = {
    user: {
      username: `Peer #${randomSuffix}`,
    },
    device: {
      device_name: detectDeviceName(),
      is_online: true,
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
    return generateFreshProfile();
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
          parsed?.device?.device_name
        ) {
          return parsed;
        }
      } else if (parsed?.user?.username && parsed?.device?.device_name) {
        return parsed;
      }
    }
  } catch {}
  return generateFreshProfile();
}

export const usePeerStore = create<PeerState>((set) => ({
  user: null,
  device: null,
  isLoading: true,
  error: null,

  initialize: async () => {
    const { user, device } = getStoredProfile();
    set({ user, device, isLoading: false, error: null });
  },

  updateUsername: (username: string) => {
    const raw = sessionStorage.getItem(PEER_PROFILE_KEY);
    if (!raw) return;
    try {
      const current = JSON.parse(raw);
      const updated = {
        ...current,
        user: { ...current.user, username: username || current.user.username },
      };
      sessionStorage.setItem(PEER_PROFILE_KEY, JSON.stringify(updated));
      set({ user: updated.user, device: updated.device });
    } catch {}
  },

  clearError: () => set({ error: null }),
}));

export const useAuthStore = usePeerStore;
export type AuthState = PeerState;
