import type { AvatarId } from "@/app/lib/avatars"

type VoiceApiOk = {
  blob: Blob
}

type VoiceApiErr = {
  message: string
}

export async function requestAvatarVoice(args: {
  avatarId: AvatarId
  text: string
}): Promise<VoiceApiOk | VoiceApiErr> {
  const res = await fetch("/api/voice", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      avatarId: args.avatarId,
      text: args.text,
    }),
  })

  if (!res.ok) {
    let message = "Voice request failed."

    try {
      const data = (await res.json()) as { error?: string }
      if (typeof data?.error === "string" && data.error.trim()) {
        message = data.error.trim()
      }
    } catch {}

    return { message }
  }

  const blob = await res.blob()
  return { blob }
}

export async function createAvatarAudio(args: {
  avatarId: AvatarId
  text: string
}): Promise<{ audio: HTMLAudioElement; objectUrl: string } | { message: string }> {
  const result = await requestAvatarVoice(args)

  if ("message" in result) {
    return result
  }

  const objectUrl = URL.createObjectURL(result.blob)
  const audio = new Audio()
  audio.preload = "auto"
  audio.src = objectUrl

  return {
    audio,
    objectUrl,
  }
}