import type { LucideIcon } from "lucide-react";

export type ApiState = "idle" | "loading" | "connected" | "not_configured" | "provider_error";

export type CareArea = { icon: LucideIcon; name: string; specialty: string; urgent?: boolean };

export type Coordinates = { latitude: number; longitude: number };

/** A booking request sent during this browser session. Kept in memory only. */
export type VisitRequest = {
  id: string;
  facilityName: string;
  specialty: string;
  createdAt: string;
  requestedAt?: string;
  revoked: boolean;
};

/** Shape of GET /api/status. */
export type BackendStatus = {
  database: "configured" | "not_configured";
  hospitalDirectory: "configured" | "not_configured";
  liveBeds: string;
  liveAppointments: string;
  patientIdentityVerification: string;
  sms: string;
  payment: string;
  ambulanceDispatch: string;
};
