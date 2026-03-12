import { RIDBUSTERS_CANON, type CanonChunk } from "@/app/lib/ridbusters-canon"

export type RidbustersFact = {
  id: string
  title: string
  content: string
  tags: string[]
  spoilerLevel: 1 | 2 | 3
}

export type RidbustersScene = {
  id: string
  title: string
  summary: string
  tags: string[]
  spoilerLevel: 1 | 2 | 3
  mayaFeel?: string
  ryanFeel?: string
  ellaFeel?: string
}

function toTitle(id: string) {
  return id
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function normalizeChunkText(chunk: CanonChunk) {
  return chunk.text.replace(/\s+/g, " ").trim()
}

function buildTags(chunk: CanonChunk) {
  return [...chunk.topics, ...chunk.characters, ...chunk.locations].map((value) =>
    value.toLowerCase()
  )
}

export const RIDBUSTERS_CANON_FACTS: RidbustersFact[] = RIDBUSTERS_CANON.map(
  (chunk: CanonChunk): RidbustersFact => ({
    id: chunk.id,
    title: toTitle(chunk.id),
    content: normalizeChunkText(chunk),
    tags: buildTags(chunk),
    spoilerLevel: chunk.spoilerLevel,
  })
)

export const RIDBUSTERS_SCENES: RidbustersScene[] = [
  {
    id: "scene_attic_discovery",
    title: "Attic discovery",
    summary:
      "The kids discover a confidential 1924 folder with letters, notes, and blueprints tied to Professor Verrard and a hidden machine.",
    tags: ["attic", "folder", "dalton", "letter", "1924", "documents"],
    spoilerLevel: 1,
    mayaFeel: "Maya feels the mystery suddenly become real and dangerous.",
    ryanFeel:
      "Ryan immediately focuses on the technical drawings and how the system may have worked.",
    ellaFeel:
      "Ella feels a rush of excitement first, then unease when the letter turns darker.",
  },
  {
    id: "scene_library_research",
    title: "Library research",
    summary:
      "In the Central Library the kids search old Daily Telegraph issues and find proof that Thomas J. Dalton was real and died under mysterious circumstances.",
    tags: ["library", "dalton", "daily telegraph", "article", "research"],
    spoilerLevel: 1,
    mayaFeel: "Maya feels dread when the old warning starts matching reality.",
    ryanFeel:
      "Ryan locks onto the dates and the consistency between the article and the letter.",
    ellaFeel:
      "Ella feels the thrill of discovery and the chill of realizing the case is bigger than expected.",
  },
  {
    id: "scene_document_theft",
    title: "Theft of the documents",
    summary:
      "The children's backpack with the key documents is stolen, and Nox becomes a direct threat to the investigation.",
    tags: ["theft", "documents", "nox", "backpack"],
    spoilerLevel: 2,
    mayaFeel:
      "Maya feels immediate alarm because the enemy is now one step ahead.",
    ryanFeel:
      "Ryan starts thinking about how the theft was coordinated and who helped make it possible.",
    ellaFeel:
      "Ella feels angry and shocked that someone moved so quickly.",
  },
  {
    id: "scene_hidden_tower_plot",
    title: "Hidden plot in the tower",
    summary:
      "The villains study the stolen materials and continue searching for the missing activation piece connected to the Oblivion Machine.",
    tags: ["tower", "nox", "verrard", "machine", "key"],
    spoilerLevel: 2,
    mayaFeel:
      "Maya would feel the scale of the threat and the pressure of running out of time.",
    ryanFeel:
      "Ryan would focus on what the villains still do not have and what that means mechanically.",
    ellaFeel:
      "Ella would react strongly to the danger and secrecy around the machine.",
  },
  {
    id: "scene_arnold_reveal",
    title: "Arnold reveals the truth",
    summary:
      "Arnold reveals that he is an agent of ROSS and admits his role in the alarm and the theft setup.",
    tags: ["arnold", "ross", "alarm", "truth", "reveal"],
    spoilerLevel: 3,
    mayaFeel:
      "Maya feels betrayed, conflicted, and forced to rethink earlier events.",
    ryanFeel:
      "Ryan immediately starts rebuilding the logic of the whole case from the beginning.",
    ellaFeel: "Ella feels shock first, then urgency and anger.",
  },
  {
    id: "scene_machine_room",
    title: "Inside the Oblivion Machine",
    summary:
      "The tower hides a large machine room with preserved mechanisms, toxic green liquid, and a central console waiting for the missing activation piece.",
    tags: ["machine", "tower", "green liquid", "console", "key"],
    spoilerLevel: 2,
    mayaFeel: "Maya feels the true weight of the danger to London.",
    ryanFeel:
      "Ryan becomes intensely focused on how the machine is built and what it needs to run.",
    ellaFeel: "Ella feels awe and fear at the same time.",
  },
  {
    id: "scene_final_confrontation",
    title: "Final confrontation",
    summary:
      "Pegas disrupts the villains during the confrontation, but the chaos ends with Verrard and Nox escaping toward a hidden submarine.",
    tags: ["pegas", "nox", "verrard", "submarine", "escape", "finale"],
    spoilerLevel: 3,
    mayaFeel:
      "Maya feels the frustration of coming so close and still losing them.",
    ryanFeel:
      "Ryan notices the escape setup quickly and understands how planned it was.",
    ellaFeel:
      "Ella feels the chaos, danger, and heartbreak of the moment most sharply.",
  },
]