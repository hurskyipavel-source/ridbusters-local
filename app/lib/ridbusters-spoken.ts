export function formatForSpeech(text: string) {

  let cleaned = text

  cleaned = cleaned.replace(/\n/g, " ")

  cleaned = cleaned.replace(/\s+/g, " ")

  cleaned = cleaned.replace(/[*_`]/g, "")

  cleaned = cleaned.trim()

  return cleaned.slice(0, 600)
}