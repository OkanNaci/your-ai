import { randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";

mkdirSync(".data", { recursive: true });
try {
  writeFileSync(
    ".env.local",
    "BETTER_AUTH_URL=http://localhost:3000\nBETTER_AUTH_SECRET=" +
      randomBytes(32).toString("hex") + "\n",
    { flag: "wx" },
  );
  console.log("Created .env.local with a local authentication secret.");
} catch (error) {
  if (error.code !== "EEXIST") throw error;
  console.log("Using your existing .env.local.");
}
