import type { CountryCode } from "./countries";
import type {
  ControlClass,
  CountryRuleSet,
  Medicine,
  MedicineOverride,
  RuleFields,
} from "./types";

const rx = [
  "Original prescription",
  "Medication in original packaging",
];

function rule(
  status: RuleFields["status"],
  notes: string,
  extra: Partial<RuleFields> = {},
): RuleFields {
  return {
    status,
    notes,
    permitRequired: extra.permitRequired ?? false,
    permitName: extra.permitName ?? null,
    prescriptionRequired: extra.prescriptionRequired ?? true,
    documents: extra.documents ?? rx,
    maxQuantity: extra.maxQuantity ?? null,
    maxDays: extra.maxDays ?? null,
    transitEnforced: extra.transitEnforced ?? null,
  };
}

export const COUNTRY_RULES: Record<CountryCode, CountryRuleSet> = {
  JP: {
    generalNotes:
      "Japan regulates personal import through MHLW. Prescription medicines are generally limited to a one-month supply. Narcotics require Narcotics Control Department permission. Amphetamine stimulants and cannabis are prohibited.",
    returningCitizenNotes:
      "Japanese residents re-entering with medication remain subject to the same personal-import and controlled-substance procedures as other travellers.",
    classes: {
      uncontrolled: rule(
        "allowed",
        "Dataset classifies this as a standard (non-controlled) medicine. Japan allows up to a one-month supply of prescription medicine for personal use, in original packaging, with a prescription or doctor's letter. More than one month requires a Yunyu Kakunin-sho (Yakkan Shoumei) import certificate.",
        { maxDays: 30, permitRequired: false, permitName: "Yunyu Kakunin-sho (if over 1 month)" },
      ),
      psychotropic: rule(
        "restricted",
        "Psychotropic medicines are limited to a one-month supply for personal use. Carry the original prescription. Quantities above one month, and some listed substances, require advance permission from the Narcotics Control Department.",
        {
          maxDays: 30,
          permitRequired: true,
          permitName: "NCD permission / Yunyu Kakunin-sho (if over 1 month)",
          documents: [...rx, "Japanese translation of prescription may be requested"],
        },
      ),
      narcotic: rule(
        "restricted",
        "Narcotic medicines require advance permission from Japan's Narcotics Control Department before entry, even for personal medical use and even in small quantities.",
        {
          permitRequired: true,
          permitName: "Narcotics Control Department import permission",
          documents: [...rx, "NCD application documents"],
        },
      ),
      stimulant: rule(
        "not_allowed",
        "Amphetamine and methamphetamine products are prohibited under Japan's Stimulant Drug Control Act, including many ADHD medicines that are legal elsewhere. Possession can be a criminal offence.",
        {
          permitRequired: false,
          permitName: null,
          prescriptionRequired: null,
          documents: null,
          maxDays: null,
        },
      ),
      cannabis: rule(
        "not_allowed",
        "Cannabis and THC-containing products are prohibited in Japan, including many CBD products that are not proven THC-free under Japanese standards.",
        {
          permitRequired: false,
          permitName: null,
          prescriptionRequired: null,
          documents: null,
          maxDays: null,
        },
      ),
      injectable: rule(
        "restricted",
        "Injectable medicines and syringes are generally restricted. Self-administered injections such as insulin are an exception, typically limited to a one-month supply. Other injectables and needles usually require a Yunyu Kakunin-sho.",
        {
          maxDays: 30,
          permitRequired: true,
          permitName: "Yunyu Kakunin-sho for injectables / syringes",
          documents: [...rx, "Doctor's letter describing self-administration"],
        },
      ),
    },
  },
  AE: {
    generalNotes:
      "The UAE requires a prescription covering the quantity carried. Uncontrolled medicines generally do not need pre-approval. Controlled, narcotic and psychotropic medicines require advance approval (Emirates Drug Establishment / MOHAP). Rules can apply in transit through Dubai or Abu Dhabi.",
    returningCitizenNotes:
      "UAE residents should still complete any required controlled-medicine approvals before arrival.",
    classes: {
      uncontrolled: rule(
        "allowed",
        "Dataset classifies this as a non-controlled medicine. Travellers may typically bring up to a three-month personal supply with a prescription (English or Arabic) and original packaging. Prior approval is not listed as required for uncontrolled medicines.",
        {
          maxDays: 90,
          prescriptionRequired: true,
          permitRequired: false,
          transitEnforced: null,
        },
      ),
      psychotropic: rule(
        "restricted",
        "Psychotropic medicines require advance approval through the UAE Ministry of Health / Emirates Drug Establishment before travel. Carry the original prescription. The dataset notes that controlled-medicine rules can apply to passengers transiting Dubai or Abu Dhabi.",
        {
          permitRequired: true,
          permitName: "EDE / MOHAP Medicines for Patients approval",
          documents: [...rx, "Doctor's letter", "Pre-travel authority approval"],
          transitEnforced: true,
        },
      ),
      narcotic: rule(
        "restricted",
        "Narcotic medicines (including many opioid pain medicines) require advance UAE authority approval. Import without a permit can be a criminal offence. Transit passengers have been reported as subject to the same controls.",
        {
          permitRequired: true,
          permitName: "EDE / MOHAP narcotic import approval",
          documents: [...rx, "Doctor's letter", "Pre-travel authority approval"],
          transitEnforced: true,
        },
      ),
      stimulant: rule(
        "restricted",
        "ADHD stimulant medicines are treated as controlled substances in the UAE and require advance authority approval. Travelling without a permit risks confiscation and prosecution.",
        {
          permitRequired: true,
          permitName: "EDE / MOHAP controlled-medicine approval",
          documents: [...rx, "Doctor's letter", "Pre-travel authority approval"],
          transitEnforced: true,
        },
      ),
      cannabis: rule(
        "not_allowed",
        "Cannabis, THC and related products are prohibited in the UAE, including many CBD products.",
        {
          permitRequired: false,
          permitName: null,
          prescriptionRequired: null,
          documents: null,
          transitEnforced: true,
        },
      ),
      injectable: rule(
        "restricted",
        "Injectable medicines should be accompanied by a prescription and doctor's letter. If the product is also a controlled substance, EDE/MOHAP pre-approval is required. Declare syringes and needles.",
        {
          permitRequired: true,
          permitName: "Approval if the injectable is a controlled substance",
          documents: [...rx, "Doctor's letter", "Syringe/needle declaration"],
          transitEnforced: true,
        },
      ),
    },
  },
  GB: {
    generalNotes:
      "The UK generally allows travellers to carry a personal supply of medicine (commonly cited as up to three months) with a prescription. Controlled drugs have additional Home Office rules.",
    returningCitizenNotes:
      "UK residents returning with medicines prescribed abroad should keep proof of legitimate personal use.",
    classes: {
      uncontrolled: rule(
        "allowed",
        "Dataset classifies this as a non-controlled medicine. The UK generally allows a personal supply of up to three months with a prescription or copy, in original packaging.",
        { maxDays: 90, permitRequired: false },
      ),
      psychotropic: rule(
        "restricted",
        "This is a controlled/psychotropic medicine in the dataset. Carry a prescription or doctor's letter covering the quantity. A personal import licence may be required depending on schedule and quantity — verify with the Home Office.",
        {
          maxDays: 90,
          permitRequired: null,
          permitName: "Home Office personal import licence (if applicable)",
          documents: [...rx, "Doctor's letter"],
        },
      ),
      narcotic: rule(
        "restricted",
        "Narcotic/controlled opioid medicines require a prescription covering personal use. A Home Office licence may be required for some schedules or quantities.",
        {
          permitRequired: true,
          permitName: "Home Office licence (if applicable)",
          documents: [...rx, "Doctor's letter"],
        },
      ),
      stimulant: rule(
        "restricted",
        "ADHD stimulant medicines are controlled drugs in the UK. Carry a prescription covering personal use and confirm whether a personal import licence is required.",
        {
          permitRequired: null,
          permitName: "Home Office licence (if applicable)",
          documents: [...rx, "Doctor's letter"],
        },
      ),
      cannabis: rule(
        "not_allowed",
        "Cannabis products, including most CBD oils with THC, are not permitted for personal import as ordinary travel medication in this dataset.",
        { permitRequired: false, permitName: null, prescriptionRequired: null, documents: null },
      ),
      injectable: rule(
        "allowed",
        "Injectable personal medicines such as insulin are generally allowed in original packaging with a prescription. Carry sharps safely and declare if asked.",
        { maxDays: 90, permitRequired: false, documents: [...rx, "Doctor's letter if carrying needles"] },
      ),
    },
  },
  DE: {
    generalNotes:
      "Germany allows personal-use medicines with a prescription. Narcotics travelling in the Schengen Area typically require a Schengen certificate. Entry from outside Schengen may need BfArM documentation for narcotics.",
    returningCitizenNotes:
      "German residents remain subject to BtMG documentation when carrying narcotics.",
    classes: {
      uncontrolled: rule(
        "allowed",
        "Dataset classifies this as a non-controlled medicine. Personal-use quantities with a prescription in original packaging are generally allowed.",
        { permitRequired: false },
      ),
      psychotropic: rule(
        "restricted",
        "Psychotropic/controlled medicines require a prescription. Additional BtMG documentation may apply depending on the substance.",
        {
          permitRequired: null,
          permitName: "BtMG / physician certificate if listed",
          documents: [...rx, "Doctor's certificate"],
        },
      ),
      narcotic: rule(
        "restricted",
        "Narcotic medicines require a Schengen certificate for travel within Schengen. Travellers entering Germany from outside Schengen should obtain the documentation required by BfArM.",
        {
          permitRequired: true,
          permitName: "Schengen certificate / BfArM documentation",
          documents: [...rx, "Schengen medical certificate"],
        },
      ),
      stimulant: rule(
        "restricted",
        "ADHD stimulants are controlled. Carry a prescription and any BtMG or Schengen documentation required for the specific substance.",
        {
          permitRequired: true,
          permitName: "Physician certificate / Schengen documentation if applicable",
          documents: [...rx, "Doctor's certificate"],
        },
      ),
      cannabis: rule(
        "restricted",
        "Medical cannabis is tightly documented. Recreational cannabis and undocumented CBD/THC products should not be treated as ordinary travel medication.",
        {
          permitRequired: true,
          permitName: "Medical cannabis documentation",
          documents: ["Medical cannabis prescription", "Physician certificate"],
        },
      ),
      injectable: rule(
        "allowed",
        "Personal injectable medicines with a prescription are generally allowed. Keep original packaging and a doctor's letter if carrying needles.",
        { permitRequired: false, documents: [...rx, "Doctor's letter if carrying needles"] },
      ),
    },
  },
  SG: {
    generalNotes:
      "Singapore allows up to a three-month personal supply of medicines. Controlled drugs require Health Sciences Authority approval, typically at least two weeks before arrival. Cannabis is prohibited.",
    returningCitizenNotes:
      "Singapore residents remain subject to HSA controlled-drug approval when bringing medicines in from overseas.",
    classes: {
      uncontrolled: rule(
        "allowed",
        "Dataset classifies this as a non-controlled medicine. Singapore generally allows up to a three-month personal supply. Keep the prescription and original packaging. Imports above three months are not allowed under HSA personal-import guidance in this dataset.",
        { maxDays: 90, permitRequired: false },
      ),
      psychotropic: rule(
        "restricted",
        "Psychotropic/controlled medicines require HSA approval before arrival (apply at least two weeks ahead). Personal supply is still subject to the three-month ceiling.",
        {
          maxDays: 90,
          permitRequired: true,
          permitName: "HSA approval",
          documents: [...rx, "HSA application documents"],
          transitEnforced: true,
        },
      ),
      narcotic: rule(
        "restricted",
        "Narcotic medicines require HSA approval in advance. Unauthorised import is a serious offence.",
        {
          permitRequired: true,
          permitName: "HSA approval",
          documents: [...rx, "HSA application documents"],
          transitEnforced: true,
        },
      ),
      stimulant: rule(
        "restricted",
        "ADHD stimulant medicines are controlled in Singapore and require HSA approval before travel.",
        {
          permitRequired: true,
          permitName: "HSA approval",
          documents: [...rx, "HSA application documents"],
          transitEnforced: true,
        },
      ),
      cannabis: rule(
        "not_allowed",
        "Cannabis and related products are prohibited in Singapore.",
        { permitRequired: false, permitName: null, prescriptionRequired: null, documents: null, transitEnforced: true },
      ),
      injectable: rule(
        "restricted",
        "Injectable personal medicines should be accompanied by a prescription. If the product is a controlled drug, HSA approval is required. Declare needles.",
        {
          maxDays: 90,
          permitRequired: true,
          permitName: "HSA approval if the product is controlled",
          documents: [...rx, "Doctor's letter"],
        },
      ),
    },
  },
  FR: {
    generalNotes:
      "France allows personal-use medicines with a prescription. Narcotics require a Schengen certificate or ANSM authorisation depending on the itinerary.",
    returningCitizenNotes:
      "French residents carrying narcotics should hold the required Schengen or ANSM documents.",
    classes: {
      uncontrolled: rule(
        "allowed",
        "Dataset classifies this as a non-controlled medicine. Personal-use quantities with a prescription in original packaging are generally allowed.",
        { permitRequired: false },
      ),
      psychotropic: rule(
        "restricted",
        "Psychotropic medicines require a prescription. Additional documentation may apply for listed substances.",
        { permitRequired: null, permitName: null, documents: [...rx, "Doctor's letter"] },
      ),
      narcotic: rule(
        "restricted",
        "Narcotic medicines require a Schengen certificate for travel within Schengen, or ANSM authorisation when entering from outside Schengen.",
        {
          permitRequired: true,
          permitName: "Schengen certificate / ANSM authorisation",
          documents: [...rx, "Schengen medical certificate"],
        },
      ),
      stimulant: rule(
        "restricted",
        "ADHD stimulants are controlled. Carry a prescription and confirm Schengen or ANSM documentation for the substance.",
        {
          permitRequired: true,
          permitName: "Physician certificate / ANSM if applicable",
          documents: [...rx, "Doctor's letter"],
        },
      ),
      cannabis: rule(
        "restricted",
        "Medical cannabis is not treated as ordinary personal-import medication in this dataset. Undocumented cannabis/THC products should not be carried.",
        { permitRequired: true, permitName: "Medical authorisation if any", documents: ["Medical documentation"] },
      ),
      injectable: rule(
        "allowed",
        "Personal injectable medicines with a prescription are generally allowed. Keep original packaging.",
        { permitRequired: false, documents: [...rx, "Doctor's letter if carrying needles"] },
      ),
    },
  },
  MX: {
    generalNotes:
      "Mexico allows personal-use medicines with a prescription. Psychotropic and narcotic medicines are regulated by COFEPRIS and require additional documentation.",
    returningCitizenNotes:
      "Mexican residents should keep prescriptions that match the medicines carried.",
    classes: {
      uncontrolled: rule(
        "allowed",
        "Dataset classifies this as a non-controlled medicine. Personal-use quantities with a prescription in original packaging are generally allowed.",
        { permitRequired: false },
      ),
      psychotropic: rule(
        "restricted",
        "Psychotropic medicines (psicotrópicos) require a prescription and may require additional COFEPRIS documentation. Quantities should be limited to personal treatment.",
        {
          permitRequired: true,
          permitName: "COFEPRIS documentation if listed",
          documents: [...rx, "Doctor's letter"],
        },
      ),
      narcotic: rule(
        "restricted",
        "Narcotic medicines are strictly controlled. Personal import without the required documentation is not treated as allowed in this dataset.",
        {
          permitRequired: true,
          permitName: "COFEPRIS / health-authority permit",
          documents: [...rx, "Official permit documents"],
        },
      ),
      stimulant: rule(
        "restricted",
        "ADHD stimulants are controlled psychotropics in Mexico. Carry a prescription and confirm any COFEPRIS requirement before travel.",
        {
          permitRequired: true,
          permitName: "COFEPRIS documentation if listed",
          documents: [...rx, "Doctor's letter"],
        },
      ),
      cannabis: rule(
        "restricted",
        "Cannabis products for travel are not treated as ordinary personal medication in this dataset. Verify COFEPRIS rules; undocumented THC products should not be carried.",
        { permitRequired: true, permitName: "COFEPRIS if applicable", documents: ["Medical documentation"] },
      ),
      injectable: rule(
        "allowed",
        "Personal injectable medicines with a prescription are generally allowed. Keep original packaging and a doctor's letter if carrying needles.",
        { permitRequired: false, documents: [...rx, "Doctor's letter if carrying needles"] },
      ),
    },
  },
  IN: {
    generalNotes:
      "India allows personal-use medicines with a valid prescription. Narcotic and psychotropic substances are controlled under the NDPS Act and may require specific approvals.",
    returningCitizenNotes:
      "Indian residents should carry prescriptions that match the medicines, especially when returning with medicines obtained abroad.",
    classes: {
      uncontrolled: rule(
        "allowed",
        "Dataset classifies this as a non-controlled medicine. Personal-use quantities with a valid prescription in original packaging are generally allowed.",
        { permitRequired: false },
      ),
      psychotropic: rule(
        "restricted",
        "Psychotropic substances are controlled under the NDPS framework. Carry a prescription and doctor's letter. Additional approvals may be required — verify before travel.",
        {
          permitRequired: true,
          permitName: "NDPS / CDSCO related approval if applicable",
          documents: [...rx, "Doctor's letter"],
        },
      ),
      narcotic: rule(
        "restricted",
        "Narcotic medicines are strictly controlled under the NDPS Act. Unauthorised import is not allowed. Confirm any personal-use permission with Indian authorities before travel.",
        {
          permitRequired: true,
          permitName: "NDPS / authority permission",
          documents: [...rx, "Official permission documents"],
        },
      ),
      stimulant: rule(
        "restricted",
        "ADHD stimulant medicines are controlled. Carry a prescription and confirm NDPS/CDSCO requirements. Some amphetamine products may not be permitted.",
        {
          permitRequired: true,
          permitName: "Authority permission if applicable",
          documents: [...rx, "Doctor's letter"],
        },
      ),
      cannabis: rule(
        "not_allowed",
        "Cannabis products are not treated as permitted personal-import medication in this dataset.",
        { permitRequired: false, permitName: null, prescriptionRequired: null, documents: null },
      ),
      injectable: rule(
        "restricted",
        "Injectable personal medicines should be accompanied by a prescription and doctor's letter. Declare needles.",
        {
          permitRequired: null,
          permitName: null,
          documents: [...rx, "Doctor's letter"],
        },
      ),
    },
  },
  IT: {
    generalNotes:
      "Italy allows personal-use medicines with a prescription. Narcotics require a Schengen certificate or Ministry of Health documentation.",
    returningCitizenNotes:
      "Italian residents carrying narcotics should hold Schengen or Ministry documentation.",
    classes: {
      uncontrolled: rule(
        "allowed",
        "Dataset classifies this as a non-controlled medicine. Personal-use quantities with a prescription in original packaging are generally allowed.",
        { permitRequired: false },
      ),
      psychotropic: rule(
        "restricted",
        "Psychotropic medicines require a prescription. Additional documentation may apply for listed substances.",
        { permitRequired: null, documents: [...rx, "Doctor's letter"] },
      ),
      narcotic: rule(
        "restricted",
        "Narcotic medicines require a Schengen certificate for travel within Schengen, or Ministry of Health documentation when entering from outside Schengen.",
        {
          permitRequired: true,
          permitName: "Schengen certificate / Ministry of Health documentation",
          documents: [...rx, "Schengen medical certificate"],
        },
      ),
      stimulant: rule(
        "restricted",
        "ADHD stimulants are controlled. Carry a prescription and confirm Schengen documentation for the substance.",
        {
          permitRequired: true,
          permitName: "Physician certificate / Schengen documentation if applicable",
          documents: [...rx, "Doctor's letter"],
        },
      ),
      cannabis: rule(
        "restricted",
        "Medical cannabis is tightly documented. Undocumented cannabis/THC products should not be carried as ordinary travel medication.",
        { permitRequired: true, permitName: "Medical authorisation if any", documents: ["Medical documentation"] },
      ),
      injectable: rule(
        "allowed",
        "Personal injectable medicines with a prescription are generally allowed.",
        { permitRequired: false, documents: [...rx, "Doctor's letter if carrying needles"] },
      ),
    },
  },
  TR: {
    generalNotes:
      "Turkey requires a prescription for personal medicines. Controlled medicines may need TİTCK permission. A doctor's letter (often requested in English or Turkish) is commonly cited in the dataset notes.",
    returningCitizenNotes:
      "Turkish residents should keep prescriptions matching the medicines carried.",
    classes: {
      uncontrolled: rule(
        "allowed",
        "Dataset classifies this as a non-controlled medicine. Personal-use quantities with a prescription and doctor's letter are generally allowed. Keep original packaging.",
        { permitRequired: false, documents: [...rx, "Doctor's letter"] },
      ),
      psychotropic: rule(
        "restricted",
        "Psychotropic medicines require a prescription and doctor's letter. TİTCK permission may be required — verify before travel.",
        {
          permitRequired: true,
          permitName: "TİTCK permission if listed",
          documents: [...rx, "Doctor's letter"],
        },
      ),
      narcotic: rule(
        "restricted",
        "Narcotic medicines require documentation and may require TİTCK permission. Do not travel without confirming the current personal-import process.",
        {
          permitRequired: true,
          permitName: "TİTCK permission",
          documents: [...rx, "Doctor's letter", "Official permit if issued"],
        },
      ),
      stimulant: rule(
        "restricted",
        "ADHD stimulant medicines are controlled. Carry a prescription, doctor's letter, and confirm TİTCK requirements.",
        {
          permitRequired: true,
          permitName: "TİTCK permission if listed",
          documents: [...rx, "Doctor's letter"],
        },
      ),
      cannabis: rule(
        "not_allowed",
        "Cannabis products are not treated as permitted personal-import medication in this dataset.",
        { permitRequired: false, permitName: null, prescriptionRequired: null, documents: null },
      ),
      injectable: rule(
        "restricted",
        "Injectable personal medicines should travel with a prescription and doctor's letter. Declare needles.",
        { permitRequired: null, documents: [...rx, "Doctor's letter"] },
      ),
    },
  },
  US: {
    generalNotes:
      "FDA personal importation policy generally allows a 90-day supply of medicine for personal use in original packaging. Controlled substances are regulated by DEA and generally cannot be imported. Declare medicines to CBP when required.",
    returningCitizenNotes:
      "US persons returning with foreign-purchased medicines remain subject to FDA personal importation limits and DEA controlled-substance rules.",
    classes: {
      uncontrolled: rule(
        "allowed",
        "Dataset classifies this as a non-controlled medicine. FDA personal importation policy generally allows up to a 90-day supply for personal use, in original packaging, with a prescription.",
        { maxDays: 90, permitRequired: false },
      ),
      psychotropic: rule(
        "restricted",
        "This medicine is treated as a controlled substance class in the dataset. DEA rules generally restrict importing controlled substances. A valid US prescription and remaining in personal-use quantities does not automatically authorise import of foreign-filled controlled drugs.",
        {
          permitRequired: true,
          permitName: "DEA / CBP authorisation is not assumed",
          documents: [...rx, "US prescription if any"],
        },
      ),
      narcotic: rule(
        "not_allowed",
        "Narcotic controlled substances generally cannot be imported into the United States for personal use under the dataset's DEA/FDA classification.",
        { permitRequired: false, permitName: null, prescriptionRequired: true, documents: rx },
      ),
      stimulant: rule(
        "restricted",
        "ADHD stimulants are DEA controlled substances. Importing foreign-filled stimulant medicines is generally restricted. Travellers with a valid US prescription typically carry medicine dispensed in the US rather than importing it.",
        {
          permitRequired: true,
          permitName: "DEA authorisation is not assumed",
          documents: [...rx],
        },
      ),
      cannabis: rule(
        "not_allowed",
        "Cannabis and most CBD products containing THC cannot be brought into the United States, including from jurisdictions where they are legal.",
        { permitRequired: false, permitName: null, prescriptionRequired: null, documents: null },
      ),
      injectable: rule(
        "allowed",
        "Personal injectable medicines such as insulin are generally allowed for personal use in original packaging with a prescription. Carry sharps containers and declare if asked.",
        { maxDays: 90, permitRequired: false, documents: [...rx, "Doctor's letter if carrying needles"] },
      ),
    },
  },
};

