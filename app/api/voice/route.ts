import OpenAI from "openai"
import { NextResponse } from "next/server"
import type { AvatarId } from "@/app/lib/avatars"

export const runtime = "nodejs"

const OPENAI_API_KEY = (process.env.OPENAI_API_KEY || "").trim()

const client = new OpenAI({
  apiKey: OPENAI_API_KEY,
  timeout: 30_000,
})

type IncomingBody = {
  avatarId?: string
  text?: string
}

export async function POST(req: Request) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing." },
        { status: 500 }
      )
    }

    const body = (await req.json()) as IncomingBody
    const avatarId = normalizeAvatarId(body?.avatarId)
    const text = normalizeText(body?.text)

    if (!avatarId) {
      return NextResponse.json({ error: "Invalid avatar." }, { status: 400 })
    }

    if (!text) {
      return NextResponse.json({ error: "No text for voice." }, { status: 400 })
    }

    const cfg = getVoiceConfig(avatarId)

    const speech = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: cfg.voice,
      input: text.slice(0, 1100),
      instructions: cfg.instructions,
      response_format: "mp3",
      speed: cfg.speed,
    })

    const buffer = Buffer.from(await speech.arrayBuffer())

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error: unknown) {
    console.error("Voice route error:", error)

    const err = error as { status?: number }

    if (err?.status === 401) {
      return NextResponse.json(
        { error: "OpenAI authentication failed in /api/voice." },
        { status: 401 }
      )
    }

    if (err?.status === 429) {
      return NextResponse.json(
        { error: "OpenAI rate limit reached for voice." },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: "Voice generation failed on the server." },
      { status: 500 }
    )
  }
}

function normalizeAvatarId(value: unknown): AvatarId | null {
  const v = String(value ?? "").toLowerCase().trim()
  if (v === "maya" || v === "ryan" || v === "ella") return v
  return null
}

function normalizeText(value: unknown) {
  if (typeof value !== "string") return ""
  return value.replace(/\s+/g, " ").trim()
}

function getVoiceConfig(avatarId: AvatarId) {
  if (avatarId === "maya") {
    return {
      voice: "shimmer" as const,
      speed: 1.12,
      instructions:
        "Young teen girl. Light, warm, feminine, natural, gentle, curious. Keep it relaxed and youthful. Never sound adult, deep, formal, theatrical, or robotic.",
    }
  }

  if (avatarId === "ryan") {
    return {
      voice: "alloy" as const,
      speed: 1.14,
      instructions:
        "Young teen boy. Light, friendly, curious, natural, quick-minded. Keep it youthful and easy. Never sound deep, old, formal, theatrical, or robotic.",
    }
  }

  return {
    voice: "coral" as const,
    speed: 1.15,
    instructions:
      "Young teen girl. Bright, playful, warm, lively, natural. Keep it cheerful but soft. Never sound aggressive, harsh, adult, theatrical, or robotic.",
    }
  }
