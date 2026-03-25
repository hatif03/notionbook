import { randomBytes, createHash } from "crypto";
import { loadTokens, saveTokens, type NotionTokenData } from "./notion-store.js";

const MCP_BASE = "https://mcp.notion.com";
const USER_AGENT = "NotionBook-MCP-Client/1.0";

export type OAuthMetadata = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  registration_endpoint?: string;
  code_challenge_methods_supported?: string[];
};

function base64URLEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export function generateCodeVerifier(): string {
  return base64URLEncode(randomBytes(32));
}

export function generateCodeChallenge(verifier: string): string {
  const hash = createHash("sha256").update(verifier).digest();
  return base64URLEncode(hash);
}

export function generateState(): string {
  return randomBytes(32).toString("hex");
}

export async function discoverOAuthMetadata(): Promise<OAuthMetadata> {
  const mcpUrl = new URL(`${MCP_BASE}/mcp`);
  const protectedResourceUrl = new URL(
    "/.well-known/oauth-protected-resource",
    mcpUrl
  );

  const prRes = await fetch(protectedResourceUrl.toString());
  if (!prRes.ok) {
    throw new Error(`Protected resource metadata failed: ${prRes.status}`);
  }
  const pr = (await prRes.json()) as { authorization_servers?: string[] };
  const authServers = pr.authorization_servers;
  if (!Array.isArray(authServers) || authServers.length === 0) {
    throw new Error("No authorization_servers in protected resource metadata");
  }
  const authServerUrl = authServers[0];
  const metadataUrl = new URL(
    "/.well-known/oauth-authorization-server",
    authServerUrl
  );
  const metaRes = await fetch(metadataUrl.toString());
  if (!metaRes.ok) {
    throw new Error(`Authorization server metadata failed: ${metaRes.status}`);
  }
  const metadata = (await metaRes.json()) as OAuthMetadata;
  if (!metadata.authorization_endpoint || !metadata.token_endpoint) {
    throw new Error("Missing authorization_endpoint or token_endpoint");
  }
  return metadata;
}

type ClientCredentials = {
  client_id: string;
  client_secret?: string;
};

export async function registerClient(
  metadata: OAuthMetadata,
  redirectUri: string
): Promise<ClientCredentials> {
  if (!metadata.registration_endpoint) {
    throw new Error("Dynamic client registration not supported");
  }
  const body = {
    client_name: "NotionBook MCP Client",
    redirect_uris: [redirectUri],
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
  };
  const res = await fetch(metadata.registration_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Client registration failed: ${res.status} ${t}`);
  }
  return (await res.json()) as ClientCredentials;
}

export function buildAuthorizationUrl(
  metadata: OAuthMetadata,
  clientId: string,
  redirectUri: string,
  codeChallenge: string,
  state: string,
  scopes: string[] = []
): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    prompt: "consent",
  });
  if (scopes.length) params.set("scope", scopes.join(" "));
  return `${metadata.authorization_endpoint}?${params.toString()}`;
}

export type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
};

export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
  metadata: OAuthMetadata,
  clientId: string,
  clientSecret: string | undefined,
  redirectUri: string
): Promise<TokenResponse> {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: clientId,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });
  if (clientSecret) params.append("client_secret", clientSecret);

  const res = await fetch(metadata.token_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
    body: params.toString(),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${t}`);
  }
  const tokens = (await res.json()) as TokenResponse;
  if (!tokens.access_token) throw new Error("Missing access_token");
  return tokens;
}

export async function refreshAccessToken(
  refreshToken: string,
  metadata: OAuthMetadata,
  clientId: string,
  clientSecret: string | undefined
): Promise<TokenResponse> {
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
  });
  if (clientSecret) params.append("client_secret", clientSecret);

  const res = await fetch(metadata.token_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
    body: params.toString(),
  });
  if (!res.ok) {
    const t = await res.text();
    let err: { error?: string } = {};
    try {
      err = JSON.parse(t) as { error?: string };
    } catch {
      /* ignore */
    }
    if (err.error === "invalid_grant") {
      const e = new Error("REAUTH_REQUIRED");
      throw e;
    }
    throw new Error(`Token refresh failed: ${res.status} ${t}`);
  }
  return (await res.json()) as TokenResponse;
}

/** In-memory pending OAuth (same server process must handle callback). */
const pending = new Map<
  string,
  { codeVerifier: string; created: number }
>();

const PENDING_TTL_MS = 10 * 60 * 1000;

export function setPendingOAuth(
  state: string,
  codeVerifier: string
): void {
  pending.set(state, { codeVerifier, created: Date.now() });
}

export function takePendingOAuth(state: string): string | null {
  const row = pending.get(state);
  pending.delete(state);
  if (!row) return null;
  if (Date.now() - row.created > PENDING_TTL_MS) return null;
  return row.codeVerifier;
}

let cachedMetadata: OAuthMetadata | null = null;

export async function getMetadata(): Promise<OAuthMetadata> {
  if (!cachedMetadata) cachedMetadata = await discoverOAuthMetadata();
  return cachedMetadata;
}

export async function ensureClientRegistered(
  redirectUri: string
): Promise<{ clientId: string; clientSecret?: string }> {
  const existing = loadTokens();
  if (existing?.client_id) {
    return { clientId: existing.client_id, clientSecret: existing.client_secret };
  }
  const metadata = await getMetadata();
  const creds = await registerClient(metadata, redirectUri);
  const partial: NotionTokenData = {
    client_id: creds.client_id,
    client_secret: creds.client_secret,
  };
  saveTokens(partial);
  return { clientId: creds.client_id, clientSecret: creds.client_secret };
}

export async function persistTokensFromResponse(
  tokens: TokenResponse,
  clientId: string,
  clientSecret?: string
): Promise<void> {
  const prev = loadTokens();
  const expires_at = tokens.expires_in
    ? Date.now() + tokens.expires_in * 1000 - 60_000
    : undefined;
  saveTokens({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? prev?.refresh_token,
    client_id: clientId,
    client_secret: clientSecret ?? prev?.client_secret,
    expires_at,
    workspace_hint: prev?.workspace_hint,
  });
}

export async function getValidAccessToken(): Promise<string> {
  const data = loadTokens();
  if (!data?.access_token) throw new Error("NOT_CONNECTED");

  const metadata = await getMetadata();
  const clientId = data.client_id;
  const clientSecret = data.client_secret;

  if (data.expires_at && Date.now() < data.expires_at && data.access_token) {
    return data.access_token;
  }

  if (!data.refresh_token) {
    throw new Error("NOT_CONNECTED");
  }

  const tokens = await refreshAccessToken(
    data.refresh_token,
    metadata,
    clientId,
    clientSecret
  );
  await persistTokensFromResponse(tokens, clientId, clientSecret);
  return tokens.access_token;
}
