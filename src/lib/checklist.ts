import type { CheckResult } from "./compliance";
import type { ConditionId } from "@/data/conditions";

export type ChecklistItem = {
  id: string;
  label: string;
  why: string;
};

export function buildChecklist(
  result: CheckResult,
  conditions: ConditionId[],
  syringes: boolean,
): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  const add = (id: string, label: string, why: string) => {
    if (!items.some((item) => item.id === id)) items.push({ id, label, why });
  };

  const lookups = result.medicines.flatMap((row) =>
    [row.destination, row.transit].filter(Boolean),
  );

  if (lookups.some((row) => row?.prescriptionRequired)) {
    add(
      "prescription",
      "Prescription available",
      "At least one dataset record lists a prescription requirement.",
    );
  }
  if (lookups.some((row) => row?.documents?.some((d) => /packaging/i.test(d)))) {
    add(
      "packaging",
      "Medication in original packaging",
      "Dataset documentation lists original packaging.",
    );
  }
  if (lookups.some((row) => row?.documents?.some((d) => /doctor/i.test(d)))) {
    add(
      "letter",
      "Doctor's letter prepared",
      "A doctor's letter is listed in the dataset documents for this route.",
    );
  }
  if (lookups.some((row) => row?.maxDays != null || row?.maxQuantity != null)) {
    add(
      "quantity",
      "Quantity checked",
      "The dataset specifies a maximum days and/or quantity for at least one medicine.",
    );
  }
  if (result.input.transit) {
    add(
      "transit",
      "Transit requirements checked",
      "A transit country is on this itinerary.",
    );
  }
  if (
    syringes ||
    result.medicines.some((row) => row.matched?.syringeRelated) ||
    conditions.includes("diabetes") ||
    conditions.includes("allergy") ||
    conditions.includes("weight")
  ) {
    add(
      "syringes",
      "Syringe / needle requirements checked",
      "The itinerary includes injectables, a syringe declaration, or a related health selection.",
    );
  }
  if (
    conditions.includes("allergy") ||
    conditions.includes("epilepsy") ||
    conditions.includes("cardiac") ||
    conditions.includes("asthma") ||
    result.medicines.some((row) =>
      ["epipen", "insulin", "ventolin"].includes(row.matched?.id ?? ""),
    )
  ) {
    add(
      "emergency-pack",
      "Emergency medication packed separately",
      "Selected conditions or matched medicines include time-critical treatment.",
    );
  }
  if (lookups.some((row) => (row?.documents && row.documents.length > 0) || row?.permitRequired)) {
    add(
      "copies",
      "Copies of documents saved",
      "The dataset lists documents or a permit for this route.",
    );
  }
  if (
    lookups.some(
      (row) =>
        row?.status === "restricted" ||
        row?.status === "not_allowed" ||
        row?.permitRequired,
    )
  ) {
    add(
      "authority",
      "Destination authority requirements verified",
      "A restriction or permit is present — confirm with the destination or transit authority before flying.",
    );
  }
  if (conditions.includes("hiv") || result.medicines.some((row) => row.matched?.category === "hiv")) {
    add(
      "privacy",
      "HIV medicines kept in original labelled packaging",
      "Selected HIV / antiretroviral treatment. Packaging and prescription remain the dataset document requirement; this is not a diagnosis.",
    );
  }
  if (conditions.includes("sleep") || result.medicines.some((row) => row.matched?.category === "sleep")) {
    add(
      "sleep-control",
      "Sleep-medicine controlled-drug papers packed",
      "Sleep aids are frequently psychotropic in this dataset.",
    );
  }

  return items;
}

export function preparationNotes(
  conditions: ConditionId[],
  syringes: boolean,
): string[] {
  const notes: string[] = [];
  const has = (id: ConditionId) => conditions.includes(id);

  if (has("sleep")) {
    notes.push(
      "Sleep aids are often psychotropic. Keep them in original packaging and expect prescription or permit checks on some routes.",
    );
  }
  if (has("diabetes")) {
    notes.push(
      "Pack insulin and meters in carry-on, with cooling if required. Confirm syringe rules for every country on the ticket.",
    );
  }
  if (has("epilepsy")) {
    notes.push(
      "Do not pack all anti-seizure medicine in checked baggage. Keep a dosing schedule and original packaging in your cabin bag.",
    );
  }
  if (has("allergy")) {
    notes.push(
      "Carry epinephrine auto-injectors in the cabin and tell the airline you are travelling with them. This is preparation guidance, not a diagnosis.",
    );
  }
  if (has("asthma")) {
    notes.push("Keep inhalers in original boxes in carry-on. Nebuliser batteries and liquids follow airline equipment rules.");
  }
  if (has("cardiac")) {
    notes.push(
      "If you use an anticoagulant or other time-critical cardiac medicine, keep a doctor's letter and extra doses in your cabin bag.",
    );
  }
  if (has("mental")) {
    notes.push(
      "Many mental-health medicines are uncontrolled, but benzodiazepines and some stimulants are not. Check each medicine separately.",
    );
  }
  if (has("hiv")) {
    notes.push(
      "Keep antiretroviral medicines in original labelled packaging with a prescription. CrossBorderMed does not disclose health status to any authority.",
    );
  }
  if (has("weight")) {
    notes.push(
      "GLP-1 injectables are typically prescription medicines and may follow injectable/syringe rules. Keep pens in cabin baggage.",
    );
  }
  if (has("antibiotics")) {
    notes.push("Carry the remaining labelled course plus the prescription. Do not import unused antibiotics as a general stock.");
  }
  if (has("bp")) {
    notes.push("Blood-pressure medicines are usually non-controlled. Keep original packaging and a prescription copy.");
  }
  if (has("pain")) {
    notes.push(
      "Opioid and some combination pain medicines are narcotics in this dataset. NSAIDs are usually not. Check each product.",
    );
  }
  if (syringes) {
    notes.push(
      "Syringes and needles should be declared when required, stored in original packaging or a sharps case, and supported by a doctor's letter.",
    );
  }
  return notes;
}
