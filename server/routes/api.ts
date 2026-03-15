import { Router, Request, Response } from "express";
import { getValidAccessToken } from "../mcp/get-access-token.js";
import { notionSearch, notionCreatePages } from "../mcp/notion-client.js";
import { complete } from "../ai/provider.js";

const router = Router();

router.post("/api/tabs-to-notion", async (req: Request, res: Response) => {
  try {
    const token = await getValidAccessToken();
    if (!token) {
      return res.status(401).json({ error: "Not connected to Notion. Connect first." });
    }

    const { tabs, parentPageId, databaseId, model = "claude" } = req.body;
    if (!Array.isArray(tabs) || tabs.length === 0) {
      return res.status(400).json({ error: "tabs array is required" });
    }

    const tabList = tabs
      .map((t: { url?: string; title?: string }) => ({ url: t.url || "", title: t.title || "" }))
      .filter((t: { url: string }) => t.url && !t.url.startsWith("chrome://"));

    const { text } = await complete({
      model: model as "claude" | "gemini" | "groq",
      prompt: `For each of these browser tabs, generate a concise task title (3-8 words) and a one-line description. Return ONLY a JSON array with objects: [{ "title": "...", "description": "..." }, ...]. Same order as input.

Tabs:
${tabList.map((t: { url: string; title: string }, i: number) => `${i + 1}. ${t.title || t.url}`).join("\n")}`,
      systemPrompt: "Return only valid JSON array. No markdown, no explanation.",
      maxTokens: 2048,
    });

    let taskData: Array<{ title: string; description: string }> = [];
    try {
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        taskData = JSON.parse(match[0]);
      }
    } catch {
      taskData = tabList.map((t: { title: string; url: string }) => ({
        title: t.title?.slice(0, 50) || new URL(t.url).hostname || "Task",
        description: t.url,
      }));
    }

    const pages = tabList.map((tab: { url: string; title: string }, i: number) => {
      const task = taskData[i] || {
        title: tab.title?.slice(0, 50) || "Research task",
        description: tab.url,
      };
      return {
        ...(parentPageId && { parent: { page_id: parentPageId } }),
        ...(databaseId && { parent: { database_id: databaseId } }),
        properties: {
          title: {
            title: [{ type: "text", text: { content: task.title } }],
          },
        },
        content: [
          {
            type: "paragraph",
            paragraph: {
              rich_text: [
                { type: "text", text: { content: task.description } },
                { type: "text", text: { content: `\n\nSource: ${tab.url}` } },
              ],
            },
          },
        ],
        icon: { type: "emoji", emoji: "📑" },
      };
    });

    const result = await notionCreatePages(pages, token);
    const contentText = result.content?.map((c) => c.text).join("") || "";
    const created = (contentText.match(/created/gi) || []).length || pages.length;

    res.json({ success: true, created, result: contentText });
  } catch (error) {
    console.error("tabs-to-notion error:", error);
    res.status(500).json({
      error: (error as Error).message,
    });
  }
});

