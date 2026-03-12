import OpenAI from "openai"
import { NextResponse } from "next/server"
import { AVATARS, type AvatarId } from "@/app/lib/avatars"
import {
  buildLoreInstructionBlock,
  getAvatarPrompt,
  getRidbustersCorePrompt,
  getSpoilerPrompt,
  type AvatarKey,
} from "@/app/lib/ridbusters-prompts"
import {
  detectLanguage,
  detectSpoilerMode,
  retrieveRelevantLore,
  type ChatMsg,
} from "@/app/lib/ridbusters-retrieval"
import { getRidbustersSafetyBlock } from "@/app/lib/ridbusters-safety"

export const runtime = "nodejs"

type Msg = {
  role: "user" | "assistant"
  content: string
}

type IncomingBody = {
  avatarId?: string
  messages?: Msg[]
  memorySummary?: string
}

type RateEntry = {
  count: number
  resetAt: number
}

const OPENAI_MODEL = (process.env.OPENAI_MODEL || "gpt-5-mini").trim()
const OPENAI_API_KEY = (process.env.OPENAI_API_KEY || "").trim()
const APP_BASE_URL = (process.env.APP_BASE_URL || "").trim()

const MAX_MESSAGES = 16
const MAX_MESSAGE_LEN = 500
const MAX_TOTAL_CHARS = 5000
const MAX_MEMORY_SUMMARY_LEN = 900

const RATE_WINDOW_MS = 60_000
const RATE_MAX = 18

const rateStore = new Map<string, RateEntry>()

const client = new OpenAI({
  apiKey: OPENAI_API_KEY,
  timeout: 20_000,
})

export async function POST(req: Request) {
  try {
    if (!isJsonRequest(req)) {
      return jsonError("Unsupported content type.", 415)
    }

    const originCheck = checkOrigin(req)
    if (!originCheck.ok) {
      return jsonError("Forbidden origin.", 403)
    }

    const clientIp = getClientIp(req)
    if (!checkRateLimit(clientIp)) {
      return jsonError("Too many requests. Please slow down.", 429)
    }

    const body = await safeReadJson(req)
    if (!body.ok) {
      return jsonError(body.message, body.status)
    }

    const payload = body.data as IncomingBody

    const avatarId = normalizeAvatarId(payload?.avatarId)
    if (!avatarId) {
      return jsonError("Invalid avatar.", 400)
    }

    const avatar = AVATARS[avatarId]
    if (!avatar) {
      return jsonError("Avatar not found.", 400)
    }

    const messagesResult = validateMessages(payload?.messages)
    if (!messagesResult.ok) {
      return jsonError(messagesResult.message, 400)
    }

    if (!OPENAI_API_KEY) {
      return jsonError("Server configuration error: OPENAI_API_KEY is missing.", 500)
    }

    const messages = trimMessages(messagesResult.messages, MAX_MESSAGES)
    const latestUserMessage =
      [...messages].reverse().find((m) => m.role === "user")?.content || ""

    if (!latestUserMessage) {
      return jsonError("No user message provided.", 400)
    }

    const memorySummary = sanitizeMemorySummary(payload?.memorySummary)
    const systemPrompt = buildEnhancedSystemPrompt(
      avatarId,
      avatar.name,
      messages,
      memorySummary
    )

    const completion = await client.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ],
      max_completion_tokens: 140,
      store: false,
    })

    const reply = extractAssistantText(completion)

    if (!reply || reply === "(empty reply)") {
      return jsonError("The model returned an empty response.", 502)
    }

    return withNoStore(
      NextResponse.json(
        { reply },
        {
          status: 200,
          headers: apiSecurityHeaders(),
        }
      )
    )
  } catch (error: unknown) {
    console.error("Chat route error:", error)

    const err = error as { status?: number; name?: string }

    const status =
      typeof err?.status === "number" && err.status >= 400
        ? err.status
        : 500

    if (status === 401) {
      return jsonError("OpenAI authentication failed. Check OPENAI_API_KEY.", 401)
    }

    if (status === 429) {
      return jsonError("OpenAI rate limit reached. Please try again shortly.", 429)
    }

    if (err?.name === "AbortError") {
      return jsonError("The request timed out. Please try again.", 504)
    }

    return jsonError("Internal server error.", 500)
  }
}

export async function OPTIONS(req: Request) {
  const origin = getAllowedCorsOrigin(req)

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
  )
}

function isJsonRequest(req: Request) {
  const ct = req.headers.get("content-type") || ""
  return ct.toLowerCase().includes("application/json")
}

