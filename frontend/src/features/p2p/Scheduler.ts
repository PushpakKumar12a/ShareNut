import { Bitfield } from "@/features/p2p/Bitfield";

export interface ScheduledRequest {
  chunkIndex: number;
  peerId: string;
  requestId: number;
}

export interface InFlightInfo {
  requestId: number;
  chunkIndex: number;
  peerId: string;
  timestamp: number;
  timeoutMs: number;
}

export class ChunkScheduler {
  private totalChunks: number;
  private localBitfield: Bitfield;
  private peerBitfields: Map<string, Bitfield> = new Map();
  private inFlightRequests: Map<number, InFlightInfo> = new Map();
  private chunkInFlightMap: Map<number, Set<number>> = new Map();
  private peerCooldowns: Map<string, Map<number, number>> = new Map();
  private maxConcurrency: number;
  private defaultTimeoutMs: number;
  private senderPeerId: string | null = null;
  private nextRequestId: number = 1;

  private fallbackChunks: Set<number> = new Set();
  private lastProgressTimestamp: number = Date.now();
  private myPeerId: string = "";

  constructor(
    totalChunks: number,
    maxConcurrency: number = 48,
    defaultTimeoutMs: number = 3000,
    myPeerId: string = "",
  ) {
    this.totalChunks = totalChunks;
    this.localBitfield = new Bitfield(totalChunks);
    this.maxConcurrency = Math.max(maxConcurrency, 32);
    this.defaultTimeoutMs = defaultTimeoutMs;
    this.myPeerId = myPeerId;
  }

  public setMyPeerId(peerId: string): void {
    this.myPeerId = peerId;
  }

  public getSeedSlot(): { slot: number; totalSlots: number } {
    const meshPeers = Array.from(this.peerBitfields.keys()).filter(
      (id) => id !== this.senderPeerId,
    );
    if (this.myPeerId && !meshPeers.includes(this.myPeerId)) {
      meshPeers.push(this.myPeerId);
    }
    meshPeers.sort();
    const totalSlots = meshPeers.length;
    const slot = this.myPeerId ? meshPeers.indexOf(this.myPeerId) : 0;
    return {
      slot: slot >= 0 ? slot : 0,
      totalSlots: totalSlots > 0 ? totalSlots : 1,
    };
  }

  private generateRequestId(): number {
    const id = this.nextRequestId;
    this.nextRequestId = this.nextRequestId >= 0x7fffffff ? 1 : this.nextRequestId + 1;
    return id;
  }

  public setLocalBitfield(bitfield: Bitfield): void {
    this.localBitfield = bitfield;
  }

