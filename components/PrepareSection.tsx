"use client";

import { Check, CircleCheck, CircleDashed, ExternalLink, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { visitChecklist } from "@/lib/care-data";
import type { ApiState, BackendStatus } from "@/types/care";

const STORAGE_KEY = "aarogya.visit-checklist";

type Props = { status: BackendStatus | null; directoryState: ApiState };

export function PrepareSection({ status, directoryState }: Props) {
  const [ready, setReady] = useState<string[]>([]);

  // Checklist ticks are a per-device convenience; storage can be unavailable (private mode), so failures are ignored.
  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
      if (Array.isArray(saved)) setReady(saved.filter((id): id is string => typeof id === "string"));
    } catch { /* storage unavailable */ }
  }, []);

  function toggle(id: string) {
    setReady((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
      return next;
    });
  }

  function reset() {
    setReady([]);
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* storage unavailable */ }
  }

  const doneCount = visitChecklist.filter((item) => ready.includes(item.id)).length;
  const directory = directoryState === "connected" ? "Connected"
    : directoryState === "not_configured" || status?.hospitalDirectory === "not_configured" ? "Needs API key"
    : status?.hospitalDirectory === "configured" ? "Configured"
    : "Checking…";

  const rows: [string, string, boolean][] = [
    ["Hospital directory", directory, directory === "Connected" || directory === "Configured"],
    ["Booking database", status ? (status.database === "configured" ? "Configured" : "Not configured") : "Checking…", status?.database === "configured"],
    ["Patient sign-in", "Not connected", false],
    ["Beds & appointment slots", "Not connected", false],
    ["SMS & payments", "Demo only", false],
    ["Ambulance dispatch", "Not connected", false],
  ];

  return (
    <section className="section" id="prepare" aria-labelledby="prepare-title">
      <div className="section-head">
        <span className="eyebrow">Before you go</span>
        <h2 id="prepare-title">Prepare for your visit</h2>
        <p>Carry these to make registration at the OP counter faster.</p>
      </div>

      <div className="prepare-grid">
        <div className="panel">
          <div className="checklist-head">
            <div>
              <b>{doneCount} of {visitChecklist.length} ready</b>
              <div className="progress"><span style={{ width: `${(doneCount / visitChecklist.length) * 100}%` }} /></div>
            </div>
            {doneCount > 0 && <button type="button" className="link-btn" onClick={reset}><RotateCcw aria-hidden="true" /> Reset</button>}
          </div>
          <ul className="checklist">
            {visitChecklist.map((item) => {
              const checked = ready.includes(item.id);
              return (
                <li key={item.id}>
                  <button type="button" className={checked ? "is-checked" : undefined} aria-pressed={checked} onClick={() => toggle(item.id)}>
                    <span className="check-box" aria-hidden="true">{checked && <Check strokeWidth={3} />}</span>
                    <span><b>{item.label}</b><small>{item.detail}</small></span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="panel status-panel">
          <h3>What this prototype connects to</h3>
          <p className="muted">Live configuration of this server. Anything not connected is clearly simulated.</p>
          <ul className="status-list">
            {rows.map(([label, value, good]) => (
              <li key={label}>
                <span>{good ? <CircleCheck className="is-good" aria-hidden="true" /> : <CircleDashed className="is-muted" aria-hidden="true" />} {label}</span>
                <b className={good ? "is-good" : undefined}>{value}</b>
              </li>
            ))}
          </ul>
          <a className="link-btn" href="/api/status" target="_blank" rel="noreferrer">View backend status JSON <ExternalLink aria-hidden="true" /></a>
        </div>
      </div>
    </section>
  );
}
