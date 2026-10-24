import { Phone, Plus, Siren } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <a className="brand" href="#top" aria-label="AAROGYA-SETU, back to top">
          <span className="brand-mark" aria-hidden="true"><Plus strokeWidth={3} /></span>
          <span className="brand-text">AAROGYA-SETU<small>Care access gateway</small></span>
        </a>
        <nav className="site-nav" aria-label="Primary">
          <a href="#find-care">Find care</a>
          <a href="#emergency">Emergency</a>
          <a href="#prepare">Prepare for a visit</a>
        </nav>
        <div className="header-actions">
          <span className="program-tag">MoHFW · IC26-03-10</span>
          <a className="header-helpline" href="tel:104" aria-label="Call 104 health helpline"><Phone aria-hidden="true" /> 104</a>
          <a className="btn btn-danger btn-sm" href="tel:108"><Siren aria-hidden="true" /> Call 108</a>
        </div>
      </div>
    </header>
  );
}
