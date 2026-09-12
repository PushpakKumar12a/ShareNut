import { Bitfield } from "@/features/p2p/Bitfield";

export interface ScheduledRequest {
  chunkIndex: number;
  peerId: string;
}

export interface InFlightInfo {
  peerId: string;
  timestamp: number;
  timeoutMs: number;
}

export class ChunkScheduler {
  private totalChunks: number;
  private localBitfield: Bitfield;
  private peerBitfields: Map<string, Bitfield> = new Map();
  private inFlightRequests: Map<number, InFlightInfo> = new Map();
  private chunkFirstMissing: Map<number, number> = new Map();
  private maxConcurrency: number;
  private defaultTimeoutMs: number;
  private senderPeerId: string | null = null;

  constructor(
    totalChunks: number,
    maxConcurrency: number = 48,
    defaultTimeoutMs: number = 3000,
  ) {
    this.totalChunks = totalChunks;
    this.localBitfield = new Bitfield(totalChunks);
    this.maxConcurrency = Math.max(maxConcurrency, 32);
    this.defaultTimeoutMs = defaultTimeoutMs;
  }

  public setLocalBitfield(bitfield: Bitfield): void {
    this.localBitfield = bitfield;
  }

  public markLocalChunk(chunkIndex: number, verified: boolean = true): void {
    this.localBitfield.set(chunkIndex, verified);
    if (verified) {
      this.inFlightRequests.delete(chunkIndex);
      this.chunkFirstMissing.delete(chunkIndex);
    }
  }

  public updatePeerBitfield(peerId: string, bitfield: Bitfield): void {
    this.peerBitfields.set(peerId, bitfield);
    this.maxConcurrency = Math.max(32, this.peerBitfields.size * 24);
  }

  public setSenderPeerId(peerId: string): void {
    this.senderPeerId = peerId;
  }

  public markPeerHave(peerId: string, chunkIndex: number): void {
    let bf = this.peerBitfields.get(peerId);
    if (!bf) {
      bf = new Bitfield(this.totalChunks);
      this.peerBitfields.set(peerId, bf);
    }
    bf.set(chunkIndex, true);
    this.maxConcurrency = Math.max(32, this.peerBitfields.size * 24);
  }

  public removePeer(peerId: string): void {
    this.peerBitfields.delete(peerId);
    for (const [idx, info] of this.inFlightRequests.entries()) {
      if (info.peerId === peerId) {
        this.inFlightRequests.delete(idx);
      }
    }
    this.maxConcurrency = Math.max(32, this.peerBitfields.size * 24);
  }

  public getMeshRarityMap(): number[] {
    const rarity = new Array<number>(this.totalChunks).fill(0);
    for (const [, bf] of this.peerBitfields.entries()) {
      for (let i = 0; i < this.totalChunks; i++) {
        if (bf.get(i)) {
          rarity[i]++;
        }
      }
    }
    return rarity;
  }

