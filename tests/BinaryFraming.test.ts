import { describe, expect, it } from "bun:test";
import {
  BinaryFraming,
  PacketType,
} from "../frontend/src/features/transfer/engine/web/BinaryFraming";

describe("BinaryFraming", () => {
  it("encodes and decodes CHUNK_DATA with requestId", () => {
    const rawPayload = new Uint8Array([10, 20, 30, 40, 50]).buffer as ArrayBuffer;
    const fileSeqId = 12;
    const chunkIndex = 42;
    const requestId = 98765;

    const encoded = BinaryFraming.encodeChunk(
      fileSeqId,
      chunkIndex,
      rawPayload,
      requestId,
    );
    const decoded = BinaryFraming.decode(encoded);

    expect(decoded).not.toBeNull();
    if (decoded) {
      expect(decoded.type).toBe(PacketType.CHUNK_DATA);
      expect(decoded.fileSeqId).toBe(fileSeqId);
      expect(decoded.chunkIndex).toBe(chunkIndex);
      expect(decoded.requestId).toBe(requestId);
      expect(decoded.payloadLength).toBe(rawPayload.byteLength);
      expect(new Uint8Array(decoded.payload)).toEqual(new Uint8Array(rawPayload));
    }
  });

  it("encodes and decodes REQUEST_CHUNK with requestId", () => {
    const fileSeqId = 7;
    const chunkIndex = 105;
    const requestId = 123456;

    const encoded = BinaryFraming.encodeRequestChunk(
      fileSeqId,
      chunkIndex,
      requestId,
    );
    const decoded = BinaryFraming.decode(encoded);

    expect(decoded).not.toBeNull();
    if (decoded) {
      expect(decoded.type).toBe(PacketType.REQUEST_CHUNK);
      expect(decoded.fileSeqId).toBe(fileSeqId);
      expect(decoded.chunkIndex).toBe(chunkIndex);
      expect(decoded.requestId).toBe(requestId);
      expect(decoded.payloadLength).toBe(0);
    }
  });

  it("encodes and decodes CHUNK_UNAVAILABLE (NACK) with requestId", () => {
    const fileSeqId = 3;
    const chunkIndex = 88;
    const requestId = 54321;

    const encoded = BinaryFraming.encodeChunkUnavailable(
      fileSeqId,
      chunkIndex,
      requestId,
    );
    const decoded = BinaryFraming.decode(encoded);

    expect(decoded).not.toBeNull();
    if (decoded) {
      expect(decoded.type).toBe(PacketType.CHUNK_UNAVAILABLE);
      expect(decoded.fileSeqId).toBe(fileSeqId);
      expect(decoded.chunkIndex).toBe(chunkIndex);
      expect(decoded.requestId).toBe(requestId);
      expect(decoded.payloadLength).toBe(0);
    }
  });

  it("handles malformed packets gracefully", () => {
    const shortBuffer = new Uint8Array([0x50, 0x01, 0x00]).buffer as ArrayBuffer;
    expect(BinaryFraming.decode(shortBuffer)).toBeNull();

    const invalidMagic = new Uint8Array(16);
    invalidMagic[0] = 0x99;
    expect(BinaryFraming.decode(invalidMagic.buffer as ArrayBuffer)).toBeNull();
  });
});
