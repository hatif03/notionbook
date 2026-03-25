import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const USER_AGENT = "NotionBook-MCP-Client/1.0";

function transportHeaders(accessToken: string): RequestInit {
  return {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": USER_AGENT,
    },
  };
}

async function connectClient(accessToken: string, useSSE: boolean): Promise<Client> {
  const client = new Client(
    { name: "notionbook", version: "1.0.0" },
    { capabilities: {} }
  );

  if (useSSE) {
    const transport = new SSEClientTransport(new URL("https://mcp.notion.com/sse"), {
      requestInit: transportHeaders(accessToken),
    });
    await client.connect(transport);
  } else {
    const transport = new StreamableHTTPClientTransport(
      new URL("https://mcp.notion.com/mcp"),
      { requestInit: transportHeaders(accessToken) }
    );
    await client.connect(transport);
  }
  return client;
}

export async function withNotionMcp<T>(
  accessToken: string,
  fn: (client: Client) => Promise<T>
): Promise<T> {
  let client: Client | null = null;
  try {
    client = await connectClient(accessToken, false);
  } catch (e) {
    console.warn("Streamable HTTP failed, falling back to SSE:", e);
    client = await connectClient(accessToken, true);
  }
  try {
    return await fn(client);
  } finally {
    try {
      await client.close();
    } catch {
      /* ignore */
    }
  }
}

export async function callNotionTool(
  accessToken: string,
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  return withNotionMcp(accessToken, async (client) => {
    const result = await client.callTool({
      name,
      arguments: args,
    });
    return result;
  });
}

export function toolResultToText(result: unknown): string {
  if (!result || typeof result !== "object") return String(result);
  const r = result as {
    content?: Array<{ type?: string; text?: string }>;
    isError?: boolean;
  };
  if (!Array.isArray(r.content)) return JSON.stringify(result);
  const text = r.content
    .map((c) => (c.type === "text" && c.text ? c.text : JSON.stringify(c)))
    .join("\n");
  return r.isError ? `MCP tool error: ${text}` : text;
}