  public getNextRequests(): ScheduledRequest[] {
    this.checkTimeouts();

    const missing = this.localBitfield.getMissingIndices();
    if (missing.length === 0) return [];

    const isEndGame =
      missing.length <= Math.max(2, Math.floor(this.totalChunks * 0.05));
    const rarityMap = this.getMeshRarityMap();
    const scheduled: ScheduledRequest[] = [];
    const activePeerRequestCounts = this.getPeerRequestCounts();

    if (isEndGame) {
      for (const chunkIndex of missing) {
        const eligiblePeers: string[] = [];
        let nonSenderCount = 0;
        for (const [peerId, bf] of this.peerBitfields.entries()) {
          if (bf.get(chunkIndex)) {
            eligiblePeers.push(peerId);
            if (peerId !== this.senderPeerId) {
              nonSenderCount++;
            }
          }
        }
        if (eligiblePeers.length === 0) continue;

        eligiblePeers.sort((firstPeer, secondPeer) => {
          const firstIsSender = firstPeer === this.senderPeerId ? 1 : 0;
          const secondIsSender = secondPeer === this.senderPeerId ? 1 : 0;
          return firstIsSender - secondIsSender;
        });

        for (const peerId of eligiblePeers) {
          if (peerId === this.senderPeerId && nonSenderCount > 0) {
            continue;
          }
          const inFlight = this.inFlightRequests.get(chunkIndex);
          if (!inFlight || inFlight.peerId !== peerId) {
            this.inFlightRequests.set(chunkIndex, {
              peerId,
              timestamp: Date.now(),
              timeoutMs: 1500,
            });
            scheduled.push({ chunkIndex, peerId });
            break;
          }
        }
      }
      return scheduled;
    }

    const availableSlots = this.maxConcurrency - this.inFlightRequests.size;
    if (availableSlots <= 0) return [];

    const candidates = missing.filter(
      (idx) => !this.inFlightRequests.has(idx) && rarityMap[idx] > 0,
    );
    if (candidates.length === 0) return [];

    const getMeshPeerCount = (idx: number) => {
      let count = 0;
      for (const [peerId, bf] of this.peerBitfields.entries()) {
        if (peerId !== this.senderPeerId && bf.get(idx)) {
          count++;
        }
      }
      return count;
    };

    candidates.sort((firstChunk, secondChunk) => {
      const firstMesh = getMeshPeerCount(firstChunk);
      const secondMesh = getMeshPeerCount(secondChunk);
      if (firstMesh > 0 !== secondMesh > 0) {
        return firstMesh > 0 ? -1 : 1;
      }
      if (firstMesh > 0 && secondMesh > 0) {
        if (firstMesh !== secondMesh) return firstMesh - secondMesh;
      }
      const diff = rarityMap[firstChunk] - rarityMap[secondChunk];
      if (diff !== 0) return diff;
      return Math.random() - 0.5;
    });

    const hasOtherMeshPeers = Array.from(this.peerBitfields.keys()).some(
      (id) => id !== this.senderPeerId,
    );
    const now = Date.now();

    const maxSenderInFlight = 1;
    const currentSenderInFlight = this.senderPeerId
      ? activePeerRequestCounts.get(this.senderPeerId) || 0
      : 0;
    let senderRequestsAdded = 0;

    for (const chunkIndex of candidates) {
      if (scheduled.length >= availableSlots) break;

      const nonSenderPeers: string[] = [];
      let senderHasIt = false;
      for (const [peerId, bf] of this.peerBitfields.entries()) {
        if (bf.get(chunkIndex)) {
          if (peerId === this.senderPeerId) {
            senderHasIt = true;
          } else {
            nonSenderPeers.push(peerId);
          }
        }
      }

      if (nonSenderPeers.length === 0 && !senderHasIt) continue;

      let chosenPeer: string;
      if (nonSenderPeers.length > 0) {
        this.chunkFirstMissing.delete(chunkIndex);
        nonSenderPeers.sort(
          (firstPeer, secondPeer) =>
            (activePeerRequestCounts.get(firstPeer) || 0) -
            (activePeerRequestCounts.get(secondPeer) || 0),
        );
        chosenPeer = nonSenderPeers[0];
      } else {
        if (hasOtherMeshPeers) {
          const firstMissingTime = this.chunkFirstMissing.get(chunkIndex);
          if (!firstMissingTime) {
            this.chunkFirstMissing.set(chunkIndex, now);
            continue;
          }
          if (now - firstMissingTime < 2000) {
            continue;
          }
        }

        if (
          this.senderPeerId &&
          currentSenderInFlight + senderRequestsAdded >= maxSenderInFlight &&
          this.inFlightRequests.size > 0
        ) {
          continue;
        }
        chosenPeer = this.senderPeerId!;
        senderRequestsAdded++;
      }

      this.inFlightRequests.set(chunkIndex, {
        peerId: chosenPeer,
        timestamp: Date.now(),
        timeoutMs: this.defaultTimeoutMs,
      });

      activePeerRequestCounts.set(
        chosenPeer,
        (activePeerRequestCounts.get(chosenPeer) || 0) + 1,
      );

      scheduled.push({ chunkIndex, peerId: chosenPeer });
    }

    return scheduled;
  }

  public checkTimeouts(): number[] {
    const now = Date.now();
    const timedOut: number[] = [];

    for (const [chunkIndex, info] of this.inFlightRequests.entries()) {
      if (now - info.timestamp > info.timeoutMs) {
        timedOut.push(chunkIndex);
        this.inFlightRequests.delete(chunkIndex);
      }
    }

    return timedOut;
  }

  public getInFlightCount(): number {
    return this.inFlightRequests.size;
  }

  public getInFlightMap(): Map<number, InFlightInfo> {
    return new Map(this.inFlightRequests);
  }

  private getPeerRequestCounts(): Map<string, number> {
    const counts = new Map<string, number>();
    for (const [, info] of this.inFlightRequests.entries()) {
      counts.set(info.peerId, (counts.get(info.peerId) || 0) + 1);
    }
    return counts;
  }
}
