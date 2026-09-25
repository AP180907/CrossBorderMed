import { COUNTRIES, type CountryCode } from "@/data/countries";
import {
  COUNTRY_RULES,
  DATASET_META,
  MEDICINES,
  classRule,
  findOverride,
} from "@/data/dataset";
import type { ComplianceStatus, Medicine, RuleFields } from "@/data/types";

export type LookupSource = "override" | "class-rule" | "none";

export type CountryLookup = {
  country: CountryCode;
  countryName: string;
  role: "destination" | "transit";
  status: ComplianceStatus;
  source: LookupSource;
  notes: string | null;
  permitRequired: boolean | null;
  permitName: string | null;
  prescriptionRequired: boolean | null;
  documents: string[] | null;
  maxQuantity: string | null;
  maxDays: number | null;
  transitEnforced: boolean | null;
  generalNotes: string;
};

export type MedicineResult = {
  query: string;
  matched: Medicine | null;
  overall: ComplianceStatus;
  destination: CountryLookup;
  transit: CountryLookup | null;
};

export type CheckInput = {
  medicines: string[];
  citizenship: CountryCode;
  /** Country the traveller boards from. Falls back to citizenship on older saved checks. */
  source?: CountryCode;
  destination: CountryCode;
  transit: CountryCode | null;
};

export type CheckResult = {
  id: string;
  createdAt: string;
  input: CheckInput;
  dataset: typeof DATASET_META;
  medicines: MedicineResult[];
  overall: ComplianceStatus;
  origin: {
    country: CountryCode;
    city: string;
    notes: string;
  };
};

const STATUS_RANK: Record<ComplianceStatus, number> = {
  not_allowed: 3,
  restricted: 2,
  allowed: 1,
  unknown: 0,
};

export function worstStatus(statuses: ComplianceStatus[]): ComplianceStatus {
  return statuses.reduce((acc, status) =>
    STATUS_RANK[status] > STATUS_RANK[acc] ? status : acc,
  "unknown");
}

export function boardingCountry(input: Pick<CheckInput, "citizenship" | "source">): CountryCode {
  return input.source ?? input.citizenship;
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchMedicine(query: string): Medicine | null {
  const q = normalize(query);
  if (!q) return null;

  const exact = MEDICINES.find((med) => {
    const names = [med.name, med.generic, ...med.aliases].map(normalize);
    return names.includes(q);
  });
  if (exact) return exact;

  const contained = MEDICINES.find((med) => {
    const names = [med.name, med.generic, ...med.aliases].map(normalize);
    return names.some((name) => q.includes(name) || (q.length >= 4 && name.includes(q)));
  });
  if (contained) return contained;

  const tokens = q.split(" ").filter((t) => t.length >= 4);
  if (!tokens.length) return null;
  return (
    MEDICINES.find((med) => {
      const blob = normalize([med.name, med.generic, ...med.aliases].join(" "));
      return tokens.every((token) => blob.includes(token));
    }) ?? null
  );
}

function fieldsToLookup(
  country: CountryCode,
  role: "destination" | "transit",
  fields: RuleFields | null,
  source: LookupSource,
): CountryLookup {
  const meta = COUNTRIES[country];
  if (!fields) {
    return {
      country,
      countryName: meta.name,
      role,
      status: "unknown",
      source: "none",
      notes: null,
      permitRequired: null,
      permitName: null,
      prescriptionRequired: null,
      documents: null,
      maxQuantity: null,
      maxDays: null,
      transitEnforced: null,
      generalNotes: COUNTRY_RULES[country].generalNotes,
    };
  }

  let notes = fields.notes;
  if (role === "transit") {
    if (fields.transitEnforced === true) {
      notes = `${fields.notes} Dataset flags that this country's controlled-medicine rules can apply in transit.`;
    } else if (fields.transitEnforced === false) {
      notes = `${fields.notes} Dataset indicates airside transit is not treated the same as entry.`;
    } else {
      notes = `${fields.notes} Dataset does not confirm whether this rule is enforced in airside transit — verify with the carrier and authority.`;
    }
  }

  return {
    country,
    countryName: meta.name,
    role,
    status: fields.status,
    source,
    notes,
    permitRequired: fields.permitRequired,
    permitName: fields.permitName,
    prescriptionRequired: fields.prescriptionRequired,
    documents: fields.documents,
    maxQuantity: fields.maxQuantity,
    maxDays: fields.maxDays,
    transitEnforced: fields.transitEnforced,
    generalNotes: COUNTRY_RULES[country].generalNotes,
  };
}

export function lookupMedicineCountry(
  medicine: Medicine | null,
  country: CountryCode,
  role: "destination" | "transit",
): CountryLookup {
  if (!medicine) {
    return fieldsToLookup(country, role, null, "none");
  }
  const override = findOverride(medicine.id, country);
  if (override) {
    return fieldsToLookup(country, role, override, "override");
  }
  const byClass = classRule(country, medicine.controlClass);
  if (byClass) {
    return fieldsToLookup(country, role, byClass, "class-rule");
  }
  return fieldsToLookup(country, role, null, "none");
}

function originNotes(input: CheckInput): string {
  const citizen = COUNTRIES[input.citizenship];
  const originCode = boardingCountry(input);
  const boarding = COUNTRIES[originCode];
  const returning = input.citizenship === input.destination;
  const returningText = COUNTRY_RULES[input.citizenship].returningCitizenNotes;

  if (returning) {
    if (originCode === input.citizenship) return returningText;
    return `Boarding/origin is ${boarding.name}. ${returningText}`;
  }

  if (originCode === input.citizenship) {
    return `Traveller citizenship/origin is ${citizen.name}. Destination and transit requirements in this dataset still apply regardless of citizenship; carry documents issued in the country of treatment.`;
  }

  return `Traveller citizenship is ${citizen.name}. Boarding/origin is ${boarding.name}. Destination and transit requirements in this dataset still apply regardless of citizenship; carry documents issued in the country of treatment.`;
}

export function runComplianceCheck(input: CheckInput): CheckResult {
  const medicines = input.medicines
    .map((name) => name.trim())
    .filter(Boolean)
    .map((query) => {
      const matched = matchMedicine(query);
      const destination = lookupMedicineCountry(matched, input.destination, "destination");
      const transit = input.transit
        ? lookupMedicineCountry(matched, input.transit, "transit")
        : null;
      const overall = worstStatus(
        [destination.status, transit?.status].filter(Boolean) as ComplianceStatus[],
      );
      return { query, matched, overall, destination, transit };
    });

  const originCode = boardingCountry(input);
  const origin = COUNTRIES[originCode];

  return {
    id: `chk-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    input,
    dataset: DATASET_META,
    medicines,
    overall: worstStatus(medicines.map((row) => row.overall)),
    origin: {
      country: originCode,
      city: origin.originLabel,
      notes: originNotes(input),
    },
  };
}

export const STATUS_LABEL: Record<ComplianceStatus, string> = {
  allowed: "Allowed / compatible",
  restricted: "Uncertain / restricted / requires verification",
  not_allowed: "Not allowed / high restriction",
  unknown: "No dataset available",
};

export function medicineSuggestions(query: string, limit = 8): Medicine[] {
  const q = normalize(query);
  if (!q) return MEDICINES.slice(0, limit);
  return MEDICINES.filter((med) =>
    normalize([med.name, med.generic, ...med.aliases].join(" ")).includes(q),
  ).slice(0, limit);
}
