import { randomBytes } from "crypto";

const store = new Map<string, { buffer: Buffer; expires: number }>();

export function putExportPng(buffer: Buffer, ttlMs = 15 * 60 * 1000): string {
  const token = randomBytes(18).toString("hex");
  store.set(token, { buffer, expires: Date.now() + ttlMs });
  return token;
}

export function getExportPng(token: string): Buffer | null {
  const row = store.get(token);
  if (!row || Date.now() > row.expires) {
    store.delete(token);
    return null;
  }
  return row.buffer;
}
