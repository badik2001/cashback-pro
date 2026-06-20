import { createWorker } from "tesseract.js";

export interface ParsedCategory {
  name: string;
  percent: number;
}

/* =========================================================
   Image preprocessing
   ---------------------------------------------------------
   The original spec asked for the Node.js "sharp" library to
   resize / grayscale / boost contrast / sharpen screenshots
   before OCR. Sharp depends on native bindings and only runs
   in Node — it cannot run inside the user's browser. Since this
   app is a static SPA with no backend server, we reproduce the
   same pipeline (resize → grayscale → contrast → sharpen) with
   the Canvas API, entirely client-side, then hand the result to
   tesseract.js (the WebAssembly build of Tesseract OCR).
   ========================================================= */

const TARGET_MIN_WIDTH = 1400;
const TARGET_MAX_WIDTH = 2200;

async function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Не удалось прочитать изображение"));
    });
    return img;
  } finally {
    // Revoke after decode (the Image keeps decoded bitmap data, not the blob URL)
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

function clamp(v: number, min = 0, max = 255): number {
  return v < min ? min : v > max ? max : v;
}

/** Resize (upscale small screenshots for better OCR), grayscale, stretch contrast, sharpen. */
async function preprocessImage(file: File | Blob): Promise<HTMLCanvasElement> {
  const img = await loadImage(file);

  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  let scale = 1;
  if (srcW < TARGET_MIN_WIDTH) scale = TARGET_MIN_WIDTH / srcW;
  if (srcW * scale > TARGET_MAX_WIDTH) scale = TARGET_MAX_WIDTH / srcW;

  const w = Math.round(srcW * scale);
  const h = Math.round(srcH * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D недоступен");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const { data } = imageData;
  const pixelCount = w * h;
  const gray = new Float32Array(pixelCount);

  // 1) Grayscale (luminosity)
  let min = 255;
  let max = 0;
  for (let i = 0; i < pixelCount; i++) {
    const o = i * 4;
    const g = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
    gray[i] = g;
    if (g < min) min = g;
    if (g > max) max = g;
  }

  // 2) Contrast stretch (normalize the observed range to 0-255)
  const range = Math.max(max - min, 1);
  for (let i = 0; i < pixelCount; i++) {
    gray[i] = ((gray[i] - min) / range) * 255;
  }

  // 3) Sharpen (simple 3x3 unsharp kernel) — improves thin font edges
  const sharpened = new Float32Array(pixelCount);
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let k = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const sx = clamp(x + kx, 0, w - 1);
          const sy = clamp(y + ky, 0, h - 1);
          sum += gray[sy * w + sx] * kernel[k++];
        }
      }
      sharpened[y * w + x] = clamp(sum);
    }
  }

  // Write back as grayscale RGBA
  for (let i = 0; i < pixelCount; i++) {
    const v = sharpened[i];
    const o = i * 4;
    data[o] = v;
    data[o + 1] = v;
    data[o + 2] = v;
    data[o + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/* =========================================================
   Text -> categories parsing
   ========================================================= */

const NOISE_NAMES = new Set(["", "%", "-", "—", "•"]);

/**
 * The row icons in bank-app screenshots (circular category glyphs,
 * checkboxes, info "i" badges, ® / © marks, etc.) sit right next to the
 * real text and get OCR'd as garbage tokens glued to the start/end of the
 * line — e.g. "О Деливери Фе О" or "№ А Активный отдых ® О" where the
 * actual category is in the middle. A token is almost certainly such
 * garbage when it's either pure punctuation/symbols (no letters or
 * digits at all) or very short (1-2 letters) — real category words are
 * never that short on their own. We strip those iteratively from both
 * ends until only the real name remains, but always leave at least one
 * token so a genuinely short name still survives.
 */
function isNoiseToken(token: string): boolean {
  const hasAlnum = /[\p{L}\p{N}]/u.test(token);
  if (!hasAlnum) return true;
  const lettersOnly = token.replace(/[^\p{L}\p{N}]/gu, "");
  return lettersOnly.length <= 2;
}

function cleanName(raw: string): string {
  const tokens = raw
    .replace(/[•·●○◦]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  while (tokens.length > 1 && isNoiseToken(tokens[0])) tokens.shift();
  while (tokens.length > 1 && isNoiseToken(tokens[tokens.length - 1])) tokens.pop();

  let name = tokens
    .join(" ")
    .replace(/[«»"“”]/g, "")
    .replace(/^[^\p{L}\p{N}]+/u, "")
    .replace(/[^\p{L}\p{N}]+$/u, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (name.length > 0) name = name[0].toUpperCase() + name.slice(1);
  return name;
}

export function parseCategoriesFromText(text: string): ParsedCategory[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const percentRe = /(\d{1,3}(?:[.,]\d{1,2})?)\s*%/;
  const results: ParsedCategory[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const match = line.match(percentRe);
    if (!match) continue; // lines without a "%" are headers/subtitles/nav noise — skip

    const percent = clamp(parseFloat(match[1].replace(",", ".")), 0, 100);
    const name = cleanName(line.replace(match[0], " "));

    if (NOISE_NAMES.has(name) || name.length < 2) continue;

    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    results.push({ name, percent });
    if (results.length >= 30) break;
  }

  return results;
}

/* =========================================================
   Public entry point
   ========================================================= */

export async function recognizeCategoriesFromImage(
  file: File,
  onProgress?: (status: string, progress: number) => void
): Promise<ParsedCategory[]> {
  const canvas = await preprocessImage(file);

  const worker = await createWorker(["rus", "eng"], undefined, {
    logger: (m) => {
      if (m.status && typeof m.progress === "number") onProgress?.(m.status, m.progress);
    },
  });

  try {
    const { data } = await worker.recognize(canvas);
    return parseCategoriesFromText(data.text);
  } finally {
    await worker.terminate();
  }
}
