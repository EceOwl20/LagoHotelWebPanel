"use client";

import { useEditLock } from "../sayfalar/components/usePageEditLock";

export default function useBlogEditLock(slug) {
  const resourceId = slug ? `blog:${slug}` : "";
  const endpoint = slug
    ? `/api/admin/blog/posts/${encodeURIComponent(slug)}/lock`
    : "";

  return useEditLock(resourceId, endpoint);
}
