import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { generateComponent } from "./ai-generate.js";
import {
  buildAuthorizationUrl,
  ensureClientRegistered,
  exchangeCodeForTokens,
  generateCodeChallenge,
  generateCodeVerifier,
  generateState,
  getMetadata,
  persistTokensFromResponse,
  setPendingOAuth,
  takePendingOAuth,
} from "./notion-oauth.js";
import { loadTokens, clearTokens } from "./notion-store.js";
import { getExportPng } from "./export-cache.js";
import {
  getNotionStatus,
  postContextForPrompt,
  postDevContext,
  postPushPrototype,
} from "./notion-handlers.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const hasServerLlmKey = Boolean(
  process.env.ANTHROPIC_API_KEY ||
    process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY ||
    process.env.GROQ_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY
);
if (!hasServerLlmKey) {
  console.error(
    "⚠️  No LLM API keys in .env — use BYOK from the extension (popup), or set ANTHROPIC_API_KEY / GROQ_API_KEY / GEMINI_API_KEY."
  );
}

const extensionApiKey = process.env.EXTENSION_API_KEY?.trim();

function requireExtensionKey(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  if (!extensionApiKey) {
    next();
    return;
  }
  const header =
    (req.headers["x-api-key"] as string) ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : "");
  if (header !== extensionApiKey) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

app.post("/api/generate-component", requireExtensionKey, async (req, res) => {
  try {
    const out = await generateComponent(req.body);
    return res.json(out);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === "MISSING_PROMPT") {
      return res.status(400).json({ error: "Prompt is required" });
    }
    if (msg === "MISSING_LLM_KEY") {
      return res.status(400).json({
        error: "missing_llm_key",
        message:
          "No API key for this provider. Add your key in the NotionBook extension popup (BYOK), or set ANTHROPIC_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY on the server.",
      });
    }
    console.error("Error generating component:", error);
    res.status(500).json({ error: "Failed to generate component" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/exports/:token", (req, res) => {
  const buf = getExportPng(req.params.token);
  if (!buf) {
    res.status(404).end();
    return;
  }
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "public, max-age=300");
  res.send(buf);
});

app.get("/api/notion/status", requireExtensionKey, (req, res) => {
  void getNotionStatus(req, res);
});

app.post("/api/notion/push-prototype", requireExtensionKey, (req, res) => {
  void postPushPrototype(req, res);
});

app.post("/api/notion/context-for-prompt", requireExtensionKey, (req, res) => {
  void postContextForPrompt(req, res);
});

app.post("/api/notion/dev-context", requireExtensionKey, (req, res) => {
  void postDevContext(req, res);
});

app.post("/api/notion/disconnect", requireExtensionKey, (req, res) => {
  clearTokens();
  res.json({ ok: true });
});

app.get("/auth/notion", async (req, res) => {
  try {
    const redirectUri = process.env.NOTION_OAUTH_REDIRECT_URI?.trim();
    if (!redirectUri) {
      res
        .status(500)
        .send("Server misconfiguration: NOTION_OAUTH_REDIRECT_URI is not set.");
      return;
    }

    const { clientId, clientSecret } =
      await ensureClientRegistered(redirectUri);
    const metadata = await getMetadata();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = generateState();
    setPendingOAuth(state, codeVerifier);

    const url = buildAuthorizationUrl(
      metadata,
      clientId,
      redirectUri,
      codeChallenge,
      state
    );
    res.redirect(url);
  } catch (e) {
    console.error(e);
    res.status(500).send(`OAuth start failed: ${e instanceof Error ? e.message : e}`);
  }
});

app.get("/auth/notion/callback", async (req, res) => {
  try {
    const redirectUri = process.env.NOTION_OAUTH_REDIRECT_URI?.trim();
    if (!redirectUri) {
      res.status(500).send("Missing NOTION_OAUTH_REDIRECT_URI");
      return;
    }

    const err = req.query.error as string | undefined;
    if (err) {
      res.status(400).send(`Notion OAuth error: ${err}`);
      return;
    }

    const code = req.query.code as string | undefined;
    const state = req.query.state as string | undefined;
    if (!code || !state) {
      res.status(400).send("Missing code or state");
      return;
    }

    const codeVerifier = takePendingOAuth(state);
    if (!codeVerifier) {
      res.status(400).send("Invalid or expired state — try connecting again.");
      return;
    }

    const data = loadTokens();
    if (!data?.client_id) {
      res.status(400).send("No client registration — start from /auth/notion");
      return;
    }

    const metadata = await getMetadata();
    const tokens = await exchangeCodeForTokens(
      code,
      codeVerifier,
      metadata,
      data.client_id,
      data.client_secret,
      redirectUri
    );
    await persistTokensFromResponse(tokens, data.client_id, data.client_secret);

    res
      .status(200)
      .send(
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Notion connected</title></head><body style="font-family:system-ui;padding:2rem;background:#0a0a0a;color:#fafafa;"><h1>Notion connected</h1><p>You can close this tab and return to the extension.</p></body></html>`
      );
  } catch (e) {
    console.error(e);
    res.status(500).send(`Callback failed: ${e instanceof Error ? e.message : e}`);
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
