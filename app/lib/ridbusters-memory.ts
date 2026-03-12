export type Msg = {
  role: "user" | "assistant"
  content: string
}

function hasAny(text: string, variants: string[]) {
  return variants.some(v => text.includes(v))
}

function compactSummary(text: string, maxLen: number) {
  const cleaned = text.replace(/\s+/g, " ").trim()
  if (cleaned.length <= maxLen) return cleaned
  return cleaned.slice(cleaned.length - maxLen)
}

function detectLanguageLabel(messages: Msg[]) {
  const recent = [...messages].reverse().slice(0, 6)

  for (const msg of recent) {
    const text = msg.content.toLowerCase()
    if (/[іїєґ]/i.test(text)) return "User often speaks Ukrainian."
    if (/[а-яё]/i.test(text)) return "User often speaks Russian."
    if (
      hasAny(` ${text} `, [
        " ik ",
        " jij ",
        " niet ",
        " waarom ",
        " welke ",
        " mijn ",
        " een ",
        " het ",
        " de ",
      ])
    ) {
      return "User may prefer Dutch."
    }
  }

  return ""
}

export function buildConversationSummary(
  previousSummary: string,
  messages: Msg[]
): string {
  const recent = messages.slice(-14)

  const userTopics = new Set<string>()
  const storyFacts = new Set<string>()
  const preferences = new Set<string>()
  const relationshipNotes = new Set<string>()

  for (const msg of recent) {
    const text = msg.content.toLowerCase()

    if (msg.role === "user") {
      if (hasAny(text, ["maya", "майя", "майа"])) {
        userTopics.add("User asked about Maya.")
      }

      if (hasAny(text, ["ryan", "райан", "раян"])) {
        userTopics.add("User asked about Ryan.")
      }

      if (hasAny(text, ["ella", "элла", "елла"])) {
        userTopics.add("User asked about Ella.")
      }

      if (hasAny(text, ["arnold", "арнольд", "jansen", "янсен", "ross"])) {
        userTopics.add("User asked about Arnold or ROSS.")
      }

      if (hasAny(text, ["nox", "нокс"])) {
        userTopics.add("User asked about Nox.")
      }

      if (hasAny(text, ["verrard", "веррард"])) {
        userTopics.add("User asked about Verrard.")
      }

      if (hasAny(text, ["tower", "croningen", "башн", "веж"])) {
        userTopics.add("User asked about the tower.")
      }

      if (hasAny(text, ["machine", "oblivion", "механизм", "машин"])) {
        userTopics.add("User asked about the Oblivion Machine.")
      }

      if (hasAny(text, ["library", "библиотек", "archive", "daily telegraph"])) {
        userTopics.add("User asked about the library research.")
      }

      if (hasAny(text, ["dalton", "дальтон"])) {
        userTopics.add("User asked about Thomas J. Dalton.")
      }

      if (hasAny(text, ["pegas", "пегас", "dog", "собак"])) {
        userTopics.add("User asked about Pegas.")
      }

      if (hasAny(text, ["submarine", "подлод", "sub"])) {
        userTopics.add("User asked about the submarine escape.")
      }

      if (hasAny(text, ["spoiler", "спойлер", "спойлеры", "со спойлерами", "зі спойлерами"])) {
        preferences.add("User allows spoiler discussion.")
      }

      if (hasAny(text, ["no spoilers", "without spoilers", "без спойлеров", "без спойлерів"])) {
        preferences.add("User prefers no spoilers.")
      }

      if (hasAny(text, ["what did you feel", "how did you feel", "что ты чувствовал", "что ты чувствовала", "що ти відчувала"])) {
        preferences.add("User is interested in emotional perspective, not only plot facts.")
      }

      if (hasAny(text, ["who are you", "кто ты", "хто ти", "tell me about yourself"])) {
        relationshipNotes.add("User asked the character for a personal introduction.")
      }
    }

    if (msg.role === "assistant") {
      if (hasAny(text, ["ross"])) {
        storyFacts.add("Conversation already mentioned Arnold's connection to ROSS.")
      }

      if (hasAny(text, ["grandson"])) {
        storyFacts.add("Conversation already mentioned that modern Verrard is Professor Verrard's grandson.")
      }

      if (hasAny(text, ["daily telegraph", "thomas j. dalton", "dalton"])) {
        storyFacts.add("Conversation already mentioned Dalton and the newspaper research.")
      }

      if (hasAny(text, ["croningen water tower", "tower"])) {
        storyFacts.add("Conversation already mentioned the Croningen Water Tower.")
      }

      if (hasAny(text, ["oblivion machine"])) {
        storyFacts.add("Conversation already mentioned the Oblivion Machine.")
      }

      if (hasAny(text, ["submarine"])) {
        storyFacts.add("Conversation already mentioned the submarine escape.")
      }
    }
  }

  const languageNote = detectLanguageLabel(recent)

  const merged = [
    previousSummary.trim(),
    languageNote,
    ...preferences,
    ...relationshipNotes,
    ...userTopics,
    ...storyFacts,
  ]
    .filter(Boolean)
    .join(" ")

  return compactSummary(merged, 1100)
}