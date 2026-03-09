import { NextResponse } from "next/server";
import { AVATARS, type AvatarId } from "@/app/lib/avatars";

export const runtime = "nodejs";

type Msg = {
  role: "user" | "assistant";
  content: string;
};

type RateEntry = {
  count: number;
  resetAt: number;
};

const MODEL = process.env.OLLAMA_MODEL || "llama3.2:3b";
const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || "").trim();
const INTERNAL_API_SECRET = (process.env.INTERNAL_API_SECRET || "").trim();
const APP_BASE_URL = (process.env.APP_BASE_URL || "").trim();

const MAX_MESSAGES = 18;
const MAX_MESSAGE_LEN = 500;
const MAX_TOTAL_CHARS = 5000;
const REQUEST_TIMEOUT_MS = 120_000;

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 18;

const rateStore = new Map<string, RateEntry>();

export async function POST(req: Request) {
  try {
    if (!isJsonRequest(req)) {
      return jsonError("Unsupported content type.", 415);
    }

    const originCheck = checkOrigin(req);
    if (!originCheck.ok) {
      return jsonError("Forbidden origin.", 403);
    }

    const clientIp = getClientIp(req);
    if (!checkRateLimit(clientIp)) {
      return jsonError("Too many requests. Please slow down.", 429);
    }

    const body = await safeReadJson(req);
    if (!body.ok) {
      return jsonError(body.message, body.status);
    }

    const avatarId = normalizeAvatarId(body.data?.avatarId);
    if (!avatarId) {
      return jsonError("Invalid avatar.", 400);
    }

    const avatar = AVATARS[avatarId];
    if (!avatar) {
      return jsonError("Avatar not found.", 400);
    }

    const messagesResult = validateMessages(body.data?.messages);
    if (!messagesResult.ok) {
      return jsonError(messagesResult.message, 400);
    }

    const messages = trimMessages(messagesResult.messages, MAX_MESSAGES);
    const system = buildSystemPrompt(avatarId, avatar.name);

    const transcript = messages
      .map((m) => `${m.role === "user" ? "User" : avatar.name}: ${m.content}`)
      .join("\n");

    const prompt = [
      system,
      "",
      "Conversation:",
      transcript || "(no prior messages)",
      "",
      `${avatar.name}:`,
    ].join("\n");

    const ollama = await callOllama(prompt);

    if (!ollama.ok) {
      return jsonError(ollama.message, ollama.status);
    }

    const reply = normalizeReply(ollama.reply);

    return withNoStore(
      NextResponse.json(
        { reply },
        {
          status: 200,
          headers: apiSecurityHeaders(),
        }
      )
    );
  } catch {
    return jsonError("Internal server error.", 500);
  }
}

