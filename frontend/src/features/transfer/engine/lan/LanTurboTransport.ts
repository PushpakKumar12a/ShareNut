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
    let transferComplete = false;

    const pollInterval = this.startProgressPoller(
      sessionId,
      fileId,
      onProgress,
      () => {
        transferComplete = true;
      },
      signal,
    );

    try {
      await axios.post(url, bodyToSend, {
        headers: { "Content-Type": "application/octet-stream" },
        signal,
      });

      // Upload to backend done, but receiver download is still ongoing.
      // Wait for download to complete (poll will report progress).
      if (!transferComplete) {
        await new Promise<void>((resolve) => {
          const checker = setInterval(() => {
            if (transferComplete || signal?.aborted) {
              clearInterval(checker);
              resolve();
            }
          }, 250);
        });
      }
    } finally {
      transferComplete = true;
      clearInterval(pollInterval);
    }
  }

  private static startProgressPoller(
    sessionId: string,
    fileId: string,
    onProgress?: LanProgressCallback,
    onComplete?: () => void,
    signal?: AbortSignal,
  ): ReturnType<typeof setInterval> {
    let prevDlBytes = 0;
    let prevPollTime = performance.now();
    let downloadSpeed = 0;
    let failureCount = 0;

    const pollInterval = setInterval(async () => {
      if (signal?.aborted) {
        clearInterval(pollInterval);
        return;
      }
      try {
        const data = await this.getSessionProgress(sessionId);
        if (!data) {
          failureCount += 1;
          if (failureCount >= 20) {
            clearInterval(pollInterval);
            onComplete?.();
          }
          return;
        }
        failureCount = 0;

        const fp = data.downloaders?.[fileId];
        if (!fp) return;

        const dlBytes = fp.bytesDownloaded || 0;
        const total = fp.totalBytes || 0;
        const now = performance.now();
        const dtMs = now - prevPollTime;

        if (dtMs >= 200 && dlBytes > prevDlBytes) {
          const diff = dlBytes - prevDlBytes;
          const instant = (diff / dtMs) * 1000;
          downloadSpeed =
            downloadSpeed === 0
              ? Math.round(instant)
              : Math.round(downloadSpeed * 0.3 + instant * 0.7);
          prevDlBytes = dlBytes;
          prevPollTime = now;
        }

        if (fp.completed) {
          clearInterval(pollInterval);
          onComplete?.();
          onProgress?.(100, 0, total, total);
        } else {
          const progress =
            total > 0 ? Math.min(99, Math.floor((dlBytes / total) * 100)) : 0;
          onProgress?.(progress, downloadSpeed, dlBytes, total);
        }
      } catch {
        // Polling failure is non-fatal
      }
    }, 1000);

    return pollInterval;
  }

  private static initiatedDownloads = new Set<string>();
  private static activeDownloadPolls = new Map<
    string,
    ReturnType<typeof setInterval>
  >();

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
    const existingPoll = this.activeDownloadPolls.get(fileId);
    if (existingPoll) {
      clearInterval(existingPoll);
      this.activeDownloadPolls.delete(fileId);
    }
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

    if (onProgress) {
      const pollInterval = this.startProgressPoller(
        sessionId,
        fileId,
        onProgress,
        () => {
          this.activeDownloadPolls.delete(fileId);
        },
      );
      this.activeDownloadPolls.set(fileId, pollInterval);
    }
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
    for (const [fileId, poll] of this.activeDownloadPolls.entries()) {
      clearInterval(poll);
      this.activeDownloadPolls.delete(fileId);
    }
    try {
      const baseUrl = await this.getLanBaseUrl();
      const url = `${baseUrl}/api/v1/lan-transfer/cancel?sessionId=${encodeURIComponent(sessionId)}`;
      await axios.post(url);
    } catch (err) {
      console.warn("[LanTurboTransport] Cancel session failed:", err);
    }
  }
}
