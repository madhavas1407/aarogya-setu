import { randomUUID } from "node:crypto";
import { getSession } from "@/lib/session";
import { decryptMobile } from "@/lib/mobile-crypto";
import { transaction } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession().catch(() => null);
  if (!session || session.actorType !== "hospital") {
    return Response.json({ error: "An active hospital account is required." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const records = await transaction(async (client) => {
      const result = await client.query<{
        booking_id: string;
        facility_id: string;
        specialty: string;
        requested_at: Date | null;
        booking_status: string;
        created_at: Date;
        patient_id: string;
        mobile_ciphertext: Buffer;
        mobile_nonce: Buffer;
        mobile_auth_tag: Buffer;
      }>(
        `SELECT b.id AS booking_id, b.facility_id, b.specialty,
                b.requested_at, b.status AS booking_status, b.created_at, p.id AS patient_id,
                p.mobile_ciphertext, p.mobile_nonce, p.mobile_auth_tag
         FROM bookings b
         JOIN facilities f ON f.id = b.facility_id
         JOIN patients p ON p.id = b.patient_id
         JOIN consents c ON c.id = b.consent_id AND c.patient_id = b.patient_id AND c.facility_id = b.facility_id
         WHERE b.facility_id = $1 AND c.revoked_at IS NULL AND c.expires_at > now()
           AND b.status IN ('requested', 'confirmed')
         ORDER BY b.created_at DESC LIMIT 100`,
        [session.facilityId],
      );
      for (const row of result.rows) {
        await client.query(
          `INSERT INTO access_audit (id, actor_type, actor_id, patient_id, facility_id, booking_id, action)
           VALUES ($1, 'hospital', $2, $3, $4, $5, 'read_booking_contact')`,
          [randomUUID(), session.hospitalUserId, row.patient_id, row.facility_id, row.booking_id],
        );
      }
      return result.rows.map((row) => ({
        bookingId: row.booking_id,
                facilityPlaceId: row.facility_id,
        specialty: row.specialty,
        requestedAt: row.requested_at,
        status: row.booking_status,
        createdAt: row.created_at,
        patient: { id: row.patient_id, mobile: decryptMobile(row.mobile_ciphertext, row.mobile_nonce, row.mobile_auth_tag) },
      }));
    });
    return Response.json({ bookings: records }, { headers: { "Cache-Control": "no-store", "Pragma": "no-cache" } });
  } catch {
    return Response.json({ error: "Hospital booking retrieval is unavailable or not configured." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
