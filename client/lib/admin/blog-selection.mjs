export function findBlogPostToSelect(
  posts,
  { preferredSlug = null, selectFirst = false } = {}
) {
  if (!Array.isArray(posts) || posts.length === 0) return null;

  if (preferredSlug) {
    return posts.find((post) => post.slug === preferredSlug) || null;
  }

  return selectFirst ? posts[0] : null;
}
