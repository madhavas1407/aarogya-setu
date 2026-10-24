import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";

function keyFromEnvironment(): Buffer {
  const encoded = process.env.PATIENT_MOBILE_ENCRYPTION_KEY;
  if (!encoded) throw new Error("PATIENT_MOBILE_ENCRYPTION_KEY is not configured.");
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) throw new Error("PATIENT_MOBILE_ENCRYPTION_KEY must decode to exactly 32 bytes.");
  return key;
}

export function encryptMobile(mobile: string) {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyFromEnvironment(), nonce);
  const ciphertext = Buffer.concat([cipher.update(mobile, "utf8"), cipher.final()]);
  return { ciphertext, nonce, authTag: cipher.getAuthTag() };
}

export function decryptMobile(ciphertext: Buffer, nonce: Buffer, authTag: Buffer) {
  const decipher = createDecipheriv("aes-256-gcm", keyFromEnvironment(), nonce);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

export function mobileLookupHash(mobile: string) {
  const encoded = process.env.PATIENT_LOOKUP_PEPPER;
  if (!encoded) throw new Error("PATIENT_LOOKUP_PEPPER is not configured.");
  const pepper = Buffer.from(encoded, "base64");
  if (pepper.length < 32) throw new Error("PATIENT_LOOKUP_PEPPER must decode to at least 32 bytes.");
  return createHmac("sha256", pepper).update(mobile, "utf8").digest();
}