  public markLocalChunk(chunkIndex: number, verified: boolean = true): void {
    this.localBitfield.set(chunkIndex, verified);
    if (verified) {
      this.lastProgressTimestamp = Date.now();
      this.fallbackChunks.delete(chunkIndex);
      const requestIds = this.chunkInFlightMap.get(chunkIndex);
      if (requestIds) {
        for (const requestId of requestIds) {
          this.inFlightRequests.delete(requestId);
        }
        this.chunkInFlightMap.delete(chunkIndex);
      }
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
    let bitfield = this.peerBitfields.get(peerId);
    if (!bitfield) {
      bitfield = new Bitfield(this.totalChunks);
      this.peerBitfields.set(peerId, bitfield);
    }
    bitfield.set(chunkIndex, true);
    this.maxConcurrency = Math.max(32, this.peerBitfields.size * 24);
  }

  public removePeer(peerId: string): void {
    this.peerBitfields.delete(peerId);
    this.peerCooldowns.delete(peerId);

    const toRemove: number[] = [];
    for (const [requestId, info] of this.inFlightRequests.entries()) {
      if (info.peerId === peerId) {
        toRemove.push(requestId);
      }
    }

    for (const requestId of toRemove) {
      this.removeInFlight(requestId);
    }

    this.maxConcurrency = Math.max(32, this.peerBitfields.size * 24);
  }

  public handlePeerUnavailable(
    chunkIndex: number,
    peerId: string,
    requestId?: number,
  ): void {
    this.fallbackChunks.add(chunkIndex);
    if (requestId !== undefined) {
      this.removeInFlight(requestId);
    } else {
      const activeIds = this.chunkInFlightMap.get(chunkIndex);
      if (activeIds) {
        for (const id of Array.from(activeIds)) {
          const info = this.inFlightRequests.get(id);
          if (info && info.peerId === peerId) {
            this.removeInFlight(id);
          }
        }
      }
    }

    let cooldownMap = this.peerCooldowns.get(peerId);
    if (!cooldownMap) {
      cooldownMap = new Map<number, number>();
      this.peerCooldowns.set(peerId, cooldownMap);
    }
    cooldownMap.set(chunkIndex, Date.now() + 5000);
  }

  private isPeerOnCooldown(peerId: string, chunkIndex: number): boolean {
    const cooldownExpiry = this.peerCooldowns.get(peerId)?.get(chunkIndex);
    if (!cooldownExpiry) return false;
    if (Date.now() > cooldownExpiry) {
      this.peerCooldowns.get(peerId)?.delete(chunkIndex);
      return false;
    }
    return true;
  }

  private addInFlight(
    chunkIndex: number,
    peerId: string,
    timeoutMs: number,
  ): ScheduledRequest {
    const requestId = this.generateRequestId();
    const info: InFlightInfo = {
      requestId,
      chunkIndex,
      peerId,
      timestamp: Date.now(),
      timeoutMs,
    };
    this.inFlightRequests.set(requestId, info);

    let requestSet = this.chunkInFlightMap.get(chunkIndex);
    if (!requestSet) {
      requestSet = new Set<number>();
      this.chunkInFlightMap.set(chunkIndex, requestSet);
    }
    requestSet.add(requestId);

    return { chunkIndex, peerId, requestId };
  }

  private removeInFlight(requestId: number): void {
    const info = this.inFlightRequests.get(requestId);
    if (!info) return;

    this.inFlightRequests.delete(requestId);
    const requestSet = this.chunkInFlightMap.get(info.chunkIndex);
    if (requestSet) {
      requestSet.delete(requestId);
      if (requestSet.size === 0) {
        this.chunkInFlightMap.delete(info.chunkIndex);
      }
    }
  }

  public getMeshRarityMap(): number[] {
    const rarity = new Array<number>(this.totalChunks).fill(0);
    for (const [peerId, bitfield] of this.peerBitfields.entries()) {
      if (peerId === this.senderPeerId) continue;
      for (let index = 0; index < this.totalChunks; index++) {
        if (bitfield.get(index)) {
          rarity[index]++;
        }
      }
    }
    return rarity;
  }

  public getNextRequests(): ScheduledRequest[] {
    this.checkTimeouts();

    const missing = this.localBitfield.getMissingIndices();
    if (missing.length === 0) return [];

    const { slot, totalSlots } = this.getSeedSlot();
    const hasOtherMeshPeers = Array.from(this.peerBitfields.keys()).some(
      (id) => id !== this.senderPeerId,
    );
    const isStalled = Date.now() - this.lastProgressTimestamp > 4000;

    const isEndGame =
      missing.length <= Math.max(3, Math.floor(this.totalChunks * 0.05));
    const rarityMap = this.getMeshRarityMap();
    const scheduled: ScheduledRequest[] = [];
    const activePeerRequestCounts = this.getPeerRequestCounts();

    if (isEndGame) {
      for (const chunkIndex of missing) {
        const eligiblePeers: string[] = [];
        let nonSenderCount = 0;

        for (const [peerId, bitfield] of this.peerBitfields.entries()) {
          if (bitfield.get(chunkIndex) && !this.isPeerOnCooldown(peerId, chunkIndex)) {
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

        const activeRequestsForChunk = this.getInFlightForChunk(chunkIndex);
        const peersWithInFlight = new Set(activeRequestsForChunk.map((req) => req.peerId));

        for (const peerId of eligiblePeers) {
          if (peerId === this.senderPeerId && nonSenderCount > 0 && activeRequestsForChunk.length === 0) {
            continue;
          }
          if (!peersWithInFlight.has(peerId) && activeRequestsForChunk.length < 2) {
            const req = this.addInFlight(chunkIndex, peerId, 1500);
            scheduled.push(req);
            break;
          }
        }
      }
      return scheduled;
    }

    const availableSlots = this.maxConcurrency - this.inFlightRequests.size;
    if (availableSlots <= 0) return [];

    const candidates = missing.filter(
      (index) =>
        (!this.chunkInFlightMap.has(index) ||
          this.chunkInFlightMap.get(index)!.size === 0) &&
        (rarityMap[index] > 0 ||
          !hasOtherMeshPeers ||
          this.fallbackChunks.has(index) ||
          isStalled ||
          isEndGame ||
          totalSlots <= 1 ||
          index % totalSlots === slot),
    );
    if (candidates.length === 0) return [];

    const getMeshPeerCount = (index: number) => {
      let count = 0;
      for (const [peerId, bitfield] of this.peerBitfields.entries()) {
        if (peerId !== this.senderPeerId && bitfield.get(index) && !this.isPeerOnCooldown(peerId, index)) {
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
      return firstChunk - secondChunk;
    });

    const maxSenderInFlight = Math.max(8, Math.floor(this.maxConcurrency / 3));
    const currentSenderInFlight = this.senderPeerId
      ? activePeerRequestCounts.get(this.senderPeerId) || 0
      : 0;
    let senderRequestsAdded = 0;

    for (const chunkIndex of candidates) {
      if (scheduled.length >= availableSlots) break;

      const nonSenderPeers: string[] = [];
      let senderHasIt = false;

      for (const [peerId, bitfield] of this.peerBitfields.entries()) {
        if (bitfield.get(chunkIndex) && !this.isPeerOnCooldown(peerId, chunkIndex)) {
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
        nonSenderPeers.sort(
          (firstPeer, secondPeer) =>
            (activePeerRequestCounts.get(firstPeer) || 0) -
            (activePeerRequestCounts.get(secondPeer) || 0),
        );
        chosenPeer = nonSenderPeers[0];
      } else {
        const isMySeedChunk = totalSlots <= 1 || chunkIndex % totalSlots === slot;
        const isFallback = this.fallbackChunks.has(chunkIndex);

        if (
          hasOtherMeshPeers &&
          !isMySeedChunk &&
          !isFallback &&
          !isEndGame &&
          !isStalled
        ) {
          continue;
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

      const req = this.addInFlight(chunkIndex, chosenPeer, this.defaultTimeoutMs);
      activePeerRequestCounts.set(
        chosenPeer,
        (activePeerRequestCounts.get(chosenPeer) || 0) + 1,
      );
      scheduled.push(req);
    }

    return scheduled;
  }

  public checkTimeouts(): number[] {
    const now = Date.now();
    const timedOut: number[] = [];
    const expiredRequestIds: number[] = [];

    for (const [requestId, info] of this.inFlightRequests.entries()) {
      if (now - info.timestamp > info.timeoutMs) {
        timedOut.push(info.chunkIndex);
        expiredRequestIds.push(requestId);
        this.fallbackChunks.add(info.chunkIndex);
        let cooldownMap = this.peerCooldowns.get(info.peerId);
        if (!cooldownMap) {
          cooldownMap = new Map<number, number>();
          this.peerCooldowns.set(info.peerId, cooldownMap);
        }
        cooldownMap.set(info.chunkIndex, now + 5000);
      }
    }

    for (const requestId of expiredRequestIds) {
      this.removeInFlight(requestId);
    }

    return timedOut;
  }

  public getInFlightCount(): number {
    return this.inFlightRequests.size;
  }

  public getInFlightForChunk(chunkIndex: number): InFlightInfo[] {
    const requestIds = this.chunkInFlightMap.get(chunkIndex);
    if (!requestIds) return [];
    const result: InFlightInfo[] = [];
    for (const id of requestIds) {
      const info = this.inFlightRequests.get(id);
      if (info) {
        result.push(info);
      }
    }
    return result;
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
