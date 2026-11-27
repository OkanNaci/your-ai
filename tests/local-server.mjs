import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import next from "next";

const hostname = "127.0.0.1";
const useFixture = process.env.YOUR_AI_TEST_OPENAI === "1";
let app;
const server = createServer(async (req, res) => {
  if (!useFixture || req.url !== "/test/openai/responses") {
    await app.getRequestHandler()(req, res);
    return;
  }
  let raw = "";
  for await (const part of req) raw += part;
  const body = JSON.parse(raw);
  if (req.method !== "POST" || body.store !== false) {
    res.writeHead(400).end();
  } else if (body.input === "Test rate limit") {
    res.writeHead(429).end();
  } else {
    res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({
      output: [{
        type: "message",
        content: [{ type: "output_text", text: "Fixture received: " + body.instructions }],
      }],
    }));
  }
});
await new Promise((resolve, reject) => server.once("error", reject).listen(0, hostname, resolve));
const port = server.address().port;
const url = "http://" + hostname + ":" + port;
process.env.BETTER_AUTH_URL = url;
if (useFixture) {
  process.env.OPENAI_API_KEY = "synthetic-smoke-key";
  // Only the temporary application copy uses the loopback provider endpoint.
  const file = "src/modules/agents/server/ask-agent.ts";
  const source = readFileSync(file, "utf8");
  const endpoint = "https://api.openai.com/v1/responses";
  assert.ok(source.includes(endpoint), "The smoke fixture must replace the OpenAI endpoint.");
  writeFileSync(file, source.replace(endpoint, url + "/test/openai/responses"));
}
app = next({ dev: true, dir: process.cwd(), hostname, port });
await app.prepare();
process.send(url);
