// PaperHacking Persistence Layer v2
// Folder-based storage: data.json (lean metadata) + pdfs/ (binary) + images/ (binary)
// Automatically migrates from old single-file JSON format.

import { open } from "@tauri-apps/plugin-dialog";
import {
  writeTextFile,
  readTextFile,
  readFile,
  writeFile,
  mkdir,
  exists,
} from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import type { AppState, Paper } from "@/data/types";
import { createInitialState } from "@/data/types";

// Filenames
const DATA_FILE = "data.json";
const OLD_DATA_FILE = "paperhacking-data.json";
const PDFS_DIR = "pdfs";
const IMAGES_DIR = "images";
const DIR_KEY = "paperhacking-data-directory";

// --- localStorage bootstrap ---

function saveDirToLocalStorage(dir: string): void {
  try {
    localStorage.setItem(DIR_KEY, dir);
  } catch {
    /* localStorage unavailable */
  }
}

function loadDirFromLocalStorage(): string | null {
  try {
    return localStorage.getItem(DIR_KEY);
  } catch {
    return null;
  }
}

export function clearDirFromLocalStorage(): void {
  try {
    localStorage.removeItem(DIR_KEY);
  } catch {
    /* ignore */
  }
}

// --- Base64 <-> Uint8Array helpers ---

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function extractBase64FromDataUrl(dataUrl: string): string {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) return dataUrl;
  return dataUrl.slice(commaIndex + 1);
}

function getDataUrlMimeType(dataUrl: string): string {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) return "image/png";
  const prefix = dataUrl.slice(0, commaIndex);
  const match = prefix.match(/data:([^;]+)/);
  return match ? match[1] : "image/png";
}

function getImageExtFromMime(mime: string): string {
  if (mime.includes("png")) return "png";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("webp")) return "webp";
  return "png";
}

// --- Path helpers ---

async function path(dir: string, ...segments: string[]): Promise<string> {
  return join(dir, ...segments);
}

// --- Detect format ---

async function detectFormat(dataDir: string): Promise<"new" | "old" | "none"> {
  const hasNew = await exists(await path(dataDir, DATA_FILE));
  if (hasNew) return "new";
  const hasOld = await exists(await path(dataDir, OLD_DATA_FILE));
  if (hasOld) return "old";
  return "none";
}

// --- Save: Memory (full) -> Disk (lean + binary) ---

/**
 * Write state to disk.
 * - Saves lean data.json (no base64 blobs)
 * - Saves PDFs as binary files in pdfs/
 * - Saves term images as binary files in images/
 * - Cleans up orphaned files
 */
export async function saveStateToDisk(state: AppState): Promise<void> {
  const dir = state.settings.dataDirectory;
  if (!dir) return;

  saveDirToLocalStorage(dir);

  // Ensure subdirectories exist
  await mkdir(await path(dir, PDFS_DIR), { recursive: true });
  await mkdir(await path(dir, IMAGES_DIR), { recursive: true });

  // Write PDF binaries
  for (const paper of state.papers) {
    if (paper.pdf?.data) {
      const fileName = `${paper.id}.pdf`;
      const pdfPath = await path(dir, PDFS_DIR, fileName);
      const bytes = base64ToUint8Array(paper.pdf.data);
      await writeFile(pdfPath, bytes);
    }
  }

  // Write image binaries
  for (const term of state.terms) {
    if (term.image) {
      const mime = getDataUrlMimeType(term.image);
      const ext = getImageExtFromMime(mime);
      const fileName = `${term.id}.${ext}`;
      const imgPath = await path(dir, IMAGES_DIR, fileName);
      const base64 = extractBase64FromDataUrl(term.image);
      const bytes = base64ToUint8Array(base64);
      await writeFile(imgPath, bytes);
    }
  }

  // Build lean disk state (strip base64 data)
  const diskState = buildDiskState(state);
  const jsonPath = await path(dir, DATA_FILE);
  await writeTextFile(jsonPath, JSON.stringify(diskState, null, 2));
  console.log("[saveStateToDisk] saved to", jsonPath);
}

/** Strip base64 blobs from state for disk storage. */
function buildDiskState(state: AppState): unknown {
  return {
    ...state,
    papers: state.papers.map((p) => {
      if (!p.pdf) return p;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { data: _, ...pdfWithoutData } = p.pdf;
      return {
        ...p,
        pdf: { ...pdfWithoutData, fileName: `${p.id}.pdf` },
      };
    }),
    terms: state.terms.map((t) => {
      if (!t.image) return t;
      const mime = getDataUrlMimeType(t.image);
      const ext = getImageExtFromMime(mime);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { image: _, ...termWithoutImage } = t;
      return {
        ...termWithoutImage,
        imageFile: `${t.id}.${ext}`,
      };
    }),
  };
}

