import type { Request, Response } from "express";
import { getValidAccessToken } from "./notion-oauth.js";
import { loadTokens } from "./notion-store.js";
import { callNotionTool, toolResultToText } from "./notion-mcp-client.js";
import { extractNotionPageId, truncate } from "./notion-helpers.js";
import { putExportPng } from "./export-cache.js";

const CREATE_PAGES = "notion-create-pages";
const SEARCH = "notion-search";
const FETCH = "notion-fetch";

function baseUrl(req: Request): string {
  const env = process.env.BASE_URL?.replace(/\/$/, "");
  if (env) return env;
  const host = req.get("host") || "localhost:3001";
  const proto = req.get("x-forwarded-proto") || "http";
  return `${proto}://${host}`;
}

export async function getNotionStatus(_req: Request, res: Response): Promise<void> {
  try {
    const data = loadTokens();
    const connected = Boolean(data?.refresh_token || data?.access_token);
    res.json({
      connected,
      workspaceHint: data?.workspace_hint,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "status_failed" });
  }
}

export async function postPushPrototype(req: Request, res: Response): Promise<void> {
  try {
    const accessToken = await getValidAccessToken();
    const {
      title,
      pageUrl,
      parentPageId: parentRaw,
      problem,
      successMetric,
      notes,
      screenshotBase64,
      screenshotDataUrl,
      devContextSummary,
      includeDevContextInPage,
    } = req.body as Record<string, string | boolean | undefined>;

    if (!title || typeof title !== "string") {
      res.status(400).json({ error: "title is required" });
      return;
    }

    let coverUrl: string | undefined;
    const b64 =
      (typeof screenshotBase64 === "string" ? screenshotBase64 : "") ||
      (typeof screenshotDataUrl === "string" && screenshotDataUrl.startsWith("data:")
        ? screenshotDataUrl.replace(/^data:image\/\w+;base64,/, "")
        : "");
    if (b64) {
      try {
        const buf = Buffer.from(b64, "base64");
        if (buf.length > 0 && buf.length < 8 * 1024 * 1024) {
          const token = putExportPng(buf);
          coverUrl = `${baseUrl(req)}/api/exports/${token}`;
        }
      } catch {
        /* skip cover */
      }
    }

    const parentId = extractNotionPageId(
      typeof parentRaw === "string" ? parentRaw : undefined
    );

    const lines: string[] = [
      "## Problem",
      problem ? String(problem) : "_—_",
      "",
      "## Success metrics",
      successMetric ? String(successMetric) : "_—_",
      "",
      "## Prototype context",
      `- **Page URL:** ${pageUrl || "_unknown_"}`,
      `- **Captured:** ${new Date().toISOString()}`,
      "",
      "## Notes",
      notes ? String(notes) : "_—_",
    ];

    if (includeDevContextInPage && devContextSummary) {
      lines.push("", "## Engineering / Slack highlights (via Notion search)", "");
      lines.push(String(devContextSummary));
    }

    const content = lines.join("\n");

    const pagePayload: Record<string, unknown> = {
      properties: { title: `🎨 ${title}` },
      content,
    };
    if (coverUrl) pagePayload.cover = coverUrl;

    const body: Record<string, unknown> = {
      pages: [pagePayload],
    };
    if (parentId) {
      body.parent = { page_id: parentId, type: "page_id" };
    }

    const raw = await callNotionTool(accessToken, CREATE_PAGES, body);
    const text = toolResultToText(raw);
    res.json({ ok: true, resultPreview: truncate(text, 2000) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "NOT_CONNECTED" || msg === "REAUTH_REQUIRED") {
      res.status(401).json({ error: "not_connected", message: msg });
      return;
    }
    console.error(e);
    res.status(500).json({ error: "push_failed", message: msg });
  }
}

export async function postContextForPrompt(req: Request, res: Response): Promise<void> {
  try {
    const accessToken = await getValidAccessToken();
    const { query } = req.body as { query?: string };
    if (!query?.trim()) {
      res.status(400).json({ error: "query is required" });
      return;
    }

    const searchRaw = await callNotionTool(accessToken, SEARCH, {
      query: query.trim(),
      query_type: "internal",
      page_size: 5,
    });
    const searchText = toolResultToText(searchRaw);

    let fetched = "";
    const idMatch = searchText.match(
      /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
    );
    if (idMatch) {
      try {
        const fetchRaw = await callNotionTool(accessToken, FETCH, {
          id: idMatch[1],
        });
        fetched = toolResultToText(fetchRaw);
      } catch {
        /* ignore */
      }
    }

    const combined = [searchText, fetched].filter(Boolean).join("\n\n---\n\n");
    res.json({ snippet: truncate(combined, 6000) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "NOT_CONNECTED" || msg === "REAUTH_REQUIRED") {
      res.status(401).json({ error: "not_connected" });
      return;
    }
    console.error(e);
    res.status(500).json({ error: "context_failed", message: msg });
  }
}

export async function postDevContext(req: Request, res: Response): Promise<void> {
  try {
    const accessToken = await getValidAccessToken();
    const { query } = req.body as { query?: string };
    if (!query?.trim()) {
      res.status(400).json({ error: "query is required" });
      return;
    }

    const searchRaw = await callNotionTool(accessToken, SEARCH, {
      query: query.trim(),
      query_type: "internal",
      page_size: 8,
    });
    const text = toolResultToText(searchRaw);
    const summaryText = truncate(text, 8000);

    const links: string[] = [];
    const urlRe = /https?:\/\/[^\s\])"'<>]+/gi;
    let m: RegExpExecArray | null;
    while ((m = urlRe.exec(text)) !== null) {
      const u = m[0].replace(/[,;.]$/, "");
      if (!links.includes(u)) links.push(u);
      if (links.length >= 12) break;
    }

    res.json({ summaryText, links });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "NOT_CONNECTED" || msg === "REAUTH_REQUIRED") {
      res.status(401).json({ error: "not_connected" });
      return;
    }
    console.error(e);
    res.status(500).json({ error: "dev_context_failed", message: msg });
  }
}
