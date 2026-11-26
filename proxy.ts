import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, PRIVATE_COOKIE, PRIVATE_SCOPE, isValidSession } from "@/lib/auth";

export function proxy(request: NextRequest) {
  if (isValidSession(request.cookies.get(AUTH_COOKIE)?.value)) {
    const response = NextResponse.next();
    // Mens private vaner er låst op, må service workeren ikke gemme siderne til offline-brug.
    if (isValidSession(request.cookies.get(PRIVATE_COOKIE)?.value, PRIVATE_SCOPE)) {
      response.headers.set("x-lawejo-private", "1");
    }
    return response;
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico|apple-icon|manifest.webmanifest|sw.js).*)"],
};
