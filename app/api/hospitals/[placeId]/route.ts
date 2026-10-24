import { NextRequest } from "next/server";
import { getPlaceDetails } from "@/lib/google-places";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ placeId: string }> }) {
  const { placeId } = await params;
  if (!placeId || placeId.length > 300) return Response.json({ error: "Invalid Google Place ID." }, { status: 400 });
  try {
    const place = await getPlaceDetails(placeId);
    if (!place) return Response.json({ error: "Place not found." }, { status: 404 });
    return Response.json({ status: "connected", source: "Google Maps Platform · Places API", fetchedAt: new Date().toISOString(), place }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const notConfigured = error instanceof Error && error.message === "GOOGLE_PLACES_NOT_CONFIGURED";
    return Response.json({ error: notConfigured ? "Google Places is not configured." : (error instanceof Error ? error.message : "Place details request failed.") }, { status: notConfigured ? 503 : 502 });
  }
}
