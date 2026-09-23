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

    let lastTime = performance.now();
    let lastBytes = 0;
    let speedBps = 0;
    try {
      const total = file.size;
      await axios.post(url, bodyToSend, {
        headers: { "Content-Type": "application/octet-stream" },
        signal,
        onUploadProgress: (evt) => {
          const current = evt.loaded;
          const now = performance.now();
          const dtMs = now - lastTime;
          if (dtMs >= 100) {
            const bytesDiff = current - lastBytes;
            const instantSpeed = (bytesDiff / dtMs) * 1000;
            if (speedBps === 0) {
              speedBps = Math.round(instantSpeed);
            } else {
              speedBps = Math.round(speedBps * 0.25 + instantSpeed * 0.75);
            }
            lastBytes = current;
            lastTime = now;
          }
          const progress =
            total > 0 ? Math.min(99, Math.floor((current / total) * 100)) : 99;
          onProgress?.(progress, speedBps, current, total);
        },
      });
      onProgress?.(100, 0, file.size, file.size);
    } finally {
    }
  }

  private static initiatedDownloads = new Set<string>();

  public static async downloadFile(
    sessionId: string,
    fileId: string,
    fileName: string,
    onProgress?: LanProgressCallback,
  ): Promise<void> {
    if (this.initiatedDownloads.has(fileId)) {
      return;
    }
    this.initiatedDownloads.add(fileId);

    return this.executeDownloadFile(sessionId, fileId, fileName, onProgress);
  }
  public static resetDownload(fileId: string): void {
    this.initiatedDownloads.delete(fileId);
  }

  private static async executeDownloadFile(
    sessionId: string,
    fileId: string,
    fileName: string,
    onProgress?: LanProgressCallback,
  ): Promise<void> {
    const baseUrl = await this.getLanBaseUrl();
    const url = `${baseUrl}/api/v1/lan-transfer/download/${encodeURIComponent(fileId)}?sessionId=${encodeURIComponent(sessionId)}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = decodeURIComponent(fileName);
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
    }, 1000);
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
