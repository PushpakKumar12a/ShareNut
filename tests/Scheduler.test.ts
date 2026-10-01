import { describe, expect, it } from "bun:test";
import { ChunkScheduler } from "../frontend/src/features/p2p/Scheduler";
import { Bitfield } from "../frontend/src/features/p2p/Bitfield";

describe("ChunkScheduler", () => {
  it("prioritizes mesh peers over the sender", () => {
    const total = 10;
    const scheduler = new ChunkScheduler(total, 16);
    scheduler.setSenderPeerId("sender-node");

    // Peer 1 has chunk 0 and 1
    const peer1Bf = new Bitfield(total);
    peer1Bf.set(0, true);
    peer1Bf.set(1, true);
    scheduler.updatePeerBitfield("peer-1", peer1Bf);

    // Sender has all chunks
    const senderBf = new Bitfield(total);
    for (let index = 0; index < total; index++) {
      senderBf.set(index, true);
    }
    scheduler.updatePeerBitfield("sender-node", senderBf);

    const requests = scheduler.getNextRequests();
    expect(requests.length).toBeGreaterThan(0);

    // For chunks 0 and 1, peer-1 should be chosen instead of sender-node
    const reqFor0 = requests.find((r) => r.chunkIndex === 0);
    const reqFor1 = requests.find((r) => r.chunkIndex === 1);
    expect(reqFor0?.peerId).toBe("peer-1");
    expect(reqFor1?.peerId).toBe("peer-1");
  });

  it("falls back to sender immediately when no mesh peer has the chunk", () => {
    const total = 5;
    const scheduler = new ChunkScheduler(total, 8);
    scheduler.setSenderPeerId("sender-node");

    // Mesh peer only has chunk 0
    const peer1Bf = new Bitfield(total);
    peer1Bf.set(0, true);
    scheduler.updatePeerBitfield("peer-1", peer1Bf);

    // Sender has all chunks
    const senderBf = new Bitfield(total);
    for (let index = 0; index < total; index++) {
      senderBf.set(index, true);
    }
    scheduler.updatePeerBitfield("sender-node", senderBf);

    const requests = scheduler.getNextRequests();
    // Chunks 1..4 only sender has, so they should be scheduled from sender-node without artificial delay
    const senderRequests = requests.filter((r) => r.peerId === "sender-node");
    expect(senderRequests.length).toBeGreaterThan(0);
  });

  it("handles peer NACK and redirects to sender without delay", () => {
    const total = 10;
    const scheduler = new ChunkScheduler(total, 16);
    scheduler.setSenderPeerId("sender-node");

    const peer1Bf = new Bitfield(total);
    peer1Bf.set(2, true);
    scheduler.updatePeerBitfield("peer-1", peer1Bf);

    const senderBf = new Bitfield(total);
    senderBf.set(2, true);
    scheduler.updatePeerBitfield("sender-node", senderBf);

    const initial = scheduler.getNextRequests();
    const reqChunk2 = initial.find((r) => r.chunkIndex === 2);
    expect(reqChunk2?.peerId).toBe("peer-1");

    // Peer 1 sends NACK (CHUNK_UNAVAILABLE)
    scheduler.handlePeerUnavailable(2, "peer-1", reqChunk2!.requestId);

    // Next scheduling cycle should immediately fall back to sender-node (peer-1 is on cooldown)
    const next = scheduler.getNextRequests();
    const fallbackReq = next.find((r) => r.chunkIndex === 2);
    expect(fallbackReq).toBeDefined();
    expect(fallbackReq?.peerId).toBe("sender-node");
  });

  it("cleans up in-flight requests when chunk is verified", () => {
    const total = 5;
    const scheduler = new ChunkScheduler(total, 8);
    scheduler.setSenderPeerId("sender-node");

    const senderBf = new Bitfield(total);
    senderBf.set(0, true);
    scheduler.updatePeerBitfield("sender-node", senderBf);

    const requests = scheduler.getNextRequests();
    expect(requests.some((r) => r.chunkIndex === 0)).toBe(true);
    expect(scheduler.getInFlightCount()).toBeGreaterThan(0);

    // Verify chunk 0
    scheduler.markLocalChunk(0, true);
    const inFlightFor0 = scheduler.getInFlightForChunk(0);
    expect(inFlightFor0.length).toBe(0);

    // Chunk 0 should not be requested again
    const nextRequests = scheduler.getNextRequests();
    expect(nextRequests.some((r) => r.chunkIndex === 0)).toBe(false);
  });

  it("allows limited redundant requests in end-game mode", () => {
    const total = 20;
    const scheduler = new ChunkScheduler(total, 16);
    scheduler.setSenderPeerId("sender-node");

    // Only 1 chunk missing (<= 5% of 20 = 1 chunk), activating end-game mode
    const localBf = new Bitfield(total);
    for (let index = 0; index < total - 1; index++) {
      localBf.set(index, true);
    }
    scheduler.setLocalBitfield(localBf);

    // Peer 1 and Sender both have the missing chunk (index 19)
    const peer1Bf = new Bitfield(total);
    peer1Bf.set(19, true);
    scheduler.updatePeerBitfield("peer-1", peer1Bf);

    const senderBf = new Bitfield(total);
    senderBf.set(19, true);
    scheduler.updatePeerBitfield("sender-node", senderBf);

    // First cycle schedules to peer-1
    const firstWave = scheduler.getNextRequests();
    expect(firstWave.some((r) => r.chunkIndex === 19 && r.peerId === "peer-1")).toBe(true);

    // In end-game mode, a second request to sender-node is permitted for redundancy
    const secondWave = scheduler.getNextRequests();
    expect(secondWave.some((r) => r.chunkIndex === 19 && r.peerId === "sender-node")).toBe(true);

    // But no more than 2 concurrent requests for the same chunk
    const thirdWave = scheduler.getNextRequests();
    expect(thirdWave.length).toBe(0);
  });

  it("partitions sender requests deterministically across mesh peers by seed slot", () => {
    const total = 20;
    const senderBf = new Bitfield(total);
    for (let index = 0; index < total; index++) {
      senderBf.set(index, true);
    }

    // Receiver 0: myPeerId = "peer-0", mesh peers = ["peer-1", "peer-2", "peer-3"]
    const scheduler0 = new ChunkScheduler(total, 16, 3000, "peer-0");
    scheduler0.setSenderPeerId("sender-node");
    scheduler0.updatePeerBitfield("sender-node", senderBf);
    scheduler0.updatePeerBitfield("peer-1", new Bitfield(total));
    scheduler0.updatePeerBitfield("peer-2", new Bitfield(total));
    scheduler0.updatePeerBitfield("peer-3", new Bitfield(total));

    const slot0 = scheduler0.getSeedSlot();
    expect(slot0.slot).toBe(0);
    expect(slot0.totalSlots).toBe(4);

    const requests0 = scheduler0.getNextRequests();
    expect(requests0.length).toBeGreaterThan(0);
    // Every request to sender-node by peer-0 must satisfy chunkIndex % 4 === 0
    for (const req of requests0) {
      expect(req.peerId).toBe("sender-node");
      expect(req.chunkIndex % 4).toBe(0);
    }

    // Receiver 1: myPeerId = "peer-1", mesh peers = ["peer-0", "peer-2", "peer-3"]
    const scheduler1 = new ChunkScheduler(total, 16, 3000, "peer-1");
    scheduler1.setSenderPeerId("sender-node");
    scheduler1.updatePeerBitfield("sender-node", senderBf);
    scheduler1.updatePeerBitfield("peer-0", new Bitfield(total));
    scheduler1.updatePeerBitfield("peer-2", new Bitfield(total));
    scheduler1.updatePeerBitfield("peer-3", new Bitfield(total));

    const slot1 = scheduler1.getSeedSlot();
    expect(slot1.slot).toBe(1);
    expect(slot1.totalSlots).toBe(4);

    const requests1 = scheduler1.getNextRequests();
    expect(requests1.length).toBeGreaterThan(0);
    // Every request to sender-node by peer-1 must satisfy chunkIndex % 4 === 1
    for (const req of requests1) {
      expect(req.peerId).toBe("sender-node");
      expect(req.chunkIndex % 4).toBe(1);
    }
  });
});
