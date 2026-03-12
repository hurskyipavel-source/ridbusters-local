"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AVATARS, type AvatarId } from "@/app/lib/avatars";
import {
  buildConversationSummary,
  type Msg as MemoryMsg,
} from "@/app/lib/ridbusters-memory";
import TalkingAvatar from "@/app/components/TalkingAvatar";
import {
  nextAvatarState,
  type AvatarState,
} from "@/app/lib/ridbusters-avatar-state";
import { speakText } from "@/app/lib/ridbusters-voice";
import { formatForSpeech } from "@/app/lib/ridbusters-spoken";

type Props = {
  params: Promise<{ avatar: string }>;
};

type Msg = { role: "user" | "assistant"; content: string };
type Mode = "write" | "speak";
type SpeechLang = "en-US" | "ru-RU" | "uk-UA" | "nl-NL";

const GREETINGS: Record<AvatarId, string[]> = {
  maya: [
    "Hi, I’m Maya. We can do this in English, Russian, Ukrainian, or Dutch, whatever feels easiest for you. What would you like to talk about?",
    "Hey, I’m Maya. Tell me which language is most comfortable for you, and we’ll continue there. What caught your attention?",
    "Hi. I’m Maya. We can speak in the language you prefer, just start however you like. What do you want to ask first?",
    "Hey. Maya here. English is fine, but Russian, Ukrainian, or Dutch also work. Which is better for you?",
    "Hi, I’m Maya. Choose the language that feels natural to you, and we’ll go from there. What are you curious about?",
    "Hey. I’m Maya. We don’t have to stay in English if another language is easier for you. Where should we begin?",
    "Hi. Maya here. You can write in the language you prefer, and I’ll follow you. What do you want to uncover?",
    "Hey, I’m Maya. Start in any language that feels comfortable, and I’ll adapt. What’s on your mind?",
  ],
  ryan: [
    "Hi, I’m Ryan. We can talk in English, Russian, Ukrainian, or Dutch, whichever is easiest for you. What do you want to figure out?",
    "Hey. Ryan here. Start in the language you prefer, and I’ll follow it. What are we looking at?",
    "Hi. I’m Ryan. Use whichever language feels natural to you, and we’ll keep it simple from there. What’s your question?",
    "Hey, I’m Ryan. If English isn’t the best option, switch to another language and I’ll adapt. What do you want to understand?",
    "Hi. Ryan here. Just write in the language you’re most comfortable with. What are we solving first?",
    "Hey. I’m Ryan. We can do this in the language that works best for you. What detail are we starting with?",
    "Hi, I’m Ryan. Choose any comfortable language and I’ll keep up. What part do you want to break down?",
    "Hey. Ryan here. We don’t need to stay in English if another language is better for you. What do you want to ask?",
  ],
  ella: [
    "Hey, I’m Ella. We can chat in English, Russian, Ukrainian, or Dutch, whatever is easiest for you. Which one do you like best?",
    "Hi! Ella here. Pick the language you’re most comfortable with and we’ll go from there. What do you want to talk about?",
    "Hey! I’m Ella. You can write in any language that feels natural to you, and I’ll follow your lead. So, where do we start?",
    "Hi, I’m Ella. If English isn’t your favourite, switch to whatever suits you better. What are you curious about?",
    "Hey! Ella here. Tell me what language feels easiest for you, and let’s make this interesting.",
    "Hi! I’m Ella. English works, but Russian, Ukrainian, or Dutch work too. Which one should we use?",
    "Hey, I’m Ella. Start in your own language if you want, I’ll keep up. What do you want to uncover first?",
    "Hi! Ella here. Use whichever language feels the most natural, and let’s get into something fun or mysterious.",
  ],
};

const OFFLINE_REPLIES: Record<AvatarId, string[]> = {
  maya: [
    "Sorry, something isn’t connecting properly right now. Let’s try again a little later.",
    "I think the connection just dropped. Come back in a bit and we’ll continue.",
    "Something on the line went quiet for a moment. Let’s pick this up later.",
    "Looks like the signal failed on us. Try me again soon.",
    "I can’t get a proper reply through right now. Let’s reconnect later.",
  ],
  ryan: [
    "The connection failed just now. Best option is to try again a bit later.",
    "Something on the system side isn’t responding. Let’s reconnect later.",
    "The signal didn’t get through properly. Try again in a little while.",
    "There’s a connection problem at the moment. We should continue later.",
    "I’m not getting a usable response through right now. Let’s try again soon.",
  ],
  ella: [
    "Ah, great timing, the connection just died on us. Come back a bit later and we’ll keep going.",
    "Looks like the internet decided to be dramatic. Try me again soon.",
    "Something cut the connection off. Let’s talk again a little later.",
    "Well, that was rude. The reply didn’t come through. Come back soon.",
    "Something broke the connection for a second there. Try again in a bit.",
  ],
};

