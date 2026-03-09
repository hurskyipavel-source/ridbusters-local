"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  videoSrc: string;
  onDone: () => void;
};

export default function IntroVideo({ videoSrc, onDone }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [closing, setClosing] = useState(false);
  const [needManualPlay, setNeedManualPlay] = useState(false);

  const finishedRef = useRef(false);
  const startedRef = useRef(false);
  const doneTimerRef = useRef<number | null>(null);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    setNeedManualPlay(false);
    setClosing(true);

    const v = videoRef.current;
    if (v) {
      try {
        v.pause();
      } catch {}
      try {
        if (Number.isFinite(v.duration) && v.duration > 0) {
          v.currentTime = Math.max(0, v.duration - 0.05);
        }
      } catch {}
    }

    if (doneTimerRef.current) window.clearTimeout(doneTimerRef.current);
    doneTimerRef.current = window.setTimeout(() => {
      onDone();
    }, 900);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    try {
      v.preload = "auto";
      v.playsInline = true;
      v.load();
    } catch {}

    const tryPlay = () => {
      if (startedRef.current) return;
      startedRef.current = true;

      try {
        v.currentTime = 0;
      } catch {}

      try {
        v.muted = false;
        v.volume = 1.0;

        const p = v.play();
        if (p && typeof (p as any).catch === "function") {
          (p as any).catch(() => setNeedManualPlay(true));
        }
      } catch {
        setNeedManualPlay(true);
      }

      window.setTimeout(() => {
        const vv = videoRef.current;
        if (!vv) return;
        if (!finishedRef.current && vv.paused) setNeedManualPlay(true);
      }, 550);
    };

    window.setTimeout(tryPlay, 0);

    return () => {
      if (doneTimerRef.current) window.clearTimeout(doneTimerRef.current);
    };
  }, []);

  const manualPlay = () => {
    setNeedManualPlay(false);
    const v = videoRef.current;
    if (!v) return;

    try {
      const p = v.play();
      if (p && typeof (p as any).catch === "function") {
        (p as any).catch(() => setNeedManualPlay(true));
      }
    } catch {
      setNeedManualPlay(true);
    }
  };

  return (
    <>
      <div className={`fixed inset-0 z-[90] ${closing ? "rbIntroClosing" : ""}`}>
        <video
          ref={videoRef}
          src={videoSrc}
          className="h-full w-full object-cover"
          playsInline
          preload="auto"
          onEnded={finish}
          onError={() => {
            setNeedManualPlay(false);
            finish();
          }}
        />

        <div className="absolute inset-0 rbIntroVignette pointer-events-none" />
        <div className="absolute inset-0 rbIntroGrain pointer-events-none" />

        {/* SIGNATURE */}
        <div className="rbSignatureIntro">Powered by P. M. Hursky</div>

        {needManualPlay ? (
          <div className="absolute inset-0 z-[96] flex items-center justify-center">
            <button type="button" onClick={manualPlay} className="rbMiniPlay" aria-label="Play intro" title="Play">
              ▶
            </button>
          </div>
        ) : null}

        <div className="absolute right-4 top-4 z-[97]">
          <button type="button" onClick={finish} className="rbSkipBtn">
            Skip
          </button>
        </div>
      </div>

      <style jsx global>{`
        .rbSignatureIntro {
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

        .rbSkipBtn {
          border-radius: 999px;
          padding: 8px 12px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.92);
          background: rgba(255, 255, 255, 0.10);
          border: 1px solid rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          cursor: pointer;
          transition: background 160ms ease, border-color 160ms ease;
        }
        .rbSkipBtn:hover {
          background: rgba(255, 255, 255, 0.14);
          border-color: rgba(255, 255, 255, 0.22);
        }

        .rbMiniPlay {
          height: 72px;
          width: 72px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(0, 0, 0, 0.28);
          color: rgba(255, 255, 255, 0.92);
          font-size: 22px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
          box-shadow: 0 18px 60px rgba(0, 0, 0, 0.55);
          cursor: pointer;
          transition: transform 180ms ease, background 180ms ease;
        }
        .rbMiniPlay:hover {
          transform: scale(1.03);
          background: rgba(0, 0, 0, 0.34);
        }

        .rbIntroVignette {
          background: radial-gradient(
            circle at center,
            rgba(0, 0, 0, 0.10) 0%,
            rgba(0, 0, 0, 0.55) 70%,
            rgba(0, 0, 0, 0.84) 100%
          );
        }

        .rbIntroGrain {
          background-image: radial-gradient(rgba(255, 255, 255, 0.022) 1px, transparent 1px);
          background-size: 3px 3px;
          mix-blend-mode: overlay;
          opacity: 0.55;
        }

        .rbIntroClosing {
          animation: rbCinematicOutro 900ms ease-in-out forwards;
          will-change: transform, opacity, filter;
        }

        @keyframes rbCinematicOutro {
          0% {
            opacity: 1;
            transform: scale(1);
            filter: blur(0px);
          }
          60% {
            opacity: 1;
            transform: scale(1.03);
            filter: blur(1px);
          }
          100% {
            opacity: 0;
            transform: scale(1.07);
            filter: blur(6px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .rbIntroClosing {
            animation: none !important;
          }
        }
      `}</style>
    </>
  );
}