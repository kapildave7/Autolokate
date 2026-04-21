import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { FEATURE_FLAGS } from "@/lib/features";
import { fetchSeoRedirect } from "@/lib/seo/seo-public-api";

/**
 * Optional: `GET /v1/seo/redirects/{path}` when `SEO_REDIRECT_LOOKUP=true` and `SEO_REDIRECT_PREFIXES` matches.
 */
async function maybeSeoRedirect(request: NextRequest): Promise<NextResponse | null> {
  if (process.env.SEO_REDIRECT_LOOKUP !== "true") return null;
  if (request.method !== "GET") return null;
  const raw = process.env.SEO_REDIRECT_PREFIXES ?? "";
  const prefixes = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (!prefixes.length) return null;

  const pathname = request.nextUrl.pathname;
  const match = prefixes.some((p) => {
    if (p === "/") return true;
    return pathname === p || pathname.startsWith(`${p}/`);
  });
  if (!match) return null;

  const redir = await fetchSeoRedirect(pathname).catch(() => null);
  if (!redir) return null;
  const target = redir.destination.startsWith("http")
    ? redir.destination
    : new URL(redir.destination, request.nextUrl.origin).toString();
  return NextResponse.redirect(target, redir.permanent ? 308 : 307);
}

/**
 * Marketplace routes disabled — Autolokate is a research platform only.
 * UI and page modules remain in the repo but are not reachable.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/sell")) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (pathname.startsWith("/used-cars")) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (pathname.startsWith("/new-cars")) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (!FEATURE_FLAGS.dealersEnabled && pathname.startsWith("/companies")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const seo = await maybeSeoRedirect(request);
  if (seo) return seo;

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/sell",
    "/sell/:path*",
    "/used-cars",
    "/used-cars/:path*",
    "/new-cars",
    "/new-cars/:path*",
    "/companies",
    "/companies/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
