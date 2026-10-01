"use client";

import React, { createContext, useContext, useState, type ReactNode } from "react";
import { getTransferEngine, TransferEngine, type EngineState } from "@/features/transfer/engine/TransferEngine";
import { useEngineStore, useEngineState } from "./engineStore";

export { useEngineStore, useEngineState };
export type { EngineState };

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
    return getTransferEngine();
  }
  return engine;
}
