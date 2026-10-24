# AAROGYA-SETU — React + Next.js

Next.js App Router provides the React frontend and backend route handlers. The hospital search uses Google Maps Platform Places API (New); PostgreSQL stores booking and consent records locally. Real appointment availability, beds, SMS, payments, hospital authentication, and emergency dispatch are not connected.

## Requirements and local startup

Install Node.js 20.9+ and Docker Desktop. This checkout includes an ignored `.env.local` with random local PostgreSQL and encryption secrets; add your Google key to it. For a fresh checkout, create it from the example using `Copy-Item .env.example .env.local`, then configure the values below. To generate a strong local PostgreSQL password in PowerShell:

```powershell
[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Use that same value for `POSTGRES_PASSWORD` and the password part of `DATABASE_URL`. The generated hex password needs no URL escaping. Add independent 32-byte base64 keys for the patient encryption and lookup settings, then start PostgreSQL and Next.js:

```powershell
docker compose --env-file .env.local up -d postgres
npm install
npm run dev
```

Open `http://localhost:3000`. PostgreSQL data is persisted under `.data/postgres` inside this project, excluded from Git. The schema is applied automatically when the database volume is first created. To re-apply later schema changes, run:

```powershell
docker compose --env-file .env.local exec postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/001-schema.sql'
```

`DATABASE_URL` must match the local PostgreSQL settings. The database service binds to `127.0.0.1`, not the network. If using a pre-existing database, back it up and apply schema migrations deliberately; `CREATE TABLE IF NOT EXISTS` does not modify old table shapes.

## Google Places API setup

1. In [Google Cloud Console](https://console.cloud.google.com/), create/select a project, enable Places API (New), attach a billing account, and set quota/budget alerts and API quotas.
2. Create a server API key restricted to Places API (New). Add it as `GOOGLE_MAPS_PLACES_API_KEY` in `.env.local`. Keep this secret server-side; do not use a `NEXT_PUBLIC_` prefix.
3. To show the incident scenario map, enable Maps Embed API and make a separate browser key restricted to that API and HTTP referrers (`http://localhost:3000/*` plus your real production domain). Put it in `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY`.
4. Restart Next.js after changing environment variables.

Hospitals are searched from `GET /api/hospitals?q=...&district=...&state=...&specialty=...`. At least one of `q`, `district`, `state`, or a location is required. An empty search is rejected without calling Google. “Near me” sends the browser's coordinates as `lat`/`lng`, which bias the search to a 15 km radius. Coordinates are used for that request only and are never stored. Search and details requests are rate limited per client IP (20 and 30 per minute). The limiter lives in server memory, so a multi-instance deployment needs a shared store such as Redis. The app calls Google only when the user searches. Selecting “Load phone, website, rating & hours” makes an additional Place Details request, which may have a higher billable SKU depending on returned fields. Check current [Places API billing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing), [Text Search fields](https://developers.google.com/maps/documentation/places/web-service/text-search), and [Place Details fields](https://developers.google.com/maps/documentation/places/web-service/place-details) before enabling production use. Search results are capped to 10 per request.

Google Place IDs are stored for facility references. The app does not persist Places names, addresses, phone numbers, ratings, website, opening hours, or coordinates in PostgreSQL; those details are returned live and kept only in the current browser memory. Google Maps content is linked to Google Maps, and the optional embedded map also uses Google Maps. Review Google's [Places policies](https://developers.google.com/maps/documentation/places/web-service/policies) and [Maps Platform terms](https://cloud.google.com/maps-platform/terms/maps-service-terms) before launch.

Places API is a facility discovery source, not a hospital information system: it does not provide reliable vacant beds, doctor rosters, emergency capacity, appointment inventory, or confirmation. Those require direct, authorized hospital/government feeds. Public webpages should not be scraped as a substitute for an authorized API or feed.

## Patient data and hospital access

The schema stores patient mobile numbers encrypted with AES-256-GCM and a separate keyed hash for exact matching. Configure `PATIENT_MOBILE_ENCRYPTION_KEY` and `PATIENT_LOOKUP_PEPPER` with independent random 32-byte base64 values. Never commit `.env.local` or `.data/` or paste secrets into source control. `POST /api/bookings` requires a server-issued patient session and explicit consent. The hospital read endpoint is scoped to a facility and active, unrevoked consent. Accesses are audit logged.

The current on-screen OTP is a browser-only demo and cannot authenticate or create a patient session. Session provisioning helpers are not exposed as unauthenticated routes. A trusted OTP/identity provider callback and verified, activated hospital accounts must be connected before any real patient booking/contact workflow can operate. Do not use real patient data until authentication, backup/restore, retention/deletion, abuse protection, security review, and privacy/legal review are in place.

## Project structure

- `app/page.tsx` holds the page state and composes the components in `components/`: verification (01), care area (02), hospital directory (03), visit request (04), emergency help, and visit preparation.
- `lib/care-data.ts` holds care areas, emergency numbers, warning signs, and the visit checklist. `lib/format.ts` holds distance and display helpers.
- `app/globals.css` defines light and dark design tokens; the theme follows the operating system's colour scheme.
- The visit checklist is saved in the browser's `localStorage`. Requests sent during a visit are listed in memory only and disappear on reload.

## Demo-only journeys

- OTP, payment, pass/QR, and eligibility are simulations.
- Emergency scenario locations and ambulance animation are examples; no incident feed or dispatch request is sent. Call 108 for emergencies.
- Booking requests saved to PostgreSQL are not confirmed appointments.
- Bed availability, appointment slots, SMS, payments, and provider-side booking integrations remain disconnected.
