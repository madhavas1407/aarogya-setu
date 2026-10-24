import "server-only";

export type GooglePlace = {
  id: string;
  name: string;
  address?: string;
  category?: string;
  latitude?: number;
  longitude?: number;
  googleMapsUri?: string;
  phone?: string;
  website?: string;
  rating?: number;
  userRatingCount?: number;
  openingHours?: string[];
};

const API = "https://places.googleapis.com/v1/places";
const SEARCH_FIELDS = "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.googleMapsUri";
const DETAIL_FIELDS = "id,displayName,formattedAddress,location,types,googleMapsUri,nationalPhoneNumber,websiteUri,rating,userRatingCount,regularOpeningHours.weekdayDescriptions";

function apiKey() {
  const key = process.env.GOOGLE_MAPS_PLACES_API_KEY;
  if (!key) throw new Error("GOOGLE_PLACES_NOT_CONFIGURED");
  return key;
}

function convert(place: Record<string, any>): GooglePlace {
  return {
    id: String(place.id),
    name: place.displayName?.text ?? "Hospital",
    address: place.formattedAddress,
    category: Array.isArray(place.types) ? place.types.filter((t: string) => !["point_of_interest", "establishment"].includes(t)).slice(0, 2).join(" · ") : undefined,
    latitude: typeof place.location?.latitude === "number" ? place.location.latitude : undefined,
    longitude: typeof place.location?.longitude === "number" ? place.location.longitude : undefined,
    googleMapsUri: place.googleMapsUri,
    phone: place.nationalPhoneNumber,
    website: place.websiteUri,
    rating: place.rating,
    userRatingCount: place.userRatingCount,
    openingHours: place.regularOpeningHours?.weekdayDescriptions,
  };
}

export async function searchPlaces(query: string) {
  const response = await fetch(`${API}:searchText`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": apiKey(), "X-Goog-FieldMask": SEARCH_FIELDS },
    body: JSON.stringify({ textQuery: query, includedType: "hospital", strictTypeFiltering: false, pageSize: 10, regionCode: "IN", languageCode: "en" }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Google Places search failed (HTTP ${response.status}).`);
  const body = await response.json();
  return (Array.isArray(body.places) ? body.places : []).map(convert);
}

export async function getPlaceDetails(placeId: string) {
  const response = await fetch(`${API}/${encodeURIComponent(placeId)}`, {
    headers: { "X-Goog-Api-Key": apiKey(), "X-Goog-FieldMask": DETAIL_FIELDS },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Google Places details failed (HTTP ${response.status}).`);
  return convert(await response.json());
}

export async function isKnownPlaceId(placeId: string) {
  const response = await fetch(`${API}/${encodeURIComponent(placeId)}`, {
    headers: { "X-Goog-Api-Key": apiKey(), "X-Goog-FieldMask": "id" },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status === 404) return false;
  if (!response.ok) throw new Error(`Google Places validation failed (HTTP ${response.status}).`);
  const result = await response.json();
  return result.id === placeId;
}
