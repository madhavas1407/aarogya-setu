import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { transaction } from "@/lib/db";
import { isKnownPlaceId } from "@/lib/google-places";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await getSession().catch(() => null);
  if (!session || session.actorType !== "patient") {
    return Response.json({ error: "A verified patient session is required." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  let body: { facilityId?: string; specialty?: string; requestedAt?: string; shareContact?: boolean };
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const facilityId = body.facilityId?.trim();
  const specialty = body.specialty?.trim();
  if (!facilityId || facilityId.length > 180 || !specialty || specialty.length > 100) {
    return Response.json({ error: "Facility and specialty details are required." }, { status: 400 });
  }
  if (body.shareContact !== true) {
    return Response.json({ error: "Explicit consent to share contact details with this facility is required." }, { status: 403 });
  }
  const requestedAt = body.requestedAt ? new Date(body.requestedAt) : null;
  if (requestedAt && (!Number.isFinite(requestedAt.getTime()) || requestedAt.getTime() < Date.now())) {
    return Response.json({ error: "Requested time must be a valid future date." }, { status: 400 });
  }

  try {
    if (!(await isKnownPlaceId(facilityId))) return Response.json({ error: "Google Place ID was not found." }, { status: 404 });
    const bookingId = randomUUID();
    const consentId = randomUUID();
    const patientId = session.patientId;
    await transaction(async (client) => {
      await client.query(
        `INSERT INTO facilities (id, source, source_url)
         VALUES ($1, 'Google Maps Platform Places API', 'https://developers.google.com/maps/documentation/places/web-service')
         ON CONFLICT (id) DO UPDATE SET updated_at = now()`,
        [facilityId],
      );
      await client.query(
        `INSERT INTO consents (id, patient_id, facility_id, purpose, consent_text_version, expires_at)
         VALUES ($1, $2, $3, 'appointment_contact', 'contact-sharing-v1', now() + interval '30 days')`,
        [consentId, patientId, facilityId],
      );
      await client.query(
        `INSERT INTO bookings (id, patient_id, facility_id, consent_id, specialty, requested_at, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'requested')`,
        [bookingId, patientId, facilityId, consentId, specialty, requestedAt],
      );
      await client.query(
        `INSERT INTO access_audit (id, actor_type, actor_id, patient_id, facility_id, booking_id, action)
         VALUES ($1, 'patient', $2, $3, $4, $5, 'booking_request_and_contact_consent')`,
        [randomUUID(), patientId, patientId, facilityId, bookingId],
      );
    });
    return Response.json({ id: bookingId, status: "requested", message: "Request recorded. This is not a confirmed appointment until the facility confirms it." }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Booking storage is unavailable or not configured." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
