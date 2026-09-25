export const HEALTH_CONDITIONS = [
  { id: "sleep", label: "Sleep aids", hint: "Hypnotics, z-drugs, melatonin" },
  { id: "diabetes", label: "Diabetes", hint: "Insulin, glucose meters" },
  { id: "epilepsy", label: "Epilepsy", hint: "Anti-seizure medicines" },
  { id: "allergy", label: "Severe allergy / anaphylaxis", hint: "Epinephrine auto-injectors" },
  { id: "asthma", label: "Asthma / COPD", hint: "Inhalers, nebulisers" },
  { id: "cardiac", label: "Cardiac conditions", hint: "Anticoagulants, heart medicines" },
  { id: "mental", label: "Mental health", hint: "Antidepressants, anxiolytics" },
  { id: "hiv", label: "HIV / antiretroviral treatment", hint: "ART / PrEP" },
  { id: "weight", label: "Type 2 diabetes / weight management", hint: "GLP-1 injectables" },
  { id: "antibiotics", label: "Antibiotics", hint: "Course-in-progress medicines" },
  { id: "bp", label: "Blood pressure", hint: "Antihypertensives" },
  { id: "pain", label: "Pain / anti-inflammatory medication", hint: "NSAIDs, opioids" },
  { id: "other", label: "Other", hint: "Anything not listed" },
] as const;

export type ConditionId = (typeof HEALTH_CONDITIONS)[number]["id"];
