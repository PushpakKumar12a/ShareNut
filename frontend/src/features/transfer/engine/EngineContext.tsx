"use client";

import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getTransferEngine, TransferEngine, type EngineState } from "@/features/transfer/engine/TransferEngine";

const EngineContext = createContext<TransferEngine | null>(null);

export function EngineProvider({ children }: { children: ReactNode }) {
  const [engine] = useState<TransferEngine>(() => getTransferEngine());

  return (
    <EngineContext.Provider value={engine}>
      {children}
    </EngineContext.Provider>
  );
}

export function useTransferEngine(): TransferEngine {
  const engine = useContext(EngineContext);
  if (!engine) {
    throw new Error("useTransferEngine must be used within an EngineProvider");
  }
  return engine;
}

export function useEngineState(): EngineState {
  const engine = useTransferEngine();
  const [state, setState] = useState<EngineState>(() => engine.getState());

  useEffect(() => {
    return engine.subscribe((newState) => {
      setState(newState);
    });
  }, [engine]);

  return state;
}
