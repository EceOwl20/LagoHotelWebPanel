import assert from "node:assert/strict";
import test from "node:test";
import { saveAzuraHomepageSteps } from "./azura-homepage-save.mjs";

test("değişmeyen alanları atlar ve kayıtları sırayla tamamlar", async () => {
  const called = [];
  const result = await saveAzuraHomepageSteps([
    { label: "Karşılama", save: async () => { called.push("welcome"); return "saved"; } },
    { label: "Kaydırıcı", save: async () => { called.push("carousel"); return "skipped"; } },
    { label: "Tanıtım", save: async () => { called.push("experience"); return "saved"; } },
  ]);
  assert.deepEqual(called, ["welcome", "carousel", "experience"]);
  assert.deepEqual(result, { saved: ["Karşılama", "Tanıtım"], failed: null });
});

test("hata sonrası bekleyen alanlara dokunmaz; başarılı kayıtları bildirir", async () => {
  let called = false;
  const failed = { label: "Tanıtım metinleri", save: async () => "failed" };
  const result = await saveAzuraHomepageSteps([
    { label: "Tanıtım görselleri", save: async () => "saved" },
    failed,
    { label: "Oda kartları", save: async () => { called = true; return "saved"; } },
  ]);
  assert.deepEqual(result, { saved: ["Tanıtım görselleri"], failed });
  assert.equal(called, false);
});

test("beklenmeyen istisnada da kaydetmeyi durdurur", async () => {
  const failed = { label: "Olanaklar", save: async () => { throw new Error("network"); } };
  assert.deepEqual(await saveAzuraHomepageSteps([failed]), { saved: [], failed });
});
