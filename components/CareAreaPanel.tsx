import { TriangleAlert, X } from "lucide-react";
import { careAreas } from "@/lib/care-data";
import type { CareArea } from "@/types/care";

type Props = { selected: CareArea | null; onSelect: (area: CareArea | null) => void };

export function CareAreaPanel({ selected, onSelect }: Props) {
  return (
    <section className="panel" id="care-area" aria-labelledby="care-title">
      <div className="panel-heading">
        <span className="step-badge">02</span>
        <div>
          <h2 id="care-title">Choose a care area</h2>
          <p>Optional. The specialty is added to your hospital search.</p>
        </div>
        {selected && (
          <button type="button" className="pill pill-brand pill-action" onClick={() => onSelect(null)} aria-label={`Clear ${selected.specialty}`}>
            {selected.specialty} <X aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="care-grid">
        {careAreas.map((area) => {
          const Icon = area.icon;
          const active = selected?.name === area.name;
          return (
            <button key={area.name} type="button" className={`care-card ${active ? "is-active" : ""}`} aria-pressed={active} onClick={() => onSelect(active ? null : area)}>
              <span className="care-icon" aria-hidden="true"><Icon /></span>
              <b>{area.name}</b>
              <small>{area.specialty}</small>
            </button>
          );
        })}
      </div>

      {selected?.urgent && (
        <div className="callout callout-warn" role="note">
          <TriangleAlert aria-hidden="true" />
          <div>
            <b>If symptoms may be severe, seek emergency care now.</b>
            <span>
              This app cannot triage or confirm which facilities have ICU, cath-lab, stroke, maternity or trauma services.
              Call <a href="tel:108">108</a> or see the <a href="#emergency">warning signs</a>.
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
