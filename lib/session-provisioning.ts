import { createHash, randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { query, transaction } from "@/lib/db";
import { encryptMobile, mobileLookupHash } from "@/lib/mobile-crypto";

const SESSION_LIFETIME_SECONDS = 60 * 60 * 24 * 7;

async function setSessionCookie(token: string) {
  (await cookies()).set("aarogya_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_LIFETIME_SECONDS,
  });
}

async function issueSession(values: { actorType: "patient" | "hospital"; actorId: string }) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest();
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_SECONDS * 1000);
  await query(
    `INSERT INTO sessions (token_hash, actor_type, patient_id, hospital_user_id, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [tokenHash, values.actorType, values.actorType === "patient" ? values.actorId : null, values.actorType === "hospital" ? values.actorId : null, expiresAt],
  );
  await setSessionCookie(token);
}

/** Call only from a server-side callback after a real OTP/identity provider verifies the E.164 mobile. */
export async function provisionVerifiedPatientSession(verifiedMobileE164: string) {
  if (!/^\+[1-9]\d{7,14}$/.test(verifiedMobileE164)) throw new Error("A verified E.164 mobile number is required.");
  const encrypted = encryptMobile(verifiedMobileE164);
  const lookupHash = mobileLookupHash(verifiedMobileE164);
  const patientId = await transaction(async (client) => {
    const existing = await client.query<{ id: string }>("SELECT id FROM patients WHERE mobile_lookup_hash = $1 LIMIT 1", [lookupHash]);
    if (existing.rows[0]) {
      await client.query(
        `UPDATE patients SET mobile_ciphertext = $2, mobile_nonce = $3, mobile_auth_tag = $4, updated_at = now()
         WHERE id = $1`,
        [existing.rows[0].id, encrypted.ciphertext, encrypted.nonce, encrypted.authTag],
      );
      return existing.rows[0].id;
    }
    const id = randomUUID();
    await client.query(
      `INSERT INTO patients (id, mobile_ciphertext, mobile_nonce, mobile_auth_tag, mobile_lookup_hash)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, encrypted.ciphertext, encrypted.nonce, encrypted.authTag, lookupHash],
    );
    return id;
  });
  await issueSession({ actorType: "patient", actorId: patientId });
  return patientId;
}

/** Call only after the organization's identity provider authenticates an enabled hospital user. */
export async function provisionActiveHospitalSession(identitySubject: string) {
  if (!identitySubject || identitySubject.length > 200) throw new Error("A trusted identity-provider subject is required.");
  const result = await query<{ id: string }>(
    "SELECT id FROM hospital_users WHERE identity_subject = $1 AND status = 'active' LIMIT 1",
    [identitySubject],
  );
  const hospitalUser = result.rows[0];
  if (!hospitalUser) throw new Error("No active hospital account is assigned to this identity.");
  await issueSession({ actorType: "hospital", actorId: hospitalUser.id });
  return hospitalUser.id;
}