function getClientIp(req: Request) {
  const xff = req.headers.get("x-forwarded-for")
  if (xff) {
    return xff.split(",")[0].trim()
  }

  const realIp = req.headers.get("x-real-ip")
  if (realIp) {
    return realIp.trim()
  }

  return "unknown"
}

function checkRateLimit(key: string) {
  const now = Date.now()
  cleanupRateStore(now)

  const found = rateStore.get(key)

  if (!found || now >= found.resetAt) {
    rateStore.set(key, {
      count: 1,
      resetAt: now + RATE_WINDOW_MS,
    })
    return true
  }

  if (found.count >= RATE_MAX) {
    return false
  }

  found.count += 1
  return true
}

function cleanupRateStore(now: number) {
  for (const [key, value] of rateStore.entries()) {
    if (now >= value.resetAt) {
      rateStore.delete(key)
    }
  }
}

function checkOrigin(req: Request): { ok: true } | { ok: false } {
  const origin = (req.headers.get("origin") || "").trim()
  const host = (req.headers.get("host") || "").trim()

  const allowedOrigins = new Set<string>()

  if (APP_BASE_URL) {
    allowedOrigins.add(stripTrailingSlash(APP_BASE_URL))
  }

  if (host) {
    allowedOrigins.add(`https://${host}`)
    allowedOrigins.add(`http://${host}`)
  }

  allowedOrigins.add("http://localhost:3000")
  allowedOrigins.add("http://127.0.0.1:3000")

  if (!origin) {
    return { ok: true }
  }

  if (!allowedOrigins.has(stripTrailingSlash(origin))) {
    return { ok: false }
  }

  return { ok: true }
}

function getAllowedCorsOrigin(req: Request) {
  const origin = (req.headers.get("origin") || "").trim()
  const host = (req.headers.get("host") || "").trim()

  const allowedOrigins = new Set<string>()

  if (APP_BASE_URL) {
    allowedOrigins.add(stripTrailingSlash(APP_BASE_URL))
  }

  if (host) {
    allowedOrigins.add(`https://${host}`)
    allowedOrigins.add(`http://${host}`)
  }

  allowedOrigins.add("http://localhost:3000")
  allowedOrigins.add("http://127.0.0.1:3000")

  const normalizedOrigin = stripTrailingSlash(origin)

  if (normalizedOrigin && allowedOrigins.has(normalizedOrigin)) {
    return normalizedOrigin
  }

  if (APP_BASE_URL) {
    return stripTrailingSlash(APP_BASE_URL)
  }

  if (host) {
    return `https://${host}`
  }

  return "http://localhost:3000"
}

async function safeReadJson(
  req: Request
): Promise<
  | { ok: true; data: unknown }
  | { ok: false; message: string; status: number }
> {
  try {
    const text = await req.text()

    if (!text || !text.trim()) {
      return { ok: false, message: "Empty request body.", status: 400 }
    }

    if (text.length > 100_000) {
      return { ok: false, message: "Request body too large.", status: 413 }
    }

    const data = JSON.parse(text) as unknown
    return { ok: true, data }
  } catch {
    return { ok: false, message: "Invalid JSON body.", status: 400 }
  }
}

function normalizeAvatarId(value: unknown): AvatarId | null {
  const v = String(value ?? "").toLowerCase().trim()

  if (v === "maya" || v === "ryan" || v === "ella") {
    return v
  }

  return null
}

function validateMessages(
  input: unknown
): { ok: true; messages: Msg[] } | { ok: false; message: string } {
  if (!Array.isArray(input)) {
    return { ok: false, message: "Messages must be an array." }
  }

  if (input.length > 100) {
    return { ok: false, message: "Too many messages." }
  }

  const messages: Msg[] = []
  let totalChars = 0

  for (const raw of input) {
    if (!raw || typeof raw !== "object") {
      return { ok: false, message: "Invalid message format." }
    }

    const maybeRole = (raw as { role?: unknown }).role
    const maybeContent = (raw as { content?: unknown }).content

    if (maybeRole !== "user" && maybeRole !== "assistant") {
      return { ok: false, message: "Invalid message role." }
    }

    if (typeof maybeContent !== "string") {
      return { ok: false, message: "Invalid message content." }
    }

    const content = normalizeUserText(maybeContent)

    if (!content) {
      continue
    }

    if (content.length > MAX_MESSAGE_LEN) {
      return {
        ok: false,
        message: `Each message must be at most ${MAX_MESSAGE_LEN} characters.`,
      }
    }

    totalChars += content.length

    if (totalChars > MAX_TOTAL_CHARS) {
      return {
        ok: false,
        message: "Conversation is too long.",
      }
    }

    messages.push({ role: maybeRole, content })
  }

  return { ok: true, messages }
}

