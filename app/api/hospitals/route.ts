import { NextRequest } from "next/server";
import { searchPlaces, type SearchBias } from "@/lib/google-places";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SOURCE = "Google Maps Platform · Places API";
const NEAR_ME_RADIUS_METERS = 15_000;

function parseBias(lat: string | null, lng: string | null): SearchBias | null | undefined {
  if (lat === null && lng === null) return undefined;
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude, radiusMeters: NEAR_ME_RADIUS_METERS };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const near = parseBias(searchParams.get("lat"), searchParams.get("lng"));
  if (near === null) return Response.json({ status: "invalid_query", message: "Location coordinates are invalid.", hospitals: [] }, { status: 400 });

  // The user must supply something to search for (or a location); "India" alone would be a wasted billable request.
  const userParts = [searchParams.get("specialty"), searchParams.get("q"), searchParams.get("district"), searchParams.get("state")]
    .map((part) => part?.trim()).filter((part): part is string => Boolean(part));
  if (!userParts.length && !near) return Response.json({ status: "invalid_query", message: "Enter a hospital name, district, or state to search.", hospitals: [] }, { status: 400 });
  const query = [...(userParts.length ? userParts : ["hospital"]), ...(near ? [] : ["India"])].join(" ");
  if (query.length > 180) return Response.json({ status: "invalid_query", message: "The search is too long. Shorten the name or location.", hospitals: [] }, { status: 400 });

  const limit = rateLimit(request, "hospital-search", 20);
  if (!limit.allowed) {
    return Response.json({ status: "rate_limited", message: `Too many searches. Try again in ${limit.retryAfterSeconds}s.`, hospitals: [] }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds), "Cache-Control": "no-store" } });
  }

  try {
    const hospitals = await searchPlaces(query, near);
    return Response.json({ status: "connected", source: SOURCE, sourceUrl: "https://developers.google.com/maps/documentation/places/web-service", fetchedAt: new Date().toISOString(), freshness: "Fetched live from Google Places for this search; details are not persisted.", partial: hospitals.length === 10, hospitals }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const notConfigured = error instanceof Error && error.message === "GOOGLE_PLACES_NOT_CONFIGURED";
    return Response.json({ status: notConfigured ? "not_configured" : "provider_error", source: SOURCE, message: notConfigured ? "Set GOOGLE_MAPS_PLACES_API_KEY in .env.local. Enable Places API (New) and billing in your Google Cloud project." : (error instanceof Error ? error.message : "Google Places request failed."), hospitals: [] }, { status: notConfigured ? 503 : 502, headers: { "Cache-Control": "no-store" } });
  }
}
