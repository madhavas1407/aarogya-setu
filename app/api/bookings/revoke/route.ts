import { randomUUID } from "node:crypto";
import { getSession } from "@/lib/session";
import { transaction } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSession().catch(() => undefined);
  if (session === undefined) {
    return Response.json({ error: "Session storage is unavailable or not configured." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  if (!session || session.actorType !== "patient") {
    return Response.json({ error: "A verified patient session is required." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  let bookingId = "";
  try { bookingId = String((await request.json()).bookingId ?? ""); } catch { /* handled below */ }
  if (!/^[0-9a-f-]{36}$/i.test(bookingId)) return Response.json({ error: "A valid booking ID is required." }, { status: 400 });
  try {
    const result = await transaction(async (client) => {
      const updated = await client.query<{ id: string; facility_id: string }>(
        `UPDATE consents c SET revoked_at = now()
         FROM bookings b
         WHERE b.consent_id = c.id AND b.id = $1 AND b.patient_id = $2
           AND c.patient_id = $2 AND c.revoked_at IS NULL
         RETURNING c.id, c.facility_id`,
        [bookingId, session.patientId],
      );
      if (!updated.rows[0]) return false;
      await client.query(
        `INSERT INTO access_audit (id, actor_type, actor_id, patient_id, facility_id, booking_id, action)
         VALUES ($1, 'patient', $2, $2, $3, $4, 'revoke_contact_consent')`,
        [randomUUID(), session.patientId, updated.rows[0].facility_id, bookingId],
      );
      return true;
    });
    if (!result) return Response.json({ error: "No active consent was found for this booking." }, { status: 404 });
    return Response.json({ revoked: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Consent revocation is unavailable or not configured." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
