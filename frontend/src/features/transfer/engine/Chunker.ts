import type { ChunkInfo, FileManifest } from "@/types/protocol";

export const DEFAULT_CHUNK_SIZE = 64 * 1024 - 32;

export class Chunker {
  private file: File;
  private chunkSize: number;

  constructor(file: File, chunkSize: number = DEFAULT_CHUNK_SIZE) {
    this.file = file;
    this.chunkSize = chunkSize;
  }

  public get totalChunks(): number {
    return Math.ceil(this.file.size / this.chunkSize) || 1;
  }

  public async getChunk(index: number): Promise<ArrayBuffer> {
    const start = index * this.chunkSize;
    const end = Math.min(start + this.chunkSize, this.file.size);
    const slice = this.file.slice(start, end);
    return await slice.arrayBuffer();
  }

  public createInstantManifest(fileId: string): {
    manifest: FileManifest;
    chunks: ChunkInfo[];
  } {
    const total = this.totalChunks;
    const chunkInfos: ChunkInfo[] = [];

    for (let i = 0; i < total; i++) {
      const offset = i * this.chunkSize;
      const size = Math.min(this.chunkSize, this.file.size - offset);
      chunkInfos.push({
        index: i,
        offset,
        size,
        hash: "",
        status: "verified",
        progress: 100,
      });
    }

    const manifest: FileManifest = {
      fileId,
      name: this.file.name,
      size: this.file.size,
      mimeType: this.file.type || "application/octet-stream",
      chunkSize: this.chunkSize,
      totalChunks: total,
      chunkHashes: [],
      rootHash: "",
    };

    return { manifest, chunks: chunkInfos };
  }
}

