export interface User {
  username: string;
}

export interface Device {
  device_name: string;
  is_online: boolean;
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