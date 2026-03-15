import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";

const NOTION_MCP_URL = "https://mcp.notion.com";

export async function callNotionTool(
  toolName: string,
  args: Record<string, unknown>,
  accessToken: string
): Promise<{ content: Array<{ type: string; text?: string }> }> {
  const client = new Client(
    { name: "notionbook-mcp-client", version: "1.0.0" },
    { capabilities: { roots: {}, sampling: {} } }
  );

  const transport = new StreamableHTTPClientTransport(
    new URL(`${NOTION_MCP_URL}/mcp`),
    {
      requestInit: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "Notionbook-MCP-Client/1.0",
        },
      },
    }
  );

  await client.connect(transport);

  try {
    const result = await client.request(
      {
        method: "tools/call",
        params: { name: toolName, arguments: args },
      },
      CallToolResultSchema
    );
    return result;
  } finally {
    await transport.close();
  }
}

export async function notionSearch(
  query: string,
  accessToken: string
): Promise<{ content: Array<{ type: string; text?: string }> }> {
  return callNotionTool(
    "notion-search",
    { query },
    accessToken
  );
}

export async function notionCreatePages(
  pages: Array<{
    parent?: { page_id?: string; database_id?: string };
    properties?: Record<string, unknown>;
    content?: Array<{ type: string; [key: string]: unknown }>;
    icon?: { type: string; emoji?: string };
  }>,
  accessToken: string
): Promise<{ content: Array<{ type: string; text?: string }> }> {
  return callNotionTool(
    "notion-create-pages",
    { pages },
    accessToken
  );
}

export async function notionFetch(
  urlOrId: string,
  accessToken: string
): Promise<{ content: Array<{ type: string; text?: string }> }> {
  return callNotionTool(
    "notion-fetch",
    { url: urlOrId },
    accessToken
  );
}
