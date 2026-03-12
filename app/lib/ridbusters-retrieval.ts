import { RIDBUSTERS_CANON, type CanonChunk } from "@/app/lib/ridbusters-canon"
import type { AvatarKey, SpoilerMode } from "@/app/lib/ridbusters-prompts"

export type ChatMsg = {
  role: "user" | "assistant"
  content: string
}

export type LanguageDecision = {
  label: string
  instruction: string
}

type ScoredChunk = {
  chunk: CanonChunk
  score: number
}

function includesAny(text: string, variants: string[]) {
  return variants.some((v) => text.includes(v))
}

function normalizeText(text: string) {
  return text.toLowerCase().trim()
}

export function detectSpoilerMode(
  latestUserMessage: string,
  messages?: ChatMsg[]
): SpoilerMode {
  const text = normalizeText(latestUserMessage)

  if (
    includesAny(text, [
      "with spoilers",
      "spoilers",
      "spoiler",
      "tell me the ending",
      "tell me the truth",
      "full spoilers",
      "со спойлерами",
      "спойлер",
      "спойлеры",
      "расскажи финал",
      "расскажи концовку",
      "расскажи правду",
      "я уже прочитал",
      "я прочитал",
      "зі спойлерами",
      "спойлери",
      "розкажи фінал",
      "met spoilers",
    ])
  ) {
    return "full"
  }

  if (
    includesAny(text, [
      "without spoilers",
      "no spoilers",
      "safe version",
      "без спойлеров",
      "без спойлерів",
      "geen spoilers",
    ])
  ) {
    return "safe"
  }

  const recentUserText = (messages || [])
    .filter((m) => m.role === "user")
    .slice(-4)
    .map((m) => normalizeText(m.content))
    .join("\n")

  if (
    includesAny(recentUserText, [
      "arnold is ross",
      "arnold was ross",
      "ross",
      "grandson of professor verrard",
      "внук веррарда",
      "концовка",
      "финал",
      "ending",
      "submarine",
      "подлодка",
    ])
  ) {
    return "full"
  }

  return "adaptive"
}

export function detectLanguage(message: string): LanguageDecision {
  const text = message.trim()

  if (!text) {
    return {
      label: "English",
      instruction: "Answer in English.",
    }
  }

  const hasCyrillic = /[а-яіїєґё]/i.test(text)
  const hasUkrainianLetters = /[іїєґ]/i.test(text)

  if (hasCyrillic && hasUkrainianLetters) {
    return {
      label: "Ukrainian",
      instruction:
        "Answer in Ukrainian. Keep the language modern, natural, and fluid.",
    }
  }

  if (hasCyrillic) {
    return {
      label: "Russian",
      instruction:
        "Answer in Russian. Keep the language modern, natural, and conversational.",
    }
  }

  const lower = text.toLowerCase()
  const padded = ` ${lower} `
  const dutchMarkers = [
    " ik ",
    " jij ",
    " je ",
    " niet ",
    " waarom ",
    " welke ",
    " mijn ",
    " dit ",
    " dat ",
    " een ",
    " het ",
    " de ",
    " kun je ",
  ]

  let dutchScore = 0
  for (const marker of dutchMarkers) {
    if (padded.includes(marker)) {
      dutchScore += 1
    }
  }

  if (dutchScore >= 3) {
    return {
      label: "Dutch",
      instruction: "Answer in Dutch. Keep it smooth and natural.",
    }
  }

  return {
    label: "Same as user",
    instruction:
      "Answer in the same language as the user's latest message whenever possible. If unclear, use English.",
  }
}

export function detectTopicTags(message: string): string[] {
  const text = normalizeText(message)
  const tags = new Set<string>()

  const map: Record<string, string[]> = {
    team: ["who are you", "кто ты", "хто ти", "wie ben je", "ridbusters", "team"],
    maya: ["maya", "майя", "майа"],
    ryan: ["ryan", "райан", "раян"],
    ella: ["ella", "элла", "елла"],
    nox: ["nox", "нокс"],
    arnold: [
      "arnold",
      "арнольд",
      "jansen",
      "янсен",
      "ross",
      "librarian",
      "библиотек",
      "library",
    ],
    verrard: [
      "verrard",
      "веррард",
      "professor verrard",
      "grandson",
      "внук",
      "professor",
    ],
    dalton: ["dalton", "дальтон", "thomas j. dalton", "thomas dalton"],
    letter: [
      "letter",
      "письмо",
      "лист",
      "prime minister",
      "macdonald",
      "ramsay",
      "folder",
      "documents",
      "document",
    ],
    library: [
      "library",
      "библиотек",
      "daily telegraph",
      "newspaper",
      "newspapers",
      "article",
      "articles",
      "газет",
      "стать",
      "archive",
      "archives",
    ],
    machine: [
      "oblivion machine",
      "machine",
      "механизм",
      "машин",
      "key",
      "activation",
      "piece",
      "device",
      "console",
      "green liquid",
      "tank",
      "tanks",
    ],
    tower: [
      "tower",
      "croningen",
      "water tower",
      "башн",
      "веж",
      "waterworks road",
      "door 33",
      "room 33",
    ],
    dog: ["dog", "pegas", "пегас", "собак", "пес", "puppy"],
    submarine: ["submarine", "подлодк", "sub", "harbor", "cable"],
    dream: ["dream", "сон", "dreamed", "приснилось", "whirlpool", "chain"],
    feelings: [
      "what did you feel",
      "how did you feel",
      "what was it like",
      "что ты чувствовал",
      "что ты чувствовала",
      "как ты себя чувствовал",
      "как ты себя чувствовала",
      "що ти відчувала",
      "як ти почувалася",
      "how was it for you",
    ],
    dates: ["date", "dates", "year", "years", "дата", "годы", "год", "когда", "when", "1924", "1879"],
    ending: ["ending", "finale", "концовка", "финал", "ending explained"],
  }

  for (const [tag, variants] of Object.entries(map)) {
    for (const variant of variants) {
      if (text.includes(variant)) {
        tags.add(tag)
        break
      }
    }
  }

  if (tags.size === 0) {
    tags.add("team")
  }

  return Array.from(tags)
}

