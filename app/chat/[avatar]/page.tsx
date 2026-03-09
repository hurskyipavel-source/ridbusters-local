"use client";

import { use, useMemo, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AVATARS, type AvatarId } from "@/app/lib/avatars";

type Props = {
  params: Promise<{ avatar: string }>;
};

type Msg = { role: "user" | "assistant"; content: string };

function storageKey(avatarId: string) {
  return `ridbusters.chat.${avatarId}`;
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

      if ((role === "user" || role === "assistant") && typeof content === "string") {
        cleaned.push({ role, content });
      }
    }

    return cleaned;
  } catch {
    return [];
  }
}

type Mode = "write" | "speak";

export default function ChatPage({ params }: Props) {
  const router = useRouter();

  const resolved = use(params);
  const avatarId = (resolved.avatar || "").toLowerCase().trim() as AvatarId;
  const avatar = useMemo(() => AVATARS[avatarId] ?? null, [avatarId]);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [mode, setMode] = useState<Mode>("write");
  const [listening, setListening] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);

  const listRef = useRef<HTMLDivElement | null>(null);
  const recogRef = useRef<any>(null);
  const speakBufferRef = useRef<string>("");

  const setBackFlags = () => {
    try {
      sessionStorage.setItem("ridbusters.skipIntroOnce", "1");
      sessionStorage.setItem("ridbusters.unlocked", "1");
      sessionStorage.setItem("ridbusters.lastView", "avatars");
      sessionStorage.setItem("ridbusters.fromChatBack", "1");
    } catch {}
  };

  const goBack = () => {
    setBackFlags();
    router.replace("/?v=avatars&from=chat");
  };

  useEffect(() => {
    setBackFlags();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = storageKey(avatarId);
    const restored = safeParseMessages(window.localStorage.getItem(key));
    if (restored.length > 0) setMessages(restored);
  }, [avatarId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = storageKey(avatarId);
    window.localStorage.setItem(key, JSON.stringify(messages));
  }, [messages, avatarId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: 999999, behavior: "smooth" });
  }, [messages, loading]);

  if (!avatar) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-50 p-10">
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
            transition: transform 140ms ease, background 140ms ease, border-color 140ms ease, color 140ms ease;
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
            text-shadow: 0 2px 12px rgba(0, 0, 0, 0.75), 0 0 18px rgba(255, 200, 90, 0.18);
            font-family: "Segoe Script", "Brush Script MT", "Snell Roundhand", cursive;
            user-select: none;
            pointer-events: none;
          }
        `}</style>
      </main>
    );
  }

  function clearHistoryNow() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(storageKey(avatarId));
    setMessages([]);
  }

  async function sendText(textRaw: string) {
    const text = textRaw.trim();
    if (!text || loading) return;

    const newMessages: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarId, messages: newMessages }),
    });

    const data = await res.json();
    const reply = String(data.reply ?? "").trim();

    const finalMessages: Msg[] = [...newMessages, { role: "assistant", content: reply || "(empty reply)" }];
    setMessages(finalMessages);
    setLoading(false);
  }

  async function onWriteClick() {
    if (mode !== "write") setMode("write");
    const t = input;
    setInput("");
    await sendText(t);
  }

  function stopRecognition() {
    try {
      recogRef.current?.stop?.();
    } catch {}
    setListening(false);
  }

  function startRecognition() {
    if (typeof window === "undefined") return;

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SR) {
      setMode("write");
      setInput("SpeechRecognition is not supported in this browser.");
      return;
    }

    if (!recogRef.current) {
      const r = new SR();
      r.lang = "en-US";
      r.continuous = false;
      r.interimResults = true;
      r.maxAlternatives = 1;

      r.onstart = () => {
        speakBufferRef.current = "";
        setListening(true);
      };

      r.onresult = (e: any) => {
        let interim = "";
        let final = "";

        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i];
          const transcript = String(res[0]?.transcript ?? "");
          if (res.isFinal) final += transcript;
          else interim += transcript;
        }

        const combined = (final || interim).trim();
        speakBufferRef.current = combined;
        setInput(combined);
      };

      r.onerror = () => {
        setListening(false);
      };

      r.onend = async () => {
        const finalText = (speakBufferRef.current || "").trim();
        setListening(false);

        if (finalText) {
          setInput("");
          await sendText(finalText);
        }
      };

      recogRef.current = r;
    }

    try {
      recogRef.current.start();
    } catch {}
  }

  async function onSpeakClick() {
    setMode("speak");

    if (listening) {
      stopRecognition();
      return;
    }

    startRecognition();
  }

  useEffect(() => {
    return () => {
      try {
        recogRef.current?.stop?.();
      } catch {}
    };
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-neutral-50">
      <div className="absolute inset-0">
        <div className="absolute inset-0 rbBackdrop" style={{ backgroundImage: `url(/hero.png)` }} />
        <div className="absolute inset-0 rbBackdropTint" />
      </div>

      <div className="rbSignature">Powered by P. M. Hursky</div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-6">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button type="button" onClick={goBack} className="rbBackBtn">
              Back
            </button>

            <div className="h-10 w-px bg-neutral-800" />

            <img
              src={avatar.avatarSrc}
              alt={avatar.name}
              className="h-14 w-14 rounded-3xl object-cover object-top ring-1 ring-white/10"
            />

            <div>
              <h1 className="text-lg font-semibold leading-tight">{avatar.name}</h1>
              <p className="text-xs text-neutral-300/70">{avatar.tagline}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
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

        <div className="mt-5">
          <section className="overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900/30">
            <div ref={listRef} className="h-[68vh] space-y-3 overflow-y-auto p-5">
              {messages.length === 0 ? (
                <div className="text-sm text-neutral-300/70">Start the conversation with {avatar.name}.</div>
              ) : null}

              {messages.map((m, idx) => (
                <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ring-1 ${
                      m.role === "user"
                        ? "bg-white text-neutral-950 ring-white/10"
                        : "bg-neutral-950/40 text-neutral-100 ring-white/10"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  </div>
                </div>
              ))}

              {loading ? (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-neutral-950/40 px-4 py-3 text-sm text-neutral-300 ring-1 ring-white/10">
                    Thinking…
                  </div>
                </div>
              ) : null}
            </div>

            <div className="border-t border-neutral-800 p-4">
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-2xl border border-neutral-800 bg-neutral-950/60 px-4 py-3 text-sm text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-neutral-600"
                  placeholder={
                    mode === "speak" ? (listening ? "Listening…" : "Press Speak and talk…") : "Type a message…"
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onWriteClick();
                  }}
                  disabled={loading || (mode === "speak" && listening)}
                />

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
                  className={`rbModeBtn rbPrimary ${mode === "write" ? "rbModeActive" : ""}`}
                  onClick={onWriteClick}
                  disabled={loading}
                  type="button"
                  title="Write"
                >
                  Write
                </button>
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
              This will permanently remove saved messages for <b>{avatar.name}</b> on this device.
            </div>

            <div className="rbModalBtns">
              <button type="button" className="rbModalBtn" onClick={() => setConfirmOpen(false)}>
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
          text-shadow: 0 2px 12px rgba(0, 0, 0, 0.75), 0 0 18px rgba(255, 200, 90, 0.18);
          font-family: "Segoe Script", "Brush Script MT", "Snell Roundhand", cursive;
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
          transition: transform 140ms ease, background 140ms ease, border-color 140ms ease, color 140ms ease;
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
          transition: transform 140ms ease, background 140ms ease, border-color 140ms ease;
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
          transition: transform 140ms ease, background 140ms ease, border-color 140ms ease;
          min-width: 92px;
        }

        .rbModeBtn:hover {
          transform: translateY(-1px);
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .rbModeBtn.rbPrimary {
          background: rgba(255, 255, 255, 0.92);
          color: rgba(10, 10, 12, 0.95);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .rbModeBtn.rbPrimary:hover {
          background: rgba(255, 255, 255, 0.85);
        }

        .rbModeActive {
          box-shadow: 0 0 0 2px rgba(255, 210, 120, 0.22), 0 16px 40px rgba(0, 0, 0, 0.35);
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
            radial-gradient(circle at 30% 30%, rgba(255, 210, 120, 0.22), rgba(0, 0, 0, 0) 55%),
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
          transition: transform 140ms ease, background 140ms ease, border-color 140ms ease;
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
      `}</style>
    </main>
  );
}