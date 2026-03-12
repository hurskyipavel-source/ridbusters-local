"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
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

  const keyTap = () => {
    const c = getCtx();
    const t = c.currentTime;

    const osc = c.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(1280, t);
    osc.frequency.exponentialRampToValueAtTime(960, t + 0.03);

    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);

    const hp = c.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.setValueAtTime(700, t);

    osc.connect(hp);
    hp.connect(g);
    g.connect(c.destination);

    osc.start(t);
    osc.stop(t + 0.05);
  };

  const keyBackspace = () => {
    const c = getCtx();
    const t = c.currentTime;

    const osc = c.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(540, t);
    osc.frequency.exponentialRampToValueAtTime(380, t + 0.05);

    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.045, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);

    osc.connect(g);
    g.connect(c.destination);

    osc.start(t);
    osc.stop(t + 0.06);
  };

  return { keyTap, keyBackspace };
}

export default function UnlockPage() {
  const HERO_SRC = "/hero.png";
  const HERO_LIGHTS = "/hero_lights.png";
  const CODE_LEN = 5;

  const [ready, setReady] = useState(false);
  const [code, setCode] = useState("");
  const [codeErr, setCodeErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [nextUrl, setNextUrl] = useState("/");

  const rootRef = useRef<HTMLElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);
  const uiSfxRef = useRef<ReturnType<typeof createSfx> | null>(null);

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

  const activeIndex = Math.min(code.length, CODE_LEN - 1);

  const focusHidden = () => {
    window.setTimeout(() => {
      try {
        hiddenInputRef.current?.focus();
      } catch {}
    }, 0);
  };

  const submitCode = async () => {
    if (loading) return;

    const password = code.trim().toUpperCase();
    if (!password) return;

    setLoading(true);
    setCodeErr(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setCodeErr(typeof data?.error === "string" ? data.error : "Wrong code");
        setCode("");
        setLoading(false);
        focusHidden();
        return;
      }

      window.location.href = nextUrl || "/";
    } catch {
      setCodeErr("Login failed");
      setCode("");
      setLoading(false);
      focusHidden();
    }
  };

  useEffect(() => {
    uiSfxRef.current = createSfx();
    setReady(true);
  }, []);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next") || "/";
      setNextUrl(next.startsWith("/") ? next : "/");
    } catch {
      setNextUrl("/");
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => focusHidden(), 0);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === "Enter") {
        e.preventDefault();
        submitCode();
        return;
      }

      if (e.key === "Backspace") {
        e.preventDefault();
        if (loading) return;
        setCodeErr(null);
        setCode((prev) => prev.slice(0, -1));
        try {
          uiSfxRef.current?.keyBackspace();
        } catch {}
        return;
      }

      if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        if (loading) return;

        const ch = e.key.toUpperCase();
        setCodeErr(null);

        setCode((prev) => {
          if (prev.length >= CODE_LEN) {
            try {
              uiSfxRef.current?.keyTap();
            } catch {}
            return ch;
          }

          try {
            uiSfxRef.current?.keyTap();
          } catch {}
          return prev + ch;
        });
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [loading, nextUrl]);

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

  if (!ready) {
    return <main className="min-h-screen bg-black" />;
  }

  return (
    <main
      ref={rootRef}
      className="relative min-h-screen overflow-hidden bg-black text-white"
    >
      <div className="absolute inset-0">
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

      <div
        className="rbLockLayer"
        role="dialog"
        aria-modal="true"
        onPointerDown={focusHidden}
      >
        <div className="rbLockCard" onPointerDown={focusHidden}>
          <div className="rbLockTop">
            <div className="rbLockIcon" aria-hidden="true">
              <div className="rbLockRing" />
              <div className="rbLockBody" />
              <div className="rbLockKeyhole" />
            </div>
            <div className="rbLockTitle">Enter access code</div>
            <div className="rbLockSub">Ridbusters private portal</div>
          </div>

          <div className="rbCodeRow" onPointerDown={focusHidden}>
            {Array.from({ length: CODE_LEN }).map((_, i) => {
              const ch = code[i] ?? "";
              const isFilled = i < code.length;
              const isActive = i === activeIndex && code.length < CODE_LEN;

              return (
                <div
                  key={i}
                  className={
                    "rbCodeCell" +
                    (isFilled ? " rbCodeFilled" : "") +
                    (isActive ? " rbCodeActive" : "")
                  }
                >
                  {ch}
                </div>
              );
            })}
          </div>

          <input
            ref={hiddenInputRef}
            className="rbHiddenInput"
            value={code}
            onChange={() => {}}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitCode();
            }}
            autoFocus
            inputMode="text"
            aria-label="Access code"
          />

          {codeErr ? (
            <div className="rbLockErr">{codeErr}</div>
          ) : loading ? (
            <div className="rbLockHint">Checking access...</div>
          ) : (
            <div className="rbLockHint">Code has 5 letters.</div>
          )}

          <button
            type="button"
            className="rbEnterBtn"
            onClick={submitCode}
            disabled={loading || code.trim().length === 0}
          >
            {loading ? "CHECKING..." : "ENTER"}
          </button>
        </div>
      </div>

      <style jsx global>{`
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

        .rbLockLayer {
          position: absolute;
          inset: 0;
          z-index: 40;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          background: rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(6px);
        }

        .rbLockCard {
          width: min(520px, 92vw);
          border-radius: 28px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(10, 10, 12, 0.72);
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.65);
          padding: 22px 22px 18px;
        }

        .rbLockTop {
          text-align: center;
        }

        .rbLockTitle {
          margin-top: 10px;
          font-size: 22px;
          font-weight: 650;
          letter-spacing: 0.02em;
        }

        .rbLockSub {
          margin-top: 6px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.55);
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .rbLockIcon {
          margin: 0 auto;
          width: 72px;
          height: 72px;
          position: relative;
          filter: drop-shadow(0 0 18px rgba(255, 200, 90, 0.18));
        }

        .rbLockRing {
          position: absolute;
          left: 50%;
          top: 6px;
          width: 40px;
          height: 30px;
          transform: translateX(-50%);
          border-radius: 18px 18px 10px 10px;
          border: 2px solid rgba(255, 210, 120, 0.65);
          background: rgba(255, 210, 120, 0.06);
        }

        .rbLockBody {
          position: absolute;
          left: 50%;
          bottom: 8px;
          width: 52px;
          height: 44px;
          transform: translateX(-50%);
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: radial-gradient(circle at 35% 30%, rgba(255, 210, 120, 0.16), rgba(0, 0, 0, 0) 55%),
            linear-gradient(180deg, rgba(18, 16, 14, 0.85), rgba(10, 10, 12, 0.92));
        }

        .rbLockKeyhole {
          position: absolute;
          left: 50%;
          bottom: 22px;
          width: 10px;
          height: 16px;
          transform: translateX(-50%);
          border-radius: 6px;
          background: rgba(255, 210, 120, 0.7);
          box-shadow: 0 0 12px rgba(255, 200, 90, 0.22);
        }

        .rbCodeRow {
          margin-top: 16px;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
        }

        .rbCodeCell {
          height: 52px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(0, 0, 0, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: rgba(255, 245, 230, 0.96);
          user-select: none;
          position: relative;
          text-transform: uppercase;
        }

        .rbCodeCell.rbCodeFilled {
          border-color: rgba(255, 210, 120, 0.22);
          background: rgba(255, 210, 120, 0.06);
        }

        .rbCodeCell.rbCodeActive {
          border-color: rgba(255, 210, 120, 0.46);
          box-shadow: 0 0 0 2px rgba(255, 210, 120, 0.18),
            0 18px 40px rgba(0, 0, 0, 0.35);
          background: rgba(255, 210, 120, 0.08);
        }

        .rbCodeCell.rbCodeActive::after {
          content: "";
          position: absolute;
          width: 2px;
          height: 20px;
          border-radius: 2px;
          background: rgba(255, 245, 230, 0.9);
          box-shadow: 0 0 12px rgba(255, 210, 120, 0.22);
          animation: rbCaretBlink 1s steps(1) infinite;
        }

        @keyframes rbCaretBlink {
          0% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }

        .rbHiddenInput {
          position: fixed;
          left: -9999px;
          top: -9999px;
          width: 1px;
          height: 1px;
          opacity: 0;
          color: transparent;
          background: transparent;
          border: none;
          outline: none;
          caret-color: transparent;
        }

        .rbLockHint {
          margin-top: 10px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          text-align: center;
        }

        .rbLockErr {
          margin-top: 10px;
          font-size: 12px;
          color: rgba(255, 130, 120, 0.95);
          text-align: center;
        }

        .rbEnterBtn {
          margin-top: 14px;
          width: 100%;
          border-radius: 18px;
          padding: 12px 14px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(255, 210, 120, 0.12);
          color: rgba(255, 245, 230, 0.95);
          cursor: pointer;
          transition: transform 140ms ease, background 140ms ease, border-color 140ms ease,
            opacity 140ms ease;
        }

        .rbEnterBtn:hover:not(:disabled) {
          transform: translateY(-1px);
          background: rgba(255, 210, 120, 0.16);
          border-color: rgba(255, 210, 120, 0.26);
        }

        .rbEnterBtn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          .rbSignature {
            right: 14px;
            bottom: 12px;
            font-size: 14px;
          }

          .rbLockCard {
            width: min(520px, 94vw);
            border-radius: 24px;
            padding: 18px 16px 16px;
          }

          .rbLockTitle {
            font-size: 20px;
          }

          .rbLockSub {
            font-size: 11px;
          }

          .rbCodeRow {
            gap: 8px;
          }

          .rbCodeCell {
            height: 48px;
            font-size: 16px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .rbBokeh,
          .rbHeroLights,
          .rbHeroLightsHot {
            animation: none !important;
          }

          .rbHero {
            transform: none !important;
          }

          .rbCodeCell.rbCodeActive::after {
            animation: none !important;
            opacity: 1;
          }
        }
      `}</style>
    </main>
  );
}