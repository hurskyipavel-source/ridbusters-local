import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/app/lib/auth";

const PUBLIC_PATHS = [
  "/unlock",
  "/api/auth/login",
  "/api/auth/logout",
];

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;

  if (pathname.startsWith("/_next/")) return true;
  if (pathname.startsWith("/favicon")) return true;
  if (pathname.startsWith("/images/")) return true;
  if (pathname.startsWith("/icons/")) return true;
  if (pathname.startsWith("/sounds/")) return true;
  if (pathname.startsWith("/videos/")) return true;
  if (pathname.startsWith("/avatars/")) return true;
  if (pathname.match(/\.(png|jpg|jpeg|webp|gif|svg|ico|mp3|wav|mp4|webm)$/i)) {
    return true;
  }

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