import type { SignalingMessage, SignalingType } from "@/types/protocol";

export type SignalingEventHandler = (msg: SignalingMessage) => void;

export interface SignalingClientConfig {
  sessionCode: string;
  peerId: string;
  deviceId: string;
  deviceName: string;
  username?: string;
  wsUrl?: string;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (err: Event) => void;
}

export class SignalingClient {
  private ws: WebSocket | null = null;
  private config: SignalingClientConfig;
  private eventHandlers: Map<SignalingType, Set<SignalingEventHandler>> = new Map();
  private isExplicitlyClosed = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 8;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private messageQueue: SignalingMessage[] = [];

  constructor(config: SignalingClientConfig) {
    this.config = config;
  }

  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isExplicitlyClosed = false;

    let baseUrl = this.config.wsUrl;
    if (
      !baseUrl &&
      typeof window !== "undefined" &&
      window.location.hostname &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      baseUrl = `${protocol}//${window.location.hostname}:8000`;
    } else if (!baseUrl) {
      baseUrl = process.env.NEXT_PUBLIC_WS_URL;
    }

    if (baseUrl) {
      baseUrl = baseUrl.replace(/\/ws\/?$/, "").replace(/\/+$/, "");
    } else {
      baseUrl = "ws://localhost:8000";
    }

    const params = new URLSearchParams({
      peer_id: this.config.peerId,
      device_id: this.config.deviceId || "dev-local-node",
      device_name: this.config.deviceName || "Web Peer",
      username: this.config.username || this.config.deviceName || "Web Peer",
    });

    const fullUrl = `${baseUrl}/ws/transfers/${this.config.sessionCode.toUpperCase()}?${params.toString()}`;
    console.log("[SignalingClient] Connecting to:", fullUrl);

    try {
      this.ws = new WebSocket(fullUrl);

      this.ws.onopen = () => {
        console.log("[SignalingClient] WebSocket OPEN to session:", this.config.sessionCode);
        this.reconnectAttempts = 0;
        this.config.onOpen?.();

        while (this.messageQueue.length > 0) {
          const queued = this.messageQueue.shift();
          if (queued && this.ws && this.ws.readyState === WebSocket.OPEN) {
            try {
              this.ws.send(JSON.stringify(queued));
            } catch (e) {
              console.error("[SignalingClient] Error sending queued message:", e);
            }
          }
        }

        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.send({
              type: "PING",
              session_code: this.config.sessionCode,
              sender_peer_id: this.config.peerId,
            });
          }
        }, 15000);
      };

      this.ws.onmessage = (event: MessageEvent) => {
        this.handleMessage(event.data);
      };

      this.ws.onclose = (event: CloseEvent) => {
        console.log("[SignalingClient] WebSocket CLOSED code:", event.code, "reason:", event.reason);
        if (this.pingInterval) {
          clearInterval(this.pingInterval);
          this.pingInterval = null;
        }
        this.config.onClose?.();
        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (err) => {
        console.warn("[SignalingClient] WebSocket connection notice:", err);
        this.config.onError?.(err);
      };
    } catch (e) {
      console.warn("[SignalingClient] Connection error:", e);
      this.scheduleReconnect();
    }
  }

  public disconnect(): void {
    this.isExplicitlyClosed = true;
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public send<T = Record<string, unknown>>(message: SignalingMessage<T>): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
        this.messageQueue.push(message as SignalingMessage);
        return true;
      }
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (e) {
      console.error("[SignalingClient] Failed to send message:", e);
      return false;
    }
  }

  public on(type: SignalingType, handler: SignalingEventHandler): () => void {
    if (!this.eventHandlers.has(type)) {
      this.eventHandlers.set(type, new Set());
    }
    this.eventHandlers.get(type)!.add(handler);

    return () => {
      this.eventHandlers.get(type)?.delete(handler);
    };
  }

  private handleMessage(rawData: string): void {
    try {
      const message = JSON.parse(rawData) as SignalingMessage;
      const handlers = this.eventHandlers.get(message.type);
      if (handlers) {
        handlers.forEach((fn) => {
          try {
            fn(message);
          } catch (err) {
            console.error(`[SignalingClient] Handler error for ${message.type}:`, err);
          }
        });
      }
    } catch (e) {
      console.error("[SignalingClient] Failed to parse message:", rawData, e);
    }
  }

  private scheduleReconnect(): void {
    if (this.isExplicitlyClosed) return;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {

      this.reconnectTimer = setTimeout(() => {
        if (!this.isExplicitlyClosed) {
          this.connect();
        }
      }, 5000);
      return;
    }

    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 4000);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      if (!this.isExplicitlyClosed) {
        this.connect();
      }
    }, delay);
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
