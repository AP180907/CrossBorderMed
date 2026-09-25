import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { StatusBadge } from "@/components/ui/status";
import { COUNTRY_LIST } from "@/data/countries";
import { getDocument, type VaultDocument } from "@/lib/vault";

export const Route = createFileRoute("/verify/$documentId")({
  component: VerifyPage,
});

function VerifyPage() {
  const { documentId } = Route.useParams();
  const [doc, setDoc] = useState<VaultDocument | undefined>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDoc(getDocument(documentId));
    setReady(true);
  }, [documentId]);

  const dest = doc ? COUNTRY_LIST.find((c) => c.code === doc.destination)?.name : "";

  return (
    <PageShell>
      <div className="mx-auto max-w-2xl px-5 py-16">
        <p className="text-[12px] uppercase tracking-[0.18em] text-muted">QR verification</p>
        <h1 className="mt-2 font-display text-4xl">CrossBorderMed verification</h1>
        <ol className="mt-8 space-y-1 text-sm text-muted">
          <li>QR → verification page</li>
          <li>Document ID → {documentId}</li>
          <li>Verification status → local prototype only</li>
          <li>Doctor verification → pending unless the treating physician completes the original</li>
        </ol>

        {!ready ? (
          <p className="mt-10 text-muted">Looking up local vault…</p>
        ) : !doc ? (
          <div className="mt-10">
            <StatusBadge status="unknown" />
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              No document with this ID is stored in this browser’s vault. This prototype does not use an
              external registry.
            </p>
            <Link to="/vault" className="mt-4 inline-block text-sm text-accent">
              Open document vault
            </Link>
          </div>
        ) : (
          <div className="mt-10 space-y-6">
            <StatusBadge status="restricted" />
            <p className="text-sm text-amber">
              Draft / template. Doctor verification has not been completed. Do not treat this as an authentic medical certificate.
            </p>
            <dl className="divide-y divide-line text-sm">
              <Row k="Document ID" v={doc.id} />
              <Row k="Verification status" v="Local record found — not government verified" />
              <Row k="Doctor verification" v="Pending treating physician" />
              <Row k="Traveller" v={doc.travelerName || "—"} />
              <Row k="Date of birth" v={doc.dob || "—"} />
              <Row k="Passport" v={doc.passportNumber ? `****${doc.passportNumber.replace(/\s+/g, "").slice(-4)}` : "—"} />
              <Row k="Medicine" v={doc.medicine || "—"} />
              <Row k="Quantity" v={doc.quantity || "—"} />
              <Row k="Destination" v={dest || "—"} />
              <Row k="Doctor" v={doc.doctorName || "—"} />
              <Row k="License" v={doc.doctorLicense || "—"} />
            </dl>
          </div>
        )}
      </div>
    </PageShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-6 py-3">
      <dt className="text-muted">{k}</dt>
      <dd className="text-right">{v}</dd>
    </div>
  );
}
