import { NextRequest } from "next/server";
import { searchPlaces } from "@/lib/google-places";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = [searchParams.get("q"), searchParams.get("district"), searchParams.get("state"), "India"]
    .map((part) => part?.trim()).filter(Boolean).join(" ");
  if (query.length < 4 || query.length > 180) return Response.json({ status: "invalid_query", message: "Enter a hospital name, district, or state to search.", hospitals: [] }, { status: 400 });
  try {
    const hospitals = await searchPlaces(query);
    return Response.json({ status: "connected", source: "Google Maps Platform · Places API", sourceUrl: "https://developers.google.com/maps/documentation/places/web-service", fetchedAt: new Date().toISOString(), freshness: "Fetched live from Google Places for this search; details are not persisted.", partial: hospitals.length === 10, hospitals }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const notConfigured = error instanceof Error && error.message === "GOOGLE_PLACES_NOT_CONFIGURED";
    return Response.json({ status: notConfigured ? "not_configured" : "provider_error", source: "Google Maps Platform · Places API", message: notConfigured ? "Set GOOGLE_MAPS_PLACES_API_KEY in .env.local. Enable Places API (New) and billing in your Google Cloud project." : (error instanceof Error ? error.message : "Google Places request failed."), hospitals: [] }, { status: notConfigured ? 503 : 502, headers: { "Cache-Control": "no-store" } });
  }
}