function sanitizeMemorySummary(value: unknown) {
  if (typeof value !== "string") return ""
  return value.replace(/\s+/g, " ").trim().slice(0, MAX_MEMORY_SUMMARY_LEN)
}

function normalizeUserText(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function trimMessages(messages: Msg[], max: number) {
  if (!Array.isArray(messages)) return []
  if (messages.length <= max) return messages
  return messages.slice(messages.length - max)
}

function extractAssistantText(completion: unknown): string {
  const content = (
    completion as {
      choices?: Array<{
        message?: {
          content?: unknown
        }
      }>
    }
  )?.choices?.[0]?.message?.content

  if (typeof content === "string") {
    return normalizeReply(content)
  }

  if (Array.isArray(content)) {
    const joined = content
      .map((part) => {
        if (typeof part === "string") return part

        if (part && typeof part === "object") {
          const maybeText = (part as { text?: unknown }).text
          if (typeof maybeText === "string") return maybeText
        }

        return ""
      })
      .join("")

    return normalizeReply(joined)
  }

  return "(empty reply)"
}

function normalizeReply(reply: string) {
  let cleaned = reply.replace(/\s+\n/g, "\n").trim()

  cleaned = cleaned
    .replace(/^\(([^)]{0,120})\)\s*/g, "")
    .replace(/^\*([^*]{0,120})\*\s*/g, "")
    .replace(/^\[([^\]]{0,120})\]\s*/g, "")
    .trim()

  if (!cleaned) return "(empty reply)"
  return cleaned.slice(0, 900)
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
  )
}

function withNoStore(res: NextResponse) {
  res.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  )
  res.headers.set("Pragma", "no-cache")
  res.headers.set("Expires", "0")
  return res
}

function apiSecurityHeaders() {
  return {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  }
}

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "")
}

function toAvatarKey(avatarId: AvatarId): AvatarKey {
  if (avatarId === "maya") return "maya"
  if (avatarId === "ryan") return "ryan"
  return "ella"
}

function toChatMsgs(messages: Msg[]): ChatMsg[] {
  return messages.map((m) => ({
    role: m.role,
    content: m.content,
  }))
}

function buildEnhancedSystemPrompt(
  avatarId: AvatarId,
  avatarName: string,
  messages: Msg[],
  memorySummary: string
) {
  const avatarKey = toAvatarKey(avatarId)
  const chatMsgs = toChatMsgs(messages)
  const latestUserMessage =
    [...messages].reverse().find((m) => m.role === "user")?.content || ""

  const spoilerMode = detectSpoilerMode(latestUserMessage)
  const language = detectLanguage(latestUserMessage)
  const loreChunks = retrieveRelevantLore(
    avatarKey,
    latestUserMessage,
    spoilerMode
  )

  const memoryBlock = memorySummary
    ? `Conversation memory summary:\n${memorySummary}`
    : "Conversation memory summary:\nNo prior summary available."

  return [
    getRidbustersCorePrompt(),
    getRidbustersSafetyBlock(),
    buildLegacyStyleBlock(avatarId, avatarName),
    getAvatarPrompt(avatarKey),
    getSpoilerPrompt(spoilerMode),
    `Language rule: ${language.instruction}`,
    memoryBlock,
    buildLoreInstructionBlock(loreChunks),
  ].join("\n\n")
}

function buildLegacyStyleBlock(avatarId: AvatarId, avatarName: string) {
  const base = [
    `You are ${avatarName}, a teen character from the Ridbusters universe.`,
    "Setting: London. Genre: teen mystery, detective adventure, hidden clues.",
    "Stay natural and conversational.",
    "Keep replies short by default.",
    "Do not invent technical or historical details that are not in the canon block or memory summary.",
    "If the user asks for a detail you do not know, admit uncertainty naturally.",
  ].join("\n")

  if (avatarId === "maya") {
    return [
      base,
      "",
      "Character profile: Maya Valdes, 13.",
      "Calm, brave, observant, leader-like.",
    ].join("\n")
  }

  if (avatarId === "ryan") {
    return [
      base,
      "",
      "Character profile: Ryan Patel, 12.",
      "Logical, practical, clue-focused, strong on mechanisms and dates.",
    ].join("\n")
  }

  return [
    base,
    "",
    "Character profile: Ella Fox, 12.",
    "Energetic, vivid, emotionally honest, adventurous.",
  ].join("\n")
}