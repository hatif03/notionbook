import { Router, Request, Response } from "express";
import {
  discoverOAuthMetadata,
  registerClient,
  buildAuthorizationUrl,
  exchangeCodeForTokens,
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
} from "../mcp/oauth.js";
import { storeAuthSession, getAuthSession } from "../mcp/auth-session.js";
import {
  loadTokens,
  saveTokens,
  loadOAuthClient,
  saveOAuthClient,
} from "../mcp/token-store.js";

const router = Router();
const NOTION_MCP_URL = "https://mcp.notion.com";

router.get("/auth/notion", async (req: Request, res: Response) => {
  try {
    const baseUrl = `${req.protocol}://${req.get("host") || `localhost:${process.env.PORT || 3001}`}`;
    const redirectUri = `${baseUrl}/auth/notion/callback`;

    const metadata = await discoverOAuthMetadata(NOTION_MCP_URL);

    let clientId = process.env.NOTION_OAUTH_CLIENT_ID;
    let clientSecret = process.env.NOTION_OAUTH_CLIENT_SECRET;

    if (!clientId) {
      const stored = await loadOAuthClient();
      if (stored) {
        clientId = stored.client_id;
        clientSecret = stored.client_secret;
      } else {
        const credentials = await registerClient(metadata, redirectUri);
        await saveOAuthClient({
          client_id: credentials.client_id,
          client_secret: credentials.client_secret,
        });
        clientId = credentials.client_id;
        clientSecret = credentials.client_secret;
      }
    }

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = generateState();

    storeAuthSession(state, codeVerifier);

    const authUrl = buildAuthorizationUrl(
      metadata,
      clientId!,
      redirectUri,
      codeChallenge,
      state
    );

    res.redirect(authUrl);
  } catch (error) {
    console.error("Notion OAuth init error:", error);
    res.status(500).send(
      `<html><body><h1>OAuth Error</h1><p>${(error as Error).message}</p></body></html>`
    );
  }
});

router.get("/auth/notion/callback", async (req: Request, res: Response) => {
  try {
    const { code, state, error, error_description } = req.query;

    if (error) {
      return res.status(400).send(
        `<html><body><h1>OAuth Error</h1><p>${error}: ${error_description || ""}</p></body></html>`
      );
    }

    if (!code || typeof code !== "string" || !state || typeof state !== "string") {
      return res.status(400).send(
        "<html><body><h1>Invalid callback</h1><p>Missing code or state</p></body></html>"
      );
    }

    const codeVerifier = getAuthSession(state);
    if (!codeVerifier) {
      return res.status(400).send(
        "<html><body><h1>Session expired</h1><p>Please try connecting again.</p></body></html>"
      );
    }

    const baseUrl = `${req.protocol}://${req.get("host") || `localhost:${process.env.PORT || 3001}`}`;
    const redirectUri = `${baseUrl}/auth/notion/callback`;

    const metadata = await discoverOAuthMetadata(NOTION_MCP_URL);

    let clientId = process.env.NOTION_OAUTH_CLIENT_ID;
    let clientSecret = process.env.NOTION_OAUTH_CLIENT_SECRET;

    if (!clientId) {
      const stored = await loadOAuthClient();
      if (stored) {
        clientId = stored.client_id;
        clientSecret = stored.client_secret;
      }
    }

    if (!clientId) {
      return res.status(500).send(
        "<html><body><h1>Configuration Error</h1><p>OAuth client not configured.</p></body></html>"
      );
    }

    const tokens = await exchangeCodeForTokens(
      code,
      codeVerifier,
      metadata,
      clientId,
      clientSecret,
      redirectUri
    );

    const expiresAt = tokens.expires_in
      ? Date.now() + tokens.expires_in * 1000
      : undefined;

    await saveTokens({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
    });

    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Notionbook - Connected</title></head>
      <body style="font-family: system-ui; max-width: 400px; margin: 80px auto; text-align: center;">
        <h1 style="color: #22c55e;">✓ Connected to Notion</h1>
        <p>You can close this tab and return to the Notionbook extension.</p>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("Notion OAuth callback error:", error);
    res.status(500).send(
      `<html><body><h1>OAuth Error</h1><p>${(error as Error).message}</p></body></html>`
    );
  }
});

export default router;
