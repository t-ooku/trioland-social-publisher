import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const config = readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8");

assert.match(source, /hoshilu_isolated: true/);
assert.match(source, /approved: z\.literal\(true\)/);
assert.match(source, /ALLOWED_GITHUB_LOGIN/);
assert.match(source, /apiRoute: "\/mcp"/);
assert.match(source, /url\.pathname === "\/admin"/);
assert.match(source, /__Host-TRIOLAND_ADMIN_SESSION/);
assert.match(source, /admin-github-state:/);
assert.match(source, /CSRF_VALIDATION_FAILED/);
assert.match(source, /掲載許諾の確認が必要です/);
assert.match(source, /公開実行の最終確認が必要です/);
assert.match(source, /#トリオランド #駒沢大学駅 #三軒茶屋駅 #保育士募集 #園児募集/);
assert.doesNotMatch(source, /ADMIN_TOKEN[^\n]*<input/i);
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
