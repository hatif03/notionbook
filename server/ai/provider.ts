import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";

export type AIModel = "claude" | "gemini" | "groq";

export type AICompletionOptions = {
  prompt: string;
  systemPrompt?: string;
  model?: AIModel;
  maxTokens?: number;
};

export type AICompletionResult = {
  text: string;
  model: string;
};

const CLAUDE_MODEL = "claude-sonnet-4-5-20250929";
const GEMINI_MODEL = "gemini-2.0-flash";
const GROQ_MODEL = "llama-3.3-70b-versatile";

function getClaudeClient(): Anthropic | null {
  const apiKey =
    process.env.ANTHROPIC_API_KEY || process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

export async function complete(
  options: AICompletionOptions
): Promise<AICompletionResult> {
  const model = options.model || "claude";
  const maxTokens = options.maxTokens ?? 4096;

  switch (model) {
    case "claude": {
      const client = getClaudeClient();
      if (!client) throw new Error("Claude API key not configured");
      const message = await client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: maxTokens,
        system: options.systemPrompt,
        messages: [{ role: "user", content: options.prompt }],
      });
      const content = message.content[0];
      const text = content.type === "text" ? content.text : "";
      return { text, model: CLAUDE_MODEL };
    }

    case "gemini": {
      const client = getGeminiClient();
      if (!client) throw new Error("Gemini API key not configured");
      const result = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: options.prompt,
        systemInstruction: options.systemPrompt,
      });
      const text = result.text ?? "";
      return { text, model: GEMINI_MODEL };
    }

    case "groq": {
      const client = getGroqClient();
      if (!client) throw new Error("Groq API key not configured");
      const messages: Array<{ role: "user" | "system"; content: string }> = [];
      if (options.systemPrompt) {
        messages.push({ role: "system", content: options.systemPrompt });
      }
      messages.push({ role: "user", content: options.prompt });
      const completion = await client.chat.completions.create({
        model: GROQ_MODEL,
        messages,
        max_tokens: maxTokens,
      });
      const text = completion.choices[0]?.message?.content ?? "";
      return { text, model: GROQ_MODEL };
    }

    default:
      throw new Error(`Unknown model: ${model}`);
  }
}

export function getAvailableModels(): AIModel[] {
  const available: AIModel[] = [];
  if (getClaudeClient()) available.push("claude");
  if (getGeminiClient()) available.push("gemini");
  if (getGroqClient()) available.push("groq");
  return available;
}
