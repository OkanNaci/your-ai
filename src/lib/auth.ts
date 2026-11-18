import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";

const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } =
  process.env;

export const enabledSocialProviders = {
  github: Boolean(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET),
  google: Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET),
};

export const auth = betterAuth({
  socialProviders: {
    ...(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET && {
      github: { clientId: GITHUB_CLIENT_ID, clientSecret: GITHUB_CLIENT_SECRET },
    }),
    ...(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && {
      google: { clientId: GOOGLE_CLIENT_ID, clientSecret: GOOGLE_CLIENT_SECRET },
    }),
  },
  emailAndPassword: { enabled: true },
  database: drizzleAdapter(db, { provider: "pg", schema }),
});
