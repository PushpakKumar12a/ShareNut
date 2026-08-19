export interface User {
  id: string;
  email?: string;
  username: string;
  is_active?: boolean;
  created_at?: string;
}

export interface Device {
  id: string;
  device_name: string;
  fingerprint: string;
  is_online: boolean;
  last_seen_at: string;
  created_at: string;
}

export interface ApiError {
  detail: string;
  status: number;
}

export interface Transfer {
  id: string;
  creator_id: string;
  session_code: string | null;
  status: string;
  created_at: string;
  completed_at: string | null;
}

export type TransferSessionStatus =
  | "created"
  | "connecting"
  | "transferring"
  | "paused"
  | "waiting_for_source"
  | "resuming"
  | "complete"
  | "failed"
  | "cancelled"
  | "seeding";