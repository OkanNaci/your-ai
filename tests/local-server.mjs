import { createServer } from "node:http";
import next from "next";

const hostname = "127.0.0.1";
const useFixture = process.env.YOUR_AI_TEST_TEXT_FIXTURE === "1";
const modelPort = process.env.YOUR_AI_SMOKE_MODEL_PORT;
let app;
const server = createServer(async (req, res) => {
  if (!useFixture || req.url !== "/v1/chat/completions") {
    await app.getRequestHandler()(req, res);
    return;
  }
  let raw = "";
  for await (const part of req) raw += part;
  const body = JSON.parse(raw);
  const [system, user] = body.messages ?? [];
  if (req.method !== "POST" || system?.role !== "system" || user?.role !== "user" || body.stream !== false) {
    res.writeHead(400).end();
  } else if (user.content === "Test rate limit") {
    res.writeHead(429).end();
  } else {
    res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({
      choices: [{ message: { content: "Fixture received: " + system.content } }],
    }));
  }
});
await new Promise((resolve, reject) => server.once("error", reject).listen(0, hostname, resolve));
const port = server.address().port;
const url = "http://" + hostname + ":" + port;
process.env.BETTER_AUTH_URL = url;
if (useFixture || modelPort) {
  process.env.AGENT_TEXT_PROVIDER = "local";
  process.env.LOCAL_AI_PORT = useFixture ? String(port) : modelPort;
}
app = next({ dev: true, dir: process.cwd(), hostname, port });
await app.prepare();
process.send(url);
