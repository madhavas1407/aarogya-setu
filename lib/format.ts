import type { Coordinates } from "@/types/care";

/** Great-circle distance in kilometres. */
export function distanceKm(from: Coordinates, to: Coordinates) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = radians(to.latitude - from.latitude);
  const dLon = radians(to.longitude - from.longitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

/** Turns Google place types such as "general_hospital · doctor" into "General hospital · Doctor". */
export function formatCategory(category?: string) {
  if (!category) return "";
  return category
    .split(" · ")
    .map((type) => type.replace(/_/g, " "))
    .map((type) => type.charAt(0).toUpperCase() + type.slice(1))
    .join(" · ");
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function maskMobile(mobile: string) {
  return `+91 ${mobile.slice(0, 2)}••••••${mobile.slice(-2)}`;
}
