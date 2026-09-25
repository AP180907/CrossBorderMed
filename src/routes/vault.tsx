import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { COUNTRY_LIST } from "@/data/countries";
import { downloadCertificatePdf } from "@/lib/pdf";
import {
  buildVerifyPayload,
  isFileProtocol,
  makeLiveQr,
  openVerifyHash,
  type LiveQr,
} from "@/lib/qr";
import { useCheckStore } from "@/lib/store";
import type { CheckResult } from "@/lib/compliance";
import {
  getDocument,
  listDocuments,
  newDocumentId,
  saveDocument,
  type VaultDocument,
} from "@/lib/vault";

export const Route = createFileRoute("/vault")({ component: VaultPage });

const empty: Omit<VaultDocument, "id" | "createdAt" | "verifiedByDoctor"> = {
  travelerName: "",
  dob: "",
  passportNumber: "",
  medicine: "",
  quantity: "",
  destination: "",
  condition: "",
  doctorName: "",
  doctorLicense: "",
  clinicPhone: "",
  clinicEmail: "",
  instructions: "",
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function VaultPage() {
  const last = useCheckStore((s) => s.lastResult);
  const [form, setForm] = useState(empty);
  const [activeId, setActiveId] = useState("");
  const [issuedDate, setIssuedDate] = useState("");
  const [docs, setDocs] = useState<VaultDocument[]>([]);
  const [qr, setQr] = useState<LiveQr | null>(null);
  const [qrError, setQrError] = useState("");
  const [fileWarn, setFileWarn] = useState(false);
  const qrGen = useRef(0);

  useEffect(() => {
    setActiveId((id) => id || newDocumentId());
    setIssuedDate((d) => d || todayIso());
    setFileWarn(isFileProtocol());
    setDocs(listDocuments());
    let fromStore = last;
    if (!fromStore) {
      try {
        const raw = sessionStorage.getItem("cbm.lastResult");
        if (raw) fromStore = JSON.parse(raw) as CheckResult;
      } catch {
        fromStore = null;
      }
    }
    if (!fromStore) return;
    setForm((f) => ({
      ...f,
      medicine: f.medicine || fromStore.input.medicines.join(", "),
      destination: f.destination || fromStore.input.destination,
      quantity: f.quantity || "Personal use quantity as prescribed",
    }));
  }, [last]);

  const destinationName =
    COUNTRY_LIST.find((c) => c.code === form.destination)?.name ?? form.destination;

  const payloadInput = useMemo(
    () => ({
      id: activeId,
      name: form.travelerName,
      dob: form.dob,
      passportNumber: form.passportNumber,
      conditions: form.condition,
      medicine: form.medicine,
      quantity: form.quantity,
      destination: destinationName,
      instructions: form.instructions,
      doctorName: form.doctorName,
      licenseNumber: form.doctorLicense,
      issuedDate,
    }),
    [activeId, destinationName, form, issuedDate],
  );

  useEffect(() => {
    if (!activeId || !issuedDate) return;
    const token = ++qrGen.current;
    const timer = window.setTimeout(() => {
      void makeLiveQr(payloadInput)
        .then((result) => {
          if (token !== qrGen.current) return;
          setQr(result);
          setQrError("");
        })
        .catch(() => {
          if (token !== qrGen.current) return;
          setQr(null);
          setQrError("The verification code could not be generated from this letter.");
        });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [payloadInput]);

  const preview: VaultDocument = useMemo(
    () => ({
      id: activeId || "…",
      createdAt: issuedDate ? `${issuedDate}T12:00:00.000Z` : new Date().toISOString(),
      verifiedByDoctor: false,
      ...form,
    }),
    [form, activeId, issuedDate],
  );

  function set<K extends keyof typeof empty>(key: K, value: (typeof empty)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function persist() {
    if (!activeId) return;
    const doc: VaultDocument = {
      ...form,
      id: activeId,
      createdAt: `${issuedDate || todayIso()}T12:00:00.000Z`,
      verifiedByDoctor: false,
    };
    saveDocument(doc);
    setDocs(listDocuments());
  }

  async function downloadPdf() {
    persist();
    let live = qr;
    if (!live) {
      try {
        live = await makeLiveQr(payloadInput);
      } catch {
        live = null;
      }
    }
    if (!live) return;
    downloadCertificatePdf(live.payload, live.dataUrl);
  }

  function testScan() {
    openVerifyHash(buildVerifyPayload(payloadInput, qr?.trimmed ?? false));
  }

  return (
    <PageShell>
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:py-16">
        <div>
          <p className="text-[12px] uppercase tracking-[0.18em] text-muted">Document vault</p>
          <h1 className="mt-2 font-display text-4xl">Draft a travel certificate</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            This is a template. It must be completed and verified by the treating physician. It is
            not an authentic medical certificate.
          </p>
          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              persist();
            }}
          >
            <div>
              <Label htmlFor="docid">Document ID</Label>
              <Input id="docid" value={activeId} readOnly />
            </div>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.travelerName}
                onChange={(e) => set("travelerName", e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="dob">Date of birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={form.dob}
                  onChange={(e) => set("dob", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="pass">Passport number</Label>
                <Input
                  id="pass"
                  autoComplete="off"
                  value={form.passportNumber}
                  onChange={(e) => set("passportNumber", e.target.value)}
                />
                <p className="mt-1 text-xs text-muted">
                  Only the last four characters are encoded in the QR code.
                </p>
              </div>
            </div>
            <div>
              <Label htmlFor="med">Medicine</Label>
              <Input id="med" value={form.medicine} onChange={(e) => set("medicine", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="qty">Quantity</Label>
              <Input id="qty" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="dest">Destination</Label>
              <Select
                id="dest"
                value={form.destination}
                onChange={(e) => set("destination", e.target.value as typeof form.destination)}
              >
                <option value="">Select</option>
                {COUNTRY_LIST.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="cond">Relevant health / travel condition</Label>
              <Input
                id="cond"
                value={form.condition}
                onChange={(e) => set("condition", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="instr">Relevant travel / documentation instructions</Label>
              <Textarea
                id="instr"
                value={form.instructions}
                onChange={(e) => set("instructions", e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="doc">Doctor name</Label>
                <Input
                  id="doc"
                  value={form.doctorName}
                  onChange={(e) => set("doctorName", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="lic">License number</Label>
                <Input
                  id="lic"
                  value={form.doctorLicense}
                  onChange={(e) => set("doctorLicense", e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="phone">Clinic phone</Label>
                <Input
                  id="phone"
                  value={form.clinicPhone}
                  onChange={(e) => set("clinicPhone", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email">Clinic email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.clinicEmail}
                  onChange={(e) => set("clinicEmail", e.target.value)}
                />
              </div>
            </div>
            {fileWarn && (
              <p className="rounded-[10px] bg-amber-muted px-3 py-2 text-sm text-amber">
                This page was opened as a local file. QR codes need a web address and will not
                verify correctly until the certificate is opened on a hosted site.
              </p>
            )}
            {qrError && <p className="text-sm text-danger">{qrError}</p>}
            <div className="flex flex-wrap items-end gap-4 pt-2">
              <Button type="submit">Save document</Button>
              <Button type="button" variant="outline" onClick={() => void downloadPdf()}>
                Download PDF
              </Button>
              <Button type="button" variant="ghost" onClick={testScan} disabled={!activeId}>
                Test scan
              </Button>
              <QrCaption dataUrl={qr?.dataUrl} compact />
            </div>
          </form>
          {docs.length > 0 && (
            <div className="mt-10">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Saved on this device</p>
              <ul className="mt-3 space-y-2 text-sm">
                {docs.map((doc) => (
                  <li key={doc.id}>
                    <button
                      type="button"
                      className="min-h-11 text-left hover:text-accent"
                      onClick={() => {
                        setActiveId(doc.id);
                        setIssuedDate(doc.createdAt.slice(0, 10));
                        const found = getDocument(doc.id);
                        if (!found) return;
                        const { id, createdAt, verifiedByDoctor, ...rest } = found;
                        void id;
                        void createdAt;
                        void verifiedByDoctor;
                        setForm(rest);
                      }}
                    >
                      {doc.id} · {doc.travelerName || "Untitled"}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <CertificateView doc={preview} qr={qr?.dataUrl ?? ""} />
      </div>
    </PageShell>
  );
}

function QrCaption({ dataUrl, compact = false }: { dataUrl?: string; compact?: boolean }) {
  if (!dataUrl) {
    return (
      <p className="text-xs text-muted">{compact ? "Generating code…" : "Generating QR code…"}</p>
    );
  }
  return (
    <figure className={compact ? "w-24" : "w-28"}>
      <img
        src={dataUrl}
        alt="Verification QR code"
        width={compact ? 96 : 112}
        height={compact ? 96 : 112}
        className="size-full bg-surface outline outline-line"
      />
      <figcaption className="mt-2 text-xs leading-snug text-muted">
        Anyone who scans this code can see the details above.
      </figcaption>
    </figure>
  );
}

function CertificateView({ doc, qr }: { doc: VaultDocument; qr: string }) {
  const dest = COUNTRY_LIST.find((c) => c.code === doc.destination)?.name ?? doc.destination;
  const last4 = doc.passportNumber.replace(/\s+/g, "").slice(-4);
  const passportDisplay = last4 ? `****${last4}` : "[passport]";
  return (
    <div>
      <div
        id="certificate-preview"
        className="certificate-sheet relative rounded-[4px] border border-line px-8 py-10 shadow-[var(--shadow-hair)]"
      >
        <p className="text-center text-[11px] font-medium uppercase tracking-[0.28em]">
          Medical certificate for travel
        </p>
        <p className="mt-2 text-center text-[11px] uppercase tracking-[0.18em] text-amber">
          Draft / template — not an authentic medical certificate
        </p>
        <p className="mt-6 text-center text-sm tracking-wide">To whom it may concern</p>
        <p className="mt-6 text-sm text-muted">
          Date{" "}
          {new Date(doc.createdAt).toLocaleDateString(undefined, { dateStyle: "long" })}
        </p>
        <p className="mt-6 text-sm leading-relaxed">
          This template concerns <strong>{doc.travelerName || "[traveller name]"}</strong>, date of
          birth <strong>{doc.dob || "[date of birth]"}</strong>, passport{" "}
          <strong>{doc.passportNumber ? passportDisplay : "[number]"}</strong>.
        </p>
        <p className="mt-4 text-sm leading-relaxed">
          Medication: <strong>{doc.medicine || "[medicine]"}</strong>. Quantity:{" "}
          <strong>{doc.quantity || "[quantity]"}</strong>.
        </p>
        <p className="mt-4 text-sm leading-relaxed">
          The medication listed above is stated to be for the traveller’s personal medical use
          {doc.condition ? ` in connection with ${doc.condition}` : ""}.
        </p>
        <p className="mt-4 text-sm leading-relaxed">
          Destination: <strong>{dest || "[destination]"}</strong>.
        </p>
        {doc.instructions && <p className="mt-4 text-sm leading-relaxed">{doc.instructions}</p>}
        <p className="mt-4 text-sm leading-relaxed">
          This document does not override destination, transit, or border laws. It requires
          completion and verification by the treating physician before it can be presented as a
          medical certificate.
        </p>
        <div className="mt-10 grid gap-1 text-sm">
          <p>Doctor: {doc.doctorName || "[name]"}</p>
          <p>License: {doc.doctorLicense || "[license number]"}</p>
          <p>Clinic phone: {doc.clinicPhone || "[phone]"}</p>
          <p>Clinic email: {doc.clinicEmail || "[email]"}</p>
        </div>
        <div className="mt-8 flex items-end justify-between gap-4">
          <p className="font-mono text-xs tracking-wider text-muted">Document ID {doc.id}</p>
          <QrCaption dataUrl={qr} />
        </div>
      </div>
    </div>
  );
}
