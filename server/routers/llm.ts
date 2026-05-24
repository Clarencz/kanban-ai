import axios from "axios";
import { TRPCError } from "@trpc/server";
import {
  type ProviderId,
  getProviderInfo,
} from "../../shared/providerCatalog";

interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 2000;

export async function callLLM(
  provider: ProviderId,
  apiKey: string,
  model: string,
  messages: LLMMessage[],
  systemPrompt?: string,
): Promise<string> {
  const info = getProviderInfo(provider);

  if (info.unsupportedRuntime) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${info.name} runtime is not yet implemented`,
    });
  }

  const fullMessages = systemPrompt
    ? [{ role: "system" as const, content: systemPrompt }, ...messages]
    : messages;

  switch (provider) {
    case "gemini":
      return callGemini(info.baseUrl, apiKey, model, fullMessages);
    case "cohere":
      return callCohere(info.baseUrl, apiKey, model, fullMessages);
    case "huggingface":
      // HF router endpoint is OpenAI-compatible; legacy /models/{name} is not.
      return callOpenAiCompatible(provider, info.baseUrl, apiKey, model, fullMessages);
    default:
      if (!info.openAiCompatible) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${info.name} is not OpenAI-compatible and has no dedicated adapter`,
        });
      }
      return callOpenAiCompatible(provider, info.baseUrl, apiKey, model, fullMessages);
  }
}

async function callOpenAiCompatible(
  provider: ProviderId,
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: LLMMessage[],
): Promise<string> {
  const info = getProviderInfo(provider);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  try {
    const response = await axios.post(
      `${baseUrl.replace(/\/+$/, "")}/chat/completions`,
      {
        model,
        messages,
        temperature: DEFAULT_TEMPERATURE,
        max_tokens: DEFAULT_MAX_TOKENS,
      },
      { headers },
    );
    return response.data.choices?.[0]?.message?.content ?? "No response";
  } catch (error: any) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `${info.name} API error: ${
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message
      }`,
    });
  }
}

async function callGemini(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: LLMMessage[],
): Promise<string> {
  try {
    const response = await axios.post(
      `${baseUrl.replace(/\/+$/, "")}/models/${model}:generateContent?key=${apiKey}`,
      {
        contents: messages.map((msg) => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        })),
        generationConfig: {
          temperature: DEFAULT_TEMPERATURE,
          maxOutputTokens: DEFAULT_MAX_TOKENS,
        },
      },
      { headers: { "Content-Type": "application/json" } },
    );
    return response.data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response";
  } catch (error: any) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Gemini API error: ${
        error.response?.data?.error?.message || error.message
      }`,
    });
  }
}

async function callCohere(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: LLMMessage[],
): Promise<string> {
  try {
    const response = await axios.post(
      `${baseUrl.replace(/\/+$/, "")}/chat`,
      {
        model,
        messages: messages.map((msg) => ({
          role:
            msg.role === "assistant"
              ? "assistant"
              : msg.role === "system"
                ? "system"
                : "user",
          content: msg.content,
        })),
        temperature: DEFAULT_TEMPERATURE,
        max_tokens: DEFAULT_MAX_TOKENS,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );
    return (
      response.data.message?.content?.[0]?.text ??
      response.data.text ??
      "No response"
    );
  } catch (error: any) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Cohere API error: ${
        error.response?.data?.message || error.message
      }`,
    });
  }
}
