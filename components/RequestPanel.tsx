"use client";

import { ArrowRight, Building2, CalendarClock, History, LoaderCircle, Lock, ShieldCheck, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import type { Notify } from "@/components/Toast";
import { SAMPLE_FEE } from "@/lib/care-data";
import { formatDateTime } from "@/lib/format";
import type { CareArea, VisitRequest } from "@/types/care";
import type { Hospital } from "@/types/hospital";

type Props = {
  chosen: Hospital | null;
  careArea: CareArea | null;
  onClearChosen: () => void;
  requests: VisitRequest[];
  onRequestCreated: (request: VisitRequest) => void;
  onRequestRevoked: (id: string) => void;
  verified: boolean;
  onOpenCheckout: () => void;
  notify: Notify;
};

type Notice = { tone: "good" | "warn"; text: string };

export function RequestPanel({ chosen, careArea, onClearChosen, requests, onRequestCreated, onRequestRevoked, verified, onOpenCheckout, notify }: Props) {
  const specialty = careArea?.specialty ?? "General consultation";

  return (
    <section className="panel request-panel" id="request" aria-labelledby="request-title">
      <div className="panel-heading">
        <span className="step-badge">04</span>
        <div>
          <h2 id="request-title">OP visit request</h2>
          <p>A consent-scoped request to the facility you select.</p>
        </div>
      </div>

      {chosen ? (
        <div className="selected-facility">
          <Building2 aria-hidden="true" />
          <div>
            <span className="overline">Selected facility</span>
            <b>{chosen.name}</b>
            {chosen.address && <small>{chosen.address}</small>}
            <span className="tag tag-brand">{specialty}</span>
          </div>
          <button type="button" className="link-btn" onClick={onClearChosen}>Change</button>
        </div>
      ) : (
        <div className="selected-facility is-empty">
          <Building2 aria-hidden="true" />
          <div><b>No facility selected</b><small>Search for a hospital and press “Select” to prepare a visit request.</small></div>
        </div>
      )}

      {/* Keyed by facility: consent and the preferred time never carry over to a different hospital. */}
      <RequestForm key={chosen?.id ?? "none"} chosen={chosen} specialty={specialty} onRequestCreated={onRequestCreated} notify={notify} />

      {requests.length > 0 && <RequestHistory requests={requests} onRequestRevoked={onRequestRevoked} notify={notify} />}

      <div className="checkout-strip">
        <div className="fee-row"><span>Sample consultation fee</span><b>₹{SAMPLE_FEE}</b></div>
        <button
          type="button"
          className="btn btn-outline btn-block"
          disabled={!chosen}
          onClick={() => {
            if (!verified) {
              notify("Verify your mobile with the demo code first.");
              document.getElementById("mobile")?.focus();
              return;
            }
            onOpenCheckout();
          }}
        >
          Open demo checkout <ArrowRight aria-hidden="true" />
        </button>
        <p className="fine-print">Requests stay pending until the facility confirms a slot. Checkout is a simulation and takes no payment.</p>
      </div>
    </section>
  );
}

function RequestForm({ chosen, specialty, onRequestCreated, notify }: { chosen: Hospital | null; specialty: string; onRequestCreated: (request: VisitRequest) => void; notify: Notify }) {
  const [shareContact, setShareContact] = useState(false);
  const [preferredAt, setPreferredAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [minDateTime, setMinDateTime] = useState<string>();

  // Computed after mount: the page is prerendered, so a render-time clock would cause a hydration mismatch.
  useEffect(() => {
    const inOneHour = new Date(Date.now() + 60 * 60_000);
    setMinDateTime(new Date(inOneHour.getTime() - inOneHour.getTimezoneOffset() * 60_000).toISOString().slice(0, 16));
  }, []);

  async function submit() {
    if (!chosen) return;
    if (!shareContact) { notify("Consent is required to share your contact with this facility."); return; }
    setSubmitting(true);
    setNotice(null);
    try {
      const requestedAt = preferredAt ? new Date(preferredAt).toISOString() : undefined;
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facilityId: chosen.id, specialty, shareContact: true, requestedAt }),
      });
      const result = await response.json();
      if (response.status === 401) {
        setNotice({ tone: "warn", text: "A verified patient sign-in is required. This prototype’s demo code cannot create one, so nothing was sent to the facility." });
        return;
      }
      if (!response.ok) throw new Error(result.error || "Booking request could not be saved.");
      onRequestCreated({ id: result.id, facilityName: chosen.name, specialty, createdAt: new Date().toISOString(), requestedAt, revoked: false });
      setNotice({ tone: "good", text: "Request saved as “requested”. This is not a confirmed appointment." });
      setShareContact(false);
      notify("Visit request sent to the selected facility.");
    } catch (error) {
      setNotice({ tone: "warn", text: error instanceof Error ? error.message : "Booking request could not be submitted." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="request-form">
      <div className="field">
        <label htmlFor="preferred-at"><CalendarClock aria-hidden="true" /> Preferred date & time <span className="optional">optional</span></label>
        <input id="preferred-at" className="input" type="datetime-local" min={minDateTime} value={preferredAt} onChange={(event) => setPreferredAt(event.target.value)} disabled={!chosen} />
      </div>

      <label className={`consent ${!chosen ? "is-disabled" : ""}`}>
        <input type="checkbox" checked={shareContact} onChange={(event) => setShareContact(event.target.checked)} disabled={!chosen} />
        <span>
          <b>Share my mobile number with {chosen ? "this facility" : "the selected facility"} for this request</b>
          <small><Lock aria-hidden="true" /> Encrypted at rest. Only an active account for this facility can read it. Consent expires after 30 days and can be revoked.</small>
        </span>
      </label>

      <button type="button" className="btn btn-primary btn-block" disabled={!chosen || !shareContact || submitting} onClick={() => void submit()}>
        {submitting ? <><LoaderCircle className="spin" aria-hidden="true" /> Sending…</> : <><ShieldCheck aria-hidden="true" /> Send secure request</>}
      </button>

      {notice && (
        <div className={`callout callout-${notice.tone === "good" ? "good" : "warn"} callout-compact`} role="status">
          {notice.tone === "warn" && <TriangleAlert aria-hidden="true" />}
          <span>{notice.text}</span>
        </div>
      )}
    </div>
  );
}

function RequestHistory({ requests, onRequestRevoked, notify }: { requests: VisitRequest[]; onRequestRevoked: (id: string) => void; notify: Notify }) {
  const [revoking, setRevoking] = useState<string | null>(null);

  async function revoke(id: string) {
    setRevoking(id);
    try {
      const response = await fetch("/api/bookings/revoke", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingId: id }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Consent could not be revoked.");
      onRequestRevoked(id);
      notify("Consent revoked. The facility can no longer retrieve your number through this app.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Consent could not be revoked.");
    } finally {
      setRevoking(null);
    }
  }

  return (
    <div className="request-history">
      <h3><History aria-hidden="true" /> Requests this session</h3>
      <ul>
        {requests.map((request) => (
          <li key={request.id}>
            <div>
              <b>{request.facilityName}</b>
              <small>{request.specialty} · sent {formatDateTime(request.createdAt)}{request.requestedAt ? ` · prefers ${formatDateTime(request.requestedAt)}` : ""}</small>
            </div>
            {request.revoked
              ? <span className="pill pill-muted">Consent revoked</span>
              : <button type="button" className="link-btn link-danger" disabled={revoking === request.id} onClick={() => void revoke(request.id)}>{revoking === request.id ? "Revoking…" : "Revoke consent"}</button>}
          </li>
        ))}
      </ul>
    </div>
  );
}
