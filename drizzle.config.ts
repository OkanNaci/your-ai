import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });
config();

const schema = "./src/db/schema.ts";
const url = process.env.DATABASE_URL;

export default defineConfig(
  url
    ? { schema, dialect: "postgresql", dbCredentials: { url } }
    : {
        schema,
        dialect: "postgresql",
        driver: "pglite",
        dbCredentials: { url: ".data/postgres" },
      },
);
