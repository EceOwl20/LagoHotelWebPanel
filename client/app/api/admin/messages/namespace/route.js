import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  readNamespaceBundle,
  updateNamespaceBundle,
} from "@/lib/admin/messages";
import { CMS_LOCALES } from "@/lib/admin/constants";
import { getAdminSession } from "@/lib/admin/session";
import {
  assertSameOrigin,
  consumeRateLimit,
  getClientIp,
} from "@/lib/admin/security";

export async function GET(request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
  }

  const namespace = request.nextUrl.searchParams.get("namespace");

  if (!namespace) {
    return NextResponse.json({ error: "Namespace zorunludur." }, { status: 400 });
  }

  const bundle = await readNamespaceBundle(namespace);
  return NextResponse.json({ namespace, bundle });
}

export async function PUT(request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
  }

  try {
    assertSameOrigin(request);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 403 });
  }

  const rateLimit = consumeRateLimit({
    key: `admin-write:messages:${getClientIp(request)}`,
    limit: 120,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Cok hizli istek gonderildi. Lutfen tekrar deneyin." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const { namespace, bundle } = await request.json();

  if (!namespace || !bundle || typeof bundle !== "object") {
    return NextResponse.json(
      { error: "Namespace ve bundle alanları zorunludur." },
      { status: 400 }
    );
  }

  const updatedBundle = await updateNamespaceBundle(namespace, bundle);

  for (const locale of CMS_LOCALES) {
    revalidatePath(`/${locale}`, "layout");
  }

  return NextResponse.json({ namespace, bundle: updatedBundle });
}
