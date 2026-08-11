import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const config = readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8");

assert.match(source, /hoshilu_isolated: true/);
assert.match(source, /approved: z\.literal\(true\)/);
assert.match(source, /ALLOWED_GITHUB_LOGIN/);
assert.match(source, /apiRoute: "\/mcp"/);
assert.match(config, /"binding": "AUTH_KV"/);
assert.match(config, /"binding": "OAUTH_KV"/);
assert.match(config, /"binding": "MEDIA_BUCKET"/);

const result = spawnSync(
  "./node_modules/.bin/esbuild",
  [
    "src/index.js",
    "--bundle",
    "--format=esm",
    "--platform=node",
    "--main-fields=module,main",
    "--external:cloudflare:*",
    "--outfile=/tmp/trioland-worker-smoke/index.js",
  ],
  { cwd: new URL("..", import.meta.url), encoding: "utf8" },
);

assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
console.log("smoke tests passed");