function storageKey(avatarId: string) {
  return `ridbusters.chat.${avatarId}`;
}

function summaryKey(avatarId: string) {
  return `ridbusters.summary.${avatarId}`;
}

function safeParseMessages(raw: string | null): Msg[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const cleaned: Msg[] = [];

    for (const item of parsed) {
      const role = item?.role;
      const content = item?.content;

      if (
        (role === "user" || role === "assistant") &&
        typeof content === "string"
      ) {
        cleaned.push({ role, content });
      }
    }

    return cleaned;
  } catch {
    return [];
  }
}

function isSpeechRecognitionSupported() {
  if (typeof window === "undefined") return false;

  return Boolean(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  );
}

function pickRandomGreeting(avatarId: AvatarId) {
  const pool = GREETINGS[avatarId] ?? GREETINGS.maya;
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickOfflineReply(avatarId: AvatarId) {
  const pool = OFFLINE_REPLIES[avatarId] ?? OFFLINE_REPLIES.maya;
  return pool[Math.floor(Math.random() * pool.length)];
}

function detectLangFromText(text: string): SpeechLang | null {
  const t = text.trim().toLowerCase();
  if (!t) return null;

  const hasCyrillic = /[а-яіїєґё]/i.test(t);
  const hasUkrainianLetters = /[іїєґ]/i.test(t);

  if (hasCyrillic && hasUkrainianLetters) return "uk-UA";
  if (hasCyrillic) return "ru-RU";

  const padded = ` ${t} `;
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
  ];

  let dutchScore = 0;
  for (const marker of dutchMarkers) {
    if (padded.includes(marker)) dutchScore += 1;
  }

  if (dutchScore >= 3) return "nl-NL";

  if (/[a-z]/i.test(t)) return "en-US";

  return null;
}

function detectNavigatorLang(): SpeechLang {
  if (typeof navigator !== "undefined") {
    const lang = (navigator.language || "").toLowerCase();
    if (lang.startsWith("uk")) return "uk-UA";
    if (lang.startsWith("ru")) return "ru-RU";
    if (lang.startsWith("nl")) return "nl-NL";
  }

  return "en-US";
}

function getRecentUserLangs(messages: Msg[]): SpeechLang[] {
  const langs: SpeechLang[] = [];

  for (const msg of messages.filter((m) => m.role === "user").slice(-6)) {
    const lang = detectLangFromText(msg.content);
    if (lang && !langs.includes(lang)) langs.push(lang);
  }

  return langs;
}

function detectSpeechLangAuto(
  messages: Msg[],
  input: string,
  rememberedLang: SpeechLang | null
): SpeechLang {
  const fromInput = detectLangFromText(input);
  if (fromInput) return fromInput;

  const recentLangs = getRecentUserLangs(messages);
  const navigatorLang = detectNavigatorLang();

  if (recentLangs.length === 0) {
    return rememberedLang || navigatorLang || "en-US";
  }

  if (recentLangs.length === 1) {
    return recentLangs[0];
  }

  if (rememberedLang && recentLangs.includes(rememberedLang)) {
    return rememberedLang;
  }

  if (recentLangs.includes(navigatorLang)) {
    return navigatorLang;
  }

  if (recentLangs.includes("en-US")) {
    return "en-US";
  }

  return recentLangs[0];
}

