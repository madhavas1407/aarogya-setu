import { Check, ChevronRight, Clock, MapPin, Search, ShieldCheck, Siren } from "lucide-react";

export type JourneyStep = { label: string; hint: string; done: boolean; href: string };

type Props = { steps: JourneyStep[]; directoryConfigured: boolean | null };

export function Hero({ steps, directoryConfigured }: Props) {
  const done = steps.filter((step) => step.done).length;
  const directoryLabel = directoryConfigured === null ? "Checking…" : directoryConfigured ? "Connected" : "Setup needed";

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <span className="eyebrow">A citizen-first care journey</span>
        <h1 id="hero-title">The right care.<br /><span>One clearer next step.</span></h1>
        <p>
          Find hospitals near you, understand where to seek care, and prepare for an outpatient visit,
          with every data source and limitation shown up front.
        </p>
        <div className="hero-actions">
          <a className="btn btn-primary btn-lg" href="#find-care"><Search aria-hidden="true" /> Find a hospital</a>
          <a className="btn btn-outline btn-lg" href="#emergency"><Siren aria-hidden="true" /> Emergency help</a>
        </div>
        <ul className="hero-points">
          <li><MapPin aria-hidden="true" /> Search anywhere in India</li>
          <li><ShieldCheck aria-hidden="true" /> Consent-first contact sharing</li>
          <li><Clock aria-hidden="true" /> Source and freshness shown</li>
        </ul>
      </div>

      <aside className="journey-card" aria-label="Your care journey">
        <div className="journey-head">
          <b>Your care journey</b>
          <span>{done} of {steps.length} done</span>
        </div>
        <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={done} aria-label="Journey progress">
          <span style={{ width: `${(done / steps.length) * 100}%` }} />
        </div>
        <ol className="journey-steps">
          {steps.map((step, index) => (
            <li key={step.label} className={step.done ? "is-done" : undefined}>
              <a href={step.href}>
                <span className="journey-index" aria-hidden="true">{step.done ? <Check strokeWidth={3} /> : index + 1}</span>
                <span className="journey-text">{step.label}<small>{step.hint}</small></span>
                <ChevronRight className="journey-chevron" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ol>
        <div className="journey-source">
          <span className={`status-dot ${directoryConfigured ? "is-good" : "is-muted"}`} aria-hidden="true" />
          Hospital directory (Google Places) · <b>{directoryLabel}</b>
        </div>
      </aside>
    </section>
  );
}
