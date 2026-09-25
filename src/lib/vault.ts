import type { CountryCode } from "@/data/countries";
import { generateDocumentId } from "./qr";

const KEY = "cbm.vault.v1";

export type VaultDocument = {
  id: string;
  createdAt: string;
  travelerName: string;
  dob: string;
  passportNumber: string;
  medicine: string;
  quantity: string;
  destination: CountryCode | "";
  condition: string;
  doctorName: string;
  doctorLicense: string;
  clinicPhone: string;
  clinicEmail: string;
  instructions: string;
  verifiedByDoctor: boolean;
};

function readAll(): VaultDocument[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as VaultDocument[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(docs: VaultDocument[]) {
  window.localStorage.setItem(KEY, JSON.stringify(docs.slice(0, 30)));
}

export function listDocuments(): VaultDocument[] {
  return readAll();
}

export function getDocument(id: string): VaultDocument | undefined {
  return readAll().find((doc) => doc.id === id);
}

export function saveDocument(doc: VaultDocument) {
  const next = [doc, ...readAll().filter((row) => row.id !== doc.id)];
  writeAll(next);
}

export function newDocumentId() {
  return generateDocumentId();
}
