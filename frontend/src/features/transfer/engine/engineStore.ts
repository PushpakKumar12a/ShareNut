"use client";

import { create } from "zustand";
import {
  getTransferEngine,
  TransferEngine,
  type EngineState,
} from "@/features/transfer/engine/TransferEngine";

export const useEngineStore = create<EngineState>((set) => {
  const engine = getTransferEngine();
  const initialState = engine.getState();

  if (typeof window !== "undefined") {
    engine.subscribe((nextState) => {
      set(nextState);
    });
  }

  return initialState;
});

export function useEngineState<T = EngineState>(
  selector?: (state: EngineState) => T,
): T {
  if (selector) {
    return useEngineStore(selector);
  }
  return useEngineStore() as unknown as T;
}

export function getEngineInstance(): TransferEngine {
  return getTransferEngine();
}
