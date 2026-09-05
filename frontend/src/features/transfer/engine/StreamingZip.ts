import { downloadZip, predictLength } from "client-zip";
import type { ChunkInfo, FileManifest } from "@/types/protocol";
import { DEFAULT_CHUNK_SIZE } from "@/features/transfer/engine/Chunker";

export class StreamingZipChunker {
  public readonly name: string;
  public readonly size: number;
  public readonly totalChunks: number;
  public readonly chunkSize: number;
  private files: File[];
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private buffer: Uint8Array = new Uint8Array(0);
  private streamFinished: boolean = false;
  private cachedChunks: Map<number, ArrayBuffer> = new Map();

  constructor(files: File[], chunkSize: number = DEFAULT_CHUNK_SIZE, archiveName: string = "archive.zip") {
    this.files = files;
    this.chunkSize = chunkSize;
    this.name = archiveName;

    const clientZipFiles = files.map((f) => ({
      name: f.webkitRelativePath || f.name,
      input: f,
      lastModified: f.lastModified,
    }));

    this.size = Number(predictLength(clientZipFiles));
    this.totalChunks = Math.ceil(this.size / this.chunkSize) || 1;
  }

  public getStream(): ReadableStream<Uint8Array> {
    const clientZipFiles = this.files.map((f) => ({
      name: f.webkitRelativePath || f.name,
      input: f,
      lastModified: f.lastModified,
    }));
    return downloadZip(clientZipFiles).body!;
  }

  public async getChunk(index: number): Promise<ArrayBuffer> {
    if (this.cachedChunks.has(index)) {
      return this.cachedChunks.get(index)!;
    }

    if (!this.reader) {
      const clientZipFiles = this.files.map((f) => ({
        name: f.webkitRelativePath || f.name,
        input: f,
        lastModified: f.lastModified,
      }));
      this.reader = downloadZip(clientZipFiles).body!.getReader();
    }

    while (this.buffer.length < this.chunkSize && !this.streamFinished) {
      const { done, value } = await this.reader.read();
      if (done) {
        this.streamFinished = true;
        break;
      }
      if (value && value.length > 0) {
        const merged = new Uint8Array(this.buffer.length + value.length);
        merged.set(this.buffer);
        merged.set(value, this.buffer.length);
        this.buffer = merged;
      }
    }

    const chunkLength = Math.min(this.chunkSize, this.buffer.length);
    const chunkData = this.buffer.slice(0, chunkLength);
    this.buffer = this.buffer.slice(chunkLength);

    const arrayBuf = chunkData.buffer as ArrayBuffer;
    this.cachedChunks.set(index, arrayBuf);
    return arrayBuf;
  }

  public createInstantManifest(fileId: string): { manifest: FileManifest; chunks: ChunkInfo[] } {
    const chunkInfos: ChunkInfo[] = [];

    for (let i = 0; i < this.totalChunks; i++) {
      const offset = i * this.chunkSize;
      const size = Math.min(this.chunkSize, this.size - offset);
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
      name: this.name,
      size: this.size,
      mimeType: "application/zip",
      chunkSize: this.chunkSize,
      totalChunks: this.totalChunks,
      chunkHashes: [],
      rootHash: "",
    };

    return { manifest, chunks: chunkInfos };
  }

  public async toBlob(): Promise<Blob> {
    const stream = this.getStream();
    return await new Response(stream).blob();
  }
}
