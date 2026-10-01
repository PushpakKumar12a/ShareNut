import { BEST_BACKPRESSURE_LIMIT } from "@/features/settings/settingsStore";

export enum PacketType {
  CHUNK_DATA = 0x01,
  MANIFEST = 0x02,
  REQUEST_CHUNK = 0x03,
  HAVE_CHUNK = 0x04,
  TRANSFER_PAUSE = 0x05,
  TRANSFER_COMPLETE = 0x07,
  TRANSFER_CANCEL = 0x08,
  LAN_MANIFEST = 0x09,
  LAN_PROGRESS = 0x0a,
  PING = 0x0b,
  PONG = 0x0c,
  CHUNK_UNAVAILABLE = 0x0d,
}

const MAGIC_BYTE = 0x50;
const HEADER_SIZE = 16;

export interface DecodedPacket {
  type: PacketType;
  fileSeqId: number;
  chunkIndex: number;
  payloadLength: number;
  payload: ArrayBuffer;
  requestId: number;
}

export class BinaryFraming {
  public static encodeChunk(
    fileSeqId: number,
    chunkIndex: number,
    chunkData: ArrayBuffer,
    requestId: number = 0,
  ): ArrayBuffer {
    const totalLength = HEADER_SIZE + chunkData.byteLength;
    const packet = new Uint8Array(totalLength);
    const view = new DataView(packet.buffer);

    view.setUint8(0, MAGIC_BYTE);
    view.setUint8(1, PacketType.CHUNK_DATA);
    view.setUint16(2, fileSeqId);
    view.setUint32(4, chunkIndex);
    view.setUint32(8, chunkData.byteLength);
    view.setUint32(12, requestId >>> 0);

    packet.set(new Uint8Array(chunkData), HEADER_SIZE);
    return packet.buffer as ArrayBuffer;
  }

  public static encodeJson(
    type: PacketType,
    data: unknown,
    fileSeqId: number = 0,
  ): ArrayBuffer {
    const encoder = new TextEncoder();
    const jsonBytes = encoder.encode(JSON.stringify(data));
    const totalLength = HEADER_SIZE + jsonBytes.byteLength;
    const packet = new Uint8Array(totalLength);
    const view = new DataView(packet.buffer);

    view.setUint8(0, MAGIC_BYTE);
    view.setUint8(1, type);
    view.setUint16(2, fileSeqId);
    view.setUint32(4, 0);
    view.setUint32(8, jsonBytes.byteLength);
    view.setUint32(12, Math.floor(Date.now() / 1000));

    packet.set(jsonBytes, HEADER_SIZE);
    return packet.buffer as ArrayBuffer;
  }

  public static encodeRequestChunk(
    fileSeqId: number,
    chunkIndex: number,
    requestId: number = 0,
  ): ArrayBuffer {
    const packet = new Uint8Array(HEADER_SIZE);
    const view = new DataView(packet.buffer);

    view.setUint8(0, MAGIC_BYTE);
    view.setUint8(1, PacketType.REQUEST_CHUNK);
    view.setUint16(2, fileSeqId);
    view.setUint32(4, chunkIndex);
    view.setUint32(8, 0);
    view.setUint32(12, requestId >>> 0);

    return packet.buffer as ArrayBuffer;
  }

  public static encodeChunkUnavailable(
    fileSeqId: number,
    chunkIndex: number,
    requestId: number = 0,
  ): ArrayBuffer {
    const packet = new Uint8Array(HEADER_SIZE);
    const view = new DataView(packet.buffer);

    view.setUint8(0, MAGIC_BYTE);
    view.setUint8(1, PacketType.CHUNK_UNAVAILABLE);
    view.setUint16(2, fileSeqId);
    view.setUint32(4, chunkIndex);
    view.setUint32(8, 0);
    view.setUint32(12, requestId >>> 0);

    return packet.buffer as ArrayBuffer;
  }

