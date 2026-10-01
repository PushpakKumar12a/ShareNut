import { describe, expect, it } from "bun:test";
import { ChunkStore } from "../frontend/src/features/transfer/engine/ChunkStore";

describe("ChunkStore LRU Cache", () => {
  it("stores and retrieves chunks from RAM memory cache", async () => {
    const store = new ChunkStore();
    const fileId = "test-file-alpha";
    const sampleData = new Uint8Array([1, 2, 3, 4, 5]).buffer as ArrayBuffer;

    expect(store.hasMemoryChunk(fileId, 0)).toBe(false);
    expect(store.getMemoryChunk(fileId, 0)).toBeNull();

    await store.saveChunk(fileId, 0, sampleData);

    expect(store.hasMemoryChunk(fileId, 0)).toBe(true);
    const retrieved = store.getMemoryChunk(fileId, 0);
    expect(retrieved).not.toBeNull();
    if (retrieved) {
      expect(new Uint8Array(retrieved)).toEqual(new Uint8Array(sampleData));
    }
  });

  it("enforces 192 chunk LRU eviction boundary", async () => {
    const store = new ChunkStore();
    const fileId = "test-file-large";

    for (let index = 0; index < 200; index++) {
      const data = new Uint8Array([index % 256]).buffer as ArrayBuffer;
      await store.saveChunk(fileId, index, data);
    }

    // Chunks 0 to 7 should have been evicted (200 - 192 = 8 evicted)
    for (let index = 0; index < 8; index++) {
      expect(store.hasMemoryChunk(fileId, index)).toBe(false);
      expect(store.getMemoryChunk(fileId, index)).toBeNull();
    }

    // Chunks 8 to 199 should be present
    for (let index = 8; index < 200; index++) {
      expect(store.hasMemoryChunk(fileId, index)).toBe(true);
    }
  });

  it("updates LRU recency on access to prevent eviction of frequently read chunks", async () => {
    const store = new ChunkStore();
    const fileId = "test-file-recency";

    // Add 192 chunks: 0..191
    for (let index = 0; index < 192; index++) {
      const data = new Uint8Array([index % 256]).buffer as ArrayBuffer;
      await store.saveChunk(fileId, index, data);
    }

    // Access chunk 0 to make it most recently used
    const touched = store.getMemoryChunk(fileId, 0);
    expect(touched).not.toBeNull();

    // Add 1 more chunk: 192 (total added: 193)
    const newChunk = new Uint8Array([99]).buffer as ArrayBuffer;
    await store.saveChunk(fileId, 192, newChunk);

    // Chunk 0 was recently accessed, so chunk 1 (now oldest) should be evicted instead!
    expect(store.hasMemoryChunk(fileId, 0)).toBe(true);
    expect(store.hasMemoryChunk(fileId, 1)).toBe(false);
    expect(store.hasMemoryChunk(fileId, 192)).toBe(true);
  });

  it("maintains independent caches for different files", async () => {
    const store = new ChunkStore();
    const file1 = "file-one";
    const file2 = "file-two";
    const data1 = new Uint8Array([11, 22]).buffer as ArrayBuffer;
    const data2 = new Uint8Array([33, 44]).buffer as ArrayBuffer;

    await store.saveChunk(file1, 0, data1);
    await store.saveChunk(file2, 0, data2);

    expect(store.hasMemoryChunk(file1, 0)).toBe(true);
    expect(store.hasMemoryChunk(file2, 0)).toBe(true);

    const res1 = store.getMemoryChunk(file1, 0);
    const res2 = store.getMemoryChunk(file2, 0);

    expect(new Uint8Array(res1!)).toEqual(new Uint8Array(data1));
    expect(new Uint8Array(res2!)).toEqual(new Uint8Array(data2));

    await store.clearFileChunks(file1);
    expect(store.hasMemoryChunk(file1, 0)).toBe(false);
    expect(store.hasMemoryChunk(file2, 0)).toBe(true);
  });
});
