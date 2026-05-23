import { z } from "zod";
import axios from "axios";
import { protectedProcedure, router } from "../_core/trpc";
import { createProvider, getUserProviders, getProvider, updateProvider, deleteProvider } from "../db";
import { TRPCError } from "@trpc/server";

const PROVIDER_TYPES = ["groq", "mistral", "gemini", "cohere", "github_models", "cerebras", "openrouter", "huggingface", "nvidia_nim", "llm7io"] as const;

const PROVIDER_DEFAULTS: Record<string, { name: string; baseUrl: string; models: string[] }> = {
  groq: {
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
  },
  mistral: {
    name: "Mistral AI",
    baseUrl: "https://api.mistral.ai/v1",
    models: ["mistral-small-latest", "mistral-medium-latest", "mistral-large-latest"],
  },
  gemini: {
    name: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    models: ["gemini-2.5-flash", "gemini-2.5-flash-lite"],
  },
  cohere: {
    name: "Cohere",
    baseUrl: "https://api.cohere.com/v2",
    models: ["command-r-plus", "command-r", "command-r7b"],
  },
  github_models: {
    name: "GitHub Models",
    baseUrl: "https://models.inference.ai.azure.com",
    models: ["gpt-4", "gpt-4-mini", "llama-3.3-70b", "mistral-small"],
  },
  cerebras: {
    name: "Cerebras",
    baseUrl: "https://api.cerebras.ai/v1",
    models: ["llama-3.1-8b", "gpt-oss-120b"],
  },
  openrouter: {
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    models: ["deepseek/deepseek-r1-distill-70b:free", "mistral/mistral-small:free"],
  },
  huggingface: {
    name: "HuggingFace",
    baseUrl: "https://api-inference.huggingface.co/models",
    models: ["meta-llama/Llama-3.1-8B-Instruct", "mistralai/Mistral-7B-Instruct-v0.3"],
  },
  nvidia_nim: {
    name: "NVIDIA NIM",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    models: ["meta/llama-3.1-405b-instruct", "nvidia/nemotron-3-super-120b-a12b"],
  },
  llm7io: {
    name: "LLM7.io",
    baseUrl: "https://api.llm7.io/v1",
    models: ["deepseek-r1-0528", "deepseek-v3-0324", "gpt-4o-mini"],
  },
};

export const providersRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const providers = await getUserProviders(ctx.user.id);
    // Don't return API keys to frontend
    return providers.map(p => ({
      ...p,
      apiKey: p.apiKey ? "***" : "",
    }));
  }),

  create: protectedProcedure
    .input(z.object({
      type: z.enum(PROVIDER_TYPES),
      apiKey: z.string().min(1, "API key is required"),
    }))
    .mutation(async ({ ctx, input }) => {
      const defaults = PROVIDER_DEFAULTS[input.type];
      if (!defaults) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid provider type" });
      }

      // TODO: Encrypt API key before storing
      return createProvider({
        userId: ctx.user.id,
        type: input.type,
        name: defaults.name,
        apiKey: input.apiKey,
      });
    }),

  get: protectedProcedure
    .input(z.object({ providerId: z.number() }))
    .query(async ({ ctx, input }) => {
      const provider = await getProvider(input.providerId, ctx.user.id);
      if (!provider) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Provider not found" });
      }
      // Don't return API key
      return {
        ...provider,
        apiKey: provider.apiKey ? "***" : "",
      };
    }),

  update: protectedProcedure
    .input(z.object({
      providerId: z.number(),
      apiKey: z.string().min(1, "API key is required"),
    }))
    .mutation(async ({ ctx, input }) => {
      const provider = await getProvider(input.providerId, ctx.user.id);
      if (!provider) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Provider not found" });
      }

      // TODO: Encrypt API key before storing
      return updateProvider(input.providerId, ctx.user.id, {
        apiKey: input.apiKey,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ providerId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const provider = await getProvider(input.providerId, ctx.user.id);
      if (!provider) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Provider not found" });
      }

      return deleteProvider(input.providerId, ctx.user.id);
    }),

  getAvailableModels: protectedProcedure
    .input(z.object({ type: z.enum(PROVIDER_TYPES) }))
    .query(async ({ ctx, input }) => {
      const defaults = PROVIDER_DEFAULTS[input.type];
      if (!defaults) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid provider type" });
      }
      return defaults.models;
    }),

  validateKey: protectedProcedure
    .input(z.object({
      type: z.enum(PROVIDER_TYPES),
      apiKey: z.string().min(1, "API key is required"),
    }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Implement actual API key validation with each provider
      // For now, just check if key is not empty
      if (!input.apiKey || input.apiKey.length < 10) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid API key format" });
      }
      return { valid: true };
    }),
});