function scoreChunk(
  chunk: CanonChunk,
  latestUserMessage: string,
  tags: string[],
  avatar: AvatarKey
) {
  const text = normalizeText(latestUserMessage)
  let score = 0

  for (const topic of chunk.topics) {
    const topicLower = topic.toLowerCase()

    if (tags.includes(topicLower)) {
      score += 10
    }

    if (text.includes(topicLower)) {
      score += 6
    }
  }

  for (const character of chunk.characters) {
    const characterLower = character.toLowerCase()

    if (text.includes(characterLower)) {
      score += 5
    }

    if (
      (avatar === "maya" && characterLower === "maya") ||
      (avatar === "ryan" && characterLower === "ryan") ||
      (avatar === "ella" && characterLower === "ella")
    ) {
      score += 1
    }
  }

  for (const location of chunk.locations) {
    const locationLower = location.toLowerCase()

    if (text.includes(locationLower)) {
      score += 4
    }
  }

  if (tags.includes("feelings")) {
    if (chunk.topics.includes("feelings") || chunk.topics.includes("arc")) {
      score += 8
    }

    if (
      chunk.id.includes("emotional") ||
      chunk.id.includes("feel") ||
      chunk.id.includes("arc")
    ) {
      score += 6
    }
  }

  if (tags.includes("ending") && chunk.spoilerLevel >= 2) {
    score += 5
  }

  if (typeof chunk.chapter === "number") {
    score += chunk.chapter * 0.05
  }

  return score
}

function buildChunkText(chunk: CanonChunk, avatar: AvatarKey) {
  const base = chunk.text.replace(/\s+/g, " ").trim()

  if (avatar === "maya" && chunk.characters.includes("Maya")) {
    return `${chunk.id}: ${base} Maya's perspective may emphasize intuition, danger, and responsibility.`
  }

  if (avatar === "ryan" && chunk.characters.includes("Ryan")) {
    return `${chunk.id}: ${base} Ryan's perspective may emphasize logic, sequence, and mechanisms.`
  }

  if (avatar === "ella" && chunk.characters.includes("Ella")) {
    return `${chunk.id}: ${base} Ella's perspective may emphasize emotion, tension, and immediacy.`
  }

  return `${chunk.id}: ${base}`
}

export function retrieveRelevantLore(
  avatar: AvatarKey,
  latestUserMessage: string,
  spoilerMode: SpoilerMode
): string[] {
  const tags = detectTopicTags(latestUserMessage)

  const maxSpoiler =
    spoilerMode === "full" ? 3 : spoilerMode === "safe" ? 1 : 2

  const filteredChunks: CanonChunk[] = RIDBUSTERS_CANON.filter((chunk) => {
    return chunk.spoilerLevel <= maxSpoiler
  })

  const scored: ScoredChunk[] = []

  for (const chunk of filteredChunks) {
    const score = scoreChunk(chunk, latestUserMessage, tags, avatar)

    if (score > 0) {
      scored.push({
        chunk,
        score,
      })
    }
  }

  scored.sort((a: ScoredChunk, b: ScoredChunk) => b.score - a.score)

  const selected: string[] = scored
    .slice(0, 6)
    .map((item: ScoredChunk) => buildChunkText(item.chunk, avatar))

  const avatarAnchor =
    avatar === "maya"
      ? "Maya should sound calm, observant, sincere, and brave."
      : avatar === "ryan"
      ? "Ryan should sound logical, restrained, practical, and factual."
      : "Ella should sound lively, warm, emotionally vivid, and grounded."

  if (selected.length === 0) {
    return [
      avatarAnchor,
      "No direct canon chunk matched this exact question. Do not invent details. Answer carefully using only clearly supported story facts.",
    ]
  }

  return [avatarAnchor, ...selected]
}