export default function ChatPage({ params }: Props) {
  const router = useRouter();

  const resolved = use(params);
  const avatarId = (resolved.avatar || "").toLowerCase().trim() as AvatarId;
  const avatar = useMemo(() => AVATARS[avatarId] ?? null, [avatarId]);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [memorySummary, setMemorySummary] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [mode, setMode] = useState<Mode>("write");
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [avatarState, setAvatarState] = useState<AvatarState>("idle");
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const recogRef = useRef<any>(null);
  const speakBufferRef = useRef<string>("");
  const shouldSendAfterStopRef = useRef<boolean>(true);
  const seededGreetingRef = useRef<boolean>(false);
  const messagesRef = useRef<Msg[]>([]);
  const lastSpeechLangRef = useRef<SpeechLang | null>(null);

  const setBackFlags = () => {
    try {
      sessionStorage.setItem("ridbusters.skipIntroOnce", "1");
      sessionStorage.setItem("ridbusters.unlocked", "1");
      sessionStorage.setItem("ridbusters.lastView", "avatars");
      sessionStorage.setItem("ridbusters.fromChatBack", "1");
    } catch {}
  };

  const focusComposer = () => {
    if (typeof window === "undefined") return;

    window.setTimeout(() => {
      try {
        inputRef.current?.focus();
      } catch {}
    }, 0);
  };

  const stopCurrentAudio = () => {
    try {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    } catch {}

    setCurrentAudio(null);
  };

  const goBack = () => {
    setBackFlags();
    stopCurrentAudio();
    router.replace("/?v=avatars&from=chat");
  };

  useEffect(() => {
    setBackFlags();
  }, []);

  useEffect(() => {
    setSpeechSupported(isSpeechRecognitionSupported());
  }, []);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const restored = safeParseMessages(
      window.localStorage.getItem(storageKey(avatarId))
    );
    const restoredSummary =
      window.localStorage.getItem(summaryKey(avatarId)) || "";

    if (restored.length > 0) {
      setMessages(restored);
      messagesRef.current = restored;
      seededGreetingRef.current = true;

      const lastUser = [...restored].reverse().find((m) => m.role === "user");
      if (lastUser) {
        lastSpeechLangRef.current = detectLangFromText(lastUser.content);
      }
    } else if (!seededGreetingRef.current && avatarId && AVATARS[avatarId]) {
      const greeting = pickRandomGreeting(avatarId);
      const seeded: Msg[] = [{ role: "assistant", content: greeting }];
      setMessages(seeded);
      messagesRef.current = seeded;
      seededGreetingRef.current = true;
      window.localStorage.setItem(storageKey(avatarId), JSON.stringify(seeded));
    }

    setMemorySummary(restoredSummary);
  }, [avatarId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey(avatarId), JSON.stringify(messages));
  }, [messages, avatarId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(summaryKey(avatarId), memorySummary);
  }, [memorySummary, avatarId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: 999999, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!loading && !listening) {
      focusComposer();
    }
  }, [loading, listening, mode, avatarId]);

  useEffect(() => {
    focusComposer();
  }, []);

  useEffect(() => {
    return () => {
      try {
        recogRef.current?.abort?.();
      } catch {}
      try {
        recogRef.current?.stop?.();
      } catch {}
      stopCurrentAudio();
    };
  }, [currentAudio]);

  if (!avatar) {
    return (
      <main className="min-h-screen bg-neutral-950 p-10 text-neutral-50">
        <button type="button" onClick={goBack} className="rbBackBtn">
          Back
        </button>

        <h1 className="mt-4 text-2xl font-bold">Avatar not found</h1>
        <div className="rbSignature">Powered by P. M. Hursky</div>

        <style jsx global>{`
          .rbBackBtn {
            border-radius: 999px;
            padding: 10px 16px;
            font-size: 13px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.92);
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.16);
            cursor: pointer;
            transition: transform 140ms ease, background 140ms ease,
              border-color 140ms ease, color 140ms ease;
          }

          .rbBackBtn:hover {
            transform: translateY(-1px);
            background: rgba(255, 210, 120, 0.14);
            border-color: rgba(255, 210, 120, 0.28);
            color: rgba(255, 245, 230, 0.98);
          }

          .rbSignature {
            position: fixed;
            right: 26px;
            bottom: 20px;
            z-index: 120;
            font-size: 18px;
            letter-spacing: 0.02em;
            color: rgba(255, 210, 120, 0.92);
            text-shadow: 0 2px 12px rgba(0, 0, 0, 0.75),
              0 0 18px rgba(255, 200, 90, 0.18);
            font-family: "Segoe Script", "Brush Script MT", "Snell Roundhand",
              cursive;
            user-select: none;
            pointer-events: none;
          }
        `}</style>
      </main>
    );
  }

  function clearHistoryNow() {
    if (typeof window === "undefined") return;

    stopCurrentAudio();

    window.localStorage.removeItem(storageKey(avatarId));
    window.localStorage.removeItem(summaryKey(avatarId));

    const greeting = pickRandomGreeting(avatarId);
    const seeded: Msg[] = [{ role: "assistant", content: greeting }];

    setMessages(seeded);
    messagesRef.current = seeded;
    setMemorySummary("");
    setInput("");
    setSpeechError(null);
    setAvatarState("idle");

    speakBufferRef.current = "";
    shouldSendAfterStopRef.current = true;
    seededGreetingRef.current = true;
    lastSpeechLangRef.current = null;

    window.localStorage.setItem(storageKey(avatarId), JSON.stringify(seeded));
    focusComposer();
  }

  function buildNextSummary(nextMessages: Msg[]) {
    const summary = buildConversationSummary(
      memorySummary,
      nextMessages as MemoryMsg[]
    );
    setMemorySummary(summary);
    return summary;
  }

  async function playAssistantVoice(reply: string) {
    try {
      const spoken = formatForSpeech(reply);
      if (!spoken) return;

      const audio = await speakText(spoken);
      if (!audio) {
        setSpeechError("Voice playback failed. Text reply is still available.");
        setAvatarState((prev) => nextAvatarState(prev, "ERROR"));
        return;
      }

      stopCurrentAudio();
      setCurrentAudio(audio);
      setAvatarState((prev) => nextAvatarState(prev, "AI_REPLY"));

      audio.onended = () => {
        setAvatarState((prev) => nextAvatarState(prev, "AUDIO_END"));
        setCurrentAudio(null);
      };

      audio.onerror = () => {
        setSpeechError("Voice playback failed. Text reply is still available.");
        setAvatarState((prev) => nextAvatarState(prev, "ERROR"));
        setCurrentAudio(null);
      };

      await audio.play();
    } catch {
      setSpeechError("Voice playback failed. Text reply is still available.");
      setAvatarState((prev) => nextAvatarState(prev, "ERROR"));
    }
  }

  async function sendText(textRaw: string, sourceMode: Mode = "write") {
    const text = textRaw.trim();
    if (!text || loading) return;

    setSpeechError(null);
    stopCurrentAudio();

    const baseMessages = messagesRef.current;
    const newMessages: Msg[] = [...baseMessages, { role: "user", content: text }];

    setMessages(newMessages);
    messagesRef.current = newMessages;
    setLoading(true);
    setAvatarState((prev) => nextAvatarState(prev, "USER_STOP"));

    const detected = detectLangFromText(text);
    if (detected) {
      lastSpeechLangRef.current = detected;
    }

    try {
      const summaryForRequest = buildNextSummary(newMessages);
      const recentMessages = newMessages.slice(-16);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatarId,
          messages: recentMessages,
          memorySummary: summaryForRequest,
        }),
      });

      if (!res.ok) {
        const fallback = pickOfflineReply(avatarId);
        const finalMessages: Msg[] = [
          ...newMessages,
          { role: "assistant", content: fallback },
        ];

        setMessages(finalMessages);
        messagesRef.current = finalMessages;
        buildNextSummary(finalMessages);
        setAvatarState("error");
        return;
      }

      const data = await res.json().catch(() => null);
      const reply =
        typeof data?.reply === "string" && data.reply.trim()
          ? data.reply.trim()
          : pickOfflineReply(avatarId);

      const finalMessages: Msg[] = [
        ...newMessages,
        { role: "assistant", content: reply },
      ];

      setMessages(finalMessages);
      messagesRef.current = finalMessages;
      buildNextSummary(finalMessages);

      if (sourceMode === "speak") {
        await playAssistantVoice(reply);
      } else {
        setAvatarState("idle");
      }
    } catch {
      const fallback = pickOfflineReply(avatarId);
      const finalMessages: Msg[] = [
        ...newMessages,
        { role: "assistant", content: fallback },
      ];

      setMessages(finalMessages);
      messagesRef.current = finalMessages;
      buildNextSummary(finalMessages);
      setAvatarState("error");
    } finally {
      setLoading(false);
      setMode("write");
      focusComposer();
    }
  }

  async function onWriteClick() {
    if (mode !== "write") setMode("write");

    const t = input;
    setInput("");
    await sendText(t, "write");
  }

  function stopRecognition(manualStop = false) {
    shouldSendAfterStopRef.current = true;

    try {
      recogRef.current?.stop?.();
    } catch {
      setListening(false);
    }

    if (manualStop) {
      setListening(false);
      setMode("write");
      setAvatarState("idle");
      focusComposer();
    }
  }

  function startRecognition() {
    if (typeof window === "undefined") return;

    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SR) {
      setSpeechSupported(false);
      setSpeechError("Speech input is not supported in this browser.");
      setMode("write");
      setAvatarState("error");
      focusComposer();
      return;
    }

    setSpeechError(null);
    stopCurrentAudio();

    if (!recogRef.current) {
      const r = new SR();

      r.continuous = false;
      r.interimResults = true;
      r.maxAlternatives = 1;

      r.onstart = () => {
        speakBufferRef.current = "";
        shouldSendAfterStopRef.current = true;
        setListening(true);
        setAvatarState((prev) => nextAvatarState(prev, "USER_START"));
      };

      r.onresult = (e: any) => {
        let interim = "";
        let final = "";

        for (let i = e.resultIndex; i < e.results.length; i++) {
          const result = e.results[i];
          const transcript = String(result?.[0]?.transcript ?? "").trim();

          if (!transcript) continue;

          if (result.isFinal) final += (final ? " " : "") + transcript;
          else interim += (interim ? " " : "") + transcript;
        }

        const combined = (final || interim).trim();
        if (combined) {
          speakBufferRef.current = combined;
          setInput(combined);
        }
      };

      r.onerror = (e: any) => {
        const code = String(e?.error || "").toLowerCase();

        if (code === "not-allowed" || code === "service-not-allowed") {
          setSpeechError(
            "Microphone access was blocked. Allow microphone access in Chrome for this site."
          );
        } else if (code === "no-speech") {
          setSpeechError("No speech was detected. Try again.");
        } else if (code === "audio-capture") {
          setSpeechError("No working microphone was found.");
        } else if (code === "aborted") {
          setSpeechError(null);
        } else {
          setSpeechError("Speech input failed. Try again.");
        }

        setListening(false);
        setAvatarState("error");
      };

      r.onend = async () => {
        const finalText = (speakBufferRef.current || "").trim();
        const shouldSend = shouldSendAfterStopRef.current;

        setListening(false);
        setMode("write");

        if (shouldSend && finalText) {
          const detected = detectLangFromText(finalText);
          if (detected) {
            lastSpeechLangRef.current = detected;
          }

          setInput("");
          speakBufferRef.current = "";
          await sendText(finalText, "speak");
        } else {
          setAvatarState("idle");
          focusComposer();
        }
      };

      recogRef.current = r;
    }

    try {
      const lang = detectSpeechLangAuto(
        messagesRef.current,
        input,
        lastSpeechLangRef.current
      );

      recogRef.current.lang = lang;
      speakBufferRef.current = "";
      shouldSendAfterStopRef.current = true;
      recogRef.current.start();
    } catch {
      setSpeechError("Speech input could not start. Try again.");
      setListening(false);
      setMode("write");
      setAvatarState("error");
      focusComposer();
    }
  }

  async function onSpeakClick() {
    if (!speechSupported) {
      setSpeechError("Speech input is supported in Chrome on HTTPS or localhost.");
      setAvatarState("error");
      focusComposer();
      return;
    }

    if (loading) return;

    if (listening) {
      stopRecognition(false);
      return;
    }

    setMode("speak");
    startRecognition();
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-neutral-50">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 rbBackdrop"
          style={{ backgroundImage: `url(/hero.png)` }}
        />
        <div className="absolute inset-0 rbBackdropTint" />
      </div>

      <div className="rbSignature">Powered by P. M. Hursky</div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-3 py-3 sm:px-4 sm:py-6">
        <header className="flex flex-col gap-3 rounded-3xl border border-white/8 bg-black/20 p-3 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={goBack} className="rbBackBtn">
              Back
            </button>

            <div className="hidden h-10 w-px bg-neutral-800 sm:block" />

            <img
              src={avatar.avatarSrc}
              alt={avatar.name}
              className="h-12 w-12 flex-shrink-0 rounded-3xl object-cover object-top ring-1 ring-white/10 sm:h-14 sm:w-14"
            />

            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold leading-tight sm:text-lg">
                {avatar.name}
              </h1>
              <p className="truncate text-xs text-neutral-300/70">
                {avatar.tagline}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="rbClearBtn"
              title="Clear saved chat history for this character"
            >
              Clear chat
            </button>
          </div>
        </header>

        <div className="mt-3 grid gap-4 xl:mt-5 xl:grid-cols-[380px_minmax(0,1fr)] xl:gap-5">
          <aside className="rounded-[28px] border border-white/10 bg-black/25 p-3 backdrop-blur-md">
            <TalkingAvatar
              avatarSrc={avatar.avatarSrc}
              state={avatarState}
              audio={currentAudio}
            />

            <div className="mt-3 rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-white/95">Avatar state</div>
              <div className="mt-2 text-sm text-white/72">
                {avatarState === "idle" && "Ready"}
                {avatarState === "listening" && "Listening"}
                {avatarState === "thinking" && "Thinking"}
                {avatarState === "speaking" && "Speaking"}
                {avatarState === "error" && "Connection or voice issue"}
              </div>
            </div>
          </aside>

          <section className="overflow-hidden rounded-[28px] border border-neutral-800 bg-neutral-900/30 backdrop-blur-md">
            <div
              ref={listRef}
              className="h-[54svh] space-y-3 overflow-y-auto p-3 sm:h-[60svh] sm:p-4 md:h-[66vh] md:p-5 xl:h-[72vh]"
              onPointerDown={() => {
                if (!listening && !loading) focusComposer();
              }}
            >
              {messages.length === 0 ? (
                <div className="text-sm text-neutral-300/70">
                  Start the conversation with {avatar.name}.
                </div>
              ) : null}

              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed ring-1 sm:max-w-[85%] ${
                      m.role === "user"
                        ? "bg-white text-neutral-950 ring-white/10"
                        : "bg-neutral-950/45 text-neutral-100 ring-white/10"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  </div>
                </div>
              ))}

              {loading ? (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-neutral-950/45 px-4 py-3 text-sm text-neutral-300 ring-1 ring-white/10">
                    Thinking…
                  </div>
                </div>
              ) : null}
            </div>

            <div className="border-t border-neutral-800 p-3 sm:p-4">
              {speechError ? (
                <div className="mb-3 rounded-2xl border border-amber-300/20 bg-amber-200/10 px-3 py-2 text-xs text-amber-100">
                  {speechError}
                </div>
              ) : null}

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  ref={inputRef}
                  className="flex-1 rounded-2xl border border-neutral-800 bg-neutral-950/60 px-4 py-3 text-sm text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-neutral-600"
                  placeholder={
                    mode === "speak"
                      ? listening
                        ? "Listening…"
                        : "Press Speak and talk…"
                      : "Type a message…"
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onWriteClick();
                    }
                  }}
                  disabled={loading || listening}
                  autoCapitalize="sentences"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />

                <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
                  <button
                    className={`rbModeBtn ${mode === "speak" ? "rbModeActive" : ""}`}
                    onClick={onSpeakClick}
                    disabled={loading}
                    type="button"
                    title="Speak"
                  >
                    {listening ? "Stop" : "Speak"}
                  </button>

                  <button
                    className={`rbModeBtn rbPrimary ${
                      mode === "write" ? "rbModeActive" : ""
                    }`}
                    onClick={onWriteClick}
                    disabled={loading}
                    type="button"
                    title="Write"
                  >
                    Write
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {confirmOpen ? (
        <div className="rbModalLayer" role="dialog" aria-modal="true">
          <div className="rbModalCard">
            <div className="rbModalImg" aria-hidden="true" />
            <div className="rbModalTitle">Clear chat history?</div>
            <div className="rbModalText">
              This will permanently remove saved messages for <b>{avatar.name}</b>{" "}
              on this device.
            </div>

            <div className="rbModalBtns">
              <button
                type="button"
                className="rbModalBtn"
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rbModalBtn rbModalDanger"
                onClick={() => {
                  setConfirmOpen(false);
                  clearHistoryNow();
                }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx global>{`
        .rbSignature {
          position: fixed;
          right: 26px;
          bottom: 20px;
          z-index: 120;
          font-size: 18px;
          letter-spacing: 0.02em;
          color: rgba(255, 210, 120, 0.92);
          text-shadow: 0 2px 12px rgba(0, 0, 0, 0.75),
            0 0 18px rgba(255, 200, 90, 0.18);
          font-family: "Segoe Script", "Brush Script MT", "Snell Roundhand",
            cursive;
          user-select: none;
          pointer-events: none;
        }

        .rbBackdrop {
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          transform: scale(1.08);
          filter: blur(26px) saturate(1.08) contrast(1.02);
          opacity: 0.55;
        }

        .rbBackdropTint {
          background: radial-gradient(
            circle at 50% 45%,
            rgba(0, 0, 0, 0.08),
            rgba(0, 0, 0, 0.42) 72%,
            rgba(0, 0, 0, 0.62) 100%
          );
        }

        .rbBackBtn {
          border-radius: 999px;
          padding: 10px 16px;
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.92);
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.16);
          cursor: pointer;
          transition: transform 140ms ease, background 140ms ease,
            border-color 140ms ease, color 140ms ease;
          white-space: nowrap;
        }

        .rbBackBtn:hover {
          transform: translateY(-1px);
          background: rgba(255, 210, 120, 0.14);
          border-color: rgba(255, 210, 120, 0.28);
          color: rgba(255, 245, 230, 0.98);
        }

        .rbClearBtn {
          border-radius: 999px;
          padding: 10px 14px;
          font-size: 12px;
          color: rgba(255, 245, 230, 0.92);
          background: rgba(255, 210, 120, 0.1);
          border: 1px solid rgba(255, 210, 120, 0.18);
          backdrop-filter: blur(10px);
          cursor: pointer;
          transition: transform 140ms ease, background 140ms ease,
            border-color 140ms ease;
          white-space: nowrap;
        }

        .rbClearBtn:hover {
          transform: translateY(-1px);
          background: rgba(255, 210, 120, 0.14);
          border-color: rgba(255, 210, 120, 0.26);
        }

        .rbModeBtn {
          border-radius: 18px;
          padding: 12px 16px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.02em;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(0, 0, 0, 0.25);
          color: rgba(255, 255, 255, 0.9);
          cursor: pointer;
          transition: transform 140ms ease, background 140ms ease,
            border-color 140ms ease, opacity 140ms ease;
          min-width: 92px;
        }

        .rbModeBtn:hover:not(:disabled) {
          transform: translateY(-1px);
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .rbModeBtn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .rbModeBtn.rbPrimary {
          background: rgba(255, 255, 255, 0.92);
          color: rgba(10, 10, 12, 0.95);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .rbModeBtn.rbPrimary:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.85);
        }

        .rbModeActive {
          box-shadow: 0 0 0 2px rgba(255, 210, 120, 0.22),
            0 16px 40px rgba(0, 0, 0, 0.35);
          border-color: rgba(255, 210, 120, 0.28) !important;
        }

        .rbModalLayer {
          position: fixed;
          inset: 0;
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(0, 0, 0, 0.62);
          backdrop-filter: blur(8px);
        }

        .rbModalCard {
          width: min(520px, 92vw);
          border-radius: 28px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(10, 10, 12, 0.78);
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.65);
          overflow: hidden;
        }

        .rbModalImg {
          height: 140px;
          background-image:
            radial-gradient(
              circle at 30% 30%,
              rgba(255, 210, 120, 0.22),
              rgba(0, 0, 0, 0) 55%
            ),
            linear-gradient(180deg, rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.65)),
            url(/hero.png);
          background-size: cover;
          background-position: center;
          filter: saturate(1.1) contrast(1.05);
        }

        .rbModalTitle {
          padding: 16px 18px 0;
          font-size: 18px;
          font-weight: 750;
          letter-spacing: 0.01em;
        }

        .rbModalText {
          padding: 10px 18px 0;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.72);
          line-height: 1.5;
        }

        .rbModalBtns {
          padding: 16px 18px 18px;
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          flex-wrap: wrap;
        }

        .rbModalBtn {
          border-radius: 18px;
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 700;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.92);
          cursor: pointer;
          transition: transform 140ms ease, background 140ms ease,
            border-color 140ms ease;
        }

        .rbModalBtn:hover {
          transform: translateY(-1px);
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .rbModalDanger {
          background: rgba(255, 120, 120, 0.14);
          border-color: rgba(255, 120, 120, 0.22);
        }

        .rbModalDanger:hover {
          background: rgba(255, 120, 120, 0.18);
          border-color: rgba(255, 120, 120, 0.28);
        }

        @media (max-width: 1279px) {
          .rbSignature {
            right: 14px;
            bottom: 12px;
            font-size: 14px;
          }
        }
      `}</style>
    </main>
  );
}