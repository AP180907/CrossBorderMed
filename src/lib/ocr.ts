import { MEDICINES } from "@/data/dataset";

export type OcrResult = {
  ok: boolean;
  names: string[];
  raw: string;
  uncertain: boolean;
  confidence: number;
  error?: string;
};

export type OcrProgress = {
  status: string;
  progress: number;
};

const PACKAGING_STOP = new Set([
  "tablet",
  "tablets",
  "tab",
  "tabs",
  "capsule",
  "capsules",
  "cap",
  "caps",
  "softgel",
  "strip",
  "strips",
  "blister",
  "pack",
  "packs",
  "batch",
  "bno",
  "exp",
  "expiry",
  "mfg",
  "mfd",
  "date",
  "dates",
  "use",
  "used",
  "using",
  "before",
  "each",
  "contains",
  "containing",
  "composition",
  "ingredients",
  "manufactured",
  "manufacture",
  "manufacturer",
  "marketed",
  "distributed",
  "limited",
  "ltd",
  "pvt",
  "private",
  "company",
  "inc",
  "llc",
  "plc",
  "pharma",
  "pharmaceutical",
  "pharmaceuticals",
  "laboratories",
  "laboratory",
  "labs",
  "india",
  "warning",
  "keep",
  "out",
  "reach",
  "children",
  "store",
  "cool",
  "dry",
  "place",
  "oral",
  "only",
  "prescription",
  "dose",
  "dosage",
  "take",
  "daily",
  "morning",
  "night",
  "uncoated",
  "coated",
  "film",
  "enteric",
  "sustained",
  "release",
  "extended",
  "formula",
  "formulae",
  "net",
  "weight",
  "contents",
  "quantity",
  "original",
  "generic",
  "brand",
  "name",
  "product",
  "information",
  "leaflet",
  "insert",
  "directions",
  "adults",
  "child",
  "not",
  "for",
  "the",
  "and",
  "with",
  "from",
  "this",
  "that",
  "your",
  "per",
  "one",
  "two",
]);

type Needle = { needle: string; display: string };

const NEEDLES: Needle[] = (() => {
  const rows: Needle[] = [];
  for (const med of MEDICINES) {
    rows.push({ needle: med.name, display: med.name });
    rows.push({ needle: med.generic, display: med.name });
    for (const alias of med.aliases) rows.push({ needle: alias, display: med.name });
    for (const part of med.generic.split(/[/+,]/)) {
      const trimmed = part.trim();
      if (trimmed.length >= 5) rows.push({ needle: trimmed, display: med.name });
    }
  }
  rows.sort((a, b) => b.needle.length - a.needle.length);
  return rows;
})();

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function foldOcr(value: string) {
  return value
    .toLowerCase()
    .replace(/0/g, "o")
    .replace(/[1|]/g, "i")
    .replace(/5/g, "s")
    .replace(/\$/g, "s");
}

function normalizeBlob(text: string) {
  return foldOcr(text.replace(/[^A-Za-z0-9+/]+/g, " ").replace(/\s+/g, " ").trim());
}

