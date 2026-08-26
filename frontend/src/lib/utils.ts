import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractPeerShortId(
  username?: string | null,
  peerId?: string | null,
): string {
  if (username && username.includes("#")) {
    const afterHash = username.split("#")[1]?.trim();
    if (afterHash) {
      const match = afterHash.match(/^[A-Za-z0-9]{4}/);
      if (match && match[0].toUpperCase() !== "PEER") {
        return match[0].toUpperCase();
      }
    }
  }
  if (peerId) {
    const parts = peerId.split("-");
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i].trim();
      if (p.length === 4 && /^[A-Za-z0-9]{4}$/.test(p) && p.toUpperCase() !== "PEER") {
        return p.toUpperCase();
      }
    }
    const clean = peerId.replace(/peer/gi, "").replace(/[^a-zA-Z0-9]/g, "");
    if (clean.length >= 4) {
      const cand = clean.slice(-4).toUpperCase();
      if (cand !== "PEER") {
        return cand;
      }
    }
    let hash = 0;
    for (let i = 0; i < peerId.length; i++) {
      hash = (hash << 5) - hash + peerId.charCodeAt(i);
      hash |= 0;
    }
    return (Math.abs(hash).toString(36).toUpperCase() + "7X4K").slice(0, 4);
  }
  return "LOCAL";
}