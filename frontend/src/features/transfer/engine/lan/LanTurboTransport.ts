import axios from "axios";

export interface ShareNutDeviceInfo {
  alias: string;
  version: string;
  deviceModel: string;
  deviceType: string;
}

export interface ShareNutFileDto {
  id: string;
  fileName: string;
  size: number;
  fileType: string;
  sha256?: string;
}

export interface PrepareUploadResult {
  sessionId: string;
  files: Record<string, string>;
}

export interface LanProgressCallback {
  (
    progress: number,
    speedBps: number,
    bytesTransferred: number,
    totalBytes: number,
  ): void;
}

export class LanTurboTransport {
  private static cachedLanHost: string | null = null;

  public static async getLanBaseUrl(): Promise<string> {
    if (this.cachedLanHost) {
      return this.cachedLanHost;
    }

    if (typeof window === "undefined") {
      return "http://127.0.0.1:8000";
    }

    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (isLocal) {
      this.cachedLanHost = "http://127.0.0.1:8000";
      return this.cachedLanHost;
    }

    this.cachedLanHost = `${window.location.protocol}//${window.location.hostname}:8000`;
    return this.cachedLanHost;
  }

  public static async prepareUpload(
    files: File[] | ShareNutFileDto[],
    deviceAlias: string = "Local Device",
    room?: string,
    senderPeerId?: string,
  ): Promise<PrepareUploadResult> {
    const baseUrl = await this.getLanBaseUrl();
    const url = `${baseUrl}/api/v1/lan-transfer/prepare-upload`;

    const filesDto: Record<string, ShareNutFileDto> = {};
    files.forEach((f, idx) => {
      const fid = (f as ShareNutFileDto).id || `file-${idx}-${Date.now()}`;
      filesDto[fid] = {
        id: fid,
        fileName:
          (f as ShareNutFileDto).fileName ||
          (f as File).name ||
          "downloaded_file",
        size: f.size,
        fileType:
          (f as ShareNutFileDto).fileType ||
          (f as File).type ||
          "application/octet-stream",
      };
    });

    const response = await axios.post<PrepareUploadResult>(url, {
      info: {
        alias: deviceAlias,
        version: "2.0",
        deviceModel:
          typeof navigator !== "undefined" &&
          navigator.userAgent.includes("Mobile")
            ? "Mobile Device"
            : "PC / Mac",
        deviceType:
          typeof navigator !== "undefined" &&
          navigator.userAgent.includes("Mobile")
            ? "mobile"
            : "desktop",
      },
      files: filesDto,
      room: room || null,
      sender_peer_id: senderPeerId || null,
    });
    return response.data;
  }

  public static async getRoomFiles(roomCode: string): Promise<
    Array<{
      sessionId: string;
      fileId: string;
      token: string;
      fileName: string;
      size: number;
      fileType: string;
      completed: boolean;
      senderPeerId?: string;
    }>
  > {
    const baseUrl = await this.getLanBaseUrl();
    const code = roomCode.trim().toUpperCase();
    const url = `${baseUrl}/api/v1/lan-transfer/room/${encodeURIComponent(code)}/files`;

    try {
      const res = await axios.get(url);
      if (res.status >= 200 && res.status < 300) {
        return res.data;
      }
    } catch (err) {
      console.warn("[LanTurboTransport] Error getting room files:", err);
    }
    return [];
  }

