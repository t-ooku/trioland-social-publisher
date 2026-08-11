const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

export default {
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
  const redirectUri = `${new URL(request.url).origin}/oauth/callback`;
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
  return json({ authorizationUrl: `https://www.instagram.com/oauth/authorize?${params}` });
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
