import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import apiRoutes from "./routes/api.js";
import { getValidAccessToken } from "./mcp/get-access-token.js";
import { getAvailableModels } from "./ai/provider.js";
import { complete } from "./ai/provider.js";

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Notion OAuth + API routes
app.use(authRoutes);
app.use(apiRoutes);

function getApiKeys(req: { body?: { apiKeys?: Record<string, unknown> } }) {
  const keys = req.body?.apiKeys;
  if (!keys || typeof keys !== "object") return undefined;
  return {
    anthropic: typeof keys.anthropic === "string" ? keys.anthropic : undefined,
    google: typeof keys.google === "string" ? keys.google : undefined,
    groq: typeof keys.groq === "string" ? keys.groq : undefined,
  };
}

app.post("/api/generate-component", async (req, res) => {
  try {
    const { prompt, context, model = "claude" } = req.body;
    const apiKeys = getApiKeys(req);

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const systemPrompt = `You are a UI component generator for a visual prototyping tool. Generate HTML and inline CSS for UI components that can be overlaid on existing websites.

Rules:
1. Return ONLY valid JSON with this structure: { "html": "<div>...</div>", "css": "..." }
2. Use inline styles or generate a single CSS string that can be injected
3. Make components self-contained and positioned absolutely
4. Use modern, clean design with proper spacing and colors
5. Components should look professional and polished
6. Include reasonable default dimensions
7. Do not use external resources or images (use placeholder backgrounds if needed)

Current page context: ${context || "Unknown website"}`;

    const { text } = await complete({
      model: model as "claude" | "gemini" | "groq",
      apiKeys,
      prompt: `Generate a UI component based on this description: ${prompt}`,
      systemPrompt,
      maxTokens: 8096,
    });

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return res.json(parsed);
      }
    } catch {
      return res.json({ html: text, css: "" });
    }

    res.json({ html: "", css: "" });
  } catch (error) {
    console.error("Error generating component:", error);
    res.status(500).json({ error: "Failed to generate component" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/notion-status", async (req, res) => {
  try {
    const token = await getValidAccessToken();
    res.json({ connected: !!token });
  } catch {
    res.json({ connected: false });
  }
});

app.get("/api/ai-models", (req, res) => {
  res.json({ models: getAvailableModels() });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
