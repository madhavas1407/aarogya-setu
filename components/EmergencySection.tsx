"use client";

import { Ambulance, ExternalLink, Phone, Siren, TriangleAlert } from "lucide-react";
import { useState } from "react";
import type { Notify } from "@/components/Toast";
import { emergencyNumbers, redFlags, scenarios } from "@/lib/care-data";

const embedKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;

export function EmergencySection({ notify }: { notify: Notify }) {
  const [active, setActive] = useState(0);
  const [dispatch, setDispatch] = useState(false);
  const scenario = scenarios[active];
  const mapSrc = embedKey
    ? `https://www.google.com/maps/embed/v1/view?key=${encodeURIComponent(embedKey)}&center=${scenario.lat}%2C${scenario.lon}&zoom=12`
    : "";

  return (
    <section className="section" id="emergency" aria-labelledby="emergency-title">
      <div className="section-head">
        <span className="eyebrow eyebrow-danger">Emergency</span>
        <h2 id="emergency-title">Urgent help is one call away</h2>
        <p>This app does not dispatch emergency services. In an emergency, call first and search later.</p>
      </div>

      <div className="emergency-grid">
        <div className="emergency-numbers">
          {emergencyNumbers.map((item) => (
            <a key={item.number} className={`number-card ${item.number === "108" ? "is-primary" : ""}`} href={`tel:${item.number}`}>
              <span className="number-icon" aria-hidden="true">{item.number === "108" ? <Ambulance /> : <Phone />}</span>
              <span className="number-text"><b>{item.number}</b><span>{item.label}</span><small>{item.detail}</small></span>
            </a>
          ))}
          <p className="fine-print">102 and 104 services vary by state.</p>
        </div>

        <div className="panel red-flags">
          <h3><TriangleAlert aria-hidden="true" /> Call 108 now if someone has</h3>
          <ul>{redFlags.map((flag) => <li key={flag}>{flag}</li>)}</ul>
          <a className="btn btn-danger btn-block" href="tel:108"><Siren aria-hidden="true" /> Call 108 ambulance</a>
        </div>

        <div className="panel scenario-panel">
          <div className="scenario-head">
            <h3>Dispatch simulation</h3>
            <span className="pill pill-warn">Scenario examples, not live alerts</span>
          </div>
          <div className="map-frame">
            {mapSrc ? (
              <iframe title={`Map of example location: ${scenario.title}`} src={mapSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            ) : (
              <div className="map-placeholder">
                <span>Add a browser-restricted Maps Embed API key to show the scenario map.</span>
                <a href={`https://www.google.com/maps/search/?api=1&query=${scenario.lat}%2C${scenario.lon}`} target="_blank" rel="noreferrer">Open this location in Google Maps <ExternalLink aria-hidden="true" /></a>
              </div>
            )}
          </div>
          <div className="scenario-list" role="radiogroup" aria-label="Example scenario">
            {scenarios.map((item, index) => (
              <button key={item.title} type="button" role="radio" aria-checked={active === index} className={`scenario-row ${active === index ? "is-active" : ""}`} onClick={() => setActive(index)}>
                <span className={`severity severity-${item.level.toLowerCase()}`} aria-hidden="true" />
                <span><b>{item.title}</b><small>Example location · {item.level} scenario</small></span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-outline-danger btn-block"
            onClick={() => { setDispatch(true); notify("This is a dispatch simulation. Call 108 for emergency response."); }}
          >
            <Siren aria-hidden="true" /> {dispatch ? "Simulation running" : "Run dispatch simulation"}
          </button>
          {dispatch && (
            <div className="dispatch-sim" role="status">
              <div className="dispatch-top"><span className="status-dot is-good pulse" aria-hidden="true" /> Simulation · <b>Ambulance AP-04-TX-108</b></div>
              <dl className="dispatch-stats">
                <div><dt>Route target</dt><dd>RIMS, Kadapa (sample)</dd></div>
                <div><dt>Estimated arrival</dt><dd>8 min (illustrative)</dd></div>
                <div><dt>Live dispatch</dt><dd>Not connected</dd></div>
              </dl>
              <p>No ambulance service or hospital was contacted. For help now, call 108.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
