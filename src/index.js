import { OAuthProvider, AuthorizationError } from "@cloudflare/workers-oauth-provider";
import { McpServer } from "@modelcontextprotocol/server";
import { createMcpHandler, getMcpAuthContext } from "agents/mcp/server";
import { z } from "zod";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

export const appHandler = {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      if (request.method === "GET" && url.pathname === "/health") {
        return json({
          ok: true,
          service: "trioland-social-publisher",
          hoshilu_isolated: true,
          metaConfigured: Boolean(env.META_APP_ID && env.META_APP_SECRET),
          apiVersionConfigured: isConfigured(env.META_API_VERSION),
          adminConfigured: Boolean(env.ADMIN_TOKEN),
          encryptionConfigured: Boolean(env.TOKEN_ENCRYPTION_KEY),
          mediaSigningConfigured: Boolean(env.MEDIA_SIGNING_SECRET),
          mcpConfigured: Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET),
          mcpEndpoint: `${url.origin}/mcp`,
          oauthRedirectUri: `${url.origin}/oauth/callback`,
        });
      }

      if (request.method === "GET" && url.pathname.startsWith("/media/")) {
        return serveSignedMedia(request, env);
      }

      if (request.method === "GET" && url.pathname === "/oauth/callback") {
        return oauthCallback(request, env);
      }

      await requireAdmin(request, env);

      if (request.method === "POST" && url.pathname === "/oauth/start") {
        return oauthStart(request, env);
      }
      if (request.method === "GET" && url.pathname === "/account") {
        return accountInfo(env);
      }
      if (request.method === "POST" && url.pathname === "/media") {
        return uploadApprovedMedia(request, env);
      }
      if (request.method === "POST" && url.pathname === "/publish") {
        return publishApprovedMedia(request, env);
      }
      if (request.method === "POST" && url.pathname === "/token/refresh") {
        return refreshToken(env);
      }

      return json({ error: "NOT_FOUND" }, 404);
    } catch (error) {
      const status = Number(error?.status || 500);
      return json({ error: error?.message || "INTERNAL_ERROR" }, status);
    }
  },
};

