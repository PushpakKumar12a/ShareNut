import fs from "fs";
import path from "path";
import crypto from "crypto";

export function generate1MbPayload(): { filePath: string; size: number; sha256: string } {
  const filePath = path.resolve("payload_1mb.bin");
  const size = 1024 * 1024;
  const buffer = Buffer.alloc(size);

  for (let i = 0; i < size; i++) {
    buffer[i] = (i * 37 + 23) & 0xff;
  }

  fs.writeFileSync(filePath, buffer);
  const hash = crypto.createHash("sha256").update(buffer).digest("hex");

  return { filePath, size, sha256: hash };
}

if (require.main === module) {
  const result = generate1MbPayload();
  console.log(`Generated: ${result.filePath}`);
  console.log(`Size: ${result.size.toLocaleString()} bytes`);
  console.log(`SHA-256: ${result.sha256}`);
}
