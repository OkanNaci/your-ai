import { createServer } from "node:http";
import next from "next";

const hostname = "127.0.0.1";
let app;
const server = createServer((req, res) => app.getRequestHandler()(req, res));
await new Promise((resolve, reject) => server.once("error", reject).listen(0, hostname, resolve));
const port = server.address().port;
const url = "http://" + hostname + ":" + port;
process.env.BETTER_AUTH_URL = url;
app = next({ dev: true, dir: process.cwd(), hostname, port });
await app.prepare();
process.send(url);
