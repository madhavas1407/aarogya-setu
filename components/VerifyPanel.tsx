"use client";

import { BadgeCheck, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import type { Notify } from "@/components/Toast";
import { maskMobile } from "@/lib/format";

const RESEND_SECONDS = 30;
const CODE_LIFETIME_MS = 5 * 60_000;
const MAX_ATTEMPTS = 5;

type Props = {
  mobile: string;
  onMobileChange: (mobile: string) => void;
  verified: boolean;
  onVerifiedChange: (verified: boolean) => void;
  notify: Notify;
};

export function VerifyPanel({ mobile, onMobileChange, verified, onVerifiedChange, notify }: Props) {
  const [demoOtp, setDemoOtp] = useState<{ code: string; expiresAt: number } | null>(null);
  const [otp, setOtp] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!seconds) return;
    const timer = window.setTimeout(() => setSeconds((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [seconds]);

  function changeMobile(value: string) {
    // A verification belongs to one number; editing the number invalidates it.
    onMobileChange(value.replace(/\D/g, "").slice(0, 10));
    onVerifiedChange(false);
    setDemoOtp(null);
    setOtp("");
  }

  function sendDemoOtp() {
    if (!/^[6-9]\d{9}$/.test(mobile)) { notify("Enter a valid 10-digit Indian mobile number."); return; }
    const value = new Uint32Array(1);
    crypto.getRandomValues(value);
    setDemoOtp({ code: String(100000 + (value[0] % 900000)), expiresAt: Date.now() + CODE_LIFETIME_MS });
    setOtp("");
    setAttempts(0);
    setSeconds(RESEND_SECONDS);
    onVerifiedChange(false);
    notify("Demo code generated. No SMS was sent.");
  }

  function verifyDemoOtp() {
    if (!demoOtp) return;
    if (Date.now() > demoOtp.expiresAt) { setDemoOtp(null); notify("That code has expired. Generate a new one."); return; }
    if (attempts >= MAX_ATTEMPTS) { setDemoOtp(null); notify("Too many attempts. Generate a new code."); return; }
    if (otp === demoOtp.code) {
      onVerifiedChange(true);
      setDemoOtp(null);
      notify("Number verified for this demo session.");
    } else {
      setAttempts((count) => count + 1);
      notify(`The code does not match. ${MAX_ATTEMPTS - attempts - 1} attempt(s) left.`);
    }
  }

  return (
    <section className="panel" id="verify" aria-labelledby="verify-title">
      <div className="panel-heading">
        <span className="step-badge">01</span>
        <div>
          <h2 id="verify-title">Verify your mobile</h2>
          <p>The code is generated in your browser for this demo. No SMS is sent.</p>
        </div>
        <span className={`pill ${verified ? "pill-good" : "pill-muted"}`}>{verified ? "Verified for demo" : "Demo flow"}</span>
      </div>

      {verified ? (
        <div className="verified-box">
          <BadgeCheck aria-hidden="true" />
          <div><b>{maskMobile(mobile)} verified</b><span>Valid for this demo session only. It does not create a patient account.</span></div>
          <button type="button" className="link-btn" onClick={() => changeMobile("")}>Use another number</button>
        </div>
      ) : (
        <>
          <form className="field-row" onSubmit={(event) => { event.preventDefault(); sendDemoOtp(); }}>
            <div className="field">
              <label htmlFor="mobile">Mobile number</label>
              <div className="input-group">
                <span className="input-prefix">+91</span>
                <input id="mobile" value={mobile} onChange={(event) => changeMobile(event.target.value)} placeholder="10-digit number" inputMode="numeric" autoComplete="tel-national" />
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={seconds > 0}>
              {seconds > 0 ? `Resend in ${seconds}s` : demoOtp ? "Resend code" : "Get demo code"}
            </button>
          </form>

          {demoOtp && (
            <>
              <div className="demo-sms">
                <span className="demo-sms-icon" aria-hidden="true"><MessageSquare /></span>
                <div>
                  <b>Demo message · just now</b>
                  <p>Your AAROGYA-SETU demo code is <strong>{demoOtp.code}</strong>. Valid for 5 minutes.</p>
                </div>
                <button type="button" className="link-btn" onClick={() => setOtp(demoOtp.code)}>Auto-fill</button>
              </div>
              <form className="field-row" onSubmit={(event) => { event.preventDefault(); verifyDemoOtp(); }}>
                <div className="field">
                  <label htmlFor="otp">Six-digit code</label>
                  <input id="otp" className="input otp-input" value={otp} maxLength={6} inputMode="numeric" autoComplete="one-time-code" onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} placeholder="••••••" />
                </div>
                <button className="btn btn-primary" type="submit" disabled={otp.length !== 6}>Verify code</button>
              </form>
            </>
          )}
        </>
      )}
    </section>
  );
}
