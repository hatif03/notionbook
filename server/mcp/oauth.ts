import { randomBytes, createHash } from "crypto";

export type OAuthMetadata = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  registration_endpoint?: string;
  code_challenge_methods_supported?: string[];
  grant_types_supported?: string[];
  response_types_supported?: string[];
  scopes_supported?: string[];
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
};

export type ClientCredentials = {
  client_id: string;
  client_secret?: string;
  client_id_issued_at?: number;
  client_secret_expires_at?: number;
};

export function base64URLEncode(str: Buffer): string {
  return str
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export function generateCodeVerifier(): string {
  const bytes = randomBytes(32);
  return base64URLEncode(bytes);
}

export function generateCodeChallenge(verifier: string): string {
  const hash = createHash("sha256").update(verifier).digest();
  return base64URLEncode(hash);
}

export function generateState(): string {
  return randomBytes(32).toString("hex");
}

export async function discoverOAuthMetadata(
  mcpServerUrl: string
): Promise<OAuthMetadata> {
  const url = new URL(mcpServerUrl);
  const protectedResourceUrl = new URL(
    "/.well-known/oauth-protected-resource",
    url
  );

  const protectedResourceResponse = await fetch(protectedResourceUrl.toString());
  if (!protectedResourceResponse.ok) {
    throw new Error(
      `Failed to fetch protected resource metadata: ${protectedResourceResponse.status}`
    );
  }

  const protectedResource = await protectedResourceResponse.json();
  const authServers = protectedResource.authorization_servers;

  if (!Array.isArray(authServers) || authServers.length === 0) {
    throw new Error(
      "No authorization servers found in protected resource metadata"
    );
  }

  const authServerUrl = authServers[0];
  const metadataUrl = new URL(
    "/.well-known/oauth-authorization-server",
    authServerUrl
  );
  const metadataResponse = await fetch(metadataUrl.toString());

  if (!metadataResponse.ok) {
    throw new Error(
      `Failed to fetch authorization server metadata: ${metadataResponse.status}`
    );
  }

  const metadata = (await metadataResponse.json()) as OAuthMetadata;

  if (!metadata.authorization_endpoint || !metadata.token_endpoint) {
    throw new Error("Missing required OAuth endpoints in metadata");
  }

  return metadata;
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
    scope: scopes.join(" "),
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    prompt: "consent",
  });

  return `${metadata.authorization_endpoint}?${params.toString()}`;
}

export async function registerClient(
  metadata: OAuthMetadata,
  redirectUri: string
): Promise<ClientCredentials> {
  if (!metadata.registration_endpoint) {
    throw new Error("Server does not support dynamic client registration");
  }

  const registrationRequest = {
    client_name: "Notionbook",
    client_uri: "https://github.com/raihankhan-rk/prototyper",
    redirect_uris: [redirectUri],
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
  };

  const response = await fetch(metadata.registration_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(registrationRequest),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Client registration failed: ${response.status} - ${errorBody}`);
  }

  return (await response.json()) as ClientCredentials;
}

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
    code: code,
    client_id: clientId,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  if (clientSecret) {
    params.append("client_secret", clientSecret);
  }

  const response = await fetch(metadata.token_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "User-Agent": "Notionbook-MCP-Client/1.0",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Token exchange failed: ${response.status} - ${errorBody}`);
  }

  const tokens = await response.json();

  if (!tokens.access_token) {
    throw new Error("Missing access_token in response");
  }

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

  if (clientSecret) {
    params.append("client_secret", clientSecret);
  }

  const response = await fetch(metadata.token_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "User-Agent": "Notionbook-MCP-Client/1.0",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    try {
      const error = JSON.parse(errorBody);
      if (error.error === "invalid_grant") {
        throw new Error("REAUTH_REQUIRED");
      }
    } catch {
      // Not JSON
    }
    throw new Error(`Token refresh failed: ${response.status} - ${errorBody}`);
  }

  const tokens = await response.json();
  return tokens;
}
