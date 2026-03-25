import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Check for API key
const apiKey = process.env.ANTHROPIC_API_KEY || process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error("⚠️  WARNING: No ANTHROPIC_API_KEY found in .env file!");
  console.error("   Create a .env file with: ANTHROPIC_API_KEY=your-key-here");
}

const anthropic = new Anthropic({
  apiKey: apiKey,
});

app.post("/api/generate-component", async (req, res) => {
  try {
    const { prompt, context } = req.body;

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

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 8096,
      messages: [
        {
          role: "user",
          content: `Generate a UI component based on this description: ${prompt}`,
        },
      ],
      system: systemPrompt,
    });

    const content = message.content[0];
    if (content.type === "text") {
      try {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return res.json(parsed);
        }
      } catch {
        return res.json({ html: content.text, css: "" });
      }
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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
