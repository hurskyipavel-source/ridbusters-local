const encoder = new TextEncoder();

export const SESSION_COOKIE = "AUTH_SESSION";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

type SessionPayload = {
  exp: number;
};

function getAuthSecret() {
  const secret = (process.env.AUTH_SECRET || "").trim();
  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }
  return secret;
}

function getAccessPassword() {
  const password = (process.env.ACCESS_PASSWORD || "").trim();
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
    ["sign"]
  );
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;

  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return mismatch === 0;
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
  if (!token || typeof token !== "string") return false;

  const dot = token.lastIndexOf(".");
  if (dot <= 0 || dot === token.length - 1) return false;

  const payloadString = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  if (!payloadString || !signature) return false;
  if (!/^[0-9a-f]+$/i.test(signature)) return false;

  try {
    const expectedSignature = await signValue(payloadString);

    if (!timingSafeEqual(signature, expectedSignature)) {
      return false;
    }

    const payload = JSON.parse(
      decodeURIComponent(payloadString)
    ) as SessionPayload;

    if (!payload || typeof payload.exp !== "number") {
      return false;
    }

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
  try {
    const expected = getAccessPassword();
    const normalizedInput = String(input || "").trim();
    return timingSafeEqual(normalizedInput, expected);
  } catch {
    return false;
  }
}