function isConfigured(value) {
  return Boolean(value && !String(value).startsWith("SET_") && !String(value).startsWith("CREATE_"));
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function problem(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function requireAdmin(request, env) {
  if (!env.ADMIN_TOKEN) throw problem("ADMIN_TOKEN_NOT_CONFIGURED", 503);
  const expected = `Bearer ${env.ADMIN_TOKEN}`;
  if (!constantTimeEqual(request.headers.get("authorization") || "", expected)) {
    throw problem("UNAUTHORIZED", 401);
  }
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function oauthStart(request, env) {
  assertMetaConfig(env);
  return json({ authorizationUrl: await createInstagramAuthorizationUrl(env, new URL(request.url).origin) });
}

async function createInstagramAuthorizationUrl(env, origin) {
  assertMetaConfig(env);
  const redirectUri = `${origin}/oauth/callback`;
  const state = crypto.randomUUID();
  await env.AUTH_KV.put(`oauth-state:${state}`, "1", { expirationTtl: 600 });
  const params = new URLSearchParams({
    enable_fb_login: "0",
    force_authentication: "1",
    client_id: env.META_APP_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "instagram_business_basic,instagram_business_content_publish",
    state,
  });
  return `https://www.instagram.com/oauth/authorize?${params}`;
}

async function oauthCallback(request, env) {
  assertMetaConfig(env);
  const url = new URL(request.url);
  const redirectUri = `${url.origin}/oauth/callback`;
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  if (!state || !code) throw problem("MISSING_OAUTH_CODE_OR_STATE");
  const stateKey = `oauth-state:${state}`;
  if (!(await env.AUTH_KV.get(stateKey))) throw problem("INVALID_OR_EXPIRED_OAUTH_STATE", 401);
  await env.AUTH_KV.delete(stateKey);

  const shortResponse = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: env.META_APP_ID,
      client_secret: env.META_APP_SECRET,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
    }),
  });
  const shortToken = await metaJson(shortResponse, "OAUTH_TOKEN_EXCHANGE_FAILED");
  const exchangeUrl = new URL("https://graph.instagram.com/access_token");
  exchangeUrl.search = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: env.META_APP_SECRET,
    access_token: shortToken.access_token,
  });
  const longToken = await metaJson(await fetch(exchangeUrl), "LONG_TOKEN_EXCHANGE_FAILED");
  const profile = await fetchProfile(env, longToken.access_token);
  await storeToken(env, {
    access_token: longToken.access_token,
    expires_in: longToken.expires_in,
    stored_at: Date.now(),
    user_id: String(profile.user_id || profile.id || shortToken.user_id),
    username: profile.username,
  });
  return new Response("Instagram API connection completed. You may close this window.", {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}

async function accountInfo(env) {
  const token = await loadToken(env);
  const profile = await fetchProfile(env, token.access_token);
  return json({ connected: true, profile });
}

async function uploadApprovedMedia(request, env) {
  const form = await request.formData();
  if (String(form.get("approved")) !== "true") throw problem("MEDIA_NOT_APPROVED", 409);
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) throw problem("FILE_REQUIRED");
  const allowed = new Set(["image/jpeg", "image/png", "video/mp4", "video/quicktime"]);
  if (!allowed.has(file.type)) throw problem("UNSUPPORTED_MEDIA_TYPE", 415);
  const ext = file.type.includes("png") ? "png" : file.type.includes("video") || file.type.includes("quicktime") ? "mp4" : "jpg";
  const key = `approved/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
  await env.MEDIA_BUCKET.put(key, file.stream(), {
    httpMetadata: { contentType: file.type, cacheControl: "private, max-age=0" },
    customMetadata: { approved: "true", originalName: file.name.slice(0, 180) },
  });
  return json({ key, mediaUrl: await signedMediaUrl(request.url, key, env, 3600) }, 201);
}

async function publishApprovedMedia(request, env) {
  const body = await request.json();
  if (body.approved !== true) throw problem("MEDIA_NOT_APPROVED", 409);
  if (!body.objectKey) throw problem("OBJECT_KEY_REQUIRED");
  const object = await env.MEDIA_BUCKET.head(body.objectKey);
  if (!object || object.customMetadata?.approved !== "true") throw problem("APPROVED_MEDIA_NOT_FOUND", 404);
  const token = await loadToken(env);
  const mediaUrl = await signedMediaUrl(request.url, body.objectKey, env, 3600);
  const type = String(body.mediaType || "").toUpperCase();
  const createParams = new URLSearchParams({
    access_token: token.access_token,
    caption: String(body.caption || ""),
  });
  if (type === "IMAGE") {
    createParams.set("image_url", mediaUrl);
  } else if (type === "REELS") {
    createParams.set("media_type", "REELS");
    createParams.set("video_url", mediaUrl);
    createParams.set("share_to_feed", body.shareToFeed === false ? "false" : "true");
  } else {
    throw problem("MEDIA_TYPE_MUST_BE_IMAGE_OR_REELS");
  }

  const base = graphBase(env);
  const createResponse = await fetch(`${base}/${encodeURIComponent(token.user_id)}/media`, {
    method: "POST",
    body: createParams,
  });
  const container = await metaJson(createResponse, "MEDIA_CONTAINER_CREATE_FAILED");
  if (type === "REELS") await waitUntilFinished(base, container.id, token.access_token);

  const publishResponse = await fetch(`${base}/${encodeURIComponent(token.user_id)}/media_publish`, {
    method: "POST",
    body: new URLSearchParams({ creation_id: container.id, access_token: token.access_token }),
  });
  const published = await metaJson(publishResponse, "MEDIA_PUBLISH_FAILED");
  return json({ published: true, mediaId: published.id, containerId: container.id });
}

async function waitUntilFinished(base, containerId, accessToken) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const url = new URL(`${base}/${encodeURIComponent(containerId)}`);
    url.search = new URLSearchParams({ fields: "status_code,status", access_token: accessToken });
    const status = await metaJson(await fetch(url), "MEDIA_STATUS_FAILED");
    if (status.status_code === "FINISHED") return;
    if (["ERROR", "EXPIRED"].includes(status.status_code)) throw problem(`MEDIA_PROCESSING_${status.status_code}`, 502);
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  throw problem("MEDIA_PROCESSING_TIMEOUT", 504);
}

async function refreshToken(env) {
  const token = await loadToken(env);
  const url = new URL("https://graph.instagram.com/refresh_access_token");
  url.search = new URLSearchParams({ grant_type: "ig_refresh_token", access_token: token.access_token });
  const refreshed = await metaJson(await fetch(url), "TOKEN_REFRESH_FAILED");
  await storeToken(env, { ...token, access_token: refreshed.access_token, expires_in: refreshed.expires_in, stored_at: Date.now() });
  return json({ refreshed: true, expiresIn: refreshed.expires_in });
}

async function fetchProfile(env, accessToken) {
  const url = new URL(`${graphBase(env)}/me`);
  url.search = new URLSearchParams({ fields: "user_id,username,account_type,media_count", access_token: accessToken });
  return metaJson(await fetch(url), "PROFILE_FETCH_FAILED");
}

function graphBase(env) {
  if (!isConfigured(env.META_API_VERSION)) throw problem("META_API_VERSION_NOT_CONFIGURED", 503);
  return `https://graph.instagram.com/${env.META_API_VERSION}`;
}

