import { NextResponse } from "next/server";
import { listBlogPosts } from "@/lib/admin/blog";
import { readMediaLibrary } from "@/lib/admin/media-library";
import { listPageDrafts } from "@/lib/admin/pages";
import {
  prepareSearchDocument,
  rankSearchDocuments,
} from "@/lib/admin/panel-search.mjs";
import { hasPanelPermission, PANEL_PERMISSIONS } from "@/lib/admin/permissions.mjs";
import { getAdminSession } from "@/lib/admin/session";
import { listPanelUsers } from "@/lib/admin/users";

export const dynamic = "force-dynamic";

const MAX_QUERY_LENGTH = 100;
const MAX_RESULTS = 24;
const mediaSearchDocumentsByAssets = new WeakMap();

const panelDestinations = [
  ["dashboard", "Dashboard", "Genel bakış ve panel özeti", "/panel/dashboard"],
  ["pages", "Dinamik sayfalar", "Taslak ve yayınlanan sayfalar", "/panel/sayfalar"],
  ["contents", "Sayfa içerikleri", "Sabit sayfaların içerik alanları", "/panel/icerikler"],
  ["media", "Medya kütüphanesi", "Yüklenen görseller ve dosyalar", "/panel/medya"],
  ["gallery", "Galeri", "Galeri kategorileri ve görselleri", "/panel/galeri"],
  ["blog", "Blog", "Blog yazıları ve haberler", "/panel/blog"],
];

function createMediaSearchDocuments(assets) {
  const cachedDocuments = mediaSearchDocumentsByAssets.get(assets);

  if (cachedDocuments) return cachedDocuments;

  const documents = assets.map((asset) =>
    prepareSearchDocument({
      id: `media:${asset.id}`,
      type: "media",
      title: asset.name,
      description: asset.folder || "Ana medya klasörü",
      href: `/panel/medya?asset=${encodeURIComponent(asset.id)}`,
      thumbnail: asset.url,
      searchFields: [
        { value: asset.name, weight: 4 },
        { value: asset.folder, weight: 2 },
        { value: asset.extension, weight: 1 },
      ],
    })
  );

  mediaSearchDocumentsByAssets.set(assets, documents);
  return documents;
}

function createSearchDocuments({ pages, posts, assets, users, canManageUsers }) {
  const destinations = canManageUsers
    ? [...panelDestinations, ["users", "Kullanıcılar", "Panel kullanıcıları ve yetkileri", "/panel/kullanicilar"]]
    : panelDestinations;

  return [
    ...destinations.map(([id, title, description, href]) => ({
      id: `destination:${id}`,
      type: "destination",
      title,
      description,
      href,
      searchFields: [
        { value: title, weight: 3 },
        { value: description, weight: 1 },
      ],
    })),
    ...pages.map((page) => ({
      id: `page:${page.id}`,
      type: "page",
      title: page.title,
      description: page.status === "published" ? "Yayında" : "Yayın bekleyen taslak",
      href: `/panel/sayfalar/${page.id}`,
      status: page.status,
      searchFields: [
        { value: page.title, weight: 4 },
        { value: Object.values(page.slugs || {}).join(" "), weight: 3 },
        { value: page.status === "published" ? "yayında published" : "taslak draft", weight: 1 },
      ],
    })),
    ...posts.map((post) => ({
      id: `blog:${post.slug}`,
      type: "blog",
      title:
        post.translations?.tr?.title ||
        post.translations?.en?.title ||
        post.slug,
      description: post.status === "published" ? "Yayında blog yazısı" : "Blog taslağı",
      href: `/panel/blog?post=${encodeURIComponent(post.slug)}`,
      status: post.status,
      searchFields: [
        {
          value: Object.values(post.translations || {})
            .map((translation) => `${translation.title || ""} ${translation.excerpt || ""}`)
            .join(" "),
          weight: 3,
        },
        { value: post.slug, weight: 2 },
      ],
    })),
    ...createMediaSearchDocuments(assets),
    ...users.map((user) => ({
      id: `user:${user.id}`,
      type: "user",
      title: user.displayName || user.username,
      description: `@${user.username} · ${user.role === "admin" ? "Yönetici" : "Editör"}`,
      href: `/panel/kullanicilar?user=${encodeURIComponent(user.id)}`,
      searchFields: [
        { value: user.displayName, weight: 4 },
        { value: user.username, weight: 3 },
        { value: user.role === "admin" ? "yönetici admin" : "editör editor", weight: 1 },
      ],
    })),
  ];
}

export async function GET(request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q")?.trim().slice(0, MAX_QUERY_LENGTH) || "";
  if (query.length < 2) return NextResponse.json({ results: [] });

  try {
    const canManageUsers = hasPanelPermission(session.role, PANEL_PERMISSIONS.MANAGE_USERS);
    const [pages, posts, library, users] = await Promise.all([
      listPageDrafts(),
      listBlogPosts(),
      readMediaLibrary(),
      canManageUsers ? listPanelUsers() : Promise.resolve([]),
    ]);
    const documents = createSearchDocuments({
      pages,
      posts,
      assets: library.assets,
      users,
      canManageUsers,
    });

    return NextResponse.json({
      results: rankSearchDocuments(documents, query, { limit: MAX_RESULTS }),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Panel araması tamamlanamadı." },
      { status: 500 }
    );
  }
}
