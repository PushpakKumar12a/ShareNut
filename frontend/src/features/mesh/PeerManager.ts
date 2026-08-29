export function generateFingerprint(): string {
  if (typeof window === "undefined") {
    return "ShareNut-node-srv-" + Math.random().toString(36).slice(2, 14);
  }

  const stored = localStorage.getItem("ShareNut_device_fingerprint");
  if (stored && stored.length >= 8) {
    return stored;
  }

  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width.toString(),
    screen.height.toString(),
    screen.colorDepth.toString(),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency?.toString() ?? "4",
  ];

  const raw = components.join("|");
  let hash1 = 5381;
  let hash2 = 52711;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash1 = ((hash1 << 5) + hash1) ^ char;
    hash2 = ((hash2 << 5) + hash2) ^ char;
  }

  const hex1 = Math.abs(hash1).toString(16).padStart(8, "0");
  const hex2 = Math.abs(hash2).toString(16).padStart(8, "0");
  const fp = `node-${hex1}${hex2}`;

  try {
    localStorage.setItem("ShareNut_device_fingerprint", fp);
  } catch {}

  return fp;
}

export function detectDeviceName(): string {
  if (typeof window === "undefined") return "Unknown Device";

  const ua = navigator.userAgent;

  let browser = "Browser";
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";

  let os = "";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  return os ? `${browser} on ${os}` : browser;
}
