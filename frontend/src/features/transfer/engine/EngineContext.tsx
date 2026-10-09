"use client";

import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getTransferEngine, TransferEngine, type EngineState } from "@/features/transfer/engine/TransferEngine";
import { useEngineStore, useEngineState } from "./engineStore";
import { usePeerStore } from "@/features/mesh/peerStore";

export { useEngineStore, useEngineState };
export type { EngineState };

const EngineContext = createContext<TransferEngine | null>(null);
const SESSION_CODE_KEY = "ShareNut_active_session_code";

function getInitialSessionCode(engine: TransferEngine): string {
  if (typeof window === "undefined") {
    return "";
  }

  const navigationEntry = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;
  const isRefresh = navigationEntry?.type === "reload";
  const queryCode = new URLSearchParams(window.location.search)
    .get("session")
    ?.trim()
    .toUpperCase();
  const storedCode = sessionStorage.getItem(SESSION_CODE_KEY)?.trim().toUpperCase();
  const code =
    (!isRefresh && queryCode) ||
    (!isRefresh && engine.getState().sessionCode) ||
    (!isRefresh && storedCode) ||
    `NUT-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

  sessionStorage.setItem(SESSION_CODE_KEY, code);
  if (isRefresh) {
    const url = new URL(window.location.href);
    url.searchParams.set("session", code);
    window.history.replaceState(null, "", url.toString());
  }
  return code;
}

export function EngineProvider({ children }: { children: ReactNode }) {
  const [engine] = useState<TransferEngine>(() => getTransferEngine());
  const { user, device, initialize } = usePeerStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!user || !device || engine.getState().sessionCode) {
      return;
    }

    const sessionCode = getInitialSessionCode(engine);
    if (!sessionCode) {
      return;
    }

    engine
      .joinSession(sessionCode, device.device_name, user.username)
      .catch((error) => {
        console.error("[EngineProvider] Failed to initialize session:", error);
      });
  }, [device, engine, user]);

  return (
    <EngineContext.Provider value={engine}>
      {children}
    </EngineContext.Provider>
  );
}

export function useTransferEngine(): TransferEngine {
  const engine = useContext(EngineContext);
  if (!engine) {
    return getTransferEngine();
  }
  return engine;
}