// --- Load: Disk (lean + binary) -> Memory (full) ---

/**
 * Load state from the new folder-based format.
 * Reads lean data.json + binary files for PDFs and images.
 */
async function loadNewFormat(dataDir: string): Promise<AppState> {
  const jsonPath = await path(dataDir, DATA_FILE);
  const json = await readTextFile(jsonPath);
  const parsed = JSON.parse(json) as AppState;

  const fresh = createInitialState();
  let state: AppState = {
    ...fresh,
    ...parsed,
    profile: { ...fresh.profile, ...parsed.profile },
    gamification: { ...fresh.gamification, ...parsed.gamification },
    settings: {
      ...fresh.settings,
      ...parsed.settings,
      dataDirectory: dataDir,
    },
  };

  // Hydrate PDFs from binary files
  for (const paper of state.papers) {
    const diskPaper = parsed.papers.find((p) => p.id === paper.id);
    const fileName = (diskPaper as unknown as Record<string, unknown>)?.pdf
      ? ((diskPaper as unknown as Record<string, { fileName?: string }>).pdf.fileName)
      : null;
    if (fileName && paper.pdf) {
      try {
        const pdfPath = await path(dataDir, PDFS_DIR, fileName);
        const bytes = await readFile(pdfPath);
        paper.pdf.data = uint8ArrayToBase64(bytes);
      } catch (e) {
        console.warn(`[loadNewFormat] could not read PDF for paper ${paper.id}:`, e);
      }
    }
  }

  // Hydrate term images from binary files
  for (const term of state.terms) {
    const diskTerm = parsed.terms.find((t) => t.id === term.id);
    const fileName = (diskTerm as unknown as Record<string, unknown>)?.imageFile as string | undefined;
    if (fileName) {
      try {
        const imgPath = await path(dataDir, IMAGES_DIR, fileName);
        const bytes = await readFile(imgPath);
        const ext = fileName.split(".").pop() || "png";
        const mime = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
        term.image = `data:${mime};base64,${uint8ArrayToBase64(bytes)}`;
      } catch (e) {
        console.warn(`[loadNewFormat] could not read image for term ${term.id}:`, e);
      }
    }
  }

  return state;
}

// --- Migrate: Old (single JSON) -> New (folder-based) ---

/**
 * Migrate from old single-file format to new folder-based format.
 * Extracts base64 PDFs and images, saves as binary files, writes lean data.json.
 */
async function migrateOldFormat(dataDir: string): Promise<AppState> {
  console.log("[migrate] migrating from old format...");
  const oldPath = await path(dataDir, OLD_DATA_FILE);
  const json = await readTextFile(oldPath);
  const parsed = JSON.parse(json) as AppState;

  // Create directories
  await mkdir(await path(dataDir, PDFS_DIR), { recursive: true });
  await mkdir(await path(dataDir, IMAGES_DIR), { recursive: true });

  // Extract PDF binaries
  for (const paper of parsed.papers) {
    if (paper.pdf?.data) {
      try {
        const fileName = `${paper.id}.pdf`;
        const pdfPath = await path(dataDir, PDFS_DIR, fileName);
        const bytes = base64ToUint8Array(paper.pdf.data);
        await writeFile(pdfPath, bytes);
        // Replace data with fileName reference
        (paper.pdf as unknown as Record<string, unknown>).fileName = fileName;
        delete (paper.pdf as unknown as Record<string, unknown>).data;
      } catch (e) {
        console.warn(`[migrate] failed to extract PDF for paper ${paper.id}:`, e);
      }
    }
  }

  // Extract image binaries
  for (const term of parsed.terms) {
    if (term.image) {
      try {
        const mime = getDataUrlMimeType(term.image);
        const ext = getImageExtFromMime(mime);
        const fileName = `${term.id}.${ext}`;
        const imgPath = await path(dataDir, IMAGES_DIR, fileName);
        const base64 = extractBase64FromDataUrl(term.image);
        const bytes = base64ToUint8Array(base64);
        await writeFile(imgPath, bytes);
        // Replace image with imageFile reference
        (term as unknown as Record<string, unknown>).imageFile = fileName;
        delete (term as unknown as Record<string, unknown>).image;
      } catch (e) {
        console.warn(`[migrate] failed to extract image for term ${term.id}:`, e);
      }
    }
  }

  // Write new lean data.json
  const newPath = await path(dataDir, DATA_FILE);
  await writeTextFile(newPath, JSON.stringify(parsed, null, 2));

  // Rename old file as backup (don't delete, just in case)
  try {
    const { rename } = await import("@tauri-apps/plugin-fs");
    await rename(oldPath, await path(dataDir, `${OLD_DATA_FILE}.backup`));
    console.log("[migrate] old file renamed to .backup");
  } catch {
    // If rename fails, leave it — it's harmless
    console.log("[migrate] could not rename old file, leaving it");
  }

  console.log("[migrate] migration complete");

  // Now load the new format to return a fully hydrated state
  return loadNewFormat(dataDir);
}