function assertMetaConfig(env) {
  if (!env.META_APP_ID || !env.META_APP_SECRET) throw problem("META_APP_NOT_CONFIGURED", 503);
}

async function metaJson(response, fallback) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.error) {
    const message = body.error?.message || body.error_message || fallback;
    throw problem(`${fallback}: ${message}`, 502);
  }
  return body;
}

async function storeToken(env, value) {
  const encrypted = await encryptJson(value, env.TOKEN_ENCRYPTION_KEY);
  await env.AUTH_KV.put("instagram-token", JSON.stringify(encrypted));
}

async function loadToken(env) {
  const raw = await env.AUTH_KV.get("instagram-token");
  if (!raw) throw problem("INSTAGRAM_NOT_CONNECTED", 409);
  return decryptJson(JSON.parse(raw), env.TOKEN_ENCRYPTION_KEY);
}

async function encryptJson(value, encodedKey) {
  const key = await importAesKey(encodedKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(value));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  return { iv: toBase64(iv), data: toBase64(new Uint8Array(ciphertext)) };
}

async function decryptJson(value, encodedKey) {
  const key = await importAesKey(encodedKey);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(value.iv) },
    key,
    fromBase64(value.data),
  );
  return JSON.parse(new TextDecoder().decode(plaintext));
}

