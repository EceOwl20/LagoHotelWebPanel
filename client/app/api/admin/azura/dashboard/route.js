import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    namespaceCount: 14,
    categoryCount: 0,
    imageCount: 0,
    postCount: 0,
    pages: [],
    latestPostTitle: null,
  });
}