import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  getSessionMaxAge,
  isValidPassword,
  SESSION_COOKIE,
} from "@/app/lib/auth";

type AttemptRecord = {
  fails: number;
  blockedUntil: number;
  lastFailAt: number;
};

const attempts = new Map<string, AttemptRecord>();

const MAX_FAILS = 5;
const BLOCK_MINUTES = 10;
const FAIL_WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = BLOCK_MINUTES * 60 * 1000;

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

function getAttemptState(ip: string) {
  const now = Date.now();
  const current = attempts.get(ip);

  if (!current) {
    return { fails: 0, blockedUntil: 0, lastFailAt: 0 };
  }

  if (current.lastFailAt && now - current.lastFailAt > FAIL_WINDOW_MS) {
    const resetState = { fails: 0, blockedUntil: 0, lastFailAt: 0 };
    attempts.set(ip, resetState);
    return resetState;
  }

  return current;
}

function registerFailure(ip: string) {
  const now = Date.now();
  const current = getAttemptState(ip);

  const nextFails = current.fails + 1;
  const blockedUntil =
    nextFails >= MAX_FAILS ? now + BLOCK_MS : current.blockedUntil;

  const nextState: AttemptRecord = {
    fails: nextFails,
    blockedUntil,
    lastFailAt: now,
  };

  attempts.set(ip, nextState);
  return nextState;
}

function clearFailures(ip: string) {
  attempts.delete(ip);
}

function getRetryAfterSeconds(blockedUntil: number) {
  const msLeft = blockedUntil - Date.now();
  return Math.max(1, Math.ceil(msLeft / 1000));
}

function cleanupOldAttempts() {
  const now = Date.now();

  for (const [ip, record] of attempts.entries()) {
    const expiredBlock = record.blockedUntil > 0 && record.blockedUntil < now;
    const expiredFailWindow =
      record.lastFailAt > 0 && now - record.lastFailAt > FAIL_WINDOW_MS;

    if (expiredBlock || expiredFailWindow) {
      attempts.delete(ip);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    cleanupOldAttempts();

    const ip = getClientIp(request);
    const state = getAttemptState(ip);
    const now = Date.now();

    if (state.blockedUntil && state.blockedUntil > now) {
      const retryAfter = getRetryAfterSeconds(state.blockedUntil);

      return NextResponse.json(
        {
          ok: false,
          error: `Too many attempts. Try again in about ${Math.ceil(
            retryAfter / 60
          )} minute(s).`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
          },
        }
      );
    }

    const body = await request.json().catch(() => null);
    const password = typeof body?.password === "string" ? body.password : "";

    if (!password || !isValidPassword(password)) {
      const nextState = registerFailure(ip);

      if (nextState.blockedUntil && nextState.blockedUntil > Date.now()) {
        const retryAfter = getRetryAfterSeconds(nextState.blockedUntil);

        return NextResponse.json(
          {
            ok: false,
            error: `Too many attempts. Try again in about ${Math.ceil(
              retryAfter / 60
            )} minute(s).`,
          },
          {
            status: 429,
            headers: {
              "Retry-After": String(retryAfter),
            },
          }
        );
      }

      return NextResponse.json(
        {
          ok: false,
          error: "Invalid password",
          attemptsLeft: Math.max(0, MAX_FAILS - nextState.fails),
        },
        { status: 401 }
      );
    }

    clearFailures(ip);

    const token = await createSessionToken();
    const response = NextResponse.json({ ok: true });

    response.cookies.set({
      name: SESSION_COOKIE,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: getSessionMaxAge(),
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}