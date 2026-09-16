import type { FileManifest } from "@/types/protocol";

export interface PartialTransferRecord {
  fileId: string;
  fileSeqId: number;
  sessionCode: string;
  manifest: FileManifest;
  senderPeerId?: string;
  senderUsername?: string;
  verifiedChunkIndices: number[];
  verifiedCount: number;
  totalCount: number;
  status: "paused" | "waiting";
  lastUpdated: number;
}

const STORAGE_KEY = "ShareNut_partial_transfers";

export class ResumeRegistry {
  private static readStorage(): Record<string, PartialTransferRecord> {
    if (typeof window === "undefined" || !window.localStorage) {
      return {};
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null) {
        return parsed as Record<string, PartialTransferRecord>;
      }
      return {};
    } catch (error) {
      console.warn("[ResumeRegistry] Failed to read storage:", error);
      return {};
    }
  }

  private static writeStorage(data: Record<string, PartialTransferRecord>): void {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn("[ResumeRegistry] Failed to write storage:", error);
    }
  }

  public static savePartialTransfer(record: PartialTransferRecord): void {
    const data = ResumeRegistry.readStorage();
    data[record.fileId] = {
      ...record,
      lastUpdated: Date.now(),
    };
    ResumeRegistry.writeStorage(data);
  }

  public static getPartialTransfersForSession(
    sessionCode: string,
  ): PartialTransferRecord[] {
    const data = ResumeRegistry.readStorage();
    const cleanCode = (sessionCode || "").trim().toUpperCase();
    const results: PartialTransferRecord[] = [];

    for (const record of Object.values(data)) {
      if (record.sessionCode?.trim().toUpperCase() === cleanCode) {
        results.push(record);
      }
    }
    return results;
  }

  public static getPartialTransfer(fileId: string): PartialTransferRecord | null {
    const data = ResumeRegistry.readStorage();
    return data[fileId] || null;
  }

  public static updateVerifiedChunks(
    fileId: string,
    verifiedIndices: number[],
  ): void {
    const data = ResumeRegistry.readStorage();
    const record = data[fileId];
    if (record) {
      record.verifiedChunkIndices = verifiedIndices;
      record.verifiedCount = verifiedIndices.length;
      record.lastUpdated = Date.now();
      ResumeRegistry.writeStorage(data);
    }
  }

  public static removePartialTransfer(fileId: string): void {
    const data = ResumeRegistry.readStorage();
    if (data[fileId]) {
      delete data[fileId];
      ResumeRegistry.writeStorage(data);
      console.log(`[ResumeRegistry] Removed partial transfer record for ${fileId}`);
    }
  }
}