async function importAesKey(encodedKey) {
  if (!encodedKey) throw problem("TOKEN_ENCRYPTION_KEY_NOT_CONFIGURED", 503);
  const bytes = fromBase64(encodedKey);
  if (bytes.byteLength !== 32) throw problem("TOKEN_ENCRYPTION_KEY_MUST_BE_32_BYTES", 503);
  return crypto.subtle.importKey("raw", bytes, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function signedMediaUrl(requestUrl, key, env, ttlSeconds) {
  if (!env.MEDIA_SIGNING_SECRET) throw problem("MEDIA_SIGNING_SECRET_NOT_CONFIGURED", 503);
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  const path = `/media/${encodedKey}`;
  const sig = await hmacHex(env.MEDIA_SIGNING_SECRET, `${path}\n${expires}`);
  const origin = new URL(requestUrl).origin;
  return `${origin}${path}?expires=${expires}&sig=${sig}`;
}

async function serveSignedMedia(request, env) {
  const url = new URL(request.url);
  const expires = Number(url.searchParams.get("expires"));
  const sig = url.searchParams.get("sig") || "";
  if (!Number.isFinite(expires) || expires < Math.floor(Date.now() / 1000)) throw problem("MEDIA_URL_EXPIRED", 403);
  const expected = await hmacHex(env.MEDIA_SIGNING_SECRET, `${url.pathname}\n${expires}`);
  if (!constantTimeEqual(sig, expected)) throw problem("INVALID_MEDIA_SIGNATURE", 403);
  const key = url.pathname.slice("/media/".length).split("/").map(decodeURIComponent).join("/");
  const object = await env.MEDIA_BUCKET.get(key);
  if (!object || object.customMetadata?.approved !== "true") throw problem("MEDIA_NOT_FOUND", 404);
  return new Response(object.body, {
    headers: {
      "content-type": object.httpMetadata?.contentType || "application/octet-stream",
      "cache-control": "private, max-age=300",
      "x-content-type-options": "nosniff",
    },
  });
}

async function hmacHex(secret, value) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
  return [...signature].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function toBase64(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

const MCP_SCOPES = ["trioland:read", "trioland:publish"];
const MCP_STATE_COOKIE = "__Host-TRIOLAND_GITHUB_STATE";
const MCP_CSRF_COOKIE = "__Host-TRIOLAND_MCP_CSRF";

function createTriolandMcpServer(env) {
  const server = new McpServer({
    name: "Trioland Social Publisher",
    version: "0.2.0",
  });

  server.registerTool(
    "get_trioland_status",
    {
      description: "トリオランド専用投稿基盤の接続状態を確認します。秘密値は返しません。",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async (context) => {
      requireMcpUser(context, "trioland:read", env);
      return mcpJson({
        ok: true,
        hoshiluIsolated: true,
        metaConfigured: Boolean(env.META_APP_ID && env.META_APP_SECRET),
        instagramConnected: Boolean(await env.AUTH_KV.get("instagram-token")),
        encryptionConfigured: Boolean(env.TOKEN_ENCRYPTION_KEY),
        mediaSigningConfigured: Boolean(env.MEDIA_SIGNING_SECRET),
      });
    },
  );

  server.registerTool(
    "get_instagram_account",
    {
      description: "接続済みInstagramプロアカウントの公開プロフィール情報を取得します。",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (context) => {
      requireMcpUser(context, "trioland:read", env);
      return mcpCall(() => accountInfo(env));
    },
  );

  server.registerTool(
    "start_instagram_connection",
    {
      description: "Instagram公式APIの初回接続URLを作成します。URLは大久津さん本人がブラウザで開きます。",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async (context) => {
      requireMcpUser(context, "trioland:publish", env);
      return mcpJson({
        authorizationUrl: await createInstagramAuthorizationUrl(env, publicOrigin(env)),
        redirectUri: `${publicOrigin(env)}/oauth/callback`,
      });
    },
  );

  server.registerTool(
    "list_approved_media",
    {
      description: "公開承認済みとして専用R2に保存された画像・動画を一覧表示します。",
      inputSchema: { limit: z.number().int().min(1).max(100).optional() },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ limit = 25 }, context) => {
      requireMcpUser(context, "trioland:read", env);
      const objects = await env.MEDIA_BUCKET.list({ prefix: "approved/", limit });
      return mcpJson({
        objects: objects.objects.map((object) => ({
          key: object.key,
          size: object.size,
          uploaded: object.uploaded,
          contentType: object.httpMetadata?.contentType || null,
        })),
        truncated: objects.truncated,
      });
    },
  );

  server.registerTool(
    "import_approved_media",
    {
      description: "承認済みのHTTPS画像・動画をトリオランド専用R2へ取り込みます。approved=trueが必須です。",
      inputSchema: {
        sourceUrl: z.string().url(),
        originalName: z.string().min(1).max(180),
        approved: z.literal(true),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async (input, context) => {
      requireMcpUser(context, "trioland:publish", env);
      return mcpJson(await importApprovedMediaFromUrl(env, input));
    },
  );

  server.registerTool(
    "publish_approved_media",
    {
      description: "承認済みR2素材をInstagramへ公開します。実際に外部公開するため、ユーザーの明示承認後だけ呼び出してください。",
      inputSchema: {
        objectKey: z.string().startsWith("approved/"),
        mediaType: z.enum(["IMAGE", "REELS"]),
        caption: z.string().max(2200),
        approved: z.literal(true),
        shareToFeed: z.boolean().optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
    },
    async (input, context) => {
      requireMcpUser(context, "trioland:publish", env);
      const request = new Request(`${publicOrigin(env)}/publish`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      return mcpCall(() => publishApprovedMedia(request, env));
    },
  );

  server.registerTool(
    "refresh_instagram_token",
    {
      description: "接続済みInstagram長期アクセストークンを更新します。",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async (context) => {
      requireMcpUser(context, "trioland:publish", env);
      return mcpCall(() => refreshToken(env));
    },
  );

  return server;
}

function requireMcpUser(context, scope, env) {
  const auth = getMcpAuthContext();
  const login = String(auth?.props?.githubLogin || "").toLowerCase();
  const allowed = String(env.ALLOWED_GITHUB_LOGIN || "t-ooku").toLowerCase();
  if (!login || login !== allowed) throw problem("MCP_USER_NOT_AUTHORIZED", 403);
  const scopes = context?.http?.authInfo?.scopes || [];
  if (!scopes.includes(scope)) throw problem(`MCP_SCOPE_REQUIRED:${scope}`, 403);
}

function mcpJson(value) {
  return { content: [{ type: "text", text: JSON.stringify(value) }] };
}

async function mcpCall(operation) {
  try {
    const response = await operation();
    const body = await response.json();
    return response.ok ? mcpJson(body) : { ...mcpJson(body), isError: true };
  } catch (error) {
    return { ...mcpJson({ error: error?.message || "INTERNAL_ERROR" }), isError: true };
  }
}

async function importApprovedMediaFromUrl(env, input) {
  if (input.approved !== true) throw problem("MEDIA_NOT_APPROVED", 409);
  const source = new URL(input.sourceUrl);
  if (source.protocol !== "https:") throw problem("HTTPS_SOURCE_URL_REQUIRED", 400);
  const response = await fetch(source, { redirect: "follow" });
  if (!response.ok || !response.body) throw problem(`MEDIA_DOWNLOAD_FAILED:${response.status}`, 502);
  const contentType = (response.headers.get("content-type") || "").split(";", 1)[0].toLowerCase();
  const allowed = new Set(["image/jpeg", "image/png", "video/mp4", "video/quicktime"]);
  if (!allowed.has(contentType)) throw problem("UNSUPPORTED_MEDIA_TYPE", 415);
  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > 250 * 1024 * 1024) throw problem("MEDIA_TOO_LARGE", 413);
  const ext = contentType === "image/png" ? "png" : contentType.startsWith("video/") ? "mp4" : "jpg";
  const key = `approved/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
  await env.MEDIA_BUCKET.put(key, response.body, {
    httpMetadata: { contentType, cacheControl: "private, max-age=0" },
    customMetadata: {
      approved: "true",
      originalName: input.originalName.slice(0, 180),
      sourceHost: source.hostname.slice(0, 120),
    },
  });
  return { imported: true, key, contentType, approved: true };
}

function publicOrigin(env) {
  const value = String(env.PUBLIC_BASE_URL || "").replace(/\/$/, "");
  if (!value.startsWith("https://")) throw problem("PUBLIC_BASE_URL_NOT_CONFIGURED", 503);
  return value;
}

const mcpApiHandler = {
  fetch(request, env, ctx) {
    return createMcpHandler(() => createTriolandMcpServer(env), { route: "/mcp" })(request, env, ctx);
  },
};

const defaultHandler = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/authorize") return handleMcpAuthorize(request, env);
      if (url.pathname === "/github/callback") return handleGithubCallback(request, env);
      return appHandler.fetch(request, env, ctx);
    } catch (error) {
      const status = Number(error?.status || 500);
      return json({ error: error?.message || "INTERNAL_ERROR" }, status);
    }
  },
};

async function handleMcpAuthorize(request, env) {
  assertGithubConfig(env);
  let oauthRequest;
  try {
    oauthRequest = await env.OAUTH_PROVIDER.parseAuthRequest(request);
  } catch (error) {
    if (!(error instanceof AuthorizationError)) throw error;
    return authorizationErrorResponse(error);
  }
  const client = await env.OAUTH_PROVIDER.lookupClient(oauthRequest.clientId);
  if (!client) throw problem("UNKNOWN_OAUTH_CLIENT", 400);

  if (request.method === "GET") {
    const csrf = crypto.randomUUID();
    return new Response(renderConsentPage({
      clientName: client.clientName || "ChatGPT",
      scopes: oauthRequest.scope,
      csrf,
      action: `/authorize?${new URL(request.url).searchParams.toString()}`,
    }), {
      headers: securityHeaders(`${MCP_CSRF_COOKIE}=${encodeURIComponent(csrf)}; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=600`),
    });
  }

  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: { allow: "GET, POST" } });
  const form = await request.formData();
  const csrfForm = String(form.get("csrf") || "");
  const csrfCookie = readCookie(request, MCP_CSRF_COOKIE);
  if (!csrfForm || !csrfCookie || !constantTimeEqual(csrfForm, csrfCookie)) throw problem("CSRF_VALIDATION_FAILED", 400);
  if (form.get("decision") !== "approve") throw problem("AUTHORIZATION_NOT_APPROVED", 403);

  const state = crypto.randomUUID();
  await env.AUTH_KV.put(`mcp-github-state:${state}`, JSON.stringify(oauthRequest), { expirationTtl: 600 });
  const github = new URL("https://github.com/login/oauth/authorize");
  github.search = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: `${publicOrigin(env)}/github/callback`,
    scope: "read:user",
    state,
  });
  return new Response(null, {
    status: 302,
    headers: {
      location: github.toString(),
      "set-cookie": `${MCP_STATE_COOKIE}=${encodeURIComponent(state)}; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=600`,
      "cache-control": "no-store",
    },
  });
}

async function handleGithubCallback(request, env) {
  assertGithubConfig(env);
  const url = new URL(request.url);
  const code = url.searchParams.get("code") || "";
  const state = url.searchParams.get("state") || "";
  const cookieState = readCookie(request, MCP_STATE_COOKIE);
  if (!code || !state || !cookieState || !constantTimeEqual(state, cookieState)) throw problem("INVALID_GITHUB_OAUTH_STATE", 401);
  const stateKey = `mcp-github-state:${state}`;
  const rawRequest = await env.AUTH_KV.get(stateKey);
  if (!rawRequest) throw problem("EXPIRED_GITHUB_OAUTH_STATE", 401);
  await env.AUTH_KV.delete(stateKey);

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json", "user-agent": "trioland-social-publisher" },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${publicOrigin(env)}/github/callback`,
    }),
  });
  const tokenBody = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || !tokenBody.access_token) throw problem("GITHUB_TOKEN_EXCHANGE_FAILED", 502);
  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${tokenBody.access_token}`,
      "user-agent": "trioland-social-publisher",
      "x-github-api-version": "2022-11-28",
    },
  });
  const user = await userResponse.json().catch(() => ({}));
  if (!userResponse.ok || !user.login || !user.id) throw problem("GITHUB_PROFILE_FETCH_FAILED", 502);
  const allowed = String(env.ALLOWED_GITHUB_LOGIN || "t-ooku").toLowerCase();
  if (String(user.login).toLowerCase() !== allowed) throw problem("GITHUB_USER_NOT_AUTHORIZED", 403);

  const oauthRequest = JSON.parse(rawRequest);
  const client = await env.OAUTH_PROVIDER.lookupClient(oauthRequest.clientId);
  const grantedScopes = oauthRequest.scope.filter((scope) => MCP_SCOPES.includes(scope));
  const { redirectTo } = await env.OAUTH_PROVIDER.completeAuthorization({
    request: oauthRequest,
    userId: `github:${user.id}`,
    scope: grantedScopes,
    metadata: { clientName: client?.clientName || "ChatGPT", githubLogin: user.login },
    props: { githubLogin: user.login, githubId: String(user.id), role: "owner" },
  });
  return new Response(null, {
    status: 302,
    headers: {
      location: redirectTo,
      "set-cookie": `${MCP_STATE_COOKIE}=; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=0`,
      "cache-control": "no-store",
    },
  });
}

function assertGithubConfig(env) {
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) throw problem("GITHUB_OAUTH_NOT_CONFIGURED", 503);
}

function authorizationErrorResponse(error) {
  if (!error.redirectUri) return new Response(error.description || error.message, { status: 400 });
  const redirect = new URL(error.redirectUri);
  redirect.searchParams.set("error", error.code);
  redirect.searchParams.set("error_description", error.description || error.message);
  if (error.state) redirect.searchParams.set("state", error.state);
  if (error.issuer) redirect.searchParams.set("iss", error.issuer);
  return Response.redirect(redirect, 302);
}

function renderConsentPage({ clientName, scopes, csrf, action }) {
  return `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>トリオランド投稿連携</title><style>body{font-family:system-ui,sans-serif;background:#f6f7fb;margin:0;padding:32px;color:#202124}.card{max-width:520px;margin:auto;background:white;border-radius:18px;padding:28px;box-shadow:0 8px 28px #0001}h1{font-size:24px}.note{background:#eef6ff;padding:14px;border-radius:10px}button{width:100%;padding:14px;border:0;border-radius:10px;background:#1769e0;color:white;font-weight:700;font-size:16px}code{word-break:break-all}</style></head>
<body><main class="card"><h1>トリオランド投稿連携</h1><p><strong>${escapeHtml(clientName)}</strong> が、トリオランド専用投稿ツールへの接続を求めています。</p><p class="note">HOSHILUのデータ・ドメイン・投稿設定には接続しません。Instagram公開は承認済み素材だけが対象です。</p><p>要求権限: <code>${escapeHtml(scopes.join(", ") || "なし")}</code></p><form method="post" action="${escapeHtml(action)}"><input type="hidden" name="csrf" value="${escapeHtml(csrf)}"><button type="submit" name="decision" value="approve">GitHubで本人確認して接続</button></form></main></body></html>`;
}

function securityHeaders(setCookie) {
  return {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store",
    "set-cookie": setCookie,
    "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
    "x-frame-options": "DENY",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
  };
}

function readCookie(request, name) {
  const match = (request.headers.get("cookie") || "").split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : "";
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
}

export default new OAuthProvider({
  apiRoute: "/mcp",
  apiHandler: mcpApiHandler,
  defaultHandler,
  authorizeEndpoint: "/authorize",
  tokenEndpoint: "/oauth/token",
  clientRegistrationEndpoint: "/oauth/register",
  scopesSupported: MCP_SCOPES,
});