function wordBoundaryIncludes(blob: string, needle: string) {
  const n = foldOcr(needle.trim());
  if (n.length < 3) return false;
  const re = new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(n)}(?:[^a-z0-9]|$)`);
  return re.test(blob);
}

function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 2) return 99;
  const m = a.length;
  const n = b.length;
  const row = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) row[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = row[0]!;
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const cur = row[j]!;
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(prev + cost, row[j]! + 1, row[j - 1]! + 1);
      prev = cur;
    }
  }
  return row[n]!;
}

function titleish(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (/^\d/.test(word)) return word.toUpperCase();
      if (word.length <= 3 && word === word.toUpperCase()) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function extractUnknownNames(text: string, already: Set<string>) {
  const found: string[] = [];
  const lines = text
    .split(/[\n,;|/]+/)
    .map((line) => line.replace(/[•·]/g, " ").replace(/\s+/g, " ").trim())
    .filter((line) => line.length >= 4 && line.length <= 80);

  const dosage =
    /^([A-Za-z][A-Za-z0-9'’.\-]{2,}(?:\s+[A-Za-z][A-Za-z0-9'’.\-]{2,}){0,3})\s+(\d+(?:\.\d+)?)\s*(mg|mcg|ug|µg|ml|iu|g|%|mg\/ml)\b/i;
  const form =
    /^([A-Za-z][A-Za-z0-9'’.\-]{2,}(?:\s+[A-Za-z][A-Za-z0-9'’.\-]{2,}){0,3})\s+(tablets?|capsules?|injection|injectable|syrup|cream|gel|drops|inhaler|pen|suspension)\b/i;

  for (const line of lines) {
    const match = line.match(dosage) ?? line.match(form);
    if (!match) continue;
    const rawName = match[1]!.replace(/\b(ip|bp|usp|nf)\b/gi, "").trim();
    const key = foldOcr(rawName);
    if (rawName.length < 3 || PACKAGING_STOP.has(key) || already.has(key)) continue;
    if (key.split(" ").every((part) => PACKAGING_STOP.has(part))) continue;
    already.add(key);
    found.push(titleish(rawName));
  }
  return found;
}

export function extractNamesFromText(text: string): string[] {
  const blob = normalizeBlob(text);
  const tokens = blob.split(" ").filter((t) => t.length >= 4);
  const matched = new Set<string>();
  const display: string[] = [];

  for (const { needle, display: name } of NEEDLES) {
    if (matched.has(name)) continue;
    const folded = foldOcr(needle);
    if (folded.length < 3) continue;
    let hit = wordBoundaryIncludes(blob, needle);
    if (!hit && folded.length >= 7 && !folded.includes(" ")) {
      const maxDist = folded.length >= 10 ? 2 : 1;
      hit = tokens.some((token) => {
        if (Math.abs(token.length - folded.length) > maxDist) return false;
        return levenshtein(token, folded) <= maxDist;
      });
    }
    if (hit) {
      matched.add(name);
      display.push(name);
    }
  }

  const already = new Set(display.map((n) => foldOcr(n)));
  for (const extra of extractUnknownNames(text, already)) {
    display.push(extra);
  }
  return display.slice(0, 12);
}

function loadBitmap(file: Blob): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

function preprocess(bitmap: ImageBitmap): HTMLCanvasElement {
  const maxSide = 2200;
  const minShort = 900;
  let width = bitmap.width;
  let height = bitmap.height;
  const longSide = Math.max(width, height);
  const shortSide = Math.min(width, height);
  let scale = 1;
  if (longSide > maxSide) scale = maxSide / longSide;
  else if (shortSide < minShort) scale = minShort / shortSide;
  width = Math.max(1, Math.round(width * scale));
  height = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return canvas;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);

  const image = ctx.getImageData(0, 0, width, height);
  const px = image.data;
  let min = 255;
  let max = 0;
  for (let i = 0; i < px.length; i += 4) {
    const g = 0.299 * px[i]! + 0.587 * px[i + 1]! + 0.114 * px[i + 2]!;
    px[i] = px[i + 1] = px[i + 2] = g;
    if (g < min) min = g;
    if (g > max) max = g;
  }
  const range = Math.max(1, max - min);
  for (let i = 0; i < px.length; i += 4) {
    const stretched = ((px[i]! - min) / range) * 255;
    const contrast = ((stretched / 255 - 0.5) * 1.45 + 0.5) * 255;
    const v = Math.max(0, Math.min(255, contrast));
    px[i] = px[i + 1] = px[i + 2] = v;
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

function invertCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.drawImage(source, 0, 0);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = image.data;
  for (let i = 0; i < px.length; i += 4) {
    px[i] = 255 - px[i]!;
    px[i + 1] = 255 - px[i + 1]!;
    px[i + 2] = 255 - px[i + 2]!;
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

type TessMod = typeof import("tesseract.js");

let workerPromise: Promise<import("tesseract.js").Worker> | null = null;
let loggerFn: (msg: { status: string; progress: number }) => void = () => {};

function tesseractDir() {
  return `${window.location.origin}/tesseract`;
}

async function getWorker() {
  if (typeof window === "undefined") {
    throw new Error("OCR runs in the browser.");
  }
  if (!workerPromise) {
    workerPromise = (async () => {
      const tesseract: TessMod = await import("tesseract.js");
      const dir = tesseractDir();
      const worker = await tesseract.createWorker("eng", 1, {
        workerPath: `${dir}/worker.min.js`,
        corePath: dir,
        langPath: dir,
        gzip: true,
        legacyCore: false,
        legacyLang: false,
        logger: (msg) => {
          loggerFn({ status: msg.status, progress: msg.progress ?? 0 });
        },
      });
      await worker.setParameters({
        tessedit_pageseg_mode: tesseract.PSM.SINGLE_BLOCK,
        preserve_interword_spaces: "1",
        user_defined_dpi: "300",
      });
      return worker;
    })();
  }
  return workerPromise;
}

async function recognizeCanvas(canvas: HTMLCanvasElement, psm: string) {
  const tesseract: TessMod = await import("tesseract.js");
  const worker = await getWorker();
  await worker.setParameters({
    tessedit_pageseg_mode: psm as typeof tesseract.PSM.SINGLE_BLOCK,
    preserve_interword_spaces: "1",
    user_defined_dpi: "300",
  });
  const result = await worker.recognize(canvas, { rotateAuto: true });
  return {
    text: result.data.text ?? "",
    confidence: result.data.confidence ?? 0,
  };
}

export async function extractFromText(text: string, handwritten = false): Promise<OcrResult> {
  const names = extractNamesFromText(text);
  return {
    ok: true,
    names,
    raw: text.slice(0, 4000),
    uncertain: handwritten || names.length === 0,
    confidence: names.length ? 90 : 0,
  };
}

export async function extractFromImage(
  file: Blob,
  options: { handwritten?: boolean; onProgress?: (progress: OcrProgress) => void } = {},
): Promise<OcrResult> {
  const onProgress = options.onProgress;
  loggerFn = (msg) => {
    const label =
      msg.status === "recognizing text"
        ? "Reading the label"
        : msg.status === "loading language traineddata"
          ? "Loading OCR language data"
          : msg.status === "initializing api" || msg.status === "loading tesseract core"
            ? "Starting OCR engine"
            : "Working";
    onProgress?.({ status: label, progress: msg.progress ?? 0 });
  };

  try {
    onProgress?.({ status: "Preparing image", progress: 0.05 });
    const bitmap = await loadBitmap(file);
    const prepared = preprocess(bitmap);
    bitmap.close();

    onProgress?.({ status: "Reading the label", progress: 0.15 });
    const tesseract: TessMod = await import("tesseract.js");
    const first = await recognizeCanvas(prepared, tesseract.PSM.SINGLE_BLOCK);
    let text = first.text;
    let confidence = first.confidence;
    let names = extractNamesFromText(text);

    if (names.length === 0) {
      onProgress?.({ status: "Trying a second reading pass", progress: 0.55 });
      const sparse = await recognizeCanvas(prepared, tesseract.PSM.SPARSE_TEXT);
      if ((sparse.text?.trim().length ?? 0) > text.trim().length || sparse.confidence > confidence) {
        text = [text, sparse.text].filter(Boolean).join("\n");
        confidence = Math.max(confidence, sparse.confidence);
      } else {
        text = [text, sparse.text].filter(Boolean).join("\n");
      }
      names = extractNamesFromText(text);
    }

    if (names.length === 0) {
      onProgress?.({ status: "Reading inverted contrast", progress: 0.8 });
      const inverted = invertCanvas(prepared);
      const second = await recognizeCanvas(inverted, tesseract.PSM.SINGLE_BLOCK);
      text = [text, second.text].filter(Boolean).join("\n");
      confidence = Math.max(confidence, second.confidence);
      names = extractNamesFromText(text);
    }

    const raw = text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    if (!raw) {
      return {
        ok: false,
        names: [],
        raw: "",
        uncertain: true,
        confidence: 0,
        error: "No text could be read from that image. Try a sharper, well-lit photo of the name on the pack.",
      };
    }

    return {
      ok: true,
      names,
      raw: raw.slice(0, 4000),
      uncertain: Boolean(options.handwritten) || confidence < 55 || names.length === 0,
      confidence,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "OCR failed";
    return {
      ok: false,
      names: [],
      raw: "",
      uncertain: true,
      confidence: 0,
      error: `Could not read the image (${message}). Try another photo or type the names.`,
    };
  }
}
