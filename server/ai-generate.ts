import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export type LlmProvider = "anthropic" | "groq" | "gemini";

export const DEFAULT_MODELS: Record<LlmProvider, string> = {
  anthropic: "claude-sonnet-4-5-20250929",
  groq: "llama-3.3-70b-versatile",
  gemini: "gemini-2.0-flash",
};

function buildSystemPrompt(context: string): string {
  return `You are a UI component generator for a visual prototyping tool. Generate HTML and inline CSS for UI components that can be overlaid on existing websites.

Rules:
1. Return ONLY valid JSON with this structure: { "html": "<div>...</div>", "css": "..." }
2. Use inline styles or generate a single CSS string that can be injected
3. Make components self-contained and positioned absolutely
4. Use modern, clean design with proper spacing and colors
5. Components should look professional and polished
6. Include reasonable default dimensions
7. Do not use external resources or images (use placeholder backgrounds if needed)

Current page context: ${context || "Unknown website"}`;
}

function parseModelOutput(text: string): { html: string; css: string } {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as { html?: string; css?: string };
      return {
        html: typeof parsed.html === "string" ? parsed.html : "",
        css: typeof parsed.css === "string" ? parsed.css : "",
      };
    }
  } catch {
    /* fall through */
  }
  return { html: text, css: "" };
}

function normalizeProvider(p: unknown): LlmProvider {
  if (p === "groq" || p === "gemini" || p === "anthropic") return p;
  return "anthropic";
}

function resolveApiKey(
  provider: LlmProvider,
  bodyKey: unknown
): string | undefined {
  const fromBody =
    typeof bodyKey === "string" && bodyKey.trim().length > 0
      ? bodyKey.trim()
      : undefined;
  if (fromBody) return fromBody;
  switch (provider) {
    case "anthropic":
      return (
        process.env.ANTHROPIC_API_KEY ||
        process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY
      )?.trim();
    case "groq":
      return process.env.GROQ_API_KEY?.trim();
    case "gemini":
      return (
        process.env.GEMINI_API_KEY ||
        process.env.GOOGLE_AI_API_KEY ||
        process.env.GOOGLE_GENERATIVE_AI_API_KEY
      )?.trim();
    default:
      return undefined;
  }
}

export type GenerateBody = {
  prompt: string;
  context?: string;
  llmProvider?: unknown;
  llmApiKey?: unknown;
  llmModel?: unknown;
};

export async function generateComponent(
  body: GenerateBody
): Promise<{ html: string; css: string }> {
  const { prompt, context } = body;
  if (!prompt?.trim()) {
    throw new Error("MISSING_PROMPT");
  }

  const provider = normalizeProvider(body.llmProvider);
  const apiKey = resolveApiKey(provider, body.llmApiKey);
  if (!apiKey) {
    throw new Error("MISSING_LLM_KEY");
  }

  const modelRaw =
    typeof body.llmModel === "string" && body.llmModel.trim()
      ? body.llmModel.trim()
      : DEFAULT_MODELS[provider];
  const system = buildSystemPrompt(context || "");
  const userMsg = `Generate a UI component based on this description: ${prompt.trim()}`;

  let textOut = "";

  switch (provider) {
    case "anthropic": {
      const client = new Anthropic({ apiKey });
      const message = await client.messages.create({
        model: modelRaw,
        max_tokens: 8096,
        messages: [{ role: "user", content: userMsg }],
        system,
      });
      const block = message.content[0];
      textOut = block?.type === "text" ? block.text : "";
      break;
    }
    case "groq": {
      const client = new OpenAI({
        apiKey,
        baseURL: "https://api.groq.com/openai/v1",
      });
      const completion = await client.chat.completions.create({
        model: modelRaw,
        max_tokens: 8192,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userMsg },
        ],
      });
      const c = completion.choices[0]?.message?.content;
      textOut = typeof c === "string" ? c : "";
      break;
    }
    case "gemini": {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: modelRaw,
        systemInstruction: system,
      });
      const result = await model.generateContent(userMsg);
      textOut = result.response.text();
      break;
    }
    default:
      throw new Error("UNKNOWN_PROVIDER");
  }

  return parseModelOutput(textOut);
}
