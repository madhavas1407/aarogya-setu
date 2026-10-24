export const dynamic = "force-dynamic";

export async function GET() {
  const directoryConfigured = Boolean(process.env.GOOGLE_MAPS_PLACES_API_KEY);
  return Response.json({
    app: "AAROGYA-SETU",
    backend: "Next.js Route Handlers",
    database: process.env.DATABASE_URL ? "configured" : "not_configured",
    hospitalDirectory: directoryConfigured ? "configured" : "not_configured",
    hospitalDirectorySource: "Google Maps Platform Places API",
    liveBeds: "not_available_without a participating hospital or government bed feed",
    liveAppointments: "not_available_without provider/UHI integration",
    patientIdentityVerification: "not_connected; demo OTP does not authenticate patients",
    hospitalAccounts: "require verified facility onboarding and identity-provider sessions",
    sms: "demo_only",
    payment: "demo_only",
    ambulanceDispatch: "not_connected; call 108 for emergencies",
  });
}
