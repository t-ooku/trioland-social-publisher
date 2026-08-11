import assert from "node:assert/strict";
import worker from "../src/index.js";

const env = {
  META_API_VERSION: "SET_IN_CLOUDFLARE",
};

const health = await worker.fetch(new Request("https://worker.example/health"), env);
assert.equal(health.status, 200);
assert.deepEqual(await health.json(), {
  ok: true,
  service: "trioland-social-publisher",
  hoshilu_isolated: true,
  metaConfigured: false,
  apiVersionConfigured: false,
  adminConfigured: false,
  encryptionConfigured: false,
  mediaSigningConfigured: false,
  oauthRedirectUri: "https://worker.example/oauth/callback",
});

const unauthorized = await worker.fetch(new Request("https://worker.example/account"), env);
assert.equal(unauthorized.status, 503);
assert.equal((await unauthorized.json()).error, "ADMIN_TOKEN_NOT_CONFIGURED");

console.log("smoke tests passed");
