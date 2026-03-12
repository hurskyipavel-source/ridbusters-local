export async function speakText(text: string) {
  const res = await fetch("/api/voice", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text })
  })

  if (!res.ok) return null

  const blob = await res.blob()

  const url = URL.createObjectURL(blob)

  const audio = new Audio(url)

  return audio
}