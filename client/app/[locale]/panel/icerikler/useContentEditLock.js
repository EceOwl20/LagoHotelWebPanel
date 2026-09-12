"use client";

import { useEditLock } from "../sayfalar/components/usePageEditLock";
import { getContentEditResourceKey } from "@/lib/admin/content-edit-resources.mjs";

export default function useContentEditLock(namespace) {
  const resourceKey = getContentEditResourceKey(namespace);
  const endpoint = resourceKey
    ? `/api/admin/content-locks/${encodeURIComponent(resourceKey)}`
    : "";

  return useEditLock(resourceKey, endpoint);
}
