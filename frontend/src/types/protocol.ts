export type SignalingType =
  | "JOIN"
  | "JOINED"
  | "PEER_JOINED"
  | "PEER_LEFT"
  | "OFFER"
  | "ANSWER"
  | "ICE_CANDIDATE"
  | "MESSAGE"
  | "TRANSFER_UPDATE"
  | "ERROR"
  | "PING"
  | "PONG";

export interface SignalingMessage<T = Record<string, unknown>> {
  type: SignalingType;
  session_code: string;
  sender_peer_id?: string;
  target_peer_id?: string | null;
  payload?: T;
}

export interface PeerMetadata {
  peer_id: string;
  user_id: string;
  username: string;
  device_id: string;
  device_name: string;
  role: "host" | "peer";
}

export type WebRTCConnectionState =
  | "new"
  | "connecting"
  | "connected"
  | "disconnected"
  | "failed"
  | "closed";

export type DataChannelState = "connecting" | "open" | "closing" | "closed";

export type DataMessageType =
  | "TEST_MESSAGE"
  | "PING"
  | "PONG"
  | "HELLO"
  | "MANIFEST"
  | "BITFIELD"
  | "REQUEST_CHUNK"
  | "CHUNK_DATA"
  | "HAVE_CHUNK"
  | "TRANSFER_COMPLETE"
  | "TRANSFER_PAUSE"
  | "TRANSFER_CANCEL"
  | "RESUME_QUERY"
  | "RESUME_ACK"
  | "CANCEL";

export interface DataMessage<T = unknown> {
  type: DataMessageType;
  timestamp: number;
  sender_peer_id: string;
  payload?: T;
}

export interface TestMessagePayload {
  text: string;
  sender_name: string;
}

export type ChunkStatus =
  | "verified"
  | "downloading"
  | "pending"
  | "failed"
  | "idle";

export interface ChunkInfo {
  index: number;
  offset: number;
  size: number;
  hash: string;
  status: ChunkStatus;
  peerId?: string;
  progress?: number;
}

export interface FileManifest {
  fileId: string;
  name: string;
  size: number;
  mimeType: string;
  chunkSize: number;
  totalChunks: number;
  chunkHashes: string[];
  rootHash?: string;
}

export interface ManifestPacketPayload {
  fileSeqId: number;
  manifest: FileManifest;
}

export type TransferStatus =
  | "idle"
  | "hashing"
  | "ready"
  | "waiting"
  | "transferring"
  | "paused"
  | "completed"
  | "cancelled"
  | "failed";

export interface ActiveFileTransfer {
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
  senderPeerId?: string;
  senderAvailable?: boolean;
  createdAt: number;
}