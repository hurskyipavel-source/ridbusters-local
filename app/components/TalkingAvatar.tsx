"use client"

import { useEffect, useState } from "react"

export type AvatarState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "error"

type Props = {
  avatarSrc: string
  state: AvatarState
}

export default function TalkingAvatar({ avatarSrc, state }: Props) {
  const [blink, setBlink] = useState(false)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setBlink(true)

      window.setTimeout(() => {
        setBlink(false)
      }, 140)
    }, 3200)

    return () => window.clearInterval(interval)
  }, [])

  return (
    <div className={`rbAvatarRoot state-${state}`}>
      <div className="rbAvatarGlow" />

      <div className="rbAvatarFrame">
        <img
          src={avatarSrc}
          alt="avatar"
          className={`rbAvatarImage ${blink ? "rbBlink" : ""}`}
          draggable={false}
        />
      </div>

      <style jsx>{`
        .rbAvatarRoot {
          position: relative;
          width: 100%;
        }

        .rbAvatarGlow {
          position: absolute;
          inset: -12px;
          border-radius: 34px;
          filter: blur(24px);
          pointer-events: none;
          transition: all 180ms ease;
        }

        .rbAvatarFrame {
          position: relative;
          width: 100%;
          max-width: 360px;
          margin: 0 auto;
          aspect-ratio: 4 / 5;
          overflow: hidden;
          border-radius: 28px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.03);
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.42);
        }

        .rbAvatarImage {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
          user-select: none;
          pointer-events: none;
          animation: rbFloat 5.6s ease-in-out infinite;
          transition: filter 120ms ease, transform 180ms ease;
        }

        .rbBlink {
          filter: brightness(0.97);
        }

        .state-idle .rbAvatarGlow {
          background: radial-gradient(
            circle at 50% 35%,
            rgba(255, 210, 120, 0.16),
            rgba(0, 0, 0, 0) 62%
          );
        }

        .state-listening .rbAvatarGlow {
          background: radial-gradient(
            circle at 50% 35%,
            rgba(120, 190, 255, 0.22),
            rgba(0, 0, 0, 0) 62%
          );
        }

        .state-thinking .rbAvatarGlow {
          background: radial-gradient(
            circle at 50% 35%,
            rgba(255, 210, 120, 0.26),
            rgba(0, 0, 0, 0) 62%
          );
        }

        .state-speaking .rbAvatarGlow {
          background: radial-gradient(
            circle at 50% 35%,
            rgba(255, 160, 190, 0.24),
            rgba(0, 0, 0, 0) 62%
          );
          animation: rbPulse 1.15s ease-in-out infinite;
        }

        .state-error .rbAvatarGlow {
          background: radial-gradient(
            circle at 50% 35%,
            rgba(255, 100, 100, 0.22),
            rgba(0, 0, 0, 0) 62%
          );
        }

        .state-speaking .rbAvatarImage {
          transform: scale(1.02);
        }

        .state-listening .rbAvatarImage {
          transform: scale(1.01);
        }

        @keyframes rbFloat {
          0% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-6px) scale(1.02);
          }
          100% {
            transform: translateY(0px) scale(1);
          }
        }

        @keyframes rbPulse {
          0% {
            opacity: 0.8;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  )
}