import assert from "node:assert/strict";
import test from "node:test";
import { validAzuraBlogDraft, validAzuraBlogBody, validAzuraBlogRecord, validAzuraBlogSlug } from "./azura-blog-model.mjs";
import { requestAzuraBlog } from "./azura-blog.mjs";
import { requestAzuraImages } from "./azura-experience-images.mjs";
import { saveAzuraBlog, blogDateInput, blogDraftInput } from "./azura-blog-client.mjs";
import { input, record, view, revision, nextRevision, time } from "../../tests/fixtures/azura-blog.mjs";
const env = { AZURA_EXPERIENCE_API_URL: "https://azura.test/api/azura/homepage/experience", AZURA_SERVICE_TOKEN: "server-secret-only" };
const response = (body, status = 200) => Response.json(body, { status });

test("Azura blog validates exact draft/v2 schema, paths, dates, language and block IDs", () => {
  assert.ok(validAzuraBlogDraft(input()));
  assert.ok(validAzuraBlogRecord(record()));
  assert.ok(validAzuraBlogRecord(record("azura-post", true)));
  assert.ok(validAzuraBlogBody("POST", { slug: "azura-post", draft: input() }));
  assert.ok(validAzuraBlogBody("PUT", { action: "publish" }));
  for (const slug of ["../x", "Bad", "x/y", "a--b", "a".repeat(121), ""]) assert.equal(validAzuraBlogSlug(slug), false);
  for (const patch of [{ coverImage: "/uploads/gallery/x.jpg" }, { coverImage: "https://other/x.jpg" },
    { coverImage: "/uploads/blog/../x.jpg" }, { publishedAt: "2026-02-30T00:00:00.000Z" }, { translations: {} }]) {
    assert.equal(validAzuraBlogDraft({ ...input(), ...patch }), false);
  }
  assert.equal(validAzuraBlogBody("POST", { slug: "post", draft: input(), published: true }), false);
  assert.equal(validAzuraBlogBody("PUT", { action: "publish", draft: input() }), false);
  const block = { id: "block-1", headingLevel: "h2", image: "", translations: Object.fromEntries(["tr", "en", "de", "ru"].map(l => [l, { heading: "", content: "Text\n\nparagraph" }])) };
  assert.ok(validAzuraBlogDraft({ ...input(), contentBlocks: [block] }));
  assert.equal(validAzuraBlogDraft({ ...input(), contentBlocks: [block, block] }), false);
});

test("Blog proxy derives trusted address, hides token/published snapshot, forwards revision and operations", async () => {
  const calls = [];
  const fetchImpl = async (url, init) => { calls.push({ url, ...init }); return response({ record: record(), revision }); };
  const result = await requestAzuraBlog("PUT", { action: "save", draft: input() }, { slug: "azura-post", revision, env, fetchImpl });
  assert.equal(result.post.slug, "azura-post");
  assert.equal(result.post.mediaOrigin, "https://azura.test");
  assert.equal(result.post.published, undefined);
  assert.ok(!JSON.stringify(result).includes(env.AZURA_SERVICE_TOKEN));
  assert.equal(calls[0].url, "https://azura.test/api/azura/blog/posts/azura-post");
  assert.equal(calls[0].headers.Authorization, `Bearer ${env.AZURA_SERVICE_TOKEN}`);
  assert.equal(calls[0].headers["If-Match"], `"${revision}"`);
  assert.deepEqual(JSON.parse(calls[0].body), { action: "save", draft: input() });
  const listing = await requestAzuraBlog("GET", undefined, { env, fetchImpl: async () => response({ posts: [{ record: record(), revision }] }) });
  assert.equal(listing.posts.length, 1);
  const deleted = await requestAzuraBlog("DELETE", undefined, { slug: "azura-post", revision, env,
    fetchImpl: async (_url, init) => { assert.equal(init.body, undefined); return response({ deleted: true, slug: "azura-post" }); } });
  assert.equal(deleted.deleted, true);
});

