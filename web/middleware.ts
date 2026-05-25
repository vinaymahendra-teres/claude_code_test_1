import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";

const PUBLIC_PATHS = ["/login"];
const PUBLIC_PREFIXES = ["/api/auth/", "/_next/", "/favicon.ico"];

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const session = await auth();
  if (!session?.user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, logo.jpg, fonts, icons, robots.txt
     */
    "/((?!_next/static|_next/image|favicon.ico|logo.jpg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