  public static encodeHaveChunk(
    fileSeqId: number,
    chunkIndex: number,
  ): ArrayBuffer {
    const packet = new Uint8Array(HEADER_SIZE);
    const view = new DataView(packet.buffer);

    view.setUint8(0, MAGIC_BYTE);
    view.setUint8(1, PacketType.HAVE_CHUNK);
    view.setUint16(2, fileSeqId);
    view.setUint32(4, chunkIndex);
    view.setUint32(8, 0);
    view.setUint32(12, 0);

    return packet.buffer as ArrayBuffer;
  }

  public static encodePing(
    timestamp: number = Math.round(performance.now()),
  ): ArrayBuffer {
    const packet = new Uint8Array(HEADER_SIZE);
    const view = new DataView(packet.buffer);
    view.setUint8(0, MAGIC_BYTE);
    view.setUint8(1, PacketType.PING);
    view.setUint16(2, 0);
    view.setUint32(4, timestamp >>> 0);
    view.setUint32(8, 0);
    view.setUint32(12, 0);
    return packet.buffer as ArrayBuffer;
  }

  public static encodePong(timestamp: number): ArrayBuffer {
    const packet = new Uint8Array(HEADER_SIZE);
    const view = new DataView(packet.buffer);
    view.setUint8(0, MAGIC_BYTE);
    view.setUint8(1, PacketType.PONG);
    view.setUint16(2, 0);
    view.setUint32(4, timestamp >>> 0);
    view.setUint32(8, 0);
    view.setUint32(12, 0);
    return packet.buffer as ArrayBuffer;
  }

  public static decode(buffer: ArrayBuffer): DecodedPacket | null {
    if (buffer.byteLength < HEADER_SIZE) {
      console.warn(
        "[BinaryFraming] Packet smaller than header size:",
        buffer.byteLength,
      );
      return null;
    }

    const view = new DataView(buffer);
    const magic = view.getUint8(0);
    if (magic !== MAGIC_BYTE) {
      console.warn("[BinaryFraming] Invalid magic byte:", magic);
      return null;
    }

    const type = view.getUint8(1) as PacketType;
    const fileSeqId = view.getUint16(2);
    const chunkIndex = view.getUint32(4);
    const payloadLength = view.getUint32(8);
    const requestId = view.getUint32(12);

    const payload = buffer.slice(HEADER_SIZE, HEADER_SIZE + payloadLength);

    return {
      type,
      fileSeqId,
      chunkIndex,
      payloadLength,
      payload,
      requestId,
    };
  }
}

export class DataChannelBackpressure {
  private channel: RTCDataChannel;
  private highWaterMark: number;
  private lowWaterMark: number;

  constructor(
    channel: RTCDataChannel,
    highWaterMark: number = BEST_BACKPRESSURE_LIMIT,
    lowWaterMark: number = Math.floor(BEST_BACKPRESSURE_LIMIT / 4),
  ) {
    this.channel = channel;
    this.highWaterMark = highWaterMark;
    this.lowWaterMark = lowWaterMark;
    this.channel.bufferedAmountLowThreshold = this.lowWaterMark;
  }

  public async sendWithBackpressure(data: ArrayBuffer): Promise<boolean> {
    if (this.channel.readyState !== "open") {
      return false;
    }

    if (this.channel.bufferedAmount >= this.highWaterMark) {
      await this.waitForBufferLow();
    }

    try {
      this.channel.send(data);
      return true;
    } catch (err) {
      console.error("[Backpressure] Send error:", err);
      return false;
    }
  }

  private waitForBufferLow(): Promise<void> {
    if (
      this.channel.bufferedAmount <= this.lowWaterMark ||
      this.channel.readyState !== "open"
    ) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      let resolved = false;
      const cleanup = () => {
        if (!resolved) {
          resolved = true;
          this.channel.removeEventListener("bufferedamountlow", handleLow);
          clearInterval(pollTimer);
          resolve();
        }
      };

      const handleLow = () => cleanup();
      this.channel.addEventListener("bufferedamountlow", handleLow);

      const pollTimer = setInterval(() => {
        if (
          this.channel.bufferedAmount <= this.lowWaterMark ||
          this.channel.readyState !== "open"
        ) {
          cleanup();
        }
      }, 50);
    });
  }
}
