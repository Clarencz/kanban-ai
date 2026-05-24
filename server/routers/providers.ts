import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createProvider,
  getUserProviders,
  getProvider,
  updateProvider,
  deleteProvider,
} from "../db";
import {
  PROVIDER_CATALOG,
  PROVIDER_IDS,
  getProviderInfo,
  type ProviderId,
  type ProviderInfo,
} from "../../shared/providerCatalog";

const providerIdSchema = z.enum(PROVIDER_IDS as [ProviderId, ...ProviderId[]]);

export const providersRouter = router({
  // Static catalog — lets the client render the picker without round-tripping per provider.
  catalog: protectedProcedure.query(() =>
    (PROVIDER_CATALOG as readonly ProviderInfo[]).map((p) => ({
      id: p.id,
      name: p.name,
      country: p.country,
      kind: p.kind,
      description: p.description,
      models: p.models,
      authType: p.auth.type,
      openAiCompatible: p.openAiCompatible,
      free: p.free,
      unsupportedRuntime: p.unsupportedRuntime ?? false,
      notes: p.notes,
    })),
  ),

  list: protectedProcedure.query(async ({ ctx }) => {
    const providers = await getUserProviders(ctx.user.id);
    // Don't return API keys to frontend
    return providers.map((p) => ({
      ...p,
      apiKey: p.apiKey ? "***" : "",
    }));
  }),

  create: protectedProcedure
    .input(
      z.object({
        type: providerIdSchema,
        apiKey: z.string().min(1, "API key is required"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const info = getProviderInfo(input.type);

      // TODO: Encrypt API key before storing
      return createProvider({
        userId: ctx.user.id,
        type: input.type,
        name: info.name,
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
      return {
        ...provider,
        apiKey: provider.apiKey ? "***" : "",
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        providerId: z.number(),
        apiKey: z.string().min(1, "API key is required"),
      }),
    )
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
    .input(z.object({ type: providerIdSchema }))
    .query(({ input }) => getProviderInfo(input.type).models),

  validateKey: protectedProcedure
    .input(
      z.object({
        type: providerIdSchema,
        apiKey: z.string().min(1, "API key is required"),
      }),
    )
    .mutation(async ({ input }) => {
      const info = getProviderInfo(input.type);

      // Catalog flags providers where API key is optional/none.
      if (info.auth.type === "none") {
        return { valid: true };
      }

      // TODO: Implement actual API key validation per provider.
      // For now, surface obvious shape errors.
      if (!input.apiKey || input.apiKey.length < 10) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid API key format",
        });
      }
      return { valid: true };
    }),
});
