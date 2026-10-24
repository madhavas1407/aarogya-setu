"use client";

import { CircleCheck, KeyRound, LoaderCircle, LocateFixed, RefreshCw, Search, TriangleAlert, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { HospitalCard } from "@/components/HospitalCard";
import type { Notify } from "@/components/Toast";
import { distanceKm } from "@/lib/format";
import type { ApiState, CareArea, Coordinates } from "@/types/care";
import type { DirectoryResponse, Hospital } from "@/types/hospital";

type SearchInput = { state: string; district: string; query: string; specialty?: string; near: Coordinates | null };

type Props = {
  careArea: CareArea | null;
  onClearCareArea: () => void;
  chosenId?: string;
  onChoose: (hospital: Hospital) => void;
  onStateChange: (state: ApiState) => void;
  notify: Notify;
};

export function DirectoryPanel({ careArea, onClearCareArea, chosenId, onChoose, onStateChange, notify }: Props) {
  const [stateName, setStateName] = useState("");
  const [district, setDistrict] = useState("");
  const [query, setQuery] = useState("");
  const [near, setNear] = useState<Coordinates | null>(null);
  const [locating, setLocating] = useState(false);
  const [directory, setDirectory] = useState<DirectoryResponse | null>(null);
  const [apiState, setApiState] = useState<ApiState>("idle");
  const [apiMessage, setApiMessage] = useState("");
  const [sort, setSort] = useState<"relevance" | "distance">("relevance");
  const [details, setDetails] = useState<Record<string, Hospital>>({});
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null);
  const lastSearch = useRef<SearchInput | null>(null);
  const requestSeq = useRef(0);

  useEffect(() => onStateChange(apiState), [apiState, onStateChange]);

  async function runSearch(input: SearchInput) {
    if (!input.query.trim() && !input.district.trim() && !input.state.trim() && !input.near) {
      setApiState("idle");
      setApiMessage(input.specialty ? `Add a district or state, or use your location, to find ${input.specialty} care.` : "Enter a hospital name, district or state, or use your location.");
      return;
    }
    const params = new URLSearchParams();
    if (input.specialty) params.set("specialty", input.specialty);
    if (input.query.trim()) params.set("q", input.query.trim());
    if (input.district.trim()) params.set("district", input.district.trim());
    if (input.state.trim()) params.set("state", input.state.trim());
    if (input.near) {
      params.set("lat", input.near.latitude.toFixed(5));
      params.set("lng", input.near.longitude.toFixed(5));
    }

    lastSearch.current = input;
    // Only the latest search may update the results; slower, older responses are discarded.
    const seq = ++requestSeq.current;
    setApiState("loading");
    setApiMessage("");
    try {
      const response = await fetch(`/api/hospitals?${params.toString()}`, { cache: "no-store" });
      const data = await response.json();
      if (seq !== requestSeq.current) return;
      if (data.status === "connected") {
        setDirectory(data);
        setApiState("connected");
        setSort(input.near ? "distance" : "relevance");
      } else {
        setDirectory(null);
        setApiState(data.status === "not_configured" ? "not_configured" : data.status === "invalid_query" ? "idle" : "provider_error");
        setApiMessage(data.message || "The hospital directory could not be reached.");
      }
    } catch {
      if (seq !== requestSeq.current) return;
      setDirectory(null);
      setApiState("provider_error");
      setApiMessage("Could not reach the application server. Check that the Next.js server is running.");
    }
  }

  const currentInput = (overrides: Partial<SearchInput> = {}): SearchInput => ({ state: stateName, district, query, specialty: careArea?.specialty, near, ...overrides });

  // Choosing a different care area re-runs the last search with the new specialty.
  useEffect(() => {
    if (lastSearch.current) void runSearch({ ...lastSearch.current, specialty: careArea?.specialty });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [careArea?.specialty]);

  function submit(event: FormEvent) {
    event.preventDefault();
    void runSearch(currentInput());
  }

  function searchNearMe() {
    if (!("geolocation" in navigator)) { notify("Location is not available in this browser."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const coords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        setNear(coords);
        void runSearch(currentInput({ near: coords }));
      },
      (error) => {
        setLocating(false);
        notify(error.code === error.PERMISSION_DENIED ? "Location permission was denied. Search by district or state instead." : "Could not get your location. Try again or search by district.");
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }

  function clearLocation() {
    setNear(null);
    setSort("relevance");
  }

  async function loadPlaceDetails(placeId: string) {
    setLoadingDetails(placeId);
    try {
      const response = await fetch(`/api/hospitals/${encodeURIComponent(placeId)}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load place details.");
      setDetails((current) => ({ ...current, [placeId]: result.place }));
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not load place details.");
    } finally {
      setLoadingDetails(null);
    }
  }

  const results = useMemo(() => {
    const list = (directory?.hospitals ?? []).map((hospital) => ({
      hospital,
      distance: near && hospital.latitude !== undefined && hospital.longitude !== undefined
        ? distanceKm(near, { latitude: hospital.latitude, longitude: hospital.longitude })
        : undefined,
    }));
    if (sort === "distance") list.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    return list;
  }, [directory, near, sort]);

  const statusPill = apiState === "connected" ? ["pill-good", "Google Places live"]
    : apiState === "loading" ? ["pill-muted", "Searching…"]
    : apiState === "idle" ? ["pill-muted", "Ready to search"]
    : ["pill-warn", "Not connected"];

  return (
    <section className="panel" id="find-care" aria-labelledby="directory-title">
      <div className="panel-heading">
        <span className="step-badge">03</span>
        <div>
          <h2 id="directory-title">Find a hospital</h2>
          <p>Live Google Places search. Full details load only when you ask for them.</p>
        </div>
        <span className={`pill ${statusPill[0]}`}>{statusPill[1]}</span>
      </div>

      <form className="search-form" onSubmit={submit}>
        <div className="field field-query">
          <label htmlFor="query">Hospital name or keyword</label>
          <div className="input-group">
            <Search className="input-icon" aria-hidden="true" />
            <input id="query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. government hospital, RIMS" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="district">District / city</label>
          <input className="input" id="district" value={district} onChange={(event) => setDistrict(event.target.value)} placeholder="e.g. YSR Kadapa" />
        </div>
        <div className="field">
          <label htmlFor="state">State / UT</label>
          <input className="input" id="state" value={stateName} onChange={(event) => setStateName(event.target.value)} placeholder="e.g. Andhra Pradesh" />
        </div>
        <div className="search-actions">
          <button className="btn btn-primary" type="submit" disabled={apiState === "loading"}>
            {apiState === "loading" ? <LoaderCircle className="spin" aria-hidden="true" /> : <Search aria-hidden="true" />} Search
          </button>
          <button className="btn btn-outline" type="button" onClick={searchNearMe} disabled={locating}>
            {locating ? <LoaderCircle className="spin" aria-hidden="true" /> : <LocateFixed aria-hidden="true" />} Near me
          </button>
        </div>
      </form>

      {(careArea || near) && (
        <div className="chip-row" aria-label="Active search filters">
          {careArea && <button type="button" className="chip" onClick={onClearCareArea} aria-label={`Remove ${careArea.specialty} filter`}>Specialty: {careArea.specialty} <X aria-hidden="true" /></button>}
          {near && <button type="button" className="chip" onClick={clearLocation} aria-label="Stop searching near your location">Near your location <X aria-hidden="true" /></button>}
        </div>
      )}

      <div className="source-strip">
        <CircleCheck className="source-icon" aria-hidden="true" />
        <span>
          <b>Source: Google Maps Platform · Places API.</b> Fetched for each search and not saved. Ownership, beds and appointments are not verified.
          {near && " Your location is used only for this search and is not stored."}
        </span>
        <span className="google-attribution" translate="no">Google Maps</span>
      </div>

      <div className="results" aria-live="polite" aria-busy={apiState === "loading"}>
        {apiState === "idle" && (
          <div className="empty-state">
            <Search aria-hidden="true" />
            <b>{apiMessage || "Search by hospital name, district or state, or tap “Near me”."}</b>
            <span>Results show name, address and a Google Maps link. Phone, website and hours load on request.</span>
          </div>
        )}

        {apiState === "loading" && (
          <div className="hospital-list">
            {[0, 1, 2].map((index) => <div key={index} className="skeleton-card" aria-hidden="true"><span /><div><i /><i /><i /></div></div>)}
            <span className="sr-only">Searching Google Places…</span>
          </div>
        )}

        {apiState === "not_configured" && (
          <div className="callout callout-info">
            <KeyRound aria-hidden="true" />
            <div>
              <b>Connect Google Places</b>
              <span>{apiMessage}</span>
              <span>Keep <code>GOOGLE_MAPS_PLACES_API_KEY</code> in the server’s <code>.env.local</code>. Never expose it with a <code>NEXT_PUBLIC_</code> prefix.</span>
              <a href="https://developers.google.com/maps/documentation/places/web-service" target="_blank" rel="noreferrer">Google Places API setup ↗</a>
            </div>
          </div>
        )}

        {apiState === "provider_error" && (
          <div className="callout callout-danger">
            <TriangleAlert aria-hidden="true" />
            <div>
              <b>Directory unavailable</b>
              <span>{apiMessage}</span>
              {lastSearch.current && <button type="button" className="link-btn" onClick={() => lastSearch.current && void runSearch(lastSearch.current)}><RefreshCw aria-hidden="true" /> Try again</button>}
            </div>
          </div>
        )}

        {apiState === "connected" && (
          <>
            <div className="results-bar">
              <span>
                <b>{results.length}</b> result{results.length === 1 ? "" : "s"}{directory?.partial ? " · first page" : ""}
                {directory?.fetchedAt && <> · checked {new Date(directory.fetchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</>}
              </span>
              {near && results.length > 1 && (
                <div className="segmented" role="group" aria-label="Sort results">
                  <button type="button" aria-pressed={sort === "distance"} onClick={() => setSort("distance")}>Nearest</button>
                  <button type="button" aria-pressed={sort === "relevance"} onClick={() => setSort("relevance")}>Best match</button>
                </div>
              )}
            </div>
            {results.length ? (
              <div className="hospital-list">
                {results.map(({ hospital, distance }) => (
                  <HospitalCard
                    key={hospital.id}
                    hospital={hospital}
                    details={details[hospital.id]}
                    distance={distance}
                    chosen={chosenId === hospital.id}
                    loadingDetails={loadingDetails === hospital.id}
                    onChoose={() => onChoose(details[hospital.id] ? { ...hospital, ...details[hospital.id] } : hospital)}
                    onLoadDetails={() => void loadPlaceDetails(hospital.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Search aria-hidden="true" />
                <b>No matching hospitals found.</b>
                <span>Try a broader search: remove the specialty, or search by district only.</span>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