test("Blog proxy rejects malformed/foreign responses and propagates conflicts without retry", async () => {
  let calls = 0;
  await assert.rejects(requestAzuraBlog("PUT", { action: "publish" }, { slug: "azura-post", revision, env,
    fetchImpl: async () => { calls++; return response({ error: "Conflict" }, 409); } }), { status: 409 });
  assert.equal(calls, 1);
  await assert.rejects(requestAzuraBlog("GET", undefined, { slug: "azura-post", env,
    fetchImpl: async () => response({ record: record("other"), revision }) }), { status: 502 });
  await assert.rejects(requestAzuraBlog("GET", undefined, { env,
    fetchImpl: async () => response({ posts: [{ record: record(), revision: "bad" }] }) }), { status: 502 });
  const draft = input(); draft.translations.tr.content = "x".repeat(100000); draft.translations.en.content = "x".repeat(100000);
  await assert.rejects(requestAzuraBlog("POST", { slug: "post", draft }, { env, fetchImpl: async () => { throw new Error("must not fetch"); } }), { status: 413 });
});

test("Publish saves edited draft first, then uses the returned revision; dates retain their instant", async () => {
  const calls = [], saved = [];
  const post = view(); post.publishedAt = blogDateInput(time);
  assert.equal(blogDraftInput(post).publishedAt, time);
  await saveAzuraBlog({ slug: post.slug, draft: post, revision, publicationStatus: "published", onSaved: p => saved.push(p),
    fetchImpl: async (_url, init) => { calls.push(init); return response({ post: view("azura-post", calls.length === 2, nextRevision) }); } });
  assert.equal(JSON.parse(calls[0].body).action, "save");
  assert.equal(calls[0].headers["If-Match"], `"${revision}"`);
  assert.deepEqual(JSON.parse(calls[1].body), { action: "publish" });
  assert.equal(calls[1].headers["If-Match"], `"${nextRevision}"`);
  assert.equal(saved.length, 2);
});

test("Partial publish failure reports saved draft and never retries or reports publication success", async () => {
  let calls = 0, adopted = 0;
  await assert.rejects(saveAzuraBlog({ slug: "azura-post", draft: view(), revision, publicationStatus: "published", onSaved: () => adopted++,
    fetchImpl: async () => ++calls === 1 ? response({ post: view("azura-post", false, nextRevision) }) : response({ error: "Conflict" }, 409) }),
  error => error.status === 409 && error.savedPost.revision === nextRevision && error.message.includes("Taslak kaydedildi"));
  assert.equal(calls, 2); assert.equal(adopted, 1);
  calls = 0;
  await assert.rejects(saveAzuraBlog({ slug: "azura-post", draft: view(), revision, publicationStatus: "published",
    fetchImpl: async () => { calls++; return response({ error: "Conflict" }, 409); } }), { status: 409 });
  assert.equal(calls, 1);
});

test("New Azura posts are draft-only; unpublish saves first; media stays within blog scope", async () => {
  await saveAzuraBlog({ draft: view(), fetchImpl: async (_url, init) => {
    assert.equal(init.method, "POST"); assert.equal(init.headers["If-Match"], undefined);
    assert.deepEqual(JSON.parse(init.body), { slug: "azura-post", draft: input() });
    return response({ post: view() });
  } });
  const actions = [];
  await saveAzuraBlog({ slug: "azura-post", draft: view(), revision, publicationStatus: "draft",
    fetchImpl: async (_url, init) => { actions.push(JSON.parse(init.body).action); return response({ post: view() }); } });
  assert.deepEqual(actions, ["save", "unpublish"]);
  const asset = { image: "/uploads/blog/cover.webp", mimeType: "image/webp", size: 123, width: 800, height: 600, modifiedAt: time };
  const images = await requestAzuraImages("GET", undefined, { env, scope: "blog", fetchImpl: async url => {
    assert.equal(url, "https://azura.test/api/azura/blog/images"); return response({ images: [asset] });
  } });
  assert.equal(images[0].previewUrl, `https://azura.test${asset.image}`);
  await assert.rejects(requestAzuraImages("GET", undefined, { env, scope: "blog", fetchImpl: async () => response({ images: [{ ...asset, image: "/uploads/gallery/x.webp" }] }) }), { status: 502 });
});