router.post("/api/notion-search", async (req: Request, res: Response) => {
  try {
    const token = await getValidAccessToken();
    if (!token) {
      return res.status(401).json({ error: "Not connected to Notion" });
    }

    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "query is required" });
    }

    const result = await notionSearch(query.trim(), token);
    const text = result.content?.map((c) => c.text).join("\n") || "No results";

    res.json({ results: text, text });
  } catch (error) {
    console.error("notion-search error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post("/api/screenshot-to-notion", async (req: Request, res: Response) => {
  try {
    const token = await getValidAccessToken();
    if (!token) {
      return res.status(401).json({ error: "Not connected to Notion" });
    }

    const { imageBase64, url, title, model = "claude" } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "imageBase64 is required" });
    }

    let summary = "";
    if (title || url) {
      const { text } = await complete({
        model: model as "claude" | "gemini" | "groq",
        prompt: `Summarize this captured page in 1-2 sentences: ${title || ""} from ${url || "unknown"}`,
        maxTokens: 150,
      });
      summary = text.trim();
    }

    // Notion API requires public URLs for images - we save metadata only; user can screenshot manually
    const pages = [
      {
        properties: {
          title: {
            title: [{ type: "text", text: { content: title?.slice(0, 100) || "Screenshot" } }],
          },
        },
        content: [
          {
            type: "paragraph",
            paragraph: {
              rich_text: [
                { type: "text", text: { content: summary || `Captured from ${url || "page"}` } },
                { type: "text", text: { content: url ? `\n\nSource: ${url}` : "" } },
              ],
            },
          },
          ...(url
            ? [
                {
                  type: "paragraph",
                  paragraph: {
                    rich_text: [
                      {
                        type: "text",
                        text: { content: "Open page", link: { url } },
                      },
                    ],
                  },
                },
              ]
            : []),
        ],
        icon: { type: "emoji", emoji: "📷" },
      },
    ];

    const result = await notionCreatePages(pages, token);
    const text = result.content?.map((c) => c.text).join("") || "";

    res.json({ success: true, result: text });
  } catch (error) {
    console.error("screenshot-to-notion error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post("/api/research-summary", async (req: Request, res: Response) => {
  try {
    const token = await getValidAccessToken();
    if (!token) {
      return res.status(401).json({ error: "Not connected to Notion" });
    }

    const { tabs, model = "claude" } = req.body;
    if (!Array.isArray(tabs) || tabs.length === 0) {
      return res.status(400).json({ error: "tabs array is required" });
    }

    const tabList = tabs
      .map((t: { url?: string; title?: string }) => ({ url: t.url || "", title: t.title || "" }))
      .filter((t: { url: string }) => t.url && !t.url.startsWith("chrome://"));

    const { text } = await complete({
      model: model as "claude" | "gemini" | "groq",
      prompt: `Create a structured research summary from these tabs. Include: 1) Key themes, 2) Competitors/findings, 3) Key insights, 4) Suggested next steps. Use markdown headings and bullet points.

Tabs:
${tabList.map((t) => `- ${t.title || t.url}\n  ${t.url}`).join("\n")}`,
      maxTokens: 2048,
    });

    const content = [
      {
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: text } }],
        },
      },
      ...tabList.map(
        (t: { url: string; title: string }) => ({
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", text: { content: `\n• ${t.title || t.url}: ${t.url}` } }],
          },
        })
      ),
    ];

    const result = await notionCreatePages(
      [
        {
          properties: {
            title: { title: [{ type: "text", text: { content: "Research Summary" } }] },
          },
          content,
          icon: { type: "emoji", emoji: "📋" },
        },
      ],
      token
    );

    res.json({ success: true, result: result.content?.map((c) => c.text).join("") });
  } catch (error) {
    console.error("research-summary error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post("/api/quick-capture", async (req: Request, res: Response) => {
  try {
    const token = await getValidAccessToken();
    if (!token) {
      return res.status(401).json({ error: "Not connected to Notion" });
    }

    const { quote, url, title, model = "claude" } = req.body;
    if (!quote || typeof quote !== "string") {
      return res.status(400).json({ error: "quote is required" });
    }

    const { text } = await complete({
      model: model as "claude" | "gemini" | "groq",
      prompt: `Tag this quote with 1-3 comma-separated tags (e.g. "insight, competitor, pricing"): "${quote.slice(0, 200)}"`,
      maxTokens: 50,
    });
    const tags = text.trim().replace(/["']/g, "").slice(0, 100);

    const result = await notionCreatePages(
      [
        {
          properties: {
            title: {
              title: [{ type: "text", text: { content: title?.slice(0, 100) || "Quick capture" } }],
            },
          },
          content: [
            {
              type: "quote",
              quote: {
                rich_text: [{ type: "text", text: { content: quote.slice(0, 2000) } }],
              },
            },
            {
              type: "paragraph",
              paragraph: {
                rich_text: [
                  { type: "text", text: { content: `Source: ${url || "unknown"}\nTags: ${tags}` } },
                ],
              },
            },
          ],
          icon: { type: "emoji", emoji: "💬" },
        },
      ],
      token
    );

    res.json({ success: true, result: result.content?.map((c) => c.text).join("") });
  } catch (error) {
    console.error("quick-capture error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post("/api/tab-to-feature-request", async (req: Request, res: Response) => {
  try {
    const token = await getValidAccessToken();
    if (!token) {
      return res.status(401).json({ error: "Not connected to Notion" });
    }

    const { url, title, databaseId, model = "claude" } = req.body;
    if (!url) {
      return res.status(400).json({ error: "url is required" });
    }

    const { text } = await complete({
      model: model as "claude" | "gemini" | "groq",
      prompt: `Create a concise feature request title (5-10 words) from: ${title || url}`,
      maxTokens: 50,
    });
    const featureTitle = text.trim().replace(/["']/g, "").slice(0, 100) || "Feature request";

    const parent = databaseId ? { database_id: databaseId } : undefined;
    const result = await notionCreatePages(
      [
        {
          ...(parent && { parent }),
          properties: {
            title: { title: [{ type: "text", text: { content: featureTitle } }] },
            ...(databaseId && {
              Status: { select: { name: "To Review" } },
            }),
          },
          content: [
            {
              type: "paragraph",
              paragraph: {
                rich_text: [
                  { type: "text", text: { content: `Source: ${url}` } },
                ],
              },
            },
          ],
          icon: { type: "emoji", emoji: "🚀" },
        },
      ],
      token
    );

    res.json({ success: true, result: result.content?.map((c) => c.text).join("") });
  } catch (error) {
    console.error("tab-to-feature-request error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
