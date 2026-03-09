"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AVATARS } from "@/app/lib/avatars";
import IntroVideo from "@/app/components/IntroVideo";

type ViewState = "landing" | "intro" | "avatars";

type Bokeh = {
  id: string;
  left: string;
  top: string;
  size: number;
  blur: number;
  opacity: number;
  dur: number;
  delay: number;
  driftX: number;
  driftY: number;
};

type CardAnim = {
  dealt: boolean;
  flipped: boolean;
};

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function createSfx() {
  let ctx: AudioContext | null = null;

  const getCtx = () => {
    if (ctx) return ctx;
    const AC = (window.AudioContext ||
      (window as any).webkitAudioContext) as typeof AudioContext;
    ctx = new AC();
    return ctx;
  };

  const noiseBuffer = (c: AudioContext, duration = 0.08) => {
    const len = Math.max(1, Math.floor(c.sampleRate * duration));
    const b = c.createBuffer(1, len, c.sampleRate);
    const data = b.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    return b;
  };

  const cardDeal = () => {
    const c = getCtx();
    const t = c.currentTime;

    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, 0.06);

    const hp = c.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.setValueAtTime(900, t);

    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);

    src.connect(hp);
    hp.connect(g);
    g.connect(c.destination);

    src.start(t);
    src.stop(t + 0.07);
  };

  const cardFlip = () => {
    const c = getCtx();
    const t = c.currentTime;

    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, 0.12);

    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(1400, t);
    bp.Q.setValueAtTime(0.7, t);

    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.26, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);

    src.connect(bp);
    bp.connect(g);
    g.connect(c.destination);

    const osc = c.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(420, t + 0.02);

    const g2 = c.createGain();
    g2.gain.setValueAtTime(0.0001, t + 0.02);
    g2.gain.exponentialRampToValueAtTime(0.12, t + 0.03);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);

    osc.connect(g2);
    g2.connect(c.destination);

    src.start(t);
    src.stop(t + 0.13);

    osc.start(t + 0.02);
    osc.stop(t + 0.09);
  };

  return { cardDeal, cardFlip };
}

