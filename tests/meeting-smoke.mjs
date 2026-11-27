import assert from "node:assert/strict";
import { execFileSync, fork } from "node:child_process";
import { once } from "node:events";
import { randomBytes } from "node:crypto";
import { cpSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const root = fileURLToPath(new URL("../", import.meta.url));
assert.ok(!process.env.DATABASE_URL, "Unset DATABASE_URL before running the local smoke test.");
assert.ok(!process.env.BETTER_AUTH_URL, "Unset BETTER_AUTH_URL before running the local smoke test.");
assert.ok(
  !process.env.YOUR_AI_SMOKE_MODEL_PORT || process.env.YOUR_AI_TEST_TEXT_FIXTURE !== "1",
  "Select the fixture or the real model, not both.",
);
const artifacts = path.join(root, ".next", "smoke-artifacts");
mkdirSync(artifacts, { recursive: true });
const scratch = mkdtempSync(path.join(artifacts, "app-"));
let browser, server;
try {
  // Copy only application inputs. No local environment files, databases or build output.
  for (const entry of ["src", "public", "package.json", "tsconfig.json", "next.config.ts",
    "components.json", "postcss.config.mjs", "drizzle.config.ts"]) {
    cpSync(path.join(root, entry), path.join(scratch, entry), { recursive: true });
  }
  process.chdir(scratch);
  for (const key of ["AGENT_TEXT_PROVIDER", "CLOUDFLARE_WORKERS_AI_TOKEN", "NEXT_PUBLIC_STREAM_VIDEO_API_KEY", "STREAM_VIDEO_SECRET_KEY",
    "GITHUB_CLIENT_SECRET", "GOOGLE_CLIENT_SECRET"]) delete process.env[key];
  process.env.BETTER_AUTH_SECRET = randomBytes(32).toString("hex");
  process.env.NEXT_TELEMETRY_DISABLED = "1";
  mkdirSync(".data");
  execFileSync(process.execPath, [path.join(root, "node_modules/drizzle-kit/bin.cjs"), "push"], { stdio: "inherit" });

  server = fork(new URL("./local-server.mjs", import.meta.url), [], { cwd: scratch });
  const base = await Promise.race([
    once(server, "message").then(([url]) => url),
    once(server, "exit").then(([code]) => { throw new Error("Test server exited: " + code); }),
  ]);
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.setDefaultTimeout(60000);
  await page.goto(base + "/meetings", { timeout: 120000 });
  await page.waitForURL("**/sign-in");
  await page.getByRole("link", { name: "Sign up" }).click();
  await page.getByLabel("Name", { exact: true }).fill("Smoke User");
  await page.getByLabel("Email").fill("smoke@example.com");
  for (const name of ["Password", "Confirm Password"]) {
    await page.getByLabel(name, { exact: true }).fill("synthetic-smoke-password");
  }
  await page.getByRole("button", { name: "Sign Up", exact: true }).click();
  await page.getByRole("link", { name: "Agents", exact: true }).click();
  async function openNewAgent(name, instructions) {
    await page.getByRole("button", { name: "New Agent" }).click();
    await page.getByLabel("Name", { exact: true }).fill(name);
    await page.getByLabel("Instructions").fill(instructions);
    await page.getByRole("button", { name: "Create", exact: true }).click();
    await page.getByRole("row", { name: new RegExp(name) }).click();
  }

  const fixture = process.env.YOUR_AI_TEST_TEXT_FIXTURE === "1";
  const liveModel = Boolean(process.env.YOUR_AI_SMOKE_MODEL_PORT);
  const first = liveModel ? "Always reply with exactly the word ALPHA." : "Coach junior developers.";
  const edited = liveModel ? "Always reply with exactly the word BRAVO." : "Coach senior developers.";
  const second = liveModel ? "Always reply with exactly the word CHARLIE." : "Facilitate planning meetings.";
  await openNewAgent("Interview Coach", first);
  if (fixture || liveModel) {
    const playground = page.locator("section").filter({ has: page.getByRole("heading", { name: "Agent playground" }) });
    async function ask(question) {
      await playground.getByLabel("Ask a question").fill(question);
      await playground.getByRole("button", { name: "Ask agent" }).click();
    }
    async function expectInstructions(instructions, marker) {
      await ask(liveModel ? "What is the word? Reply with only that word." : "How should I prepare?");
      const expected = fixture ? "Fixture received: " + instructions : new RegExp(marker, "i");
      await playground.getByRole("status").getByText(expected, { exact: fixture }).waitFor();
    }
    await expectInstructions(first, "ALPHA");
    if (fixture) {
      await ask("Test rate limit");
      await playground.getByRole("alert").filter({ hasText: "usage limit" }).waitFor();
      await expectInstructions(first, "ALPHA");
    }
    await page.getByRole("button", { name: "Agent actions" }).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();
    await page.getByLabel("Instructions").fill(edited);
    await page.getByRole("button", { name: "Update", exact: true }).click();
    await page.getByText(edited, { exact: true }).waitFor();
    await expectInstructions(edited, "BRAVO");
    await page.getByRole("link", { name: "My Agents" }).click();
    await openNewAgent("Meeting Facilitator", second);
    await expectInstructions(second, "CHARLIE");
    console.log(fixture ? "Text provider fixture passed." : "Real local model answered for both saved agents and the edited instructions.");
  } else {
    await page.getByText("Text replies are unavailable until the workspace administrator connects a model.").waitFor();
  }
  await page.getByRole("link", { name: "Meetings", exact: true }).click();
  await page.getByRole("button", { name: "New Meeting" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name", { exact: true }).fill("Interview practice");
  await dialog.getByRole("button", { name: "Select an agent" }).click();
  await page.getByRole("option", { name: "Interview Coach" }).click();
  await dialog.getByLabel("Agenda").fill("Practice a technical question.");
  await dialog.getByRole("button", { name: "Create", exact: true }).click();
  await page.getByRole("button", { name: "Start Meeting", exact: true }).click();
  const note = "Review one example before the next interview.";
  await page.getByLabel("Meeting notes").fill(note);
  await page.getByRole("button", { name: "Finish meeting" }).click();
  await page.getByRole("heading", { name: "Meeting completed" }).waitFor();
  await page.reload();
  await page.getByText(note, { exact: true }).waitFor();
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 800 });
    await page.screenshot({ path: path.join(artifacts, "completed-" + width + ".png") });
  }
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(base + "/meetings");
  await page.getByRole("button", { name: "Select", exact: true }).click();
  await page.getByRole("option", { name: "completed", exact: true }).click();
  await page.waitForURL(url => url.searchParams.get("status") === "completed");
  await page.getByRole("row", { name: /Interview practice.*completed/i }).waitFor();
  console.log("Meeting smoke test passed.");
} finally {
  await browser?.close();
  if (server && server.exitCode === null && server.signalCode === null) {
    const stopped = once(server, "exit");
    server.kill("SIGKILL");
    await stopped;
  }
  process.chdir(root);
  rmSync(scratch, { recursive: true, force: true, maxRetries: 3 });
}
