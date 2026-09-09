import { DEFAULT_CHUNK_SIZE } from "@/features/transfer/engine/Chunker";

export class ChunkStore {
  private opfsRootPromise: Promise<FileSystemDirectoryHandle | null> | null =
    null;
  private opfsWritables: Map<string, FileSystemWritableFileStream> = new Map();
  private opfsHandles: Map<string, FileSystemFileHandle> = new Map();
  private opfsWriteQueues: Map<string, Promise<void>> = new Map();
  private opfsClosingPromises: Map<string, Promise<void>> = new Map();

  public isOpfsSupported(): boolean {
    return (
      typeof navigator !== "undefined" &&
      typeof window !== "undefined" &&
      Boolean(
        navigator.storage &&
        typeof navigator.storage.getDirectory === "function",
      )
    );
  }

  private async getOpfsRoot(): Promise<FileSystemDirectoryHandle | null> {
    if (!this.isOpfsSupported()) return null;
    if (this.opfsRootPromise) return this.opfsRootPromise;

    this.opfsRootPromise = (async () => {
      try {
        return await navigator.storage.getDirectory();
      } catch (err) {
        console.warn(
          "[ChunkStore] Failed to initialize OPFS root directory:",
          err,
        );
        return null;
      }
    })();

    return this.opfsRootPromise;
  }

  private async getOpfsWritable(
    fileId: string,
  ): Promise<FileSystemWritableFileStream | null> {
    const existingStream = this.opfsWritables.get(fileId);
    if (existingStream) return existingStream;

    const root = await this.getOpfsRoot();
    if (!root) return null;

    try {
      const sanitizedName = `ShareNut_opfs_${fileId.replace(/[^a-zA-Z0-9_-]/g, "_")}.bin`;
      const fileHandle = await root.getFileHandle(sanitizedName, {
        create: true,
      });
      this.opfsHandles.set(fileId, fileHandle);

      const writable = await fileHandle.createWritable({
        keepExistingData: true,
      });
      this.opfsWritables.set(fileId, writable);
      return writable;
    } catch (err) {
      console.warn(
        "[ChunkStore] Failed to open OPFS writable stream for:",
        fileId,
        err,
      );
      return null;
    }
  }

  private enqueueOpfsWrite(
    fileId: string,
    writeTask: () => Promise<void>,
  ): Promise<void> {
    const currentQueue = this.opfsWriteQueues.get(fileId) || Promise.resolve();
    const nextQueue = currentQueue.then(writeTask).catch((err) => {
      console.warn("[ChunkStore] OPFS queued write error:", err);
    });
    this.opfsWriteQueues.set(fileId, nextQueue);
    return nextQueue;
  }

  public async closeOpfsWritable(fileId: string): Promise<void> {
    const existingClosing = this.opfsClosingPromises.get(fileId);
    if (existingClosing) {
      return existingClosing;
    }

    const closePromise = (async () => {
      while (true) {
        const pendingQueue = this.opfsWriteQueues.get(fileId);
        if (!pendingQueue) break;
        this.opfsWriteQueues.delete(fileId);
        try {
          await pendingQueue;
        } catch {}
      }

      const writable = this.opfsWritables.get(fileId);
      if (writable) {
        this.opfsWritables.delete(fileId);
        try {
          await writable.close();
        } catch (err) {
          console.warn("[ChunkStore] Error closing OPFS writable stream:", err);
        }
      }
    })();

    this.opfsClosingPromises.set(fileId, closePromise);
    try {
      await closePromise;
    } finally {
      this.opfsClosingPromises.delete(fileId);
    }
  }

  public async saveChunk(
    fileId: string,
    chunkIndex: number,
    data: ArrayBuffer,
    chunkSize: number = DEFAULT_CHUNK_SIZE,
  ): Promise<void> {
    const byteOffset = chunkIndex * chunkSize;
    return this.enqueueOpfsWrite(fileId, async () => {
      const root = await this.getOpfsRoot();
      if (!root) {
        console.warn("[ChunkStore] OPFS root unavailable, cannot save chunk");
        return;
      }

      const writable = await this.getOpfsWritable(fileId);
      if (writable) {
        await (writable as any).write({
          type: "write",
          position: byteOffset,
          data: data,
        });
      }
    });
  }

  public async getChunk(
    fileId: string,
    chunkIndex: number,
    chunkSize: number = DEFAULT_CHUNK_SIZE,
  ): Promise<ArrayBuffer | null> {
    const root = await this.getOpfsRoot();
    if (root) {
      try {
        const sanitizedName = `ShareNut_opfs_${fileId.replace(/[^a-zA-Z0-9_-]/g, "_")}.bin`;
        let fileHandle = this.opfsHandles.get(fileId);
        if (!fileHandle) {
          fileHandle = await root.getFileHandle(sanitizedName);
          this.opfsHandles.set(fileId, fileHandle);
        }

        if (fileHandle) {
          const diskFile = await fileHandle.getFile();
          const byteOffset = chunkIndex * chunkSize;
          if (byteOffset < diskFile.size) {
            const endOffset = Math.min(byteOffset + chunkSize, diskFile.size);
            const slice = diskFile.slice(byteOffset, endOffset);
            const buffer = await slice.arrayBuffer();
            if (buffer.byteLength > 0) {
              return buffer;
            }
          }
        }
      } catch (err) {
        console.warn(
          "[ChunkStore] Failed to read chunk from OPFS:",
          fileId,
          chunkIndex,
          err,
        );
      }
    }

    return null;
  }

  public async assembleFile(fileId: string): Promise<File> {
    await this.closeOpfsWritable(fileId);

    const root = await this.getOpfsRoot();
    if (root) {
      try {
        const sanitizedName = `ShareNut_opfs_${fileId.replace(/[^a-zA-Z0-9_-]/g, "_")}.bin`;
        let fileHandle = this.opfsHandles.get(fileId);
        if (!fileHandle) {
          fileHandle = await root.getFileHandle(sanitizedName);
          this.opfsHandles.set(fileId, fileHandle);
        }

        if (fileHandle) {
          const opfsFile = await fileHandle.getFile();
          if (opfsFile && opfsFile.size > 0) {
            console.log(
              `[ChunkStore] Assembled file directly from OPFS (size: ${opfsFile.size} bytes). Zero heap memory allocation.`,
            );
            return opfsFile;
          }
        }
      } catch (err) {
        console.warn("[ChunkStore] OPFS assembly error:", err);
      }
    }

    throw new Error(`Failed to assemble file ${fileId} from OPFS disk storage`);
  }

  public async clearFileChunks(fileId: string): Promise<void> {
    await this.closeOpfsWritable(fileId);

    const root = await this.getOpfsRoot();
    if (root) {
      try {
        const sanitizedName = `ShareNut_opfs_${fileId.replace(/[^a-zA-Z0-9_-]/g, "_")}.bin`;
        await root.removeEntry(sanitizedName);
        this.opfsHandles.delete(fileId);
        console.log(`[ChunkStore] Purged OPFS file: ${sanitizedName}`);
      } catch (err) {
        // Entry may already be removed
      }
    }
  }
}

export const chunkStore = new ChunkStore();
