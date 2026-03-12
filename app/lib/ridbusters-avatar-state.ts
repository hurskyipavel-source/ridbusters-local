export type AvatarState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "error"

export function nextAvatarState(
  current: AvatarState,
  event: string
): AvatarState {

  if (event === "USER_START") return "listening"

  if (event === "USER_STOP") return "thinking"

  if (event === "AI_REPLY") return "speaking"

  if (event === "AUDIO_END") return "idle"

  if (event === "ERROR") return "error"

  return current
}