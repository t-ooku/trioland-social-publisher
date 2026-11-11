// ステップアップ表のログイン（ID とパスワード）。本部・園長・指導役・新人が使う。
// - パスワードは PBKDF2-SHA256（Workers の上限 100,000 回）でハッシュにして保存。平文は保存しない。
// - セッションは HttpOnly・Secure・SameSite=Lax の Cookie。D1 にはトークンの SHA-256 だけを保存する。
// - 書き込みの API は、ログイン時に渡す csrf を x-step-csrf ヘッダーで送らないと受け付けない。
// - 同じ ID で 15 分に 8 回まちがえると、15 分ログインできない。

export const SESSION_COOKIE = "__Host-STEP_SESSION";
export const PBKDF2_ITERATIONS = 100000;
const SESSION_DAYS = 30;
const FAIL_LIMIT = 8;
const FAIL_WINDOW_MIN = 15;

function b64url(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(value) {
  const s = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i += 1) out[i] = s.charCodeAt(i);
  return out;
}

export function randomToken(bytes = 32) {
  return b64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

export async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** 仮パスワード：読み間違えやすい文字（0 O 1 l I など）を使わない 10 文字。英字と数字を必ずふくむ。 */
export function tempPassword() {
  const letters = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const all = letters + digits;
  const r = crypto.getRandomValues(new Uint8Array(20));
  const pick = (set, b) => set[b % set.length];
  const chars = [pick(letters, r[0]), pick(digits, r[1])];
  for (let i = 2; i < 10; i += 1) chars.push(pick(all, r[i]));
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = r[10 + (i % 10)] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

export async function hashPassword(password, saltB64 = null, iterations = PBKDF2_ITERATIONS) {
  const salt = saltB64 ? fromB64url(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
  return { hash: b64url(new Uint8Array(bits)), salt: b64url(salt), iterations };
}

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyPassword(password, user) {
  const { hash } = await hashPassword(password, user.pw_salt, Number(user.pw_iter) || PBKDF2_ITERATIONS);
  return safeEqual(hash, user.pw_hash);
}

export function readCookie(request, name) {
  const match = (request.headers.get("cookie") || "").split(";").map((p) => p.trim()).find((p) => p.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : "";
}

export function sessionCookie(token, maxAgeSec) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSec}`;
}

export function clearCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

/** ログイン失敗が多すぎるか。 */
export async function tooManyFailures(db, loginId) {
  const since = new Date(Date.now() - FAIL_WINDOW_MIN * 60000).toISOString();
  const row = await db.prepare("SELECT COUNT(*) AS n FROM login_failures WHERE login_id = ? AND at > ?").bind(loginId, since).first();
  return (row?.n || 0) >= FAIL_LIMIT;
}

export async function recordFailure(db, loginId) {
  await db.prepare("INSERT INTO login_failures (login_id, at) VALUES (?, ?)").bind(loginId, new Date().toISOString()).run();
  // 古い記録は消す
  const old = new Date(Date.now() - 24 * 3600000).toISOString();
  await db.prepare("DELETE FROM login_failures WHERE at < ?").bind(old).run();
}

export async function clearFailures(db, loginId) {
  await db.prepare("DELETE FROM login_failures WHERE login_id = ?").bind(loginId).run();
}

/** セッションを作り、Cookie に入れるトークンと csrf を返す。 */
export async function createSession(db, userId) {
  const token = randomToken(32);
  const csrf = randomToken(18);
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_DAYS * 86400000);
  await db.prepare("INSERT INTO sessions (token_hash, user_id, csrf, created_at, expires_at) VALUES (?, ?, ?, ?, ?)")
    .bind(await sha256Hex(token), userId, csrf, now.toISOString(), expires.toISOString()).run();
  return { token, csrf, maxAge: SESSION_DAYS * 86400 };
}

/** Cookie からログイン中の人を返す（いなければ null）。停止された ID は null。 */
export async function sessionUser(request, db) {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token || !/^[A-Za-z0-9_-]{40,50}$/.test(token)) return null;
  const tokenHash = await sha256Hex(token);
  const row = await db.prepare(
    "SELECT s.csrf, s.expires_at, u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?",
  ).bind(tokenHash).first();
  if (!row) return null;
  if (row.expires_at < new Date().toISOString() || row.disabled_at) {
    await db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(tokenHash).run();
    return null;
  }
  return { ...row, tokenHash };
}

export async function endSession(db, tokenHash) {
  if (tokenHash) await db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(tokenHash).run();
}

export async function endAllSessions(db, userId, exceptHash = null) {
  if (exceptHash) await db.prepare("DELETE FROM sessions WHERE user_id = ? AND token_hash <> ?").bind(userId, exceptHash).run();
  else await db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId).run();
}
