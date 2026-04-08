import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { ADMIN_SESSION_COOKIE_NAME } from "@/lib/admin/constants";

const intlMiddleware = createMiddleware(routing);
const DEFAULT_SESSION_SECRET = "change-me-before-production";

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  const binary = atob(`${normalized}${padding}`);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function compareSignatures(left, right) {
  if (!left || !right || left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }

  return true;
}

async function createSignature(encodedPayload) {
  const secret = process.env.ADMIN_SESSION_SECRET || DEFAULT_SESSION_SECRET;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(encodedPayload)
  );

  const base64 = btoa(
    String.fromCharCode(...new Uint8Array(signatureBuffer))
  );

  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function hasValidAdminSession(token) {
  if (!token || !token.includes(".")) {
    return false;
  }

  const [encodedPayload, providedSignature] = token.split(".");

  if (!encodedPayload || !providedSignature) {
    return false;
  }

  const expectedSignature = await createSignature(encodedPayload);

  if (!compareSignatures(providedSignature, expectedSignature)) {
    return false;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload));
    return Boolean(payload?.username && payload?.expiresAt > Date.now());
  } catch {
    return false;
  }
}

export default async function middleware(request) {
  const response = intlMiddleware(request);
  const { pathname } = request.nextUrl;
  const segments = pathname.split("/").filter(Boolean);
  const locale = segments[0];
  const isPanelRoute = segments[1] === "panel";
  const isLoginRoute = segments[2] === "login";

  if (isPanelRoute && !isLoginRoute) {
    const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;

    if (!(await hasValidAdminSession(sessionCookie))) {
      const redirectResponse = NextResponse.redirect(
        new URL(`/${locale}/panel/login`, request.url)
      );
      redirectResponse.cookies.delete(ADMIN_SESSION_COOKIE_NAME);
      return redirectResponse;
    }
  }

  return response;
}
 
export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
};
