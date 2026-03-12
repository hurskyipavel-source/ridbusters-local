import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/app/lib/auth";

const PUBLIC_PATHS = [
  "/unlock",
  "/api/auth/login",
  "/api/auth/logout",
];

const PUBLIC_PREFIXES = [
  "/_next/",
  "/images/",
  "/icons/",
  "/sounds/",
  "/videos/",
  "/avatars/",
];

function isStaticAsset(pathname: string) {
  return /\.(png|jpg|jpeg|webp|gif|svg|ico|mp3|wav|mp4|webm|txt|xml|json)$/i.test(
    pathname
  );
}

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname === "/favicon.ico") return true;
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
  if (isStaticAsset(pathname)) return true;
  return false;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const isValid = await verifySessionToken(token);

  if (isValid) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/unlock", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};