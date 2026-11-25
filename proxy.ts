import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, isValidSession } from "@/lib/auth";

export function proxy(request: NextRequest) {
  if (isValidSession(request.cookies.get(AUTH_COOKIE)?.value)) {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico|apple-icon|manifest.webmanifest).*)"],
};
