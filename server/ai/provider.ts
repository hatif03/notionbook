import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";

export type AIModel = "claude" | "gemini" | "groq";

export type AIApiKeys = {
  anthropic?: string;
  google?: string;
  groq?: string;
};

export type AICompletionOptions = {
  prompt: string;
  systemPrompt?: string;
  model?: AIModel;
  maxTokens?: number;
  /** BYOK: API keys from client - never persisted on server */
  apiKeys?: AIApiKeys;
};

export type AICompletionResult = {
  text: string;
  model: string;
};

const CLAUDE_MODEL = "claude-sonnet-4-5-20250929";
const GEMINI_MODEL = "gemini-2.0-flash";
const GROQ_MODEL = "llama-3.3-70b-versatile";

function getClaudeClient(apiKeys?: AIApiKeys): Anthropic | null {
  const apiKey = apiKeys?.anthropic ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

function getGeminiClient(apiKeys?: AIApiKeys): GoogleGenAI | null {
  const apiKey = apiKeys?.google ?? process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

function getGroqClient(apiKeys?: AIApiKeys): Groq | null {
  const apiKey = apiKeys?.groq ?? process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

export async function complete(
  options: AICompletionOptions
): Promise<AICompletionResult> {
  const model = options.model || "claude";
  const maxTokens = options.maxTokens ?? 4096;
  const apiKeys = options.apiKeys;

  switch (model) {
    case "claude": {
      const client = getClaudeClient(apiKeys);
      if (!client) throw new Error("Claude API key required. Add your key in extension settings (BYOK).");
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
      const client = getGeminiClient(apiKeys);
      if (!client) throw new Error("Gemini API key required. Add your key in extension settings (BYOK).");
      const result = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: options.prompt,
        systemInstruction: options.systemPrompt,
      });
      const text = result.text ?? "";
      return { text, model: GEMINI_MODEL };
    }

    case "groq": {
      const client = getGroqClient(apiKeys);
      if (!client) throw new Error("Groq API key required. Add your key in extension settings (BYOK).");
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

/** Returns all models - keys are provided per-request via BYOK */
export function getAvailableModels(): AIModel[] {
  return ["claude", "gemini", "groq"];
}
