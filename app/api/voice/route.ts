import OpenAI from "openai"
import { NextResponse } from "next/server"

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {
  const body = await req.json()

  const text = String(body?.text || "").slice(0, 800)

  if (!text) {
    return NextResponse.json({ error: "No text" }, { status: 400 })
  }

  const speech = await client.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: "alloy",
    input: text
  })

  const buffer = Buffer.from(await speech.arrayBuffer())

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "audio/mpeg"
    }
  })
}