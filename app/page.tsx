"use client";

import QRCode from "qrcode";
import { FormEvent, useEffect, useRef, useState } from "react";
import type { DirectoryResponse, Hospital } from "@/types/hospital";

type ApiState = "idle" | "loading" | "connected" | "not_configured" | "provider_error";
type Organ = { icon: string; name: string; specialty: string; urgent?: boolean };
const organs: Organ[] = [
  { icon: "♥", name: "Heart & chest", specialty: "Cardiology", urgent: true },
  { icon: "◉", name: "Brain & nerves", specialty: "Neurology", urgent: true },
  { icon: "◌", name: "Breathing & lungs", specialty: "Pulmonology", urgent: true },
  { icon: "◒", name: "Stomach & liver", specialty: "Gastroenterology" },
  { icon: "◈", name: "Kidneys & urinary", specialty: "Nephrology" },
  { icon: "✿", name: "Pregnancy & women", specialty: "Gynecology", urgent: true },
  { icon: "⌁", name: "Bones & injury", specialty: "Orthopedics", urgent: true },
  { icon: "✚", name: "General care", specialty: "General Medicine" },
  { icon: "◉", name: "Eyes", specialty: "Ophthalmology" },
  { icon: "◖", name: "Ear, nose & throat", specialty: "ENT" },
  { icon: "◍", name: "Skin", specialty: "Dermatology" },
  { icon: "✦", name: "Dental", specialty: "Dentistry" },
  { icon: "♧", name: "Children", specialty: "Pediatrics" },
];
const incidents = [
  { title: "Proddatur Bypass · NH-40", level: "Critical", lat: 14.7504, lon: 78.5482 },
  { title: "Yerraguntla Junction · NH-716", level: "Moderate", lat: 14.6338, lon: 78.5395 },
  { title: "Chennur Bridge · NH-40", level: "Major", lat: 14.4734, lon: 78.8078 },
];

