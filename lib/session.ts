import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { query } from "@/lib/db";

export type PatientSession = { actorType: "patient"; patientId: string };
export type HospitalSession = { actorType: "hospital"; hospitalUserId: string; facilityId: string };
export type Session = PatientSession | HospitalSession;

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get("aarogya_session")?.value;
  if (!token || !/^[A-Za-z0-9_-]{40,100}$/.test(token)) return null;
  const tokenHash = createHash("sha256").update(token).digest();
  const result = await query<{
    actor_type: "patient" | "hospital";
    patient_id: string | null;
    hospital_user_id: string | null;
    facility_id: string | null;
  }>(
    `SELECT s.actor_type, s.patient_id, s.hospital_user_id, h.facility_id
     FROM sessions s
     LEFT JOIN hospital_users h ON h.id = s.hospital_user_id AND h.status = 'active'
     WHERE s.token_hash = $1 AND s.revoked_at IS NULL AND s.expires_at > now()
     LIMIT 1`,
    [tokenHash],
  );
  const row = result.rows[0];
  if (!row) return null;
  if (row.actor_type === "patient" && row.patient_id) return { actorType: "patient", patientId: row.patient_id };
  if (row.actor_type === "hospital" && row.hospital_user_id && row.facility_id) {
    return { actorType: "hospital", hospitalUserId: row.hospital_user_id, facilityId: row.facility_id };
  }
  return null;
}
