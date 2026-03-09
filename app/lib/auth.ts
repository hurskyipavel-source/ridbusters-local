const encoder = new TextEncoder();

export const SESSION_COOKIE = "AUTH_SESSION";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

type SessionPayload = {
  exp: number;
};

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }
  return secret;
}

function getAccessPassword() {
  const password = process.env.ACCESS_PASSWORD;
  if (!password) {
    throw new Error("ACCESS_PASSWORD is not set");
  }
  return password;
}

async function importKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function signValue(value: string) {
  const key = await importKey(getAuthSecret());
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return toHex(sig);
}

export async function createSessionToken() {
  const payload: SessionPayload = {
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };

  const payloadString = encodeURIComponent(JSON.stringify(payload));
  const signature = await signValue(payloadString);

  return `${payloadString}.${signature}`;
}

export async function verifySessionToken(token: string | undefined) {
  if (!token) return false;

  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;

  const payloadString = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  const expectedSignature = await signValue(payloadString);
  if (signature !== expectedSignature) return false;

  try {
    const payload = JSON.parse(decodeURIComponent(payloadString)) as SessionPayload;
    if (!payload?.exp) return false;

    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  } catch {
    return false;
  }
}

export function getSessionMaxAge() {
  return SESSION_TTL_SECONDS;
}

export function isValidPassword(input: string) {
  return input === getAccessPassword();
}