// --- Public API ---

/**
 * Load state on startup. Handles three scenarios:
 * 1. New folder-based format → load normally
 * 2. Old single-file JSON → auto-migrate, then load
 * 3. Nothing found → fresh start
 */
export async function loadStateOnStartup(): Promise<{
  state: AppState;
  loadedFromDisk: boolean;
}> {
  const dirFromStorage = loadDirFromLocalStorage();

  if (!dirFromStorage) {
    return { state: createInitialState(), loadedFromDisk: false };
  }

  try {
    const format = await detectFormat(dirFromStorage);

    if (format === "new") {
      const state = await loadNewFormat(dirFromStorage);
      return { state, loadedFromDisk: true };
    }

    if (format === "old") {
      const state = await migrateOldFormat(dirFromStorage);
      return { state, loadedFromDisk: true };
    }

    // No data found
    return { state: createInitialState(), loadedFromDisk: false };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[loadStateOnStartup] error:", msg);

    // If it's "not found", clear localStorage
    if (
      msg.includes("NotFound") ||
      msg.includes("ENOENT") ||
      msg.includes("No such file")
    ) {
      clearDirFromLocalStorage();
    }
    return { state: createInitialState(), loadedFromDisk: false };
  }
}

/** Store directory path in localStorage immediately */
export function setDataDirectoryInBootstrap(dir: string): void {
  saveDirToLocalStorage(dir);
}

/** Ask user to pick a directory */
export async function pickDataDirectory(): Promise<string | null> {
  const path = await open({
    directory: true,
    multiple: false,
    title: "Choose Data Directory",
  });
  return path ?? null;
}

/**
 * Import data from a user-selected file.
 * Accepts BOTH old format (paperhacking-data.json) and new format (data.json).
 */
export async function importDataFromDirectory(): Promise<{
  state: AppState | null;
  error: string | null;
}> {
  const filePath = await open({
    directory: false,
    multiple: false,
    title: "Select PaperHacking data file",
    filters: [{ name: "PaperHacking Data", extensions: ["json"] }],
  });
  if (!filePath) {
    return { state: null, error: null };
  }

  console.log("[import] selected file:", filePath);

  try {
    const json = await readTextFile(filePath);
    const parsed = JSON.parse(json);
    const dataDir = await dirname(filePath);

    // Detect if this is old format (has papers with pdf.data base64)
    const isOldFormat = (parsed.papers || []).some(
      (p: Paper) => p.pdf?.data && typeof p.pdf.data === "string" && p.pdf.data.length > 100
    );

    let state: AppState;

    if (isOldFormat) {
      console.log("[import] detected old format, migrating...");
      // Write the old file to the target directory first, then migrate
      const targetOldPath = await join(dataDir, OLD_DATA_FILE);
      // Only write if the selected file isn't already named paperhacking-data.json
      const fileName = filePath.split("/").pop() || "";
      if (fileName !== OLD_DATA_FILE) {
        await writeTextFile(targetOldPath, json);
      }
      state = await migrateOldFormat(dataDir);
    } else {
      // New format or hybrid — load directly
      state = await loadNewFormat(dataDir);
    }

    // Override dataDirectory to the imported location
    state.settings.dataDirectory = dataDir;
    saveDirToLocalStorage(dataDir);

    console.log(
      "[import] loaded —",
      state.papers.length,
      "papers,",
      state.plans.length,
      "plans,",
      state.terms.length,
      "terms",
    );
    return { state, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[import] error:", message);
    return { state: null, error: `Cannot import file: ${message}` };
  }
}

// dirname utility (avoids importing if not needed)
async function dirname(filePath: string): Promise<string> {
  // Use dynamic import to avoid bundling issues
  const { dirname: pathDirname } = await import("@tauri-apps/api/path");
  return pathDirname(filePath);
}
