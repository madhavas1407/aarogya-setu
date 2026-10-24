"use client";

import QRCode from "qrcode";
import { CircleCheck, CreditCard, Landmark, LoaderCircle, Printer, QrCode, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Notify } from "@/components/Toast";
import { SAMPLE_FEE } from "@/lib/care-data";

type Props = { facilityName: string; specialty: string; onClose: () => void; notify: Notify };
type DemoPass = { id: string; ref: string; free: boolean; qr: string };

const methods = [
  { name: "UPI", icon: QrCode },
  { name: "Debit / credit card", icon: CreditCard },
  { name: "Net banking", icon: Landmark },
];

export function CheckoutModal({ facilityName, specialty, onClose, notify }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [freePass, setFreePass] = useState(false);
  const [method, setMethod] = useState("UPI");
  const [processing, setProcessing] = useState(false);
  const [pass, setPass] = useState<DemoPass | null>(null);

  // showModal() gives focus trapping, Escape handling and an inert background for free.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);

  function requestClose() {
    if (!processing) onClose();
  }

  async function createPass() {
    setProcessing(true);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 1400));
      const id = `OP-DEMO-${String(crypto.getRandomValues(new Uint16Array(1))[0] % 10000).padStart(4, "0")}`;
      const ref = `DEMO-${String(crypto.getRandomValues(new Uint32Array(1))[0] % 100_000_000).padStart(8, "0")}`;
      const qr = await QRCode.toDataURL(
        JSON.stringify({ issuer: "AAROGYA-SETU DEMO", id, facility: facilityName, payment: freePass ? "ELIGIBILITY NOT VERIFIED" : "SIMULATION ONLY" }),
        { margin: 1, width: 192 },
      );
      setPass({ id, ref, free: freePass, qr });
      notify("Demo OP pass created. No payment or reservation was made.");
    } catch {
      notify("The demo pass could not be generated.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby="modal-title"
      onCancel={(event) => { event.preventDefault(); requestClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) requestClose(); }}
    >
      <div className="modal-body">
        <header className="modal-header">
          <div>
            <span className="eyebrow">Demo flow · no payment gateway</span>
            <h2 id="modal-title">{pass ? "Your demo pass" : "Review your visit"}</h2>
            <p>Nothing will be booked or charged.</p>
          </div>
          <button type="button" className="icon-btn" onClick={requestClose} disabled={processing} aria-label="Close"><X aria-hidden="true" /></button>
        </header>

        {processing ? (
          <div className="processing" role="status">
            <LoaderCircle className="spin" aria-hidden="true" />
            <b>Preparing your demo pass…</b>
            <p>Simulation only. No bank or hospital systems are contacted.</p>
          </div>
        ) : pass ? (
          <div className="pass-result">
            <CircleCheck className="success-icon" aria-hidden="true" />
            <p>No payment was made and no appointment was reserved.</p>
            <div className="pass-card">
              <div>
                <span className="overline">Zero-queue demo pass</span>
                <h3>{pass.id}</h3>
                <b>{facilityName}</b>
                <dl>
                  <div><dt>Specialty</dt><dd>{specialty}</dd></div>
                  <div><dt>Doctor / room</dt><dd>Not assigned</dd></div>
                  <div><dt>Payment</dt><dd>{pass.free ? "₹0 · eligibility not verified" : "Not paid · simulation"}</dd></div>
                  <div><dt>Reference</dt><dd>{pass.ref}</dd></div>
                </dl>
              </div>
              <img src={pass.qr} alt="QR code for the demo pass" width={112} height={112} />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={() => window.print()}><Printer aria-hidden="true" /> Print pass</button>
              <button type="button" className="btn btn-outline" onClick={onClose}>Done</button>
            </div>
          </div>
        ) : (
          <>
            <dl className="summary">
              <div><dt>Facility</dt><dd>{facilityName}</dd></div>
              <div><dt>Specialty</dt><dd>{specialty}</dd></div>
              <div className="summary-total"><dt>Sample fee</dt><dd>₹{freePass ? 0 : SAMPLE_FEE}</dd></div>
            </dl>

            <label className="consent">
              <input type="checkbox" checked={freePass} onChange={(event) => setFreePass(event.target.checked)} />
              <span>
                <b>I hold an Ayushman Bharat (PM-JAY) or Aarogyasri card</b>
                <small>Demo toggle only. Eligibility and coverage are not checked.</small>
              </span>
            </label>

            {!freePass && (
              <fieldset className="methods">
                <legend>Demo payment method</legend>
                <div className="method-list">
                  {methods.map(({ name, icon: Icon }) => (
                    <button key={name} type="button" className={method === name ? "is-active" : undefined} aria-pressed={method === name} onClick={() => setMethod(name)}>
                      <Icon aria-hidden="true" /> {name}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            <p className="fine-print center">Simulation only. No payment details are requested or sent.</p>
            <button type="button" className="btn btn-primary btn-block btn-lg" onClick={() => void createPass()}>
              {freePass ? "Create free demo pass" : `Continue · ₹${SAMPLE_FEE} demo`}
            </button>
          </>
        )}
      </div>
    </dialog>
  );
}
