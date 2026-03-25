/** Extract Notion page UUID from pasted URL or raw id (with or without dashes). */
export function extractNotionPageId(input: string | undefined): string | undefined {
  if (!input?.trim()) return undefined;
  const s = input.trim();
  const compact = s.replace(/-/g, "");
  const uuid32 = /^[0-9a-f]{32}$/i;
  if (uuid32.test(compact)) {
    const h = compact;
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }
  const m = s.match(
    /([0-9a-f]{8})-?([0-9a-f]{4})-?([0-9a-f]{4})-?([0-9a-f]{4})-?([0-9a-f]{12})/i
  );
  if (m) {
    return `${m[1]}-${m[2]}-${m[3]}-${m[4]}-${m[5]}`.toLowerCase();
  }
  return undefined;
}

export function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max) + "\n…(truncated)";
}
