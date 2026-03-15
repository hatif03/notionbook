import { readFile, writeFile } from "fs/promises";
import { join } from "path";

export type StoredTokens = {
  access_token: string;
  refresh_token?: string;
  expires_at?: number; // Unix timestamp, access tokens typically expire in 1 hour
};

export type StoredOAuthClient = {
  client_id: string;
  client_secret?: string;
};

const TOKENS_FILE = "notion-tokens.json";
const OAUTH_CLIENT_FILE = "notion-oauth-client.json";

function getTokensPath(): string {
  return join(process.cwd(), TOKENS_FILE);
}

export async function loadTokens(): Promise<StoredTokens | null> {
  try {
    const data = await readFile(getTokensPath(), "utf-8");
    return JSON.parse(data) as StoredTokens;
  } catch {
    return null;
  }
}

export async function saveTokens(tokens: StoredTokens): Promise<void> {
  const path = getTokensPath();
  await writeFile(path, JSON.stringify(tokens, null, 2), "utf-8");
}

export async function clearTokens(): Promise<void> {
  try {
    const { unlink } = await import("fs/promises");
    await unlink(getTokensPath());
  } catch {
    // File may not exist
  }
}

export function isTokenExpired(tokens: StoredTokens): boolean {
  if (!tokens.expires_at) return false;
  // Consider expired 5 minutes before actual expiry
  return Date.now() >= tokens.expires_at - 5 * 60 * 1000;
}

export async function loadOAuthClient(): Promise<StoredOAuthClient | null> {
  try {
    const data = await readFile(join(process.cwd(), OAUTH_CLIENT_FILE), "utf-8");
    return JSON.parse(data) as StoredOAuthClient;
  } catch {
    return null;
  }
}

export async function saveOAuthClient(client: StoredOAuthClient): Promise<void> {
  await writeFile(
    join(process.cwd(), OAUTH_CLIENT_FILE),
    JSON.stringify(client, null, 2),
    "utf-8"
  );
}