export const MEDICINES: Medicine[] = [
  { id: "adderall", name: "Adderall", generic: "amphetamine mixed salts", aliases: ["adderall xr", "dextroamphetamine", "amphetamine", "adderrall"], category: "adhd", controlClass: "stimulant" },
  { id: "vyvanse", name: "Vyvanse", generic: "lisdexamfetamine", aliases: ["elvanse", "lisdexamfetamine dimesylate"], category: "adhd", controlClass: "stimulant" },
  { id: "concerta", name: "Concerta", generic: "methylphenidate", aliases: ["ritalin", "ritalin la", "medikinet", "focalin", "dexmethylphenidate"], category: "adhd", controlClass: "stimulant" },
  { id: "modafinil", name: "Modafinil", generic: "modafinil", aliases: ["provigil", "modalert"], category: "adhd", controlClass: "psychotropic" },
  { id: "tramadol", name: "Tramadol", generic: "tramadol", aliases: ["ultram", "tramal"], category: "pain", controlClass: "narcotic" },
  { id: "codeine", name: "Codeine", generic: "codeine", aliases: ["codeine phosphate", "nurofen plus", "solpadeine", "tylenol with codeine"], category: "pain", controlClass: "narcotic" },
  { id: "oxycodone", name: "Oxycodone", generic: "oxycodone", aliases: ["oxycontin", "percocet", "endone"], category: "pain", controlClass: "narcotic" },
  { id: "morphine", name: "Morphine", generic: "morphine", aliases: ["ms contin", "sevedol"], category: "pain", controlClass: "narcotic" },
  { id: "ibuprofen", name: "Ibuprofen", generic: "ibuprofen", aliases: ["advil", "nurofen", "brufen", "motrin"], category: "pain", controlClass: "uncontrolled" },
  { id: "naproxen", name: "Naproxen", generic: "naproxen", aliases: ["aleve", "naprosyn"], category: "pain", controlClass: "uncontrolled" },
  { id: "zolpidem", name: "Zolpidem", generic: "zolpidem", aliases: ["ambien", "stilnox", "myslee"], category: "sleep", controlClass: "psychotropic" },
  { id: "alprazolam", name: "Alprazolam", generic: "alprazolam", aliases: ["xanax", "niravam"], category: "mental", controlClass: "psychotropic" },
  { id: "diazepam", name: "Diazepam", generic: "diazepam", aliases: ["valium"], category: "mental", controlClass: "psychotropic" },
  { id: "lorazepam", name: "Lorazepam", generic: "lorazepam", aliases: ["ativan"], category: "mental", controlClass: "psychotropic" },
  { id: "sertraline", name: "Sertraline", generic: "sertraline", aliases: ["zoloft", "lustral"], category: "mental", controlClass: "uncontrolled" },
  { id: "fluoxetine", name: "Fluoxetine", generic: "fluoxetine", aliases: ["prozac"], category: "mental", controlClass: "uncontrolled" },
  { id: "insulin", name: "Insulin", generic: "insulin", aliases: ["lantus", "humalog", "novorapid", "novolog", "levemir", "tresiba", "basaglar"], category: "diabetes", controlClass: "injectable", syringeRelated: true },
  { id: "metformin", name: "Metformin", generic: "metformin", aliases: ["glucophage", "glycomet"], category: "diabetes", controlClass: "uncontrolled" },
  { id: "ozempic", name: "Ozempic", generic: "semaglutide", aliases: ["wegovy", "rybelsus", "semaglutide"], category: "weight", controlClass: "injectable", syringeRelated: true },
  { id: "mounjaro", name: "Mounjaro", generic: "tirzepatide", aliases: ["zepbound", "tirzepatide"], category: "weight", controlClass: "injectable", syringeRelated: true },
  { id: "epipen", name: "EpiPen", generic: "epinephrine", aliases: ["adrenaline", "auvi-q", "epinephrine auto injector", "epipen jr"], category: "allergy", controlClass: "injectable", syringeRelated: true },
  { id: "ventolin", name: "Ventolin", generic: "salbutamol", aliases: ["albuterol", "salbutamol", "proair", "ventolin hfa"], category: "asthma", controlClass: "uncontrolled" },
  { id: "prednisone", name: "Prednisone", generic: "prednisone", aliases: ["prednisolone", "deltasone"], category: "asthma", controlClass: "uncontrolled" },
  { id: "warfarin", name: "Warfarin", generic: "warfarin", aliases: ["coumadin", "jantoven"], category: "cardiac", controlClass: "uncontrolled" },
  { id: "atorvastatin", name: "Atorvastatin", generic: "atorvastatin", aliases: ["lipitor"], category: "cardiac", controlClass: "uncontrolled" },
  { id: "amlodipine", name: "Amlodipine", generic: "amlodipine", aliases: ["norvasc"], category: "bp", controlClass: "uncontrolled" },
  { id: "lisinopril", name: "Lisinopril", generic: "lisinopril", aliases: ["zestril", "prinivil"], category: "bp", controlClass: "uncontrolled" },
  { id: "amoxicillin", name: "Amoxicillin", generic: "amoxicillin", aliases: ["amoxil", "augmentin"], category: "antibiotics", controlClass: "uncontrolled" },
  { id: "azithromycin", name: "Azithromycin", generic: "azithromycin", aliases: ["zithromax", "z-pak"], category: "antibiotics", controlClass: "uncontrolled" },
  { id: "levothyroxine", name: "Levothyroxine", generic: "levothyroxine", aliases: ["synthroid", "eltroxin"], category: "other", controlClass: "uncontrolled" },
  { id: "melatonin", name: "Melatonin", generic: "melatonin", aliases: ["circadin"], category: "sleep", controlClass: "uncontrolled" },
  { id: "cbd", name: "CBD", generic: "cannabidiol", aliases: ["cbd oil", "cannabidiol", "epidiolex"], category: "other", controlClass: "cannabis" },
  { id: "cannabis", name: "Medical cannabis", generic: "cannabis / THC", aliases: ["marijuana", "thc", "weed", "sativex"], category: "other", controlClass: "cannabis" },
  { id: "pseudoephedrine", name: "Pseudoephedrine", generic: "pseudoephedrine", aliases: ["sudafed", "unifed"], category: "other", controlClass: "stimulant" },
  { id: "diphenhydramine", name: "Diphenhydramine", generic: "diphenhydramine", aliases: ["benadryl", "nytol"], category: "allergy", controlClass: "uncontrolled" },
  { id: "testosterone", name: "Testosterone", generic: "testosterone", aliases: ["androgels", "androgel", "testogel", "depo-testosterone"], category: "other", controlClass: "narcotic", syringeRelated: true },
  { id: "biktarvy", name: "Biktarvy", generic: "bictegravir/emtricitabine/tenofovir", aliases: ["bictegravir"], category: "hiv", controlClass: "uncontrolled" },
  { id: "truvada", name: "Truvada", generic: "emtricitabine/tenofovir", aliases: ["prep", "descovy", "tenofovir"], category: "hiv", controlClass: "uncontrolled" },
  { id: "lamotrigine", name: "Lamotrigine", generic: "lamotrigine", aliases: ["lamictal"], category: "epilepsy", controlClass: "uncontrolled" },
  { id: "levetiracetam", name: "Levetiracetam", generic: "levetiracetam", aliases: ["keppra"], category: "epilepsy", controlClass: "uncontrolled" },
  { id: "phenobarbital", name: "Phenobarbital", generic: "phenobarbital", aliases: ["phenobarbitone", "luminal"], category: "epilepsy", controlClass: "psychotropic" },
  { id: "paracetamol", name: "Paracetamol", generic: "acetaminophen", aliases: ["acetaminophen", "tylenol", "panadol"], category: "pain", controlClass: "uncontrolled" },
];

