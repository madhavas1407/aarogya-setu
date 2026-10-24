"use client";

import { TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { CareAreaPanel } from "@/components/CareAreaPanel";
import { CheckoutModal } from "@/components/CheckoutModal";
import { DirectoryPanel } from "@/components/DirectoryPanel";
import { EmergencySection } from "@/components/EmergencySection";
import { Hero, type JourneyStep } from "@/components/Hero";
import { PrepareSection } from "@/components/PrepareSection";
import { RequestPanel } from "@/components/RequestPanel";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Toast, useToast } from "@/components/Toast";
import { VerifyPanel } from "@/components/VerifyPanel";
import type { ApiState, BackendStatus, CareArea, VisitRequest } from "@/types/care";
import type { Hospital } from "@/types/hospital";

export default function Home() {
  const { message, notify } = useToast();
  const [mobile, setMobile] = useState("");
  const [verified, setVerified] = useState(false);
  const [careArea, setCareArea] = useState<CareArea | null>(null);
  const [chosen, setChosen] = useState<Hospital | null>(null);
  const [requests, setRequests] = useState<VisitRequest[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [directoryState, setDirectoryState] = useState<ApiState>("idle");
  const [status, setStatus] = useState<BackendStatus | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/status", { cache: "no-store", signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: BackendStatus | null) => setStatus(data))
      .catch(() => { /* status is informational; the panels show their own errors */ });
    return () => controller.abort();
  }, []);

  const specialty = careArea?.specialty ?? "General consultation";
  const directoryConfigured = directoryState === "connected" ? true
    : directoryState === "not_configured" ? false
    : status ? status.hospitalDirectory === "configured" : null;

  const steps: JourneyStep[] = [
    { label: "Verify your mobile", hint: verified ? "Verified for this demo" : "Demo code, no SMS sent", done: verified, href: "#verify" },
    { label: "Choose a care area", hint: careArea?.specialty ?? "Optional, guides your search", done: Boolean(careArea), href: "#care-area" },
    { label: "Find a facility", hint: chosen?.name ?? "Live Google Places search", done: Boolean(chosen), href: "#find-care" },
    { label: "Send a visit request", hint: requests.length ? `${requests.length} sent this session` : "Consent-scoped, revocable", done: requests.length > 0, href: "#request" },
  ];

  function chooseCareArea(area: CareArea | null) {
    setCareArea(area);
    if (area) document.getElementById("find-care")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function chooseHospital(hospital: Hospital) {
    setChosen(hospital);
    notify(`${hospital.name} selected. No appointment is confirmed yet.`);
    // On narrow screens the request panel sits below the results, so bring it into view.
    if (window.matchMedia("(max-width: 1023px)").matches) document.getElementById("request")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <a className="skip-link" href="#find-care">Skip to hospital search</a>
      <SiteHeader />
      <main className="container" id="top">
        <Hero steps={steps} directoryConfigured={directoryConfigured} />

        <div className="safety-banner" role="note">
          <TriangleAlert aria-hidden="true" />
          <div>
            <b>Demonstration build: not an emergency dispatch or booking service.</b>
            <span>For urgent care call <a href="tel:108">108</a>. Bed availability, appointment slots, OTP delivery and payment are not connected to live systems.</span>
          </div>
        </div>

        <div className="workspace">
          <div className="workspace-main">
            <VerifyPanel mobile={mobile} onMobileChange={setMobile} verified={verified} onVerifiedChange={setVerified} notify={notify} />
            <CareAreaPanel selected={careArea} onSelect={chooseCareArea} />
            <DirectoryPanel careArea={careArea} onClearCareArea={() => setCareArea(null)} chosenId={chosen?.id} onChoose={chooseHospital} onStateChange={setDirectoryState} notify={notify} />
          </div>
          <aside className="workspace-side" aria-label="Visit request">
            <RequestPanel
              chosen={chosen}
              careArea={careArea}
              onClearChosen={() => setChosen(null)}
              requests={requests}
              onRequestCreated={(request) => setRequests((current) => [request, ...current])}
              onRequestRevoked={(id) => setRequests((current) => current.map((request) => (request.id === id ? { ...request, revoked: true } : request)))}
              verified={verified}
              onOpenCheckout={() => setCheckoutOpen(true)}
              notify={notify}
            />
          </aside>
        </div>

        <EmergencySection notify={notify} />
        <PrepareSection status={status} directoryState={directoryState} />
      </main>
      <SiteFooter />

      {checkoutOpen && chosen && <CheckoutModal facilityName={chosen.name} specialty={specialty} onClose={() => setCheckoutOpen(false)} notify={notify} />}
      <Toast message={message} />
    </>
  );
}
