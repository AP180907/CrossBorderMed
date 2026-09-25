import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import { extractFromImage, extractFromText } from "@/lib/ocr";
import { useCheckStore } from "@/lib/store";

export function PrescriptionUpload() {
  const medicines = useCheckStore((s) => s.medicines);
  const setMedicines = useCheckStore((s) => s.setMedicines);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<string[]>([]);
  const [rawText, setRawText] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const [handwritten, setHandwritten] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const previewRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  function setPreviewUrl(url: string | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = url;
    setPreview(url);
  }

  function applyNames(names: string[]) {
    const existing = medicines.filter((m) => m.name.trim());
    const next = names.map((name, i) => ({
      key: existing[i]?.key ?? `m-${Math.random().toString(36).slice(2, 9)}`,
      name,
    }));
    if (next.length === 0) next.push({ key: `m-${Math.random().toString(36).slice(2, 9)}`, name: "" });
    setMedicines(next);
  }

  async function runText() {
    setBusy(true);
    setMessage(null);
    setStatus("Reading typed prescription");
    setProgress(0.4);
    try {
      const result = await extractFromText(typed, handwritten);
      setExtracted(result.names);
      setRawText(result.raw);
      setUncertain(result.uncertain);
      setConfirmed(false);
      if (result.names.length === 0) {
        setMessage("No medicine names were extracted. Type them below for confirmation.");
      }
    } catch {
      setMessage("Extraction failed. Enter medicine names manually.");
    } finally {
      setBusy(false);
      setStatus(null);
      setProgress(0);
    }
  }

  async function runFile(file: File) {
    setBusy(true);
    setMessage(null);
    setRawText("");
    try {
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        setMessage("PDF files cannot be read here. Photograph the strip, label, or box instead.");
        return;
      }
      if (file.type.startsWith("text") || file.name.endsWith(".txt")) {
        const text = await file.text();
        const result = await extractFromText(text, handwritten);
        setExtracted(result.names);
        setRawText(result.raw);
        setUncertain(result.uncertain || handwritten);
        setConfirmed(false);
        return;
      }
      if (!file.type.startsWith("image/") && !/\.(png|jpe?g|webp|gif|bmp|heic)$/i.test(file.name)) {
        setMessage("Please upload a photo of the medicine strip, label, or box.");
        return;
      }
      setPreviewUrl(URL.createObjectURL(file));
      const result = await extractFromImage(file, {
        handwritten,
        onProgress: (p) => {
          setStatus(p.status);
          setProgress(p.progress);
        },
      });
      if (!result.ok) {
        setMessage(result.error ?? "Could not read the prescription image.");
        setUncertain(true);
        setExtracted([]);
        setRawText(result.raw);
        return;
      }
      setExtracted(result.names);
      setRawText(result.raw);
      setUncertain(result.uncertain || handwritten);
      setConfirmed(false);
      if (result.names.length === 0) {
        setMessage("Text was read, but no medicine name was recognised. Check the raw text and type the name.");
      }
    } catch {
      setMessage("Could not process that file. Type the medicine names instead.");
    } finally {
      setBusy(false);
      setStatus(null);
      setProgress(0);
    }
  }

  return (
    <div className="mt-8 border-t border-line pt-6">
      <p className="text-[13px] font-medium tracking-wide text-muted">Upload prescription or pack</p>
      <p className="mt-1 text-sm leading-relaxed text-ink-soft">
        Photograph a medicine strip, label, or box. Names are read on this device with OCR — the photo is not sent to a server. Handwritten prescriptions are never treated as certain — confirm every name before running the check.
      </p>
      <label className="mt-4 flex items-center gap-2 text-sm text-ink-soft">
        <input
          type="checkbox"
          checked={handwritten}
          onChange={(e) => setHandwritten(e.target.checked)}
          className="size-4 accent-accent"
        />
        This prescription is handwritten
      </label>
      <Label htmlFor="rx-text" className="mt-4">
        Typed prescription
      </Label>
      <Textarea
        id="rx-text"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        placeholder="Paste the medicine list…"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" disabled={busy || !typed.trim()} onClick={() => void runText()}>
          {busy ? "Reading…" : "Extract from text"}
        </Button>
        <label className="inline-flex h-10 cursor-pointer items-center rounded-[8px] border border-line-strong px-3.5 text-sm font-medium hover:border-ink">
          {busy ? "Reading image…" : "Upload image"}
          <input
            type="file"
            accept="image/*,.txt"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void runFile(file);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {busy && (
        <div className="mt-4">
          <p className="text-sm text-ink-soft">{status ?? "Reading…"}</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
            <div
              className="h-full bg-accent transition-[width] duration-150"
              style={{ width: `${Math.max(6, Math.round(progress * 100))}%` }}
            />
          </div>
        </div>
      )}
      {preview && (
        <div className="mt-4 overflow-hidden rounded-[12px] border border-line bg-surface-2">
          <img src={preview} alt="Uploaded medicine pack" className="max-h-56 w-full object-contain bg-bg-warm" />
        </div>
      )}
      {message && <p className="mt-3 text-sm text-amber">{message}</p>}
      {rawText && (
        <details className="mt-3 rounded-[12px] border border-line bg-surface-2 px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium">Raw text read from the image</summary>
          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-ink-soft">
            {rawText}
          </pre>
        </details>
      )}
      {extracted.length > 0 && (
        <div className="mt-4 rounded-[12px] border border-line bg-surface-2 p-4">
          <p className="text-sm font-medium">Extracted names — confirm before use</p>
          {uncertain && (
            <p className="mt-1 text-sm text-amber">
              Extraction is uncertain. Verify each medicine against the pack or paper prescription.
            </p>
          )}
          <ul className="mt-3 space-y-2">
            {extracted.map((name, i) => (
              <li key={`${name}-${i}`}>
                <input
                  className="h-10 w-full rounded-[8px] border border-line bg-surface px-3 text-sm"
                  value={name}
                  onChange={(e) =>
                    setExtracted((rows) => rows.map((row, idx) => (idx === i ? e.target.value : row)))
                  }
                />
              </li>
            ))}
          </ul>
          <Button
            className="mt-3"
            size="sm"
            disabled={uncertain && !confirmed}
            onClick={() => {
              applyNames(extracted.filter(Boolean));
              setConfirmed(true);
            }}
          >
            Use these medicines
          </Button>
          {uncertain && (
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="size-4 accent-accent"
              />
              I have verified these names against the prescription
            </label>
          )}
        </div>
      )}
    </div>
  );
}
