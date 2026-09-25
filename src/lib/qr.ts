import QRCode from "qrcode";
import LZString from "lz-string";

export const VERIFY_STATUS = "Issued by traveler - Doctor verification: Pending" as const;

export type VerifyPayload = {
  id: string;
  name: string;
  dob: string;
  passportLast4: string;
  conditions: string;
  medicine: string;
  quantity: string;
  destination: string;
  instructions: string;
  doctorName: string;
  licenseNumber: string;
  issuedDate: string;
  status: typeof VERIFY_STATUS;
};

const PAYLOAD_KEYS = [
  "id",
  "name",
  "dob",
  "passportLast4",
  "conditions",
  "medicine",
  "quantity",
  "destination",
  "instructions",
  "doctorName",
  "licenseNumber",
  "issuedDate",
  "status",
] as const;

export function generateDocumentId(date = new Date()): string {
  const ymd = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  const bytes = new Uint8Array(4);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
    for (let i = 0; i < 4; i++) suffix += alphabet[bytes[i]! % alphabet.length];
  } else {
    for (let i = 0; i < 4; i++) suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `CBM-${ymd}-${suffix}`;
}

export function last4Passport(passport: string): string {
  return passport.replace(/\s+/g, "").slice(-4);
}

export function maskPassport(last4: string): string {
  const cleaned = last4.replace(/[^\dA-Za-z]/g, "").slice(-4);
  return cleaned ? `****${cleaned}` : "****";
}

export function isFileProtocol(): boolean {
  return typeof window !== "undefined" && window.location.protocol === "file:";
}

function clip(value: string, max?: number): string {
  const text = value ?? "";
  return typeof max === "number" ? text.slice(0, max) : text;
}

export function buildVerifyPayload(
  input: {
    id: string;
    name: string;
    dob: string;
    passportNumber: string;
    conditions: string;
    medicine: string;
    quantity: string;
    destination: string;
    instructions: string;
    doctorName: string;
    licenseNumber: string;
    issuedDate: string;
  },
  trimLongFields = false,
): VerifyPayload {
  const max = trimLongFields ? 80 : undefined;
  return {
    id: input.id,
    name: input.name,
    dob: input.dob,
    passportLast4: last4Passport(input.passportNumber),
    conditions: clip(input.conditions, max),
    medicine: input.medicine,
    quantity: input.quantity,
    destination: input.destination,
    instructions: clip(input.instructions, max),
    doctorName: input.doctorName,
    licenseNumber: input.licenseNumber,
    issuedDate: input.issuedDate,
    status: VERIFY_STATUS,
  };
}

export function isVerifyPayload(value: unknown): value is VerifyPayload {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return PAYLOAD_KEYS.every((key) => typeof record[key] === "string");
}

export function verifyHashFromPayload(payload: VerifyPayload): string {
  const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(payload));
  return `#verify=${compressed}`;
}

export function verifyUrlFromPayload(payload: VerifyPayload): string {
  if (typeof window === "undefined") return verifyHashFromPayload(payload);
  return `${window.location.origin}${window.location.pathname}${verifyHashFromPayload(payload)}`;
}

export function decodeVerifyHash(hash: string): VerifyPayload | null {
  if (!hash.startsWith("#verify=")) return null;
  const compressed = hash.slice("#verify=".length);
  if (!compressed) return null;
  try {
    const json = LZString.decompressFromEncodedURIComponent(compressed);
    if (!json) return null;
    const parsed: unknown = JSON.parse(json);
    return isVerifyPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

const QR_OPTIONS = {
  errorCorrectionLevel: "L" as const,
  margin: 1,
  width: 256,
  color: { dark: "#1c1b19", light: "#ffffff" },
};

export async function qrDataUrlFromText(text: string): Promise<string> {
  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, text, QR_OPTIONS);
  return canvas.toDataURL("image/png");
}

export type LiveQr = {
  dataUrl: string;
  url: string;
  payload: VerifyPayload;
  trimmed: boolean;
};

export async function makeLiveQr(
  input: Parameters<typeof buildVerifyPayload>[0],
): Promise<LiveQr> {
  const attempt = async (trim: boolean): Promise<LiveQr> => {
    const payload = buildVerifyPayload(input, trim);
    const url = verifyUrlFromPayload(payload);
    const dataUrl = await qrDataUrlFromText(url);
    return { dataUrl, url, payload, trimmed: trim };
  };

  try {
    return await attempt(false);
  } catch {
    return await attempt(true);
  }
}

export function openVerifyHash(payload: VerifyPayload) {
  if (typeof window === "undefined") return;
  const next = verifyHashFromPayload(payload);
  if (window.location.hash === next) {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    return;
  }
  window.location.hash = next;
}

export function clearVerifyHash() {
  if (typeof window === "undefined") return;
  const { pathname, search } = window.location;
  window.history.replaceState(null, "", `${pathname}${search}`);
}