export default function HomePage() {
  const HERO_SRC = "/hero.png";
  const HERO_LIGHTS = "/hero_lights.png";
  const INTRO_SRC = "/intro.mp4";
  const BOOK_COVER_SRC = "/hardCover.png";
  const AMAZON_BOOK_URL =
    "https://www.amazon.com/Ridbusters-thrilling-underground-discoveries-RIDBUSTERSTM-ebook/dp/B0FMYVRF9G/ref=sr_1_1?crid=2M411B0518ZJF&dib=eyJ2IjoiMSJ9.UFL_RfpXJXD-b9Xxy7H8uA.jBtnKKHtTeABCS0Mla4pPNFD8aea9UDZSlkQI9NYj9U&dib_tag=se&keywords=ridbusters&qid=1772819809&sprefix=rodbusters%2Caps%2C281&sr=8-1";

  const avatars = useMemo(() => Object.values(AVATARS), []);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<ViewState>("landing");
  const [qp, setQp] = useState("");
  const [from, setFrom] = useState("");

  const rootRef = useRef<HTMLElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const introWarmRef = useRef<HTMLVideoElement | null>(null);

  const totalCards = 4;
  const deckRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  const [cards, setCards] = useState<CardAnim[]>(
    Array.from({ length: totalCards }, () => ({ dealt: false, flipped: false }))
  );
  const [animReady, setAnimReady] = useState(false);
  const [animRunning, setAnimRunning] = useState(false);

  const sfxRef = useRef<ReturnType<typeof createSfx> | null>(null);
  const hoverVideoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  const bokeh = useMemo<Bokeh[]>(() => {
    const arr: Bokeh[] = [];
    const count = 44;

    for (let i = 0; i < count; i++) {
      const size = Math.round(rand(6, 22));
      arr.push({
        id: `b${i}-${Math.random().toString(16).slice(2)}`,
        left: `${rand(2, 98)}%`,
        top: `${rand(2, 98)}%`,
        size,
        blur: rand(0.6, 2.6),
        opacity: rand(0.1, 0.4),
        dur: rand(7, 16),
        delay: rand(0, 8),
        driftX: rand(-30, 30),
        driftY: rand(-40, 40),
      });
    }

    return arr;
  }, []);

  const items = useMemo(() => {
    const firstThree = avatars
      .slice(0, 3)
      .map((a) => ({ kind: "avatar" as const, a }));
    const book = { kind: "book" as const };
    return [...firstThree, book];
  }, [avatars]);

  const forceAvatars = from === "chat" || qp === "avatars";
  const effectiveView: ViewState = forceAvatars ? "avatars" : view;

  const computeDeltas = () => {
    const deck = deckRef.current;
    if (!deck) return;

    const dr = deck.getBoundingClientRect();
    const deckX = dr.left + dr.width / 2;
    const deckY = dr.top + dr.height / 2;

    for (let i = 0; i < totalCards; i++) {
      const el = cardRefs.current[i];
      if (!el) continue;

      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;

      const dx = deckX - cx;
      const dy = deckY - cy;

      const cdx = clamp(dx, -900, 900);
      const cdy = clamp(dy, -700, 700);

      el.style.setProperty("--fromX", `${cdx}px`);
      el.style.setProperty("--fromY", `${cdy}px`);
    }
  };

  const primeHoverVideos = async () => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (mq?.matches) return;

    const vids = Object.values(hoverVideoRefs.current).filter(
      Boolean
    ) as HTMLVideoElement[];

    for (const v of vids) {
      try {
        v.muted = true;
        v.playsInline = true;
        v.preload = "auto";
        await v.play();
        v.pause();
        v.currentTime = 0;
      } catch {}
    }
  };

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      setQp((params.get("v") || "").toLowerCase());
      setFrom((params.get("from") || "").toLowerCase());
    } catch {
      setQp("");
      setFrom("");
    }
  }, []);

  useEffect(() => {
    if (from === "chat") {
      setView("avatars");
      setReady(true);
      return;
    }

    let skip = false;
    try {
      skip = sessionStorage.getItem("ridbusters.skipIntroOnce") === "1";
      sessionStorage.removeItem("ridbusters.skipIntroOnce");
    } catch {}

    let lastView: string | null = null;
    try {
      lastView = sessionStorage.getItem("ridbusters.lastView");
    } catch {}

    if (qp === "avatars") {
      setView("avatars");
      try {
        sessionStorage.setItem("ridbusters.lastView", "avatars");
      } catch {}
    } else if (skip || lastView === "avatars") {
      setView("avatars");
    } else {
      setView("landing");
    }

    setReady(true);
  }, [from, qp]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (mq?.matches) return;

    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;

    const tick = () => {
      rafRef.current = null;
      cx += (tx - cx) * 0.07;
      cy += (ty - cy) * 0.07;
      el.style.setProperty("--px", String(cx));
      el.style.setProperty("--py", String(cy));
    };

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      tx = (x - 0.5) * 2;
      ty = (y - 0.5) * 2;

      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;

    const v = introWarmRef.current;
    if (!v) return;

    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (mq?.matches) return;

    const warm = async () => {
      try {
        v.muted = true;
        v.playsInline = true;
        v.preload = "auto";
        await v.play();
        v.pause();
        v.currentTime = 0;
      } catch {}
    };

    const t = window.setTimeout(() => {
      warm();
    }, 120);

    return () => {
      window.clearTimeout(t);
    };
  }, [ready]);

  useEffect(() => {
    if (effectiveView !== "avatars") return;

    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const reduce = mq?.matches;

    sfxRef.current = createSfx();

    setCards(
      Array.from({ length: totalCards }, () => ({ dealt: false, flipped: false }))
    );
    setAnimReady(false);
    setAnimRunning(false);

    const t1 = window.setTimeout(() => {
      computeDeltas();
      setAnimReady(true);

      window.setTimeout(() => {
        primeHoverVideos();
      }, 200);

      if (reduce) {
        setCards(
          Array.from({ length: totalCards }, () => ({
            dealt: true,
            flipped: true,
          }))
        );
        return;
      }

      const run = async () => {
        setAnimRunning(true);

        await new Promise((r) => setTimeout(r, 250));

        for (let i = 0; i < totalCards; i++) {
          setCards((prev) => {
            const next = prev.slice();
            next[i] = { ...next[i], dealt: true };
            return next;
          });

          try {
            sfxRef.current?.cardDeal();
          } catch {}

          await new Promise((r) => setTimeout(r, 260));
        }

        await new Promise((r) => setTimeout(r, 260));

        for (let i = 0; i < totalCards; i++) {
          setCards((prev) => {
            const next = prev.slice();
            next[i] = { ...next[i], flipped: true };
            return next;
          });

          try {
            sfxRef.current?.cardFlip();
          } catch {}

          await new Promise((r) => setTimeout(r, 310));
        }

        setAnimRunning(false);
      };

      run();
    }, 80);

    const onResize = () => {
      if (effectiveView !== "avatars") return;
      computeDeltas();
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.clearTimeout(t1);
      window.removeEventListener("resize", onResize);
    };
  }, [effectiveView]);

  function startIntro() {
    setView("intro");
    try {
      sessionStorage.setItem("ridbusters.lastView", "intro");
    } catch {}
  }

  function finishIntro() {
    setView("avatars");
    try {
      sessionStorage.setItem("ridbusters.lastView", "avatars");
    } catch {}
  }

  const onHoverEnter = async (id: string) => {
    const v = hoverVideoRefs.current[id];
    if (!v) return;
    try {
      v.currentTime = 0;
      await v.play();
    } catch {}
  };

  const onHoverLeave = (id: string) => {
    const v = hoverVideoRefs.current[id];
    if (!v) return;
    try {
      v.pause();
      v.currentTime = 0;
    } catch {}
  };

  if (!ready) return <main className="min-h-screen bg-neutral-950" />;

  return (
    <main
      ref={rootRef}
      className="relative min-h-screen overflow-hidden bg-black text-white"
    >
      <video
        ref={introWarmRef}
        className="rbIntroWarm"
        src={INTRO_SRC}
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      />

      <div className="absolute inset-0">
        <div
          className="absolute inset-0 rbBackdrop"
          style={{ backgroundImage: `url(${HERO_SRC})` }}
        />
        <div className="absolute inset-0 rbBackdropTint" />
      </div>

      <div className="rbSignature">Powered by P. M. Hursky</div>

      <div className="pointer-events-none absolute inset-0 z-[4]">
        {bokeh.map((p) => (
          <span
            key={p.id}
            className="rbBokeh"
            style={{
              left: p.left,
              top: p.top,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: p.opacity,
              filter: `blur(${p.blur}px)`,
              animationDuration: `${p.dur}s`,
              animationDelay: `${p.delay}s`,
              transform: `translate(-50%, -50%)`,
              ["--dx" as any]: `${p.driftX}px`,
              ["--dy" as any]: `${p.driftY}px`,
            }}
          />
        ))}
      </div>

      {effectiveView === "intro" ? (
        <IntroVideo videoSrc={INTRO_SRC} onDone={finishIntro} />
      ) : null}

      {effectiveView === "landing" ? (
        <div className="relative z-10 h-screen w-screen">
          <div
            className="rbHero rbHeroBase"
            style={{ backgroundImage: `url(${HERO_SRC})` }}
          />
          <div
            className="rbHero rbHeroLights"
            style={{ backgroundImage: `url(${HERO_LIGHTS})` }}
          />
          <div
            className="rbHero rbHeroLights rbHeroLightsHot"
            style={{ backgroundImage: `url(${HERO_LIGHTS})` }}
          />
          <div className="rbOverlay" />

          <button
            type="button"
            onClick={startIntro}
            className="rbWelcomeBtn"
            aria-label="Welcome"
          >
            <span className="rbWelcomeText">Welcome</span>
            <span className="rbWelcomeShine" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {effectiveView === "avatars" ? (
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-10">
          <div className="relative mb-6 h-0">
            <div ref={deckRef} className="rbDeckAnchor" aria-hidden="true" />
          </div>

          <section className="mt-2 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((it, i) => {
              const state = cards[i] ?? { dealt: false, flipped: false };
              const isDealt = state.dealt;
              const isFlipped = state.flipped;

              const wrapClass =
                "rbDealWrap" +
                (animReady ? " rbReady" : "") +
                (isDealt ? " rbDealt" : "") +
                (animRunning ? " rbRunning" : "");

              const innerClass = "rbFlipInner" + (isFlipped ? " rbFaceUp" : "");

              const commonBack = (
                <div className="rbCardFace rbBack" aria-hidden="true">
                  <div className="rbBackFrame" />
                  <div className="rbBackPattern" />
                  <div className="rbBackMedallion" />
                  <div className="rbBackTitle">Ridbusters</div>
                </div>
              );

              const cardFront =
                it.kind === "avatar" ? (
                  <div className="rbCardFace rbFront">
                    <div className="rbCardShell relative h-full overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900/45 p-5 transition hover:border-neutral-700 hover:bg-neutral-900/65">
                      <span className="rbCardSheen" aria-hidden="true" />
                      <span className="rbCardGlow" aria-hidden="true" />

                      <div className="relative flex h-full flex-col">
                        <div className="flex items-center gap-3">
                          <img
                            src={it.a.avatarSrc}
                            alt={it.a.name}
                            className="h-11 w-11 rounded-2xl object-cover object-top ring-1 ring-white/10"
                          />
                          <div>
                            <div className="text-base font-semibold">{it.a.name}</div>
                            <div className="text-xs text-neutral-400">
                              {it.a.tagline ?? it.a.id}
                            </div>
                          </div>
                        </div>

                        <div
                          className="rbMediaBox mt-4 overflow-hidden rounded-2xl ring-1 ring-white/10"
                          onMouseEnter={() => onHoverEnter(it.a.id)}
                          onMouseLeave={() => onHoverLeave(it.a.id)}
                        >
                          <video
                            ref={(n) => {
                              hoverVideoRefs.current[it.a.id] = n;
                            }}
                            className="rbHoverVideo"
                            src={it.a.videoSrc}
                            muted
                            playsInline
                            loop
                            preload="auto"
                            poster={it.a.imageSrc}
                          />
                          <img
                            src={it.a.imageSrc}
                            alt={it.a.name}
                            className="rbHoverPoster"
                          />
                        </div>

                        <p className="mt-4 text-sm text-neutral-300">
                          {it.a.description}
                        </p>

                        <div className="mt-auto flex items-center justify-between pt-5">
                          <span className="text-xs text-neutral-500">
                            Click to chat →
                          </span>
                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-neutral-200 ring-1 ring-white/10">
                            Local AI
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rbCardFace rbFront">
                    <div className="rbCardShell relative h-full overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900/45 p-5 transition hover:border-neutral-700 hover:bg-neutral-900/65">
                      <span className="rbCardSheen" aria-hidden="true" />
                      <span className="rbCardGlow" aria-hidden="true" />

                      <div className="relative flex h-full flex-col">
                        <div className="flex items-center gap-3">
                          <img
                            src={BOOK_COVER_SRC}
                            alt="Ridbusters book"
                            className="h-11 w-11 rounded-2xl object-cover object-center ring-1 ring-white/10"
                          />
                          <div>
                            <div className="text-base font-semibold">Ridbusters Book</div>
                            <div className="text-xs text-neutral-400">
                              Official story, original adventure.
                            </div>
                          </div>
                        </div>

                        <div className="rbMediaBox rbBookMediaBox mt-4 overflow-hidden rounded-2xl ring-1 ring-white/10">
                          <img
                            src={BOOK_COVER_SRC}
                            alt="Ridbusters: Mission London book cover"
                            className="rbBookPoster"
                          />
                          <div className="rbBookOverlay" />
                        </div>

                        <p className="mt-4 text-sm text-neutral-300 rbBookTextBlock">
                          Read the original story on Amazon.
                        </p>

                        <div className="mt-auto pt-3">
                          <a
                            href={AMAZON_BOOK_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rbBuyBtnGold"
                          >
                            <span className="rbBuyBtnGoldText">Buy on Amazon</span>
                            <span className="rbBuyBtnGoldGlow" aria-hidden="true" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );

              const Container: any = it.kind === "avatar" ? Link : "div";

              const containerProps =
                it.kind === "avatar"
                  ? {
                      href: `/chat/${it.a.id}`,
                      className: "group block",
                      onClick: () => {
                        try {
                          sessionStorage.setItem("ridbusters.skipIntroOnce", "1");
                          sessionStorage.setItem("ridbusters.lastView", "avatars");
                        } catch {}
                      },
                    }
                  : { className: "group block" };

              return (
                <Container
                  key={it.kind === "avatar" ? it.a.id : "book"}
                  {...containerProps}
                >
                  <div
                    ref={(n) => {
                      cardRefs.current[i] = n;
                    }}
                    className={wrapClass}
                    style={{
                      ["--stack" as any]: `${(totalCards - 1 - i) * 2}px`,
                      ["--rot" as any]: `${(i - 1.5) * 2.2}deg`,
                    }}
                  >
                    <div className={innerClass}>
                      {cardFront}
                      {commonBack}
                    </div>
                  </div>
                </Container>
              );
            })}
          </section>
        </div>
      ) : null}

      <style jsx global>{`
        .rbIntroWarm {
          position: fixed;
          width: 1px;
          height: 1px;
          left: -9999px;
          top: -9999px;
          opacity: 0;
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

        .rbHero {
          position: absolute;
          inset: 0;
          width: 100vw;
          height: 100vh;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          transform: translate(calc(var(--px, 0) * -6px), calc(var(--py, 0) * -6px));
          will-change: transform;
          user-select: none;
          pointer-events: none;
        }

        .rbHeroBase {
          z-index: 2;
        }

        .rbHeroLights {
          z-index: 3;
          mix-blend-mode: screen;
          opacity: 0.72;
          filter: saturate(1.35) contrast(1.3) brightness(1.3) blur(0.6px);
          animation: rbLightsBreath 6.45s ease-in-out infinite;
          will-change: opacity, filter;
        }

        .rbHeroLightsHot {
          z-index: 4;
          mix-blend-mode: screen;
          opacity: 0.55;
          filter: brightness(2.15) contrast(1.5) saturate(1.55) blur(1.8px)
            drop-shadow(0 0 10px rgba(255, 205, 120, 0.22))
            drop-shadow(0 0 26px rgba(255, 190, 90, 0.14));
          animation: rbLightsBloom 6.45s ease-in-out infinite;
          will-change: opacity, filter;
        }

        @keyframes rbLightsBreath {
          0% {
            opacity: 0.46;
            filter: saturate(1.2) contrast(1.18) brightness(1.05) blur(0.55px);
          }
          50% {
            opacity: 0.92;
            filter: saturate(1.55) contrast(1.42) brightness(2.05) blur(0.85px);
          }
          100% {
            opacity: 0.46;
            filter: saturate(1.2) contrast(1.18) brightness(1.05) blur(0.55px);
          }
        }

        @keyframes rbLightsBloom {
          0% {
            opacity: 0.28;
            filter: brightness(1.55) contrast(1.35) saturate(1.35) blur(1.6px)
              drop-shadow(0 0 8px rgba(255, 205, 120, 0.14))
              drop-shadow(0 0 18px rgba(255, 190, 90, 0.1));
          }
          50% {
            opacity: 0.95;
            filter: brightness(3.1) contrast(1.65) saturate(1.7) blur(2.1px)
              drop-shadow(0 0 14px rgba(255, 210, 130, 0.34))
              drop-shadow(0 0 38px rgba(255, 195, 95, 0.22));
          }
          100% {
            opacity: 0.28;
            filter: brightness(1.55) contrast(1.35) saturate(1.35) blur(1.6px)
              drop-shadow(0 0 8px rgba(255, 205, 120, 0.14))
              drop-shadow(0 0 18px rgba(255, 190, 90, 0.1));
          }
        }

        .rbOverlay {
          position: absolute;
          inset: 0;
          z-index: 5;
          pointer-events: none;
          background: radial-gradient(
            circle at 50% 48%,
            rgba(0, 0, 0, 0.02),
            rgba(0, 0, 0, 0.12) 62%,
            rgba(0, 0, 0, 0.18) 100%
          );
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
          font-family: "Segoe Script", "Brush Script MT", "Snell Roundhand", cursive;
          user-select: none;
          pointer-events: none;
        }

        .rbWelcomeBtn {
          position: absolute;
          left: 50%;
          top: 78%;
          transform: translate(-50%, -50%);
          padding: 14px 36px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.22);
          background: rgba(18, 16, 14, 0.3);
          backdrop-filter: blur(12px);
          box-shadow: 0 18px 48px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(0, 0, 0, 0.22) inset;
          cursor: pointer;
          overflow: hidden;
          z-index: 12;
          min-width: min(520px, calc(100vw - 48px));
          max-width: 760px;
        }

        .rbWelcomeText {
          position: relative;
          z-index: 2;
          display: inline-block;
          font-size: clamp(30px, 3.1vw, 46px);
          letter-spacing: 0.02em;
          color: rgba(255, 245, 230, 0.96);
          text-shadow: 0 2px 18px rgba(0, 0, 0, 0.55);
          font-family: "Segoe Script", "Brush Script MT", "Snell Roundhand", cursive;
          font-weight: 600;
        }

        .rbWelcomeShine {
          position: absolute;
          inset: -40% -30%;
          background: linear-gradient(
            115deg,
            transparent 0%,
            rgba(255, 215, 120, 0) 35%,
            rgba(255, 215, 120, 0.22) 45%,
            rgba(255, 215, 120, 0) 55%,
            transparent 100%
          );
          transform: translateX(-40%);
          animation: rbShine 3.2s ease-in-out infinite;
          opacity: 0.85;
        }

        @keyframes rbShine {
          0% {
            transform: translateX(-55%);
          }
          45% {
            transform: translateX(5%);
          }
          100% {
            transform: translateX(60%);
          }
        }

        .rbBokeh {
          position: absolute;
          border-radius: 999px;
          background: radial-gradient(
            circle at 35% 35%,
            rgba(255, 230, 160, 0.92),
            rgba(255, 180, 70, 0.5) 45%,
            rgba(255, 150, 40, 0.1) 70%,
            transparent 78%
          );
          box-shadow: 0 0 24px rgba(255, 190, 80, 0.16);
          mix-blend-mode: screen;
          animation-name: rbBokehFloat;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          will-change: transform, opacity;
        }

        @keyframes rbBokehFloat {
          0% {
            transform: translate(-50%, -50%) translate(0px, 0px);
            opacity: 0.1;
          }
          20% {
            opacity: 0.4;
          }
          55% {
            transform: translate(-50%, -50%) translate(var(--dx), var(--dy));
            opacity: 0.18;
          }
          85% {
            opacity: 0.45;
          }
          100% {
            transform: translate(-50%, -50%) translate(0px, 0px);
            opacity: 0.12;
          }
        }

        .rbDeckAnchor {
          position: absolute;
          left: 50%;
          top: 0px;
          width: 70px;
          height: 94px;
          transform: translate(-50%, -18px);
          opacity: 0;
          pointer-events: none;
        }

        .rbDealWrap {
          width: 100%;
          aspect-ratio: 3 / 4;
          border-radius: 24px;
          perspective: 1200px;
          -webkit-perspective: 1200px;
          opacity: 0;
          transform: translate3d(0px, 0px, 0px);
          filter: blur(0px);
          will-change: transform, opacity, filter;
        }

        .rbDealWrap.rbReady:not(.rbDealt) {
          opacity: 1;
          transform: translate3d(
              var(--fromX, 0px),
              calc(var(--fromY, 0px) + var(--stack, 0px)),
              0px
            )
            rotateZ(var(--rot, 0deg)) scale(0.98);
          filter: blur(0.6px);
        }

        .rbDealWrap.rbReady.rbDealt {
          opacity: 1;
          transform: translate3d(0px, 0px, 0px) rotateZ(0deg) scale(1);
          filter: blur(0px);
          transition: transform 720ms cubic-bezier(0.16, 1, 0.3, 1),
            filter 720ms cubic-bezier(0.16, 1, 0.3, 1),
            opacity 240ms ease;
        }

        .rbFlipInner {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          -webkit-transform-style: preserve-3d;
          transform: rotateX(180deg);
          transition: transform 820ms cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform;
        }

        .rbFlipInner.rbFaceUp {
          transform: rotateX(0deg);
        }

        .rbCardFace {
          position: absolute;
          inset: 0;
          border-radius: 24px;
          overflow: hidden;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        .rbFront {
          transform: rotateX(0deg);
        }

        .rbBack {
          transform: rotateX(180deg);
        }

        .rbBack {
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: radial-gradient(circle at 50% 35%, rgba(255, 210, 130, 0.12), rgba(0, 0, 0, 0) 55%),
            radial-gradient(circle at 20% 70%, rgba(120, 190, 255, 0.08), rgba(0, 0, 0, 0) 60%),
            radial-gradient(circle at 80% 75%, rgba(255, 160, 90, 0.06), rgba(0, 0, 0, 0) 62%),
            linear-gradient(180deg, rgba(16, 14, 12, 0.92), rgba(10, 10, 12, 0.94));
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.55),
            inset 0 0 0 1px rgba(255, 255, 255, 0.06);
        }

        .rbBackFrame {
          position: absolute;
          inset: 12px;
          border-radius: 18px;
          border: 1px solid rgba(255, 215, 140, 0.18);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
          opacity: 0.92;
        }

        .rbBackPattern {
          position: absolute;
          inset: 20px;
          border-radius: 16px;
          background: radial-gradient(circle at 30% 25%, rgba(255, 215, 140, 0.1), rgba(0, 0, 0, 0) 44%),
            radial-gradient(circle at 70% 75%, rgba(120, 190, 255, 0.08), rgba(0, 0, 0, 0) 46%),
            repeating-linear-gradient(
              135deg,
              rgba(255, 215, 140, 0) 0px,
              rgba(255, 215, 140, 0) 10px,
              rgba(255, 215, 140, 0.06) 10px,
              rgba(255, 215, 140, 0.06) 11px
            );
          opacity: 0.55;
          mix-blend-mode: screen;
        }

        .rbBackMedallion {
          position: absolute;
          left: 50%;
          top: 48%;
          width: 54px;
          height: 54px;
          transform: translate(-50%, -50%) rotate(45deg);
          border-radius: 10px;
          background: radial-gradient(circle at 35% 35%, rgba(255, 230, 170, 0.18), rgba(0, 0, 0, 0) 60%);
          border: 1px solid rgba(255, 215, 140, 0.2);
          box-shadow: 0 0 22px rgba(255, 205, 120, 0.12),
            inset 0 0 0 1px rgba(255, 255, 255, 0.06);
          opacity: 0.9;
        }

        .rbBackTitle {
          position: absolute;
          left: 50%;
          bottom: 22px;
          transform: translateX(-50%);
          font-size: 26px;
          letter-spacing: 0.02em;
          color: rgba(255, 210, 120, 0.92);
          text-shadow: 0 2px 12px rgba(0, 0, 0, 0.75),
            0 0 18px rgba(255, 200, 90, 0.18);
          font-family: "Segoe Script", "Brush Script MT", "Snell Roundhand", cursive;
          user-select: none;
          pointer-events: none;
          opacity: 0.98;
        }

        .rbCardShell {
          height: 100%;
          transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease, background 220ms ease;
        }

        .group:hover .rbCardShell {
          transform: translateY(-6px) scale(1.012);
          box-shadow: 0 28px 70px rgba(0, 0, 0, 0.42),
            0 0 0 1px rgba(255, 255, 255, 0.04) inset;
        }

        .rbCardSheen {
          position: absolute;
          inset: -40%;
          background: linear-gradient(
            110deg,
            transparent 0%,
            rgba(255, 215, 130, 0) 35%,
            rgba(255, 215, 130, 0.16) 46%,
            rgba(255, 215, 130, 0) 56%,
            transparent 100%
          );
          transform: translateX(-60%);
          opacity: 0;
          pointer-events: none;
          animation: rbCardSheenIn 1400ms ease-in-out forwards;
          mix-blend-mode: screen;
        }

        @keyframes rbCardSheenIn {
          0% {
            transform: translateX(-65%);
            opacity: 0;
          }
          55% {
            opacity: 0;
          }
          78% {
            opacity: 0.65;
          }
          100% {
            transform: translateX(65%);
            opacity: 0;
          }
        }

        .rbCardGlow {
          position: absolute;
          inset: -1px;
          border-radius: 26px;
          pointer-events: none;
          background: radial-gradient(circle at 30% 20%, rgba(255, 210, 130, 0.14), rgba(255, 210, 130, 0) 45%),
            radial-gradient(circle at 70% 80%, rgba(120, 190, 255, 0.09), rgba(0, 0, 0, 0) 52%);
          opacity: 0.55;
          filter: blur(10px);
          transition: opacity 500ms ease, filter 500ms ease;
          mix-blend-mode: screen;
        }

        .group:hover .rbCardGlow {
          opacity: 0.85;
          filter: blur(12px);
        }

        .rbMediaBox {
          position: relative;
          height: 224px;
          flex-shrink: 0;
        }

        .rbBookMediaBox {
          height: 172px;
        }

        .rbHoverVideo,
        .rbHoverPoster,
        .rbBookPoster {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: opacity 260ms ease, transform 260ms ease;
        }

        .rbHoverVideo {
          opacity: 0;
          object-position: top;
        }

        .rbHoverPoster {
          opacity: 1;
          object-position: top;
        }

        .rbBookPoster {
          opacity: 1;
          object-position: center top;
          transform: scale(1.01);
        }

        .group:hover .rbHoverVideo {
          opacity: 1;
        }

        .group:hover .rbHoverPoster {
          opacity: 0;
        }

        .group:hover .rbBookPoster {
          transform: scale(1.04);
        }

        .rbBookOverlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(0, 0, 0, 0.02) 0%,
            rgba(0, 0, 0, 0.08) 45%,
            rgba(0, 0, 0, 0.18) 100%
          );
          pointer-events: none;
        }

        .rbBookTextBlock {
          min-height: 44px;
        }

        .rbBuyBtnGold {
          position: relative;
          display: flex;
          width: 100%;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-radius: 16px;
          padding: 13px 16px;
          text-decoration: none;
          border: 1px solid rgba(255, 220, 140, 0.5);
          background: linear-gradient(
            180deg,
            rgba(255, 225, 150, 0.96) 0%,
            rgba(245, 193, 86, 0.96) 45%,
            rgba(196, 138, 33, 0.96) 100%
          );
          box-shadow: 0 10px 26px rgba(0, 0, 0, 0.34),
            0 0 0 1px rgba(255, 246, 210, 0.2) inset,
            0 0 24px rgba(255, 196, 72, 0.18);
          transition: transform 180ms ease, box-shadow 180ms ease, filter 180ms ease;
          min-height: 48px;
          visibility: visible;
          opacity: 1;
        }

        .rbBuyBtnGold:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.38),
            0 0 0 1px rgba(255, 246, 210, 0.26) inset,
            0 0 32px rgba(255, 196, 72, 0.26);
          filter: saturate(1.06) brightness(1.02);
        }

        .rbBuyBtnGoldText {
          position: relative;
          z-index: 2;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #2f1c05;
          text-shadow: 0 1px 0 rgba(255, 244, 210, 0.42);
        }

        .rbBuyBtnGoldGlow {
          position: absolute;
          inset: -20% -30%;
          background: linear-gradient(
            115deg,
            transparent 0%,
            rgba(255, 255, 255, 0) 36%,
            rgba(255, 249, 220, 0.45) 49%,
            rgba(255, 255, 255, 0) 62%,
            transparent 100%
          );
          transform: translateX(-55%);
          animation: rbGoldSweep 3s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes rbGoldSweep {
          0% {
            transform: translateX(-55%);
          }
          50% {
            transform: translateX(8%);
          }
          100% {
            transform: translateX(62%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .rbBokeh,
          .rbHeroLights,
          .rbHeroLightsHot,
          .rbWelcomeShine,
          .rbBuyBtnGoldGlow {
            animation: none !important;
          }

          .rbHero {
            transform: none !important;
          }

          .rbDealWrap {
            opacity: 1 !important;
            transform: none !important;
            filter: none !important;
          }

          .rbFlipInner {
            transform: rotateX(0deg) !important;
            transition: none !important;
          }

          .rbBookPoster {
            transform: none !important;
          }
        }
      `}</style>
    </main>
  );
}