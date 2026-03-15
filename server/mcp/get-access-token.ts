import {
  loadTokens,
  saveTokens,
  isTokenExpired,
} from "./token-store.js";
import {
  discoverOAuthMetadata,
  refreshAccessToken,
} from "./oauth.js";
import { loadOAuthClient } from "./token-store.js";

const NOTION_MCP_URL = "https://mcp.notion.com";

export async function getValidAccessToken(): Promise<string | null> {
  const tokens = await loadTokens();
  if (!tokens?.access_token) return null;

  if (!isTokenExpired(tokens)) {
    return tokens.access_token;
  }

  if (!tokens.refresh_token) return null;

  try {
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

    if (!clientId) return null;

    const newTokens = await refreshAccessToken(
      tokens.refresh_token,
      metadata,
      clientId,
      clientSecret
    );

    const expiresAt = newTokens.expires_in
      ? Date.now() + newTokens.expires_in * 1000
      : undefined;

    await saveTokens({
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token ?? tokens.refresh_token,
      expires_at: expiresAt,
    });

    return newTokens.access_token;
  } catch (error) {
    if ((error as Error).message === "REAUTH_REQUIRED") {
      await import("./token-store.js").then(({ clearTokens }) => clearTokens());
    }
    throw error;
  }
}
