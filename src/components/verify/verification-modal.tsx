import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  clearVerifyHash,
  decodeVerifyHash,
  maskPassport,
  type VerifyPayload,
} from "@/lib/qr";

type ModalState =
  | { open: false }
  | { open: true; ok: true; payload: VerifyPayload }
  | { open: true; ok: false };

function readHashState(): ModalState {
  if (typeof window === "undefined") return { open: false };
  const hash = window.location.hash;
  if (!hash.startsWith("#verify=")) return { open: false };
  const payload = decodeVerifyHash(hash);
  return payload ? { open: true, ok: true, payload } : { open: true, ok: false };
}

export function VerificationModal() {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [state, setState] = useState<ModalState>({ open: false });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    function handle() {
      setState(readHashState());
    }
    handle();
    window.addEventListener("hashchange", handle);
    return () => window.removeEventListener("hashchange", handle);
  }, []);

  useEffect(() => {
    if (!state.open) return;
    closeRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") closeVerify();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [state.open]);

  if (!mounted || !state.open) return null;

  return createPortal(
    <div
      id="cbm-verify-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 flex flex-col bg-bg text-ink"
    >
      <div className="flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3 print:hidden">
        <p id={titleId} className="font-display text-xl tracking-tight">
          CrossBorderMed Verification
        </p>
        <div className="cbm-verify-actions flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            Print
          </Button>
          <Button ref={closeRef} variant="ink" size="sm" onClick={closeVerify}>
            Close
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto px-4 py-8 md:px-8">
        <div className="mx-auto max-w-xl rounded-[18px] bg-surface px-6 py-8 shadow-[var(--shadow-lift)] md:px-10">
          <p className="mb-6 hidden font-display text-2xl print:block">
            CrossBorderMed Verification
          </p>
          {state.ok ? <VerifyBody payload={state.payload} /> : <VerifyError />}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function closeVerify() {
  clearVerifyHash();
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

function VerifyError() {
  return (
    <p className="text-sm leading-relaxed text-danger">Invalid or corrupted verification code</p>
  );
}

function VerifyBody({ payload }: { payload: VerifyPayload }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Document ID</p>
          <p className="mt-1 font-mono text-sm tracking-wide">{payload.id}</p>
        </div>
        <StatusChip status={payload.status} />
      </div>
      <dl className="divide-y divide-line text-sm">
        <Row label="Name" value={payload.name} />
        <Row label="Date of birth" value={payload.dob} />
        <Row label="Passport" value={maskPassport(payload.passportLast4)} />
        <Row label="Conditions" value={payload.conditions} />
        <Row label="Medicine" value={payload.medicine} />
        <Row label="Quantity" value={payload.quantity} />
        <Row label="Destination" value={payload.destination} />
        <Row label="Instructions" value={payload.instructions} />
        <Row label="Doctor" value={payload.doctorName} />
        <Row label="License" value={payload.licenseNumber} />
        <Row label="Issue date" value={payload.issuedDate} />
      </dl>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  return (
    <span className="inline-flex max-w-[18rem] items-center rounded-full bg-amber-muted px-3 py-1.5 text-left text-xs font-medium leading-snug text-amber">
      {status}
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const display = value?.trim() ? value : "—";
  return (
    <div className="flex justify-between gap-6 py-3">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="text-right whitespace-pre-wrap">{display}</dd>
    </div>
  );
}
