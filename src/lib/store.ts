import { create } from "zustand";
import type { CountryCode } from "@/data/countries";
import type { ConditionId } from "@/data/conditions";
import type { CheckResult } from "./compliance";

export type MedicineEntry = {
  key: string;
  name: string;
};

type CheckState = {
  step: number;
  citizenship: CountryCode | null;
  source: CountryCode | null;
  medicines: MedicineEntry[];
  destination: CountryCode | null;
  transit: CountryCode | null;
  conditions: ConditionId[];
  syringes: boolean;
  lastResult: CheckResult | null;
  setStep: (step: number) => void;
  setCitizenship: (code: CountryCode) => void;
  setSource: (code: CountryCode) => void;
  setMedicines: (rows: MedicineEntry[]) => void;
  addMedicine: () => void;
  updateMedicine: (key: string, name: string) => void;
  removeMedicine: (key: string) => void;
  setDestination: (code: CountryCode) => void;
  setTransit: (code: CountryCode | null) => void;
  toggleCondition: (id: ConditionId) => void;
  setSyringes: (value: boolean) => void;
  setLastResult: (result: CheckResult | null) => void;
  hydrateFromResult: (result: CheckResult, extra?: { conditions?: ConditionId[]; syringes?: boolean }) => void;
  reset: () => void;
};

function emptyMedicine(): MedicineEntry {
  return { key: `m-${Math.random().toString(36).slice(2, 9)}`, name: "" };
}

function boardingFromResult(result: CheckResult): CountryCode {
  return result.input.source ?? result.input.citizenship;
}

export const useCheckStore = create<CheckState>((set) => ({
  step: 0,
  citizenship: null,
  source: null,
  medicines: [emptyMedicine()],
  destination: null,
  transit: null,
  conditions: [],
  syringes: false,
  lastResult: null,
  setStep: (step) => set({ step }),
  setCitizenship: (citizenship) => set({ citizenship }),
  setSource: (source) => set({ source }),
  setMedicines: (medicines) => set({ medicines }),
  addMedicine: () => set((state) => ({ medicines: [...state.medicines, emptyMedicine()] })),
  updateMedicine: (key, name) =>
    set((state) => ({
      medicines: state.medicines.map((row) => (row.key === key ? { ...row, name } : row)),
    })),
  removeMedicine: (key) =>
    set((state) => ({
      medicines: state.medicines.length === 1
        ? state.medicines
        : state.medicines.filter((row) => row.key !== key),
    })),
  setDestination: (destination) => set({ destination }),
  setTransit: (transit) => set({ transit }),
  toggleCondition: (id) =>
    set((state) => ({
      conditions: state.conditions.includes(id)
        ? state.conditions.filter((item) => item !== id)
        : [...state.conditions, id],
    })),
  setSyringes: (syringes) => set({ syringes }),
  setLastResult: (lastResult) => set({ lastResult }),
  hydrateFromResult: (result, extra) =>
    set({
      citizenship: result.input.citizenship,
      source: boardingFromResult(result),
      destination: result.input.destination,
      transit: result.input.transit,
      medicines: result.input.medicines.map((name) => ({
        key: `m-${Math.random().toString(36).slice(2, 9)}`,
        name,
      })),
      lastResult: result,
      conditions: extra?.conditions ?? [],
      syringes: extra?.syringes ?? false,
      step: 5,
    }),
  reset: () =>
    set({
      step: 0,
      citizenship: null,
      source: null,
      medicines: [emptyMedicine()],
      destination: null,
      transit: null,
      conditions: [],
      syringes: false,
      lastResult: null,
    }),
}));
