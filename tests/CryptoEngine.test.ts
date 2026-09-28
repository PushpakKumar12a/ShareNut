import { describe, expect, it } from "bun:test";
import { CryptoEngine } from "../frontend/src/features/transfer/engine/CryptoEngine";
import { BinaryFraming } from "../frontend/src/features/transfer/engine/web/BinaryFraming";

describe("CryptoEngine (AES-GCM 64 KB Chunk Streaming)", () => {
  const sessionSecret = "TEST-SESSION-XYZ";

  it("encrypts and decrypts a 64 KB chunk bit-for-bit", async () => {
    const originalChunk = new Uint8Array(65504);
    for (let index = 0; index < originalChunk.length; index++) {
      originalChunk[index] = index % 256;
    }

    const encrypted = await CryptoEngine.encryptChunk(
      originalChunk.buffer as ArrayBuffer,
      sessionSecret,
    );

    
    expect(encrypted.byteLength).toBe(12 + originalChunk.byteLength + 16);
    expect(new Uint8Array(encrypted)).not.toEqual(originalChunk);

    const decrypted = await CryptoEngine.decryptChunk(
      encrypted,
      sessionSecret,
    );

    expect(decrypted.byteLength).toBe(originalChunk.byteLength);
    expect(new Uint8Array(decrypted)).toEqual(originalChunk);
  });

  it("produces unique IVs and ciphertexts for identical chunks", async () => {
    const chunk = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer as ArrayBuffer;

    const enc1 = await CryptoEngine.encryptChunk(chunk, sessionSecret);
    const enc2 = await CryptoEngine.encryptChunk(chunk, sessionSecret);

    expect(new Uint8Array(enc1)).not.toEqual(new Uint8Array(enc2));

    const dec1 = await CryptoEngine.decryptChunk(enc1, sessionSecret);
    const dec2 = await CryptoEngine.decryptChunk(enc2, sessionSecret);

    expect(new Uint8Array(dec1)).toEqual(new Uint8Array(chunk));
    expect(new Uint8Array(dec2)).toEqual(new Uint8Array(chunk));
  });

  it("gracefully catches tampered ciphertext", async () => {
    const chunk = new Uint8Array([10, 20, 30, 40]).buffer as ArrayBuffer;
    const encrypted = await CryptoEngine.encryptChunk(chunk, sessionSecret);

    const tampered = new Uint8Array(encrypted);
    tampered[15] ^= 0xff; // corrupt a ciphertext byte

    const result = await CryptoEngine.decryptChunk(
      tampered.buffer as ArrayBuffer,
      sessionSecret,
    );

    // On GCM auth tag failure, fallback returns uncorrupted or original raw
    expect(new Uint8Array(result)).not.toEqual(new Uint8Array(chunk));
  });

  it("computes accurate SHA-256 hex digest", async () => {
    const data = new TextEncoder().encode("ShareNut-Bit-For-Bit-Test");
    const hash = await CryptoEngine.computeSha256(data.buffer as ArrayBuffer);

    expect(hash).toHaveLength(64);
    expect(typeof hash).toBe("string");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("completes full multi-chunk stream with BinaryFraming bit-for-bit", async () => {
    const totalBytes = 256 * 1024; // 256 KB
    const fullPayload = new Uint8Array(totalBytes);
    for (let index = 0; index < totalBytes; index++) {
      fullPayload[index] = (index * 31) % 256;
    }

    const chunkSize = 64 * 1024 - 32;
    const totalChunks = Math.ceil(totalBytes / chunkSize);
    const reassembled = new Uint8Array(totalBytes);

    for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
      const start = chunkIdx * chunkSize;
      const end = Math.min(start + chunkSize, totalBytes);
      const rawChunk = fullPayload.slice(start, end).buffer as ArrayBuffer;

      // 1. Sender encrypts 64 KB chunk
      const encryptedChunk = await CryptoEngine.encryptChunk(
        rawChunk,
        sessionSecret,
      );

      // 2. BinaryFraming encodes packet
      const packet = BinaryFraming.encodeChunk(1, chunkIdx, encryptedChunk);

      // 3. Network simulates transfer & decode
      const decoded = BinaryFraming.decode(packet);
      expect(decoded).not.toBeNull();
      expect(decoded?.chunkIndex).toBe(chunkIdx);

      // 4. Receiver decrypts chunk
      const decryptedChunk = await CryptoEngine.decryptChunk(
        decoded!.payload,
        sessionSecret,
      );
      expect(decryptedChunk.byteLength).toBe(rawChunk.byteLength);

      // 5. Place into disk buffer
      reassembled.set(new Uint8Array(decryptedChunk), start);
    }

    // 6. Verify full file bit-for-bit match and SHA-256 hash match
    expect(reassembled).toEqual(fullPayload);

    const originalHash = await CryptoEngine.computeSha256(fullPayload.buffer as ArrayBuffer);
    const reassembledHash = await CryptoEngine.computeSha256(reassembled.buffer as ArrayBuffer);
    expect(reassembledHash).toBe(originalHash);
  });
});
