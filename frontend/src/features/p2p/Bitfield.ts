export class Bitfield {
  private totalChunks: number;
  private buffer: Uint8Array;

  constructor(totalChunks: number, buffer?: Uint8Array) {
    this.totalChunks = totalChunks;
    const byteLength = Math.ceil(totalChunks / 8);
    if (buffer) {
      this.buffer = new Uint8Array(buffer);
    } else {
      this.buffer = new Uint8Array(byteLength);
    }
  }

  public get(index: number): boolean {
    if (index < 0 || index >= this.totalChunks) return false;
    const byteIndex = Math.floor(index / 8);
    const bitIndex = index % 8;
    return (this.buffer[byteIndex] & (1 << (7 - bitIndex))) !== 0;
  }

  public set(index: number, value: boolean = true): void {
    if (index < 0 || index >= this.totalChunks) return;
    const byteIndex = Math.floor(index / 8);
    const bitIndex = index % 8;
    if (value) {
      this.buffer[byteIndex] |= 1 << (7 - bitIndex);
    } else {
      this.buffer[byteIndex] &= ~(1 << (7 - bitIndex));
    }
  }

  public count(): number {
    let count = 0;
    for (let i = 0; i < this.totalChunks; i++) {
      if (this.get(i)) count++;
    }
    return count;
  }

  public isComplete(): boolean {
    return this.count() === this.totalChunks;
  }

  public getBuffer(): Uint8Array {
    return this.buffer;
  }

  public getMissingIndices(): number[] {
    const missing: number[] = [];
    for (let i = 0; i < this.totalChunks; i++) {
      if (!this.get(i)) missing.push(i);
    }
    return missing;
  }

  public getAvailableIndices(): number[] {
    const available: number[] = [];
    for (let i = 0; i < this.totalChunks; i++) {
      if (this.get(i)) available.push(i);
    }
    return available;
  }

  public static createAll(totalChunks: number): Bitfield {
    const bf = new Bitfield(totalChunks);
    for (let i = 0; i < totalChunks; i++) {
      bf.set(i, true);
    }
    return bf;
  }
}
