/**
 * AES-256-GCM symmetric encryption for integration configs.
 *
 * Integration configs contain third-party credentials (API keys, SMTP
 * passwords, Slack webhooks). These are encrypted before writing to the
 * integrations.config JSONB column and decrypted on read.
 *
 * Storage format in DB:
 *   { "_enc": "<iv>:<authTag>:<ciphertext>" }  (all base64url)
 *
 * Backwards compatibility:
 *   If config does NOT have an "_enc" key, decryptConfig returns it
 *   unchanged. This handles rows written before encryption was enabled.
 *
 * Requirement:
 *   ENCRYPTION_KEY env var must be a 64-char hex string (32 bytes).
 *   The app hard-fails if this is missing — never stores plaintext credentials.
 *
 * Key rotation:
 *   To rotate, decrypt with the old key, re-encrypt with the new key.
 *   A future key-version field can be added to the format if needed.
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV — recommended for GCM
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY is not set or invalid. " +
        "Set a 64-char hex string (32 bytes). " +
        "Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  return Buffer.from(hex, "hex");
}

/**
 * Encrypt a config object. Returns { "_enc": "iv:tag:ciphertext" }.
 * Always encrypts — call this on every write.
 */
export function encryptConfig(
  plainConfig: Record<string, unknown>
): Record<string, unknown> {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: TAG_LENGTH,
  });

  const plaintext = JSON.stringify(plainConfig);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  const payload = [
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");

  return { _enc: payload };
}

/**
 * Decrypt a config object. If the object has no "_enc" key the row predates
 * encryption. We return it unchanged so the app keeps working, but emit a
 * server-side warning so the issue is visible in logs. Run
 * `node scripts/encrypt-plaintext-integrations.mjs` to backfill these rows.
 */
export function decryptConfig(
  storedConfig: Record<string, unknown>
): Record<string, unknown> {
  if (!storedConfig || typeof storedConfig._enc !== "string") {
    if (storedConfig && Object.keys(storedConfig).length > 0) {
      // Non-empty config without encryption — row predates AES-256-GCM storage.
      // This is a security gap: credentials are stored in plaintext.
      // Fix: run `node scripts/encrypt-plaintext-integrations.mjs`
      console.warn(
        "[config-cipher] SECURITY WARNING: integration config row is not encrypted. " +
          "Run `node scripts/encrypt-plaintext-integrations.mjs` to backfill."
      );
    }
    return storedConfig ?? {};
  }

  const key = getKey();
  const parts = storedConfig._enc.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted config format.");
  }

  const iv = Buffer.from(parts[0], "base64url");
  const authTag = Buffer.from(parts[1], "base64url");
  const ciphertext = Buffer.from(parts[2], "base64url");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString("utf8")) as Record<string, unknown>;
}
