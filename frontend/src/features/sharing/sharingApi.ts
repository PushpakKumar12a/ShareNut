import { get, post } from "@/services/api";
import type { Transfer } from "@/types/api";

export interface TransferPeerDetail {
  id: string;
  user_id: string;
  device_id: string;
  peer_id: string;
  username: string;
  device_name: string;
  role: "host" | "peer";
  joined_at: string;
  is_online: boolean;
}

export interface TransferDetail extends Transfer {
  name: string;
  peers_count: number;
  peers: TransferPeerDetail[];
}

export interface CreateTransferPayload {
  name?: string;
}

export interface JoinTransferPayload {
  session_code: string;
  device_id: string;
  peer_id: string;
}

export function createTransfer(
  payload: CreateTransferPayload = {},
): Promise<TransferDetail> {
  return post<TransferDetail>("/v1/transfers/create", payload);
}

export function getTransfer(sessionCode: string): Promise<TransferDetail> {
  return get<TransferDetail>(`/v1/transfers/${sessionCode.toUpperCase()}`);
}

export function joinTransfer(
  payload: JoinTransferPayload,
): Promise<TransferDetail> {
  return post<TransferDetail>(
    `/v1/transfers/${payload.session_code.toUpperCase()}/join`,
    payload,
  );
}
