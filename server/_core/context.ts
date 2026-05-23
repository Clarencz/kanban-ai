import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import * as db from "../db";

const MOCK_USER_OPEN_ID = "mock-dev-user";
const MOCK_USER_NAME = "Dev User";
const MOCK_USER_EMAIL = "dev@local.test";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

let cachedUser: User | null = null;
let userPromise: Promise<User | null> | null = null;

async function ensureMockUser(): Promise<User | null> {
  if (cachedUser) return cachedUser;
  if (!userPromise) {
    userPromise = (async () => {
      try {
        await db.upsertUser({
          openId: MOCK_USER_OPEN_ID,
          name: MOCK_USER_NAME,
          email: MOCK_USER_EMAIL,
          loginMethod: "mock",
          role: "admin",
          lastSignedIn: new Date(),
        });
        const user = await db.getUserByOpenId(MOCK_USER_OPEN_ID);
        cachedUser = user ?? null;
        return cachedUser;
      } catch (error) {
        console.error("[MockAuth] Failed to provision dev user:", error);
        userPromise = null;
        return null;
      }
    })();
  }
  return userPromise;
}

export async function createContext(
  opts: CreateExpressContextOptions,
): Promise<TrpcContext> {
  const user = await ensureMockUser();
  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
