import type { CountryCode } from "@/data/countries";
import type { ComplianceStatus } from "@/data/types";
import type { CheckResult } from "./compliance";
import type { ConditionId } from "@/data/conditions";

const KEY = "cbm.history.v1";

export type HistoryRecord = {
  id: string;
  date: string;
  citizenship: CountryCode;
  source?: CountryCode;
  medicines: string[];
  destination: CountryCode;
  transit: CountryCode | null;
  result: ComplianceStatus;
  conditions: ConditionId[];
  syringes: boolean;
  snapshot: CheckResult;
};

function readAll(): HistoryRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(records: HistoryRecord[]) {
  window.localStorage.setItem(KEY, JSON.stringify(records.slice(0, 40)));
}

export function loadHistory(): HistoryRecord[] {
  return readAll();
}

export function saveHistory(record: HistoryRecord) {
  const next = [record, ...readAll().filter((row) => row.id !== record.id)];
  writeAll(next);
}

export function getHistory(id: string): HistoryRecord | undefined {
  return readAll().find((row) => row.id === id);
}

export function clearHistory() {
  writeAll([]);
}