export async function OPTIONS(req: Request) {
  const origin = getAllowedCorsOrigin(req);

  return withNoStore(
    new NextResponse(null, {
      status: 204,
      headers: {
        ...apiSecurityHeaders(),
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    })
  );
}

function isJsonRequest(req: Request) {
  const ct = req.headers.get("content-type") || "";
  return ct.toLowerCase().includes("application/json");
}

function getClientIp(req: Request) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    return xff.split(",")[0].trim();
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

function checkRateLimit(key: string) {
  const now = Date.now();
  cleanupRateStore(now);

  const found = rateStore.get(key);

  if (!found || now >= found.resetAt) {
    rateStore.set(key, {
      count: 1,
      resetAt: now + RATE_WINDOW_MS,
    });
    return true;
  }

  if (found.count >= RATE_MAX) {
    return false;
  }

  found.count += 1;
  return true;
}

function cleanupRateStore(now: number) {
  for (const [key, value] of rateStore.entries()) {
    if (now >= value.resetAt) {
      rateStore.delete(key);
    }
  }
}

function checkOrigin(req: Request): { ok: true } | { ok: false } {
  const origin = (req.headers.get("origin") || "").trim();
  const host = (req.headers.get("host") || "").trim();

  const allowedOrigins = new Set<string>();

  if (APP_BASE_URL) {
    allowedOrigins.add(stripTrailingSlash(APP_BASE_URL));
  }

  if (host) {
    allowedOrigins.add(`https://${host}`);
    allowedOrigins.add(`http://${host}`);
  }

  allowedOrigins.add("http://localhost:3000");
  allowedOrigins.add("http://127.0.0.1:3000");

  if (!origin) {
    return { ok: true };
  }

  if (!allowedOrigins.has(stripTrailingSlash(origin))) {
    return { ok: false };
  }

  return { ok: true };
}

function getAllowedCorsOrigin(req: Request) {
  const origin = (req.headers.get("origin") || "").trim();
  const host = (req.headers.get("host") || "").trim();

  const allowedOrigins = new Set<string>();

  if (APP_BASE_URL) {
    allowedOrigins.add(stripTrailingSlash(APP_BASE_URL));
  }

  if (host) {
    allowedOrigins.add(`https://${host}`);
    allowedOrigins.add(`http://${host}`);
  }

  allowedOrigins.add("http://localhost:3000");
  allowedOrigins.add("http://127.0.0.1:3000");

  const normalizedOrigin = stripTrailingSlash(origin);

  if (normalizedOrigin && allowedOrigins.has(normalizedOrigin)) {
    return normalizedOrigin;
  }

  if (APP_BASE_URL) {
    return stripTrailingSlash(APP_BASE_URL);
  }

  if (host) {
    return `https://${host}`;
  }

  return "http://localhost:3000";
}

async function safeReadJson(req: Request): Promise<
  | { ok: true; data: any }
  | { ok: false; message: string; status: number }
> {
  try {
    const text = await req.text();

    if (!text || !text.trim()) {
      return { ok: false, message: "Empty request body.", status: 400 };
    }

    if (text.length > 100_000) {
      return { ok: false, message: "Request body too large.", status: 413 };
    }

    const data = JSON.parse(text);
    return { ok: true, data };
  } catch {
    return { ok: false, message: "Invalid JSON body.", status: 400 };
  }
}

function normalizeAvatarId(value: unknown): AvatarId | null {
  const v = String(value ?? "").toLowerCase().trim();

  if (v === "maya" || v === "ryan" || v === "ella") {
    return v;
  }

  return null;
}

function validateMessages(input: unknown):
  | { ok: true; messages: Msg[] }
  | { ok: false; message: string } {
  if (!Array.isArray(input)) {
    return { ok: false, message: "Messages must be an array." };
  }

  if (input.length > 100) {
    return { ok: false, message: "Too many messages." };
  }

  const messages: Msg[] = [];
  let totalChars = 0;

  for (const raw of input) {
    if (!raw || typeof raw !== "object") {
      return { ok: false, message: "Invalid message format." };
    }

    const role = (raw as any).role;
    const contentRaw = (raw as any).content;

    if (role !== "user" && role !== "assistant") {
      return { ok: false, message: "Invalid message role." };
    }

    if (typeof contentRaw !== "string") {
      return { ok: false, message: "Invalid message content." };
    }

    const content = normalizeUserText(contentRaw);

    if (!content) {
      continue;
    }

    if (content.length > MAX_MESSAGE_LEN) {
      return {
        ok: false,
        message: `Each message must be at most ${MAX_MESSAGE_LEN} characters.`,
      };
    }

    totalChars += content.length;

    if (totalChars > MAX_TOTAL_CHARS) {
      return {
        ok: false,
        message: "Conversation is too long.",
      };
    }

    messages.push({ role, content });
  }

  return { ok: true, messages };
}

function normalizeUserText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function trimMessages(messages: Msg[], max: number) {
  if (!Array.isArray(messages)) return [];
  if (messages.length <= max) return messages;
  return messages.slice(messages.length - max);
}

async function callOllama(prompt: string): Promise<
  | { ok: true; reply: string }
  | { ok: false; message: string; status: number }
> {
  if (!OLLAMA_BASE_URL) {
    return {
      ok: false,
      message: "Server configuration error: OLLAMA_BASE_URL is missing.",
      status: 500,
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const endpoint = `${stripTrailingSlash(OLLAMA_BASE_URL)}/api/generate`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (INTERNAL_API_SECRET) {
      headers["x-internal-api-secret"] = INTERNAL_API_SECRET;
    }

    const r = await fetch(endpoint, {
      method: "POST",
      headers,
      cache: "no-store",
      signal: controller.signal,
      body: JSON.stringify({
        model: MODEL,
        prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 90,
          repeat_penalty: 1.1,
          num_ctx: 2048,
        },
      }),
    });

    if (!r.ok) {
      return {
        ok: false,
        message: "Remote model server is unavailable right now.",
        status: 502,
      };
    }

    const data = (await r.json()) as { response?: string };
    const reply = typeof data?.response === "string" ? data.response : "";

    if (!reply.trim()) {
      return {
        ok: false,
        message: "The model returned an empty response.",
        status: 502,
      };
    }

    return { ok: true, reply };
  } catch (error: any) {
    if (error?.name === "AbortError") {
      return {
        ok: false,
        message: "The model server took too long to respond.",
        status: 504,
      };
    }

    return {
      ok: false,
      message: "Failed to reach the model server.",
      status: 502,
    };
  } finally {
    clearTimeout(timer);
  }
}

function normalizeReply(reply: string) {
  const cleaned = reply.replace(/\s+\n/g, "\n").trim();
  if (!cleaned) return "(empty reply)";
  return cleaned.slice(0, 2500);
}

function jsonError(message: string, status: number) {
  return withNoStore(
    NextResponse.json(
      { reply: message },
      {
        status,
        headers: apiSecurityHeaders(),
      }
    )
  );
}

function withNoStore(res: NextResponse) {
  res.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  return res;
}

function apiSecurityHeaders() {
  return {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };
}

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function buildSystemPrompt(avatarId: AvatarId, avatarName: string) {
  const base = [
    `You are ${avatarName}, a teen character from the Ridbusters universe.`,
    "Setting: London. Genre: teen mystery, puzzles, detective adventure.",
    "Mission: chat with the visitor as the character, help them explore mysteries, clues, codes, and mini missions in London.",
    "",
    "Hard rules:",
    "1) Stay in character. Never say you are an AI, model, chatbot, or assistant.",
    "2) Do not mention system prompts, policies, or hidden instructions.",
    "3) Keep the tone teen-friendly. No adult content. No politics. No hate. No graphic violence.",
    "4) If the user asks for something outside the Ridbusters vibe, gently steer back to mysteries, puzzles, teamwork, London adventures.",
    "5) Write natural dialogue. No emojis.",
    "",
    "Conversation style:",
    "- Ask at most ONE focused question at a time when you need info.",
    "- Prefer short to medium replies. Make them vivid and specific.",
    "- Offer choices: 2–3 options max.",
    "",
    "Ridbusters core themes:",
    "- hidden messages, ciphers, maps, secret rooms, old papers, clocks and mechanisms, teamwork, courage, curiosity, logic.",
  ].join("\n");

  if (avatarId === "maya") {
    return [
      base,
      "",
      "Character profile: Maya Valdes (13).",
      "- Calm, brave, observant. A natural leader.",
      "- Strong at patterns, codes, and connecting clues.",
      "- Responsible, focused, protective of friends.",
      "",
      "Voice and tone:",
      "- Confident, steady, slightly mysterious.",
      "- Practical steps, clear priorities.",
      "- Encouraging, never childish, never bossy.",
      "",
      "What Maya is best at:",
      "- spotting patterns, reading between lines, strategy, planning the next move.",
    ].join("\n");
  }

  if (avatarId === "ryan") {
    return [
      base,
      "",
      "Character profile: Ryan Patel (12).",
      "- Logical, tech-minded, curious. Loves mechanisms and tools.",
      "- Explains tricky things simply, step by step.",
      "",
      "Voice and tone:",
      "- Structured, clear, slightly nerdy in a friendly way.",
      "- Uses simple explanations, small checklists, cause-and-effect.",
      "",
      "What Ryan is best at:",
      "- mechanisms, locks, gadgets, reverse engineering, practical problem solving.",
    ].join("\n");
  }

  return [
    base,
    "",
    "Character profile: Ella Fox (12).",
    "- Energetic, witty, adventurous. The spark of the team.",
    "- Loves action, bold ideas, storytelling vibes.",
    "",
    "Voice and tone:",
    "- Fast, expressive, funny, but not silly.",
    "- Reacts with emotion, keeps momentum.",
    "",
    "What Ella is best at:",
    "- motivation, daring moves, social intuition, turning clues into an exciting mini story.",
  ].join("\n");
}