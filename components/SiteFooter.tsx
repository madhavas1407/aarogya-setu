import { Plus } from "lucide-react";
import { emergencyNumbers } from "@/lib/care-data";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-brand">
          <a className="brand" href="#top">
            <span className="brand-mark" aria-hidden="true"><Plus strokeWidth={3} /></span>
            <span className="brand-text">AAROGYA-SETU<small>Care access gateway</small></span>
          </a>
          <p>
            A care-access prototype. Hospital listings come from Google Places and are not verified for beds,
            doctors or services. Not for emergency decision-making.
          </p>
        </div>
        <nav aria-label="Footer">
          <h2>Navigate</h2>
          <a href="#find-care">Find a hospital</a>
          <a href="#emergency">Emergency numbers</a>
          <a href="#prepare">Visit checklist</a>
          <a href="/api/status" target="_blank" rel="noreferrer">Backend status</a>
        </nav>
        <div>
          <h2>Emergency numbers</h2>
          {emergencyNumbers.slice(0, 4).map((item) => (
            <a key={item.number} href={`tel:${item.number}`}><b>{item.number}</b> {item.label}</a>
          ))}
        </div>
      </div>
      <div className="footer-legal">
        <span suppressHydrationWarning>© {new Date().getFullYear()} AAROGYA-SETU prototype</span>
        <span>Hospital data: Google Maps Platform, fetched live and not stored</span>
      </div>
    </footer>
  );
}
