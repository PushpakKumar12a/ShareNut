import type { TransportRoute, DetectedRoute } from "./lan/NetworkRouteDetector";
import type { Chunker } from "@/features/transfer/engine/Chunker";
import type { ChunkScheduler } from "@/features/p2p/Scheduler";
import type {
  ActiveFileTransfer,
  ChunkInfo,
  DataChannelState,
  FileManifest,
  PeerMetadata,
  TransferStatus,
  WebRTCConnectionState,
} from "@/types/protocol";

export interface PeerNode {
  metadata: PeerMetadata;
  connectionState: WebRTCConnectionState;
  dataChannelState: DataChannelState;
  lastSeen: number;
  fileChunks?: Map<string, Set<number>>;
  hasChunks?: Set<number>;
  latencyMs?: number;
}

export interface EngineState {
  sessionCode: string | null;
  localPeerId: string;
  localRole: "host" | "peer" | null;
  signalingConnected: boolean;
  peers: Map<string, PeerNode>;
  activeFiles: ActiveFileTransfer[];
  manifest: FileManifest | null;
  chunks: ChunkInfo[];
  transferStatus: TransferStatus;
  transferProgress: number;
  throughputBps: number;
  uploadThroughputBps: number;
  downloadThroughputBps: number;
  etaSeconds: number;
  activeTransportRoute: TransportRoute;
  lastRouteDetection: DetectedRoute | null;
}

export interface LanProgressPacketPayload {
  action?: string;
  fileId: string;
  name?: string;
  sessionId?: string;
  token?: string;
  progress: number;
  speedBytesPerSec: number;
  bytesTransferred: number;
  totalBytes: number;
}

export type StateListener = (state: EngineState) => void;

export interface InternalFileTransfer {
  fileSeqId: number;
  fileId: string;
  manifest: FileManifest;
  chunks: ChunkInfo[];
  status: TransferStatus;
  progress: number;
  speedBytesPerSec: number;
  etaSeconds: number;
  verifiedCount: number;
  totalCount: number;
  isSender: boolean;
  chunker?: Chunker;
  scheduler?: ChunkScheduler;
  rawFile?: File;
  lanSessionId?: string;
  lanToken?: string;
  createdAt: number;
  bytesInterval: number;
}

export interface MeshPeerProgress {
  peerId: string;
  name: string;
  deviceModel?: string;
  isSender: boolean;
  progress: number;
  speedBytesPerSec: number;
  latencyMs: number;
  transferredBytes: number;
  totalBytes: number;
  chunksDownloaded: number;
  totalChunks: number;
  status: "transferring" | "completed" | "waiting" | "paused" | "connected";
  dataChannelState?: string;
  connectionType?: "lan" | "webrtc" | "direct";
}

export interface MeshProgressSummary {
  fileId: string;
  totalMeshSpeedBps: number;
  overallProgress: number;
  totalBytesTransferredAcrossMesh: number;
  completedRecipientPeers: number;
  peers: MeshPeerProgress[];
}
