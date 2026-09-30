import { requestAzuraBlog } from "./azura-blog.mjs";

function getPostTitle(post) {
  for (const locale of ["tr", "en", "de", "ru"]) {
    const title = post?.translations?.[locale]?.title?.trim();

    if (title) {
      return title;
    }
  }

  return "Başlıksız blog yazısı";
}

export async function readAzuraBlogNotificationSummary() {
  const result = await requestAzuraBlog("GET");

  const drafts = result.posts
    .filter(
      (post) =>
        post.status === "draft" ||
        post.hasUnpublishedChanges === true
    )
    .map((post) => ({
      slug: post.slug,
      title: getPostTitle(post),
      status: post.status,
      hasUnpublishedChanges: post.hasUnpublishedChanges,
      updatedAt: post.updatedAt,
    }))
    .sort((left, right) =>
      (right.updatedAt || "").localeCompare(left.updatedAt || "")
    );

  return {
    draftCount: drafts.length,
    drafts,
  };
}