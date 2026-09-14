"use client";

import { useEditLock } from "../sayfalar/components/usePageEditLock";

export default function useGalleryCategoryEditLock(categoryId) {
  const resourceId = categoryId ? `gallery-category:${categoryId}` : "";
  const endpoint = categoryId
    ? `/api/admin/gallery/${encodeURIComponent(categoryId)}/lock`
    : "";

  return useEditLock(resourceId, endpoint);
}
