export type AvatarId = "maya" | "ryan" | "ella";

export type Avatar = {
  id: AvatarId;
  name: string;
  tagline: string;
  description: string;
  avatarSrc: string; // маленькая
  imageSrc: string; // большая (poster)
  videoSrc: string; // mp4 для hover
};

export const AVATARS: Record<AvatarId, Avatar> = {
  maya: {
    id: "maya",
    name: "Maya",
    avatarSrc: "/avatars/maya.png",
    imageSrc: "/avatars/maya.png",
    videoSrc: "/avatars/maya.mp4",
    tagline: "Calm, brave, observant.",
    description:
      "Maya stays cool under pressure. She spots patterns, connects clues, and keeps the team moving forward.",
  },
  ryan: {
    id: "ryan",
    name: "Ryan",
    avatarSrc: "/avatars/ryan.png",
    imageSrc: "/avatars/ryan.png",
    videoSrc: "/avatars/ryan.mp4",
    tagline: "Tech minded, logical, curious.",
    description:
      "Ryan thinks in systems. He loves mechanisms, tests ideas fast, and explains tricky things in simple steps.",
  },
  ella: {
    id: "ella",
    name: "Ella",
    avatarSrc: "/avatars/ella.png",
    imageSrc: "/avatars/ella.png",
    videoSrc: "/avatars/ella.mp4",
    tagline: "Energetic, witty, adventurous.",
    description:
      "Ella brings energy and bold ideas. She jokes, improvises, and pushes the story into action.",
  },
};

export const AVATAR_LIST = Object.values(AVATARS);