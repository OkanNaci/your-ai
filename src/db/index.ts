import "server-only";
import { drizzle as neonDrizzle } from "drizzle-orm/neon-http";
import { drizzle as localDrizzle } from "drizzle-orm/pglite";

const local = globalThis as typeof globalThis & {
  yourAiDb?: ReturnType<typeof localDrizzle>;
};

function connect() {
  if (process.env.DATABASE_URL) return neonDrizzle(process.env.DATABASE_URL);
  return (local.yourAiDb ??= localDrizzle(".data/postgres"));
}

let connection: ReturnType<typeof connect>;

// Open the local database on first use rather than during Next.js build discovery.
export const db = new Proxy({} as ReturnType<typeof connect>, {
  get(_target, property) {
    connection ??= connect();
    const value = Reflect.get(connection, property);
    return typeof value === "function" ? value.bind(connection) : value;
  },
});
