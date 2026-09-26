export class CryptoEngine {
  private static keyCache = new Map<string, CryptoKey>();

  public static async getSessionKey(secret: string): Promise<CryptoKey> {
    const cleanSecret = secret.trim().toUpperCase() || "DEFAULT-SECRET";
    const cached = this.keyCache.get(cleanSecret);
    if (cached) return cached;

    const encoder = new TextEncoder();
    const rawDigest = await crypto.subtle.digest(
      "SHA-256",
      encoder.encode(cleanSecret),
    );
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      rawDigest,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"],
    );

    this.keyCache.set(cleanSecret, cryptoKey);
    return cryptoKey;
  }

  public static async encryptChunk(
    chunkData: ArrayBuffer,
    secret: string,
  ): Promise<ArrayBuffer> {
    const key = await this.getSessionKey(secret);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      chunkData,
    );

    const result = new Uint8Array(12 + ciphertext.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(ciphertext), 12);
    return result.buffer as ArrayBuffer;
  }

  public static async decryptChunk(
    encryptedData: ArrayBuffer,
    secret: string,
  ): Promise<ArrayBuffer> {
    if (encryptedData.byteLength < 28) {
      return encryptedData;
    }

    try {
      const key = await this.getSessionKey(secret);
      const iv = new Uint8Array(encryptedData, 0, 12);
      const ciphertext = new Uint8Array(encryptedData, 12);

      return await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        ciphertext,
      );
    } catch (err) {
      console.warn("[CryptoEngine] Chunk decryption fallback:", err);
      return encryptedData;
    }
  }

  public static async computeSha256(data: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray
      .map((byteItem) => byteItem.toString(16).padStart(2, "0"))
      .join("");
  }
}
