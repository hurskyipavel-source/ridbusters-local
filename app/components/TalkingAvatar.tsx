"use client"

import { useEffect, useRef, useState } from "react"

type AvatarState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "error"

type Props = {
  avatarSrc: string
  state: AvatarState
  audio?: HTMLAudioElement | null
}

export default function TalkingAvatar({ avatarSrc, state, audio }: Props) {
  const [mouthOpen, setMouthOpen] = useState(false)
  const [blink, setBlink] = useState(false)

  const rafRef = useRef<number | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)

  useEffect(() => {
    let blinkTimer: number | null = null
    let closeTimer: number | null = null
    let cancelled = false

    const scheduleBlink = () => {
      const delay = 1800 + Math.random() * 2600

      blinkTimer = window.setTimeout(() => {
        if (cancelled) return

        setBlink(true)

        closeTimer = window.setTimeout(() => {
          if (cancelled) return
          setBlink(false)
          scheduleBlink()
        }, 140)
      }, delay)
    }

    scheduleBlink()

    return () => {
      cancelled = true
      if (blinkTimer !== null) window.clearTimeout(blinkTimer)
      if (closeTimer !== null) window.clearTimeout(closeTimer)
    }
  }, [])

  useEffect(() => {
    setMouthOpen(false)

    if (!audio) {
      cleanupAudio()
      return
    }

    const AudioCtx =
      window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

    if (!AudioCtx) {
      return
    }

    cleanupAudio()

    const ctx = new AudioCtx()
    ctxRef.current = ctx

    const source = ctx.createMediaElementSource(audio)
    sourceRef.current = source

    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.72
    analyserRef.current = analyser

    source.connect(analyser)
    analyser.connect(ctx.destination)

    const buffer = new Uint8Array(analyser.frequencyBinCount)

    const tick = () => {
      if (!analyserRef.current) return

      analyserRef.current.getByteFrequencyData(buffer)

      let sum = 0
      for (let i = 0; i < buffer.length; i++) {
        sum += buffer[i]
      }

      const avg = sum / buffer.length
      setMouthOpen(avg > 18)

      rafRef.current = window.requestAnimationFrame(tick)
    }

    const handlePlay = async () => {
      try {
        if (ctx.state === "suspended") {
          await ctx.resume()
        }
      } catch {}

      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
      }

      tick()
    }

    const handlePauseOrEnd = () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      setMouthOpen(false)
    }

    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePauseOrEnd)
    audio.addEventListener("ended", handlePauseOrEnd)

    if (!audio.paused) {
      handlePlay()
    }

    return () => {
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePauseOrEnd)
      audio.removeEventListener("ended", handlePauseOrEnd)
      cleanupAudio()
    }
  }, [audio])

  function cleanupAudio() {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    setMouthOpen(false)

    try {
      sourceRef.current?.disconnect()
    } catch {}
    sourceRef.current = null

    try {
      analyserRef.current?.disconnect()
    } catch {}
    analyserRef.current = null

    if (ctxRef.current) {
      try {
        ctxRef.current.close()
      } catch {}
      ctxRef.current = null
    }
  }

  return (
    <div className="rbAvatarRoot">
      <div className={`rbAvatarFrame state-${state}`}>
        <div className="rbAvatarGlow" />

        <img
          src={avatarSrc}
          className="rbAvatarImage"
          alt="avatar"
          draggable={false}
        />

        <div className={`rbEye rbEyeLeft ${blink ? "closed" : ""}`} />
        <div className={`rbEye rbEyeRight ${blink ? "closed" : ""}`} />

        <div className={`rbAvatarMouth ${mouthOpen ? "open" : ""}`} />
      </div>

      <style jsx>{`
        .rbAvatarRoot {
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .rbAvatarFrame {
          position: relative;
          width: min(100%, 360px);
          aspect-ratio: 4 / 5;
          border-radius: 28px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background:
            radial-gradient(
              circle at 50% 18%,
              rgba(255, 210, 120, 0.16),
              rgba(0, 0, 0, 0) 44%
            ),
            linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.04),
              rgba(255, 255, 255, 0.02)
            );
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.42);
          backdrop-filter: blur(10px);
        }

        .rbAvatarGlow {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(
            circle at 50% 18%,
            rgba(255, 210, 120, 0.12),
            rgba(0, 0, 0, 0) 45%
          );
          z-index: 1;
        }

        .rbAvatarImage {
          position: relative;
          z-index: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
          user-select: none;
          pointer-events: none;
          animation: rbBreath 4.2s ease-in-out infinite;
          will-change: transform;
        }

        .rbEye {
          position: absolute;
          top: 37%;
          width: 7%;
          height: 1.8%;
          border-radius: 999px;
          background: rgba(20, 14, 14, 0.72);
          z-index: 2;
          transition: transform 90ms ease, opacity 90ms ease, height 90ms ease;
          opacity: 0.55;
        }

        .rbEyeLeft {
          left: 35%;
        }

        .rbEyeRight {
          right: 35%;
        }

        .rbEye.closed {
          height: 0.35%;
          opacity: 0.92;
        }

        .rbAvatarMouth {
          position: absolute;
          left: 50%;
          bottom: 22%;
          transform: translateX(-50%);
          width: 13%;
          height: 1.7%;
          border-radius: 999px;
          background: rgba(30, 8, 10, 0.75);
          box-shadow:
            inset 0 1px 2px rgba(255, 255, 255, 0.1),
            0 2px 10px rgba(0, 0, 0, 0.22);
          z-index: 2;
          transition: height 80ms ease, width 80ms ease, opacity 80ms ease;
          opacity: 0.92;
        }

        .rbAvatarMouth.open {
          height: 4.8%;
          width: 12%;
        }

        .state-idle {
          box-shadow:
            0 24px 70px rgba(0, 0, 0, 0.42),
            0 0 0 rgba(255, 210, 120, 0);
        }

        .state-listening {
          border-color: rgba(120, 190, 255, 0.35);
          box-shadow:
            0 24px 70px rgba(0, 0, 0, 0.42),
            0 0 26px rgba(120, 190, 255, 0.18);
        }

        .state-thinking {
          border-color: rgba(255, 210, 120, 0.28);
          box-shadow:
            0 24px 70px rgba(0, 0, 0, 0.42),
            0 0 30px rgba(255, 210, 120, 0.16);
          filter: brightness(0.96);
        }

        .state-speaking {
          border-color: rgba(255, 170, 190, 0.28);
          box-shadow:
            0 24px 70px rgba(0, 0, 0, 0.42),
            0 0 34px rgba(255, 170, 190, 0.18);
        }

        .state-error {
          border-color: rgba(255, 110, 110, 0.32);
          box-shadow:
            0 24px 70px rgba(0, 0, 0, 0.42),
            0 0 30px rgba(255, 110, 110, 0.16);
        }

        @keyframes rbBreath {
          0% {
            transform: scale(1) translateY(0px);
          }
          50% {
            transform: scale(1.018) translateY(-2px);
          }
          100% {
            transform: scale(1) translateY(0px);
          }
        }
      `}</style>
    </div>
  )
}