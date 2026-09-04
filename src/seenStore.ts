import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SEEN_FILE = fileURLToPath(new URL("../data/seen.json", import.meta.url));
const MAX_SEEN = 2000;

export async function loadSeen(): Promise<Set<string>> {
  try {
    const raw = await readFile(SEEN_FILE, "utf-8");
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export async function saveSeen(seen: Set<string>): Promise<void> {
  const ids = [...seen].slice(-MAX_SEEN);
  await mkdir(dirname(SEEN_FILE), { recursive: true });
  await writeFile(SEEN_FILE, JSON.stringify(ids, null, 2));
}
