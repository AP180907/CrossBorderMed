import type { CountryCode } from "./countries";

export type ComplianceStatus =
  | "allowed"
  | "restricted"
  | "not_allowed"
  | "unknown";

export type ControlClass =
  | "uncontrolled"
  | "psychotropic"
  | "narcotic"
  | "stimulant"
  | "cannabis"
  | "injectable";

export type MedicineCategory =
  | "adhd"
  | "pain"
  | "sleep"
  | "mental"
  | "diabetes"
  | "weight"
  | "allergy"
  | "asthma"
  | "cardiac"
  | "hiv"
  | "antibiotics"
  | "bp"
  | "epilepsy"
  | "other";

export type Medicine = {
  id: string;
  name: string;
  generic: string;
  aliases: string[];
  category: MedicineCategory;
  controlClass: ControlClass;
  syringeRelated?: boolean;
};

export type RuleFields = {
  status: Exclude<ComplianceStatus, "unknown">;
  notes: string;
  permitRequired: boolean | null;
  permitName: string | null;
  prescriptionRequired: boolean | null;
  documents: string[] | null;
  maxQuantity: string | null;
  maxDays: number | null;
  transitEnforced: boolean | null;
};

export type CountryRuleSet = {
  generalNotes: string;
  returningCitizenNotes: string;
  classes: Partial<Record<ControlClass, RuleFields>>;
};

export type MedicineOverride = RuleFields & {
  medicineId: string;
  country: CountryCode;
};