function ov(
  medicineId: string,
  country: CountryCode,
  status: RuleFields["status"],
  notes: string,
  extra: Partial<RuleFields> = {},
): MedicineOverride {
  return {
    medicineId,
    country,
    ...rule(status, notes, extra),
  };
}

export const OVERRIDES: MedicineOverride[] = [
  ov(
    "adderall",
    "JP",
    "not_allowed",
    "Adderall contains amphetamine. Amphetamine products are prohibited in Japan under the Stimulant Drug Control Act, even with a foreign prescription. The dataset lists this as not allowed.",
    { permitRequired: false, permitName: null, documents: null, prescriptionRequired: null },
  ),
  ov(
    "vyvanse",
    "JP",
    "restricted",
    "Lisdexamfetamine is not in the same absolute-prohibition group as amphetamine salts in this dataset, but it is a stimulant-class medicine. Advance Yakkan Shoumei / NCD confirmation is required. Do not travel without written confirmation from Japanese authorities.",
    { permitRequired: true, permitName: "Yakkan Shoumei / NCD confirmation", documents: [...rx, "Advance import certificate"] },
  ),
  ov(
    "concerta",
    "JP",
    "restricted",
    "Methylphenidate (Concerta, Ritalin) requires advance import documentation (Yakkan Shoumei / NCD) for Japan. It is not treated as an ordinary one-month personal import in this dataset.",
    { permitRequired: true, permitName: "Yakkan Shoumei / NCD", maxDays: 30, documents: [...rx, "Advance import certificate"] },
  ),
  ov(
    "pseudoephedrine",
    "JP",
    "not_allowed",
    "Pseudoephedrine-containing cold medicines are prohibited for import into Japan.",
    { permitRequired: false, permitName: null, documents: null, prescriptionRequired: null },
  ),
  ov(
    "insulin",
    "JP",
    "allowed",
    "Self-administered insulin is an explicit exception to Japan's general injectable restriction. Dataset limit: one-month supply, original packaging, prescription or doctor's letter. Syringes/needles for insulin still sit under injectable documentation rules — confirm Yunyu Kakunin-sho if carrying needles.",
    { maxDays: 30, permitRequired: null, permitName: "Yunyu Kakunin-sho may be required for syringes", documents: [...rx, "Doctor's letter"] },
  ),
  ov(
    "melatonin",
    "JP",
    "restricted",
    "Melatonin is handled as a pharmaceutical in Japan, not as an unregulated supplement. Personal import follows prescription-medicine rules; confirm current MHLW classification before travel.",
    { maxDays: 30, permitRequired: false, documents: [...rx] },
  ),
  ov(
    "tramadol",
    "JP",
    "restricted",
    "Japan's Narcotics Control Department states tramadol is not classified as a narcotic. It is still a prescription medicine. Treat as a standard personal-import prescription medicine unless a more specific listing applies: one-month supply with prescription.",
    { maxDays: 30, permitRequired: false, prescriptionRequired: true },
  ),
  ov(
    "diphenhydramine",
    "AE",
    "restricted",
    "Diphenhydramine at some concentrations is listed among medicines that may require UAE authority review. Confirm the specific product against the EDE/MOHAP list before travel.",
    { permitRequired: true, permitName: "EDE / MOHAP confirmation", transitEnforced: true },
  ),
  ov(
    "adderall",
    "US",
    "allowed",
    "Amphetamine mixed salts dispensed against a valid US prescription for personal use are treated as allowed domestically in this dataset. Importing foreign-filled Adderall remains restricted under DEA rules.",
    { permitRequired: false, maxDays: 90, documents: rx },
  ),
  ov(
    "concerta",
    "US",
    "allowed",
    "Methylphenidate dispensed against a valid US prescription for personal use is treated as allowed domestically. Importing foreign-filled product remains restricted.",
    { permitRequired: false, maxDays: 90, documents: rx },
  ),
  ov(
    "vyvanse",
    "US",
    "allowed",
    "Lisdexamfetamine dispensed against a valid US prescription for personal use is treated as allowed domestically. Importing foreign-filled product remains restricted.",
    { permitRequired: false, maxDays: 90, documents: rx },
  ),
];

export const DATASET_META = {
  title: "CrossBorderMed regulatory dataset",
  version: "prototype-workbook-1",
  coverage:
    "Converted from the prototype workbook: medicine catalogue, country class rules, and explicit overrides. Combinations with no class rule and no override return No dataset available.",
};

export function classRule(country: CountryCode, controlClass: ControlClass): RuleFields | null {
  return COUNTRY_RULES[country].classes[controlClass] ?? null;
}

export function findOverride(medicineId: string, country: CountryCode): MedicineOverride | undefined {
  return OVERRIDES.find((row) => row.medicineId === medicineId && row.country === country);
}
