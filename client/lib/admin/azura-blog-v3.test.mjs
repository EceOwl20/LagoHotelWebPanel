import assert from "node:assert/strict";
import test from "node:test";
import { validAzuraBlogDraft, validAzuraBlogRecord } from "./azura-blog-model.mjs";
import { getAzuraBlogVersion } from "./azura-blog-version.mjs";
import { requestAzuraBlog } from "./azura-blog.mjs";
import { saveAzuraBlog, newAzuraBlogDraft } from "./azura-blog-client.mjs";
import { input, record, revision, nextRevision } from "../../tests/fixtures/azura-blog.mjs";
const slugs = {tr: "tatil", en: "holiday", de: "urlaub", ru: "otdyh"};
function v3(published = true) {
  const r = record("stable-key", published);
  r.storageVersion = 3;
  r.aliases = {tr: ["eski-adres"], en: [], de: [], ru: []};
  r.draft.slugs = {...slugs};
  if (r.published) r.published.slugs = {...slugs};
  return r;
}
const env = {AZURA_EXPERIENCE_API_URL: "https://azura.test/api/azura/homepage/experience",
  AZURA_SERVICE_TOKEN: "server-only-secret", AZURA_BLOG_CONTRACT_VERSION: "3"};

test("Server mode defaults to V2 and validates configuration; exact V2/V3 schemas stay separate", () => {
  assert.equal(getAzuraBlogVersion({}), 2);
  assert.equal(getAzuraBlogVersion(env), 3);
  assert.throws(() => getAzuraBlogVersion({AZURA_BLOG_CONTRACT_VERSION: "bad"}), {status: 503});
  assert.ok(validAzuraBlogRecord(v3(), 3));
  assert.ok(validAzuraBlogRecord(v3(false), 3));
  assert.equal(validAzuraBlogRecord(v3()), false);
  assert.equal(validAzuraBlogRecord(record(), 3), false);
  assert.equal(validAzuraBlogDraft(input(), 3), false);
  assert.ok(validAzuraBlogDraft({...input(), slugs}, 3));
  for (const edit of [
    r => {delete r.draft.slugs.ru;}, r => {r.draft.slugs.tr = "";},
    r => {r.draft.slugs.tr = "../bad";}, r => {r.draft.slugs.tr = "Upper";},
    r => {r.draft.slugs.tr = "x".repeat(121);},
    r => {r.aliases.en = ["old", "old"];}, r => {r.aliases.tr = [r.published.slugs.tr];},
    r => {r.draft.slug = "changed-key";}, r => {r.aliases.extra = [];},
  ]) { const r = v3(); edit(r); assert.equal(validAzuraBlogRecord(r, 3), false); }
});

test("V3 proxy carries slugs, retains stable identity, compares drafts and exposes only published addresses", async () => {
  const r = v3(); r.draft.slugs.tr = "yeni-adres";
  const result = await requestAzuraBlog("GET", undefined, {env, slug: r.slug,
    fetchImpl: async (url, init) => {
      assert.equal(url, "https://azura.test/api/azura/blog/posts/stable-key");
      assert.equal(init.headers["X-Azura-Blog-Contract-Version"], "3");
      assert.equal(init.headers.Authorization, "Bearer server-only-secret");
      return Response.json({record: r, revision});
    }});
  assert.equal(result.post.slug, "stable-key");
  assert.equal(result.post.slugs.tr, "yeni-adres");
  assert.equal(result.post.publishedSlugs.tr, "tatil");
  assert.equal(result.post.hasUnpublishedChanges, true);
  assert.equal(result.post.aliases, undefined);
  assert.equal(result.post.published, undefined);
  assert.ok(!JSON.stringify(result).includes(env.AZURA_SERVICE_TOKEN));
  await assert.rejects(requestAzuraBlog("GET", undefined, {env,
    fetchImpl: async () => Response.json({posts: [{record: record(), revision}]})}), {status: 502});
});

test("V3 proxy preserves migration/contract error codes and never retries", async () => {
  for (const [code, status] of [["BLOG_MIGRATION_REQUIRED",503], ["BLOG_CONTRACT_VERSION_MISMATCH",409]]) {
    let calls = 0;
    await assert.rejects(requestAzuraBlog("GET", undefined, {env, fetchImpl: async () => {
      calls++; return Response.json({error: "Setup required",code},{status});
    }}), {status,code});
    assert.equal(calls, 1);
  }
});

test("V3 save/publish/unpublish/delete forward exact bodies, version and revisions", async () => {
  const draft = {...input(), slug: "stable-key", slugs, publishedSlugs: slugs};
  for (const publicationStatus of ["published","draft"]) {
    const calls = [];
    await saveAzuraBlog({slug: "stable-key", draft, revision, version: 3, publicationStatus,
      fetchImpl: async (url, init) => {
        calls.push(init);
        assert.equal(url, "/api/admin/azura/blog/posts/stable-key");
        assert.equal(init.headers["X-Azura-Blog-Contract-Version"], "3");
        return Response.json({post: {...draft, revision: nextRevision}});
      }});
    assert.deepEqual(JSON.parse(calls[0].body), {action:"save",draft:{...input(),slugs}});
    assert.equal(calls[1].headers["If-Match"], '"' + nextRevision + '"');
    assert.deepEqual(JSON.parse(calls[1].body), {action: publicationStatus === "published" ? "publish" : "unpublish"});
  }
  await requestAzuraBlog("DELETE", undefined, {env, slug:"stable-key", revision, fetchImpl: async (_url, init) => {
    assert.equal(init.headers["X-Azura-Blog-Contract-Version"], "3");
    assert.equal(init.headers["If-Match"], '"' + revision + '"');
    assert.equal(init.body, undefined);
    return Response.json({deleted:true,slug:"stable-key"});
  }});
});

test("New V3 drafts generate stable keys independently of editable visitor addresses", async () => {
  const post = newAzuraBlogDraft(() => ({...input(),slug:""}), 3);
  assert.match(post.slug, /^[a-f0-9-]{36}$/);
  assert.deepEqual(post.slugs, {tr:"",en:"",de:"",ru:""});
  const originalKey = post.slug; post.slugs = slugs;
  await saveAzuraBlog({draft:post,version:3,fetchImpl:async (_url,init) => {
    assert.equal(init.method,"POST");
    assert.equal(init.headers["X-Azura-Blog-Contract-Version"],"3");
    const body=JSON.parse(init.body);
    assert.equal(body.slug,originalKey);
    assert.deepEqual(body.draft.slugs,slugs);
    assert.equal(body.draft.slug,undefined);
    return Response.json({post:{...post,revision}});
  }});
});
