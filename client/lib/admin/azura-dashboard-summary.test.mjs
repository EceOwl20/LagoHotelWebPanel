import test from "node:test";
import assert from "node:assert/strict";
import { requestAzuraDashboardSummary, validSummarySection } from "./azura-dashboard-summary.mjs";
import { shareAzuraList } from "./azura-list-flight.mjs";
import { getAzuraConnection } from "./azura-experience.mjs";

const env = { AZURA_EXPERIENCE_API_URL: "https://example.test/api/azura/homepage/experience",
  AZURA_SERVICE_TOKEN: "test-token", AZURA_BLOG_CONTRACT_VERSION: "3" };
const empty = (blog = false) => ({ total: 0, currentPublishedCount: 0, changedCount: 0,
  draftCount: 0, notifications: { total: 0, items: [] }, ...(blog ? { latestPost: null } : {}) });

test("summary uses bounded section query and V3 header only for blog", async () => {
  for (const section of ["gallery", "blog", "pages"]) {
    const data = section === "gallery" ? { categoryCount: 9, imageCount: 95 } : empty(section === "blog");
    const result = await requestAzuraDashboardSummary(section, { env, fetchImpl: async (url, options) => {
      assert.equal(new URL(url).pathname, "/api/azura/dashboard/summary");
      assert.equal(new URL(url).searchParams.get("sections"), section);
      assert.equal(new URL(url).searchParams.get("limit"), "5");
      assert.equal(options.headers["X-Azura-Blog-Contract-Version"], section === "blog" ? "3" : undefined);
      assert.equal(options.cache, "no-store");
      assert.equal(options.redirect, "error");
      return Response.json({ [section]: { status: "ok", data } });
    } });
    assert.deepEqual(result, data);
  }
});
test("section errors, contract mismatch, missing endpoint and malformed counters are not zero summaries", async () => {
  for (const [body, status, expected] of [
    [{ blog: { status: "error", error: { code: "SUMMARY_SOURCE_UNAVAILABLE", message: "unavailable" } } }, 200, 503],
    [{ error: "mismatch" }, 409, 409], [{ error: "not found" }, 404, 404],
    [{ blog: { status: "ok", data: { ...empty(true), total: 12 } } }, 200, 502],
  ]) {
    await assert.rejects(requestAzuraDashboardSummary("blog", { env,
      fetchImpl: async () => Response.json(body, { status }) }), error => error.status === expected);
  }
});
test("notification preview keeps totals separate and rejects full-content fields", () => {
  const items = Array.from({ length: 5 }, (_, i) => ({ slug: `post-${i}`, title: "Draft", status: "draft",
    hasUnpublishedChanges: false, updatedAt: "2026-10-05T00:00:00.000Z" }));
  const data = { ...empty(true), total: 20, draftCount: 20, latestPost: { slug: "post-0", title: "Draft" }, notifications: { total: 20, items } };
  assert.ok(validSummarySection("blog", { status: "ok", data }));
  assert.equal(validSummarySection("blog", { status: "ok", data: { ...data, history: [] } }), false);
  assert.equal(validSummarySection("blog", { status: "ok", data: { ...data, notifications: { total: 5, items } } }), false);
});
test("summary requests coalesce, but a write detaches in-flight summary and list variants", async () => {
  let resolve; const gate = new Promise(r => { resolve = r; }); let calls = 0;
  const fetchImpl = async () => { calls++; await gate; return Response.json({ blog: { status: "ok", data: empty(true) } }); };
  const options = { env, fetchImpl };
  const a = requestAzuraDashboardSummary("blog", options), b = requestAzuraDashboardSummary("blog", options);
  await Promise.resolve(); assert.equal(calls, 1);
  await shareAzuraList({ connection: getAzuraConnection(env), resource: "blog", version: 3, fetchImpl, write: true }, () => ({}));
  const c = requestAzuraDashboardSummary("blog", options);
  resolve(); await Promise.all([a, b, c]); assert.equal(calls, 2);
  await requestAzuraDashboardSummary("blog", options); assert.equal(calls, 3);
});
