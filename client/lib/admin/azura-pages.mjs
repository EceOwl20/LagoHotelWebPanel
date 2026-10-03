import { AzuraConnectionError, getAzuraConnection } from "./azura-experience.mjs";
import { shareAzuraList } from "./azura-list-flight.mjs";
import { validatePageDocument } from "../pages/schema.mjs";
import { createAdminPageView } from "../pages/page-versions.mjs";

const FIELDS = ["schemaVersion", "template", "slugs", "showContactSection", "hero", "navigation", "seo", "sections"];
const exact = (value, keys) => value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
export const validPageId = value => typeof value === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
const validRevision = value => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const fail = (message, status = 400) => { throw new AzuraConnectionError(message, status); };

export function validAzuraPageDraft(draft) {
  if (!exact(draft, FIELDS)) return false;
  try { return validatePageDocument({ ...draft, status: "draft" }).length === 0; }
  catch { return false; }
}

export function validateAzuraPageRequest(method, body, { id, versionId, history = false, revision } = {}) {
  if (id !== undefined && !validPageId(id)) fail("Geçersiz sayfa kimliği.");
  if (versionId !== undefined && (!id || !validPageId(versionId))) fail("Geçersiz sürüm kimliği.");
  const allowed = versionId ? ["POST"] : history ? ["GET"] : id ? ["GET", "PUT", "DELETE"] : ["GET", "POST"];
  if (!allowed.includes(method) || (history && !id)) fail("Geçersiz sayfa işlemi.");
  if ((["PUT", "DELETE"].includes(method) || versionId) && !validRevision(revision)) fail("Geçersiz sayfa revision değeri.");
  if (method === "GET" || method === "DELETE" || versionId) {
    if (body !== undefined) fail("Bu işlem gövdesiz olmalıdır.");
  } else if (method === "POST") {
    if (!exact(body, ["draft"]) || !validAzuraPageDraft(body.draft)) fail("Geçersiz sayfa taslağı.");
  } else if (body?.action === "save") {
    if (!exact(body, ["action", "draft"]) || !validAzuraPageDraft(body.draft)) fail("Geçersiz sayfa taslağı.");
  } else if (!exact(body, ["action"]) || !["publish", "unpublish"].includes(body.action)) fail("Geçersiz yayın işlemi.");
}

function validDocument(document, id, status) {
  if (!exact(document, ["id", ...FIELDS, "status", "createdAt", "updatedAt"]) || document.id !== id || document.status !== status) return false;
  return validAzuraPageDraft(Object.fromEntries(FIELDS.map(key => [key, document[key]]))) &&
    [document.createdAt, document.updatedAt].every(value => typeof value === "string" && Number.isFinite(Date.parse(value)));
}

function toView(payload, origin, id) {
  const record = payload?.record;
  if (!validRevision(payload?.revision) || !exact(record, ["storageVersion", "id", "createdAt", "updatedAt", "publishedAt", "history", "draft", "published"]) ||
      record.storageVersion !== 2 || !validPageId(record.id) || (id && record.id !== id) || !validDocument(record.draft, record.id, "draft") ||
      (record.published !== null && !validDocument(record.published, record.id, "published")) ||
      !Array.isArray(record.history) || record.history.length > 100 ||
      !record.history.every(item => validPageId(item?.versionId) && validDocument(item.draft, record.id, "draft"))) {
    fail("Azura sayfa yanıtı beklenen biçimde değil.", 502);
  }
  const page = createAdminPageView(record);
  return { page, record, revision: payload.revision, mediaOrigin: origin };
}

export async function requestAzuraPages(method, body, options = {}) {
  validateAzuraPageRequest(method, body, options);
  if (method === "GET" && options.id) return requestAzuraPagesDirect(method, body, options);
  const { env = process.env, fetchImpl = fetch } = options;
  return shareAzuraList({ connection: getAzuraConnection(env), resource: "pages",
    fetchImpl, write: method !== "GET" }, () => requestAzuraPagesDirect(method, body, options));
}

async function requestAzuraPagesDirect(method, body, options = {}) {
  validateAzuraPageRequest(method, body, options);
  const { id, versionId, history, revision, env = process.env, fetchImpl = fetch } = options;
  const connection = getAzuraConnection(env);
  const url = new URL(connection.url);
  url.pathname = `/api/azura/pages${id ? `/${id}` : ""}${versionId ? `/history/${versionId}/restore` : history ? "/history" : ""}`;
  const serialized = body === undefined ? undefined : JSON.stringify(body);
  if (serialized && Buffer.byteLength(serialized) > 128 * 1024) fail("İstek 128 KiB sınırını aşıyor.", 413);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetchImpl(url.toString(), {
      method, cache: "no-store", redirect: "error", signal: controller.signal,
      headers: { Authorization: `Bearer ${connection.token}`, ...(serialized ? { "Content-Type": "application/json" } : {}),
        ...(revision ? { "If-Match": `"${revision}"` } : {}) },
      ...(serialized ? { body: serialized } : {}),
    });
    let payload;
    try { payload = await response.json(); } catch { fail("Azura geçerli JSON yanıtı vermedi.", 502); }
    if (!response.ok) fail(typeof payload?.error === "string" && payload.error.length < 300 ? payload.error : "Azura sayfa işlemi başarısız.", response.status);
    if (method === "GET" && !id) {
      if (!exact(payload, ["pages"]) || !Array.isArray(payload.pages)) fail("Azura sayfa listesi geçersiz.", 502);
      const pages = payload.pages.map(item => toView(item, url.origin));
      if (new Set(pages.map(item => item.page.id)).size !== pages.length) fail("Yinelenen sayfa kimliği.", 502);
      return { pages, mediaOrigin: url.origin };
    }
    if (!exact(payload, method === "DELETE" ? ["deleted", "record", "revision"] : ["record", "revision"]) ||
        (method === "DELETE" && payload.deleted !== true)) fail("Azura işlem yanıtı geçersiz.", 502);
    return { ...toView(payload, url.origin, id), ...(method === "DELETE" ? { deleted: true } : {}) };
  } catch (error) {
    if (error instanceof AzuraConnectionError) throw error;
    fail(error.name === "AbortError" ? "Azura yanıt süresi aşıldı." : "Azura sayfa bağlantısı kurulamadı.", error.name === "AbortError" ? 504 : 502);
  } finally { clearTimeout(timeout); }
}
