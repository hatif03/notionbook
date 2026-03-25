import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = path.join(__dirname, ".data");
const TOKEN_PATH = path.join(DATA_DIR, "notion-tokens.json");

export type NotionTokenData = {
  access_token?: string;
  refresh_token?: string;
  client_id: string;
  client_secret?: string;
  expires_at?: number;
  workspace_hint?: string;
};

export function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadTokens(): NotionTokenData | null {
  try {
    ensureDataDir();
    if (!fs.existsSync(TOKEN_PATH)) return null;
    const raw = fs.readFileSync(TOKEN_PATH, "utf-8");
    return JSON.parse(raw) as NotionTokenData;
  } catch {
    return null;
  }
}

export function saveTokens(data: NotionTokenData): void {
  ensureDataDir();
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export function clearTokens(): void {
  try {
    if (fs.existsSync(TOKEN_PATH)) fs.unlinkSync(TOKEN_PATH);
  } catch {
    /* ignore */
  }
}