export default function Home() {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [verified, setVerified] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [stateName, setStateName] = useState("");
  const [district, setDistrict] = useState("");
  const [query, setQuery] = useState("");
  const [directory, setDirectory] = useState<DirectoryResponse | null>(null);
  const [apiState, setApiState] = useState<ApiState>("idle");
  const [apiMessage, setApiMessage] = useState("");
  const [chosen, setChosen] = useState<Hospital | null>(null);
  const [organ, setOrgan] = useState<Organ | null>(null);
  const [activeIncident, setActiveIncident] = useState(0);
  const [dispatch, setDispatch] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [freePass, setFreePass] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [shareContact, setShareContact] = useState(false);
  const [bookingNotice, setBookingNotice] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [processing, setProcessing] = useState(false);
  const [pass, setPass] = useState<{ id: string; ref: string; paid: boolean } | null>(null);
  const [passQr, setPassQr] = useState("");
  const [toast, setToast] = useState("");
  const [placeDetails, setPlaceDetails] = useState<Record<string, Hospital>>({});
  const [mapSrc, setMapSrc] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fee = chosen?.category?.toLowerCase().includes("private") ? 500 : 100;

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  };

  async function loadDirectory(event?: FormEvent) {
    event?.preventDefault();
    setApiState("loading"); setApiMessage(""); setChosen(null);
    const params = new URLSearchParams();
    if (stateName.trim()) params.set("state", stateName.trim());
    if (district.trim()) params.set("district", district.trim());
    if (query.trim()) params.set("q", query.trim());
    if (!query.trim() && !district.trim() && !stateName.trim()) { setApiState("idle"); setApiMessage("Enter a hospital name, district, or state to search."); return; }
    try {
      const response = await fetch(`/api/hospitals?${params.toString()}`, { cache: "no-store" });
      const data = await response.json();
      if (data.status === "connected") {
        setDirectory(data); setApiState("connected");
      } else {
        setDirectory(null); setApiState(data.status === "not_configured" ? "not_configured" : "provider_error");
        setApiMessage(data.message || "The official data source could not be reached.");
      }
    } catch {
      setDirectory(null); setApiState("provider_error"); setApiMessage("Could not reach the application server. Check that the Next.js server is running.");
    }
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const hospitals = directory?.hospitals ?? [];

  async function loadPlaceDetails(placeId: string) {
    try {
      const response = await fetch(`/api/hospitals/${encodeURIComponent(placeId)}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load place details.");
      setPlaceDetails((current) => ({ ...current, [placeId]: result.place }));
    } catch (error) { notify(error instanceof Error ? error.message : "Could not load place details."); }
  }

  function sendDemoOtp() {
    if (!/^\d{10}$/.test(mobile)) { notify("Enter a valid 10-digit number."); return; }
    const value = new Uint32Array(1); crypto.getRandomValues(value);
    const code = String(100000 + (value[0] % 900000));
    setDemoOtp(code); setOtp(""); setVerified(false); setSeconds(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setSeconds((current) => {
      if (current <= 1) { if (timerRef.current) clearInterval(timerRef.current); return 0; }
      return current - 1;
    }), 1000);
    notify("Demo OTP generated. No SMS was sent.");
  }

  function verifyDemoOtp() {
    if (otp && otp === demoOtp) { setVerified(true); notify("Number verified for this demo session."); }
    else notify("The entered code does not match.");
  }

  function chooseIncident(index: number) {
    setActiveIncident(index);
    const incident = incidents[index];
    const embedKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
    setMapSrc(embedKey ? `https://www.google.com/maps/embed/v1/view?key=${encodeURIComponent(embedKey)}&center=${incident.lat}%2C${incident.lon}&zoom=12` : "");
  }

  function startDispatch() {
    setDispatch(true);
    chooseIncident(activeIncident);
    notify("This is a dispatch simulation. Call 108 for emergency response.");
  }

  async function createPass() {
    if (!chosen) return;
    setProcessing(true);
    await new Promise((resolve) => window.setTimeout(resolve, 1800));
    const id = `OP-DEMO-${crypto.getRandomValues(new Uint16Array(1))[0].toString().padStart(4, "0")}`;
    const ref = `DEMO-${crypto.getRandomValues(new Uint32Array(1))[0].toString().slice(0, 8)}`;
    const paid = freePass;
    setPass({ id, ref, paid });
    const qr = await QRCode.toDataURL(JSON.stringify({ issuer: "AAROGYA-SETU DEMO", id, facility: chosen.name, payment: paid ? "ELIGIBILITY NOT VERIFIED" : "SIMULATION ONLY" }), { margin: 1, width: 168 });
    setPassQr(qr); setProcessing(false);
    notify("Demo OP pass created. No payment or reservation was made.");
  }

  async function submitBookingRequest() {
    if (!chosen) { notify("Select a hospital from live Google Places search first."); return; }
    if (!shareContact) { notify("Consent is required to share your contact with this facility."); return; }
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facilityId: chosen.id, specialty: organ?.specialty ?? "General consultation", shareContact: true }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Booking request could not be saved.");
      setBookingNotice(`Request ${result.id} saved as ${result.status}. This is not a confirmed appointment.`);
      setBookingId(result.id);
      notify("Booking request saved for the selected facility.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Booking request could not be submitted.";
      setBookingNotice(message);
      notify(message);
    }
  }

  async function revokeBookingConsent() {
    if (!bookingId) return;
    try {
      const response = await fetch("/api/bookings/revoke", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Consent could not be revoked.");
      setBookingNotice("Contact-sharing consent revoked. The facility can no longer retrieve your contact through this application.");
      setBookingId("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Consent could not be revoked.";
      setBookingNotice(message); notify(message);
    }
  }

  return <main>
    <header className="topbar"><a className="brand" href="#top"><span className="brand-mark">✚</span><span>AAROGYA-SETU<small>CARE ACCESS GATEWAY</small></span></a><div className="nav-right"><span className="program">MoHFW · IC26-03-10</span><a className="emergency-link" href="tel:108">Call 108 Emergency</a><a className="helpline" href="tel:104">104 Helpline</a><select aria-label="Language" className="language"><option>English</option><option>తెలుగు</option></select></div></header>
    <div className="container" id="top">
      <section className="hero"><div><div className="eyebrow">A citizen-first care journey</div><h1>The right care.<br/><em>One clearer next step.</em></h1><p>Search the official facility directory, understand where to seek care, and prepare for an outpatient visit.</p><div className="hero-badges"><span>✦ Mobile-friendly</span><span>⌖ India-wide directory search</span><span>◷ Source and freshness shown</span></div></div><div className="hero-art"><div className="art-orbit orbit-one"></div><div className="art-orbit orbit-two"></div><div className="art-cross">✚</div><div className="art-label">CARE, CONNECTED</div><div className="art-stat"><span className="pulse-dot"></span> Official source connection <b>{apiState === "connected" ? "Connected" : apiState === "loading" ? "Checking" : "Setup needed"}</b></div></div></section>
      <div className="safety-banner"><span className="safety-icon">!</span><div><b>Demonstration build — not an emergency dispatch or booking service.</b><span>For urgent care call <a href="tel:108">108</a>. Bed availability, appointment slots, OTP delivery, and payment are not connected to live systems.</span></div></div>

      <div className="layout-grid">
        <div className="main-column">
          <section className="panel verify-panel"><div className="panel-heading"><div className="step">01</div><div><h2>Verify your mobile</h2><p>OTP in this build is a local simulation; no SMS is sent.</p></div><span className={verified ? "status status-good" : "status status-demo"}>{verified ? "● Verified for demo" : "● Demo flow"}</span></div><div className="verify-controls"><div className="input-wrap"><label htmlFor="mobile">Mobile number</label><div className="mobile-input"><span>+91</span><input id="mobile" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit number" inputMode="numeric" autoComplete="tel-national"/></div></div><button className="btn btn-primary" onClick={sendDemoOtp}>Generate demo OTP</button></div>{demoOtp && <div className="otp-area"><div className="demo-sms"><span>▣</span><div><b>Messages · just now</b><p>Your AAROGYA-SETU demo code is <strong>{demoOtp}</strong>. No SMS has been sent.</p></div><button className="text-btn" onClick={() => { setOtp(demoOtp); notify("Demo code filled in"); }}>Auto-fill</button></div><div className="verify-controls otp-controls"><div className="input-wrap"><label htmlFor="otp">Six-digit code</label><input id="otp" className="plain-input otp-input" value={otp} maxLength={6} inputMode="numeric" onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="••••••"/></div><button className="btn btn-primary" onClick={verifyDemoOtp}>Verify code</button><span className="countdown">{seconds ? `Resend in ${seconds}s` : "You can generate a new code"}</span></div></div>}</section>

          <section className="panel directory-panel" id="directory"><div className="panel-heading"><div className="step">02</div><div><h2>Search hospitals</h2><p>Search Google Places live. Full details load only when requested.</p></div><span className={`status ${apiState === "connected" ? "status-good" : "status-demo"}`}>{apiState === "connected" ? "● Google Places" : apiState === "loading" ? "● Searching" : apiState === "idle" ? "● Ready to search" : "● Not connected"}</span></div>
            <form className="search-form" onSubmit={loadDirectory}><div className="input-wrap"><label htmlFor="state">State / UT</label><input className="plain-input" id="state" value={stateName} onChange={(e) => setStateName(e.target.value)} placeholder="e.g. Andhra Pradesh"/></div><div className="input-wrap"><label htmlFor="district">District</label><input className="plain-input" id="district" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="e.g. YSR Kadapa"/></div><div className="input-wrap query-wrap"><label htmlFor="query">Facility name / keyword</label><input className="plain-input" id="query" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search hospitals and services"/></div><button className="btn btn-primary search-btn" type="submit">Search directory <span>⌕</span></button></form>
            <div className="filter-row"><span>Ownership is not verified by Google Places.</span><button className="refresh-btn" onClick={() => void loadDirectory()}>↻ Refresh source</button></div>
            <div className="source-strip"><span className="source-check">✓</span><span><b>Source:</b> Google Maps Platform · Places API <small>Place data is fetched for this search and not saved. Google Places does not provide live bed or appointment availability.</small></span><span translate="no" style={{ fontFamily: "Arial, sans-serif", fontSize: "12px", color: "#5e5e5e", whiteSpace: "nowrap" }}>Google Maps</span>{directory?.fetchedAt && <time>Checked {new Date(directory.fetchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>}</div>
            {apiState === "idle" && <div className="state-message"><b>{apiMessage || "Search a hospital, district, or state to find nearby facilities."}</b></div>}
            {apiState === "loading" && <div className="state-message"><span className="loader"></span><b>Searching Google Places…</b></div>}
            {apiState === "not_configured" && <div className="setup-message"><div className="setup-icon">⌁</div><div><h3>Connect Google Places</h3><p>{apiMessage}</p><p>Keep <code>GOOGLE_MAPS_PLACES_API_KEY</code> in the server’s <code>.env.local</code>; never expose it using a <code>NEXT_PUBLIC_</code> prefix.</p><a href="https://developers.google.com/maps/documentation/places/web-service" target="_blank" rel="noreferrer">Google Places API setup ↗</a></div></div>}
            {apiState === "provider_error" && <div className="setup-message error-message"><div className="setup-icon">!</div><div><h3>Directory unavailable</h3><p>{apiMessage}</p><button className="text-btn" onClick={() => void loadDirectory()}>Try again</button></div></div>}
            {apiState === "connected" && <><div className="results-caption">{hospitals.length} Google Places result{hospitals.length === 1 ? "" : "s"}{directory?.partial ? " · showing first page" : ""}</div>{hospitals.length ? <div className="hospital-list">{hospitals.map((hospital) => { const details = placeDetails[hospital.id]; return <article className={`hospital-card ${chosen?.id === hospital.id ? "hospital-chosen" : ""}`} key={hospital.id}><div className="hospital-symbol">⌂</div><div className="hospital-info"><div className="hospital-title"><h3>{hospital.name}</h3>{hospital.category && <span>{hospital.category}</span>}</div><p>{hospital.address || "Address not provided"}</p>{(details?.rating ?? hospital.rating) !== undefined && <p className="hospital-meta">★ {details?.rating ?? hospital.rating}{(details?.userRatingCount ?? hospital.userRatingCount) ? ` · ${details?.userRatingCount ?? hospital.userRatingCount} Google reviews` : ""}</p>}<div className="hospital-links">{details?.phone && <a href={`tel:${details.phone}`}>☎ {details.phone}</a>}{details?.website && <a href={details.website} target="_blank" rel="noreferrer">Website ↗</a>}{hospital.googleMapsUri && <a href={hospital.googleMapsUri} target="_blank" rel="noreferrer">View on Google Maps ↗</a>}</div>{details?.openingHours && <div className="hospital-meta">{details.openingHours.map((day) => <div key={day}>{day}</div>)}</div>}<button className="text-btn" onClick={() => void loadPlaceDetails(hospital.id)}>{details ? "Refresh place details" : "Load phone, website, rating & hours"}</button><div className="not-live">Beds, doctors, appointments, and current service availability are not supplied by Google Places.</div></div><button className="btn btn-small" onClick={() => { setChosen(hospital); notify("Facility selected; no appointment is confirmed"); }}>Select</button></article>; })}</div> : <div className="empty-results">No matching Google Places results. Try a broader search.</div>}</>}
          </section>

          <section className="panel map-panel"><div className="panel-heading"><div className="step">03</div><div><h2>Emergency information</h2><p>Incident cards are scenario examples, not live alerts.</p></div><a className="small-emergency" href="tel:108">Call 108 ↗</a></div><div className="map-frame">{mapSrc ? <iframe title="Google Maps incident scenario location" src={mapSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade"/> : <div className="empty-results">Add a browser-restricted Maps Embed API key to show the scenario map. <a href={`https://www.google.com/maps/search/?api=1&query=${incidents[activeIncident].lat}%2C${incidents[activeIncident].lon}`} target="_blank" rel="noreferrer">Open this location in Google Maps ↗</a></div>}</div><div className="scenario-label">SIMULATION SCENARIOS — NOT REPORTED INCIDENTS</div><div className="incident-list">{incidents.map((item, i) => <button key={item.title} className={`incident-row ${activeIncident === i ? "active" : ""}`} onClick={() => chooseIncident(i)}><span className="incident-dot"/><span><b>{item.title}</b><small>Example location · {item.level} scenario</small></span><span className="incident-level">{item.level}</span></button>)}</div><button className="btn btn-sos" onClick={startDispatch}>{dispatch ? "✓ Dispatch demo started" : "🚨 Run emergency dispatch simulation"}</button>{dispatch && <div className="dispatch-sim"><div className="dispatch-top"><span className="pulse-dot"/> SIMULATION RUNNING <b>Ambulance AP-04-TX-108</b></div><div className="dispatch-stats"><span>Route target<b>RIMS, Kadapa · sample route</b></span><span>Estimated arrival<b>8 min · illustrative</b></span><span>Live dispatch<b>Not connected</b></span></div><p>This did not contact an ambulance service or hospital. For help now, use the 108 call button.</p></div>}</section>
        </div>

        <aside className="side-column">
          <section className="panel specialist-panel"><div className="panel-heading"><div className="step">04</div><div><h2>Choose a care area</h2><p>Choose a specialty to guide your search.</p></div></div><div className="organ-grid">{organs.map((item) => <button key={item.name} className={`organ-card ${organ?.name === item.name ? "organ-active" : ""}`} onClick={() => { setOrgan(item); document.getElementById("directory")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}><span>{item.icon}</span><b>{item.name}</b><small>{item.specialty}</small></button>)}</div>{organ?.urgent && <div className="referral-warning"><b>⚠ If symptoms may be severe, seek emergency care.</b><span>This app cannot triage or verify which facilities have ICU, cath-lab, stroke, maternity, or trauma services. Call 108 for emergencies.</span></div>}</section>
          <section className="panel booking-panel"><div className="panel-heading"><div className="step">05</div><div><h2>OP visit request</h2><p>Send a consent-scoped request to the selected facility.</p></div></div>{chosen ? <div className="selected-facility"><span>Selected facility</span><b>{chosen.name}</b><small>{organ?.specialty ?? "General consultation"}</small><button className="change-link" onClick={() => { setChosen(null); setBookingNotice(""); }}>Change facility</button></div> : <div className="booking-empty">Select a facility in the directory to prepare a visit request.</div>}<label className="consent-row"><input type="checkbox" checked={shareContact} onChange={(event) => setShareContact(event.target.checked)} disabled={!chosen}/><span><b>Share my mobile number with this facility for this request</b><small>Only for the selected booking request. The number is encrypted at rest; only an active account for this facility can retrieve it. Consent expires after 30 days and can be revoked.</small></span></label><button className="btn btn-primary booking-btn" disabled={!chosen} onClick={() => void submitBookingRequest()}>Send secure booking request <span>→</span></button>{bookingNotice && <div className="booking-notice" role="status">{bookingNotice}</div>}{bookingId && <button className="change-link revoke-link" onClick={() => void revokeBookingConsent()}>Revoke contact-sharing consent</button>}<div className="fee-row"><span>Sample consultation fee</span><b>₹{fee}</b></div><button className="btn btn-light booking-btn" disabled={!chosen} onClick={() => { if (!verified) { notify("The displayed OTP is only a demo and cannot authenticate a patient account."); document.getElementById("mobile")?.focus(); return; } setPaymentOpen(true); setPass(null); }}>Open demo checkout <span>→</span></button><p className="booking-disclaimer">The request remains pending until the facility confirms a slot. The payment flow remains a simulation and takes no payment.</p></section>
          <section className="help-card"><div className="help-icon">✚</div><div><b>Urgent help is one call away</b><p>Call 108 for ambulance and emergency response. This application does not dispatch emergency services.</p><a href="tel:108">Call emergency services <span>↗</span></a></div></section>
          <section className="system-status"><div className="system-heading"><span>SERVER STATUS</span><span className="status-indicator"/></div><div><span>Hospital directory</span><b>{apiState === "connected" ? "Connected" : apiState === "loading" ? "Checking" : "Needs setup"}</b></div><div><span>Bed availability</span><b>Not connected</b></div><div><span>SMS / payment / ambulance</span><b>Demo / not connected</b></div><a href="/api/status" target="_blank">View backend status JSON ↗</a></section>
        </aside>
      </div>
      <footer className="footer"><b>AAROGYA-SETU</b><span>Care access prototype · Official directory source details shown in app · not for emergency decision-making</span><span>For emergencies call <a href="tel:108">108</a></span></footer>
    </div>

    {paymentOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !processing) setPaymentOpen(false); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header className="modal-header"><div><div className="eyebrow">DEMO FLOW · NO PAYMENT GATEWAY</div><h2 id="modal-title">Review your visit details</h2><p>Nothing will be booked or charged.</p></div><button className="close-button" onClick={() => !processing && setPaymentOpen(false)} aria-label="Close">×</button></header>{processing ? <div className="processing"><span className="spinner"/><b>Preparing your demo pass…</b><p>Simulation only. No bank or hospital systems are contacted.</p></div> : pass ? <div className="pass-result"><div className="success-mark">✓</div><h3>Demo pass ready</h3><p>No payment was made and no appointment was reserved.</p><div className="pass-card"><div><small>ZERO-QUEUE DEMO PASS</small><h4>{pass.id}</h4><b>{chosen?.name}</b><span>{organ?.specialty ?? "General consultation"}</span><span>Doctor / room / bed: not supplied or reserved</span><span>Payment: {pass.paid ? "₹0 simulation · eligibility not validated" : "not paid · simulation only"}</span><span>Reference: {pass.ref}</span></div>{passQr && <img src={passQr} alt="Scannable demo pass QR code"/>}</div><div className="modal-actions"><button className="btn btn-primary" onClick={() => window.print()}>Print demo pass</button><button className="btn btn-light" onClick={() => setPaymentOpen(false)}>Done</button></div></div> : <><div className="checkout-summary"><div><span>Facility</span><b>{chosen?.name}</b></div><div><span>Specialty</span><b>{organ?.specialty ?? "General consultation"}</b></div><div className="checkout-total"><span>Sample fee</span><b>₹{freePass ? 0 : fee}</b></div></div><label className="eligibility-toggle"><input type="checkbox" checked={freePass} onChange={(event) => setFreePass(event.target.checked)}/><span><b>Ayushman Bharat / Aarogyasri cardholder</b><small>Demo toggle only. No eligibility or coverage validation is performed.</small></span></label><div className="method-title">Choose a demo method</div><div className="method-list">{["UPI", "Debit / credit card", "Net banking"].map((method) => <button key={method} className={paymentMethod === method ? "method-active" : ""} onClick={() => setPaymentMethod(method)}>{method === "UPI" ? "▣" : method.startsWith("Debit") ? "▰" : "⌂"} {method}</button>)}</div>{paymentMethod === "UPI" && <div className="demo-qr">▦<span>NO PAYMENT QR</span></div>}<div className="no-gateway">Simulation only · no payment details are requested or sent.</div><button className="btn btn-primary confirm-btn" onClick={() => void createPass()}>{freePass ? "Create free demo pass" : "Continue · ₹" + fee + " demo"}</button></>}</section></div>}
    {toast && <div className="toast" role="status">{toast}</div>}
  </main>;
}
