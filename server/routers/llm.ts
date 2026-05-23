import axios from "axios";
import { TRPCError } from "@trpc/server";

type ProviderType = "groq" | "mistral" | "gemini" | "cohere" | "github_models" | "cerebras" | "openrouter" | "huggingface" | "nvidia_nim" | "llm7io";

interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callLLM(
  provider: ProviderType,
  apiKey: string,
  model: string,
  messages: LLMMessage[],
  systemPrompt?: string
): Promise<string> {
  const fullMessages = systemPrompt
    ? [{ role: "system" as const, content: systemPrompt }, ...messages]
    : messages;

  switch (provider) {
    case "groq":
      return callGroq(apiKey, model, fullMessages);
    case "mistral":
      return callMistral(apiKey, model, fullMessages);
    case "gemini":
      return callGemini(apiKey, model, fullMessages);
    case "cohere":
      return callCohere(apiKey, model, fullMessages);
    case "github_models":
      return callGitHubModels(apiKey, model, fullMessages);
    case "cerebras":
      return callCerebras(apiKey, model, fullMessages);
    case "openrouter":
      return callOpenRouter(apiKey, model, fullMessages);
    case "huggingface":
      return callHuggingFace(apiKey, model, fullMessages);
    case "nvidia_nim":
      return callNVIDIANIM(apiKey, model, fullMessages);
    case "llm7io":
      return callLLM7io(apiKey, model, fullMessages);
    default:
      throw new TRPCError({ code: "BAD_REQUEST", message: `Unknown provider: ${provider}` });
  }
}

async function callGroq(apiKey: string, model: string, messages: LLMMessage[]): Promise<string> {
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.choices[0]?.message?.content || "No response";
  } catch (error: any) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Groq API error: ${error.response?.data?.error?.message || error.message}`,
    });
  }
}

async function callMistral(apiKey: string, model: string, messages: LLMMessage[]): Promise<string> {
  try {
    const response = await axios.post(
      "https://api.mistral.ai/v1/chat/completions",
      {
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.choices[0]?.message?.content || "No response";
  } catch (error: any) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Mistral API error: ${error.response?.data?.message || error.message}`,
    });
  }
}

async function callGemini(apiKey: string, model: string, messages: LLMMessage[]): Promise<string> {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        contents: messages.map((msg) => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        })),
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.candidates[0]?.content?.parts[0]?.text || "No response";
  } catch (error: any) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Gemini API error: ${error.response?.data?.error?.message || error.message}`,
    });
  }
}

async function callCohere(apiKey: string, model: string, messages: LLMMessage[]): Promise<string> {
  try {
    const response = await axios.post(
      "https://api.cohere.ai/v1/chat",
      {
        model,
        messages: messages.map((msg) => ({
          role: msg.role === "assistant" ? "CHATBOT" : "USER",
          message: msg.content,
        })),
        temperature: 0.7,
        max_tokens: 2000,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.text || "No response";
  } catch (error: any) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Cohere API error: ${error.response?.data?.message || error.message}`,
    });
  }
}

async function callGitHubModels(apiKey: string, model: string, messages: LLMMessage[]): Promise<string> {
  try {
    const response = await axios.post(
      "https://models.inference.ai.azure.com/chat/completions",
      {
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.choices[0]?.message?.content || "No response";
  } catch (error: any) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `GitHub Models API error: ${error.response?.data?.error?.message || error.message}`,
    });
  }
}

async function callCerebras(apiKey: string, model: string, messages: LLMMessage[]): Promise<string> {
  try {
    const response = await axios.post(
      "https://api.cerebras.ai/v1/chat/completions",
      {
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.choices[0]?.message?.content || "No response";
  } catch (error: any) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Cerebras API error: ${error.response?.data?.error?.message || error.message}`,
    });
  }
}

async function callOpenRouter(apiKey: string, model: string, messages: LLMMessage[]): Promise<string> {
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.choices[0]?.message?.content || "No response";
  } catch (error: any) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `OpenRouter API error: ${error.response?.data?.error?.message || error.message}`,
    });
  }
}

async function callHuggingFace(apiKey: string, model: string, messages: LLMMessage[]): Promise<string> {
  try {
    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        inputs: messages.map((m) => m.content).join("\n"),
        parameters: {
          max_length: 2000,
          temperature: 0.7,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    return Array.isArray(response.data)
      ? response.data[0]?.generated_text || "No response"
      : response.data.generated_text || "No response";
  } catch (error: any) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `HuggingFace API error: ${error.response?.data?.error || error.message}`,
    });
  }
}

async function callNVIDIANIM(apiKey: string, model: string, messages: LLMMessage[]): Promise<string> {
  try {
    const response = await axios.post(
      `https://integrate.api.nvidia.com/v1/chat/completions`,
      {
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.choices[0]?.message?.content || "No response";
  } catch (error: any) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `NVIDIA NIM API error: ${error.response?.data?.error?.message || error.message}`,
    });
  }
}

async function callLLM7io(apiKey: string, model: string, messages: LLMMessage[]): Promise<string> {
  try {
    const response = await axios.post(
      "https://api.llm7.io/v1/chat/completions",
      {
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.choices[0]?.message?.content || "No response";
  } catch (error: any) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `LLM7.io API error: ${error.response?.data?.error?.message || error.message}`,
    });
  }
}