  public static async uploadFile(
    sessionId: string,
    fileId: string,
    token: string,
    file:
      | File
      | Blob
      | { size: number; name: string; toBlob?: () => Promise<Blob> },
    onProgress?: LanProgressCallback,
    signal?: AbortSignal,
  ): Promise<void> {
    const baseUrl = await this.getLanBaseUrl();
    const url = `${baseUrl}/api/v1/lan-transfer/upload?sessionId=${encodeURIComponent(sessionId)}&fileId=${encodeURIComponent(fileId)}&token=${encodeURIComponent(token)}`;

    let bodyToSend: BodyInit;
    if ("toBlob" in file && typeof file.toBlob === "function") {
      bodyToSend = await file.toBlob();
    } else {
      bodyToSend = file as Blob;
    }

    const total = file.size;
    let smoothedSpeed = 0;
    let prevDlBytes = 0;
    let prevPollTime = performance.now();
    let uploadDone = false;

    // Poll the backend /progress endpoint to get actual download-side bytes
    // instead of measuring localhost upload speed (which is inflated).
    const pollInterval = setInterval(async () => {
      if (signal?.aborted) {
        clearInterval(pollInterval);
        return;
      }
      try {
        const progressData = await this.getSessionProgress(sessionId);
        if (!progressData) return;
        const fileProgress = progressData.downloaders?.[fileId];
        if (!fileProgress) return;

        const dlBytes = fileProgress.bytesDownloaded || 0;
        const now = performance.now();
        const dtMs = now - prevPollTime;

        if (dtMs >= 200) {
          const bytesDiff = dlBytes - prevDlBytes;
          const instantSpeed = bytesDiff > 0 ? (bytesDiff / dtMs) * 1000 : 0;
          if (smoothedSpeed === 0) {
            smoothedSpeed = Math.round(instantSpeed);
          } else {
            smoothedSpeed = Math.round(
              smoothedSpeed * 0.3 + instantSpeed * 0.7,
            );
          }
          prevDlBytes = dlBytes;
          prevPollTime = now;
        }

        const progress =
          total > 0 ? Math.min(99, Math.floor((dlBytes / total) * 100)) : 99;
        onProgress?.(progress, smoothedSpeed, dlBytes, total);

        if (fileProgress.completed && uploadDone) {
          clearInterval(pollInterval);
          onProgress?.(100, 0, total, total);
        }
      } catch {
        // Polling failure is non-fatal; upload continues
      }
    }, 500);

    try {
      await axios.post(url, bodyToSend, {
        headers: { "Content-Type": "application/octet-stream" },
        signal,
      });
      uploadDone = true;

      // Give the poll a moment to catch the final state
      await new Promise<void>((resolve) => {
        const finalCheck = setInterval(async () => {
          try {
            const progressData = await this.getSessionProgress(sessionId);
            const fileProgress = progressData?.downloaders?.[fileId];
            if (fileProgress?.completed || signal?.aborted) {
              clearInterval(finalCheck);
              clearInterval(pollInterval);
              onProgress?.(100, 0, total, total);
              resolve();
            }
          } catch {
            clearInterval(finalCheck);
            clearInterval(pollInterval);
            onProgress?.(100, 0, total, total);
            resolve();
          }
        }, 500);

        // Timeout after 30s max wait for download completion
        setTimeout(() => {
          clearInterval(finalCheck);
          clearInterval(pollInterval);
          onProgress?.(100, 0, total, total);
          resolve();
        }, 30000);
      });
    } finally {
      clearInterval(pollInterval);
    }
  }

  private static initiatedDownloads = new Set<string>();

  public static async downloadFile(
    sessionId: string,
    fileId: string,
    fileName: string,
    peerIdOrProgress?: string | LanProgressCallback,
    onProgress?: LanProgressCallback,
  ): Promise<void> {
    if (this.initiatedDownloads.has(fileId)) {
      return;
    }
    this.initiatedDownloads.add(fileId);

    const progressCallback =
      typeof peerIdOrProgress === "function" ? peerIdOrProgress : onProgress;
    const peerId =
      typeof peerIdOrProgress === "string" ? peerIdOrProgress : undefined;

    return this.executeDownloadFile(
      sessionId,
      fileId,
      fileName,
      peerId,
      progressCallback,
    );
  }
  public static resetDownload(fileId: string): void {
    this.initiatedDownloads.delete(fileId);
  }

  private static async executeDownloadFile(
    sessionId: string,
    fileId: string,
    fileName: string,
    peerId?: string,
    onProgress?: LanProgressCallback,
  ): Promise<void> {
    const baseUrl = await this.getLanBaseUrl();
    const peerParam = peerId ? `&peerId=${encodeURIComponent(peerId)}` : "";
    const url = `${baseUrl}/api/v1/lan-transfer/download/${encodeURIComponent(fileId)}?sessionId=${encodeURIComponent(sessionId)}${peerParam}`;
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = decodeURIComponent(fileName);
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(() => {
      if (document.body.contains(anchor)) {
        document.body.removeChild(anchor);
      }
    }, 1000);
  }

  public static async getSessionProgress(sessionId: string): Promise<{
    sessionId: string;
    downloaders: Record<
      string,
      {
        fileId: string;
        bytesDownloaded: number;
        bytesUploaded: number;
        totalBytes: number;
        progress: number;
        completed: boolean;
      }
    >;
    allCompleted: boolean;
  } | null> {
    try {
      const baseUrl = await this.getLanBaseUrl();
      const url = `${baseUrl}/api/v1/lan-transfer/progress/${encodeURIComponent(sessionId)}`;
      const res = await axios.get(url);
      if (res.status >= 200 && res.status < 300) {
        return res.data;
      }
    } catch (err) {
      console.warn("[LanTurboTransport] Error getting session progress:", err);
    }
    return null;
  }

  public static async cancelSession(sessionId: string): Promise<void> {
    try {
      const baseUrl = await this.getLanBaseUrl();
      const url = `${baseUrl}/api/v1/lan-transfer/cancel?sessionId=${encodeURIComponent(sessionId)}`;
      await axios.post(url);
    } catch (err) {
      console.warn("[LanTurboTransport] Cancel session failed:", err);
    }
  }
}
