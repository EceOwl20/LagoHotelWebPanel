import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { installPanelNavigationGuard, PANEL_LEAVE_EVENT } from "./panel-navigation-guard.mjs";

const require = createRequire(import.meta.url);
const source = name => readFileSync(new URL(`../../app/[locale]/panel/${name}`, import.meta.url), "utf8");

test("Azura hook uses the shared guard and does not register a second unload handler", () => {
  const blog = source("blog/useAzuraBlog.js");
  assert.match(blog, /usePanelNavigationGuard\(dirty, enabled && busy, enabled\)/);
  assert.doesNotMatch(blog, /addEventListener\("beforeunload"/);
  assert.match(blog, /busyRef.current \|\| !confirmDiscard\(\)/);
});

test("navigation hook is inactive for Lago and reads current dirty/busy state", () => {
  const { code } = require("next/dist/build/swc").transformSync(source("components/usePanelNavigationGuard.js"), {
    filename: "guard.js", jsc: { parser: { syntax: "ecmascript" } }, module: { type: "commonjs" },
  });
  const win = new EventTarget(), doc = new EventTarget();
  let effect, prompts = 0, alerts = 0;
  const ref = {};
  win.confirm = () => { prompts++; return false; };
  win.alert = () => { alerts++; };
  const compiled = { exports: {} };
  new Function("require", "module", "exports", "window", "document", code)(name => name === "react" ? {
    useRef: () => ref, useEffect: callback => { effect = callback; },
  } : { installPanelNavigationGuard }, compiled, compiled.exports, win, doc);
  const useGuard = compiled.exports.default;
  const leave = () => win.dispatchEvent(new Event(PANEL_LEAVE_EVENT, { cancelable: true }));
  useGuard(true, true, false);
  assert.equal(effect(), undefined);
  assert.equal(leave(), true);
  useGuard(true, false, true);
  const cleanup = effect();
  assert.equal(leave(), false);
  assert.equal(prompts, 1);
  useGuard(false, false, true); // Saved: the existing listener sees the new state.
  assert.equal(leave(), true);
  useGuard(false, true, true);
  assert.equal(leave(), false);
  assert.equal(alerts, 1);
  cleanup();
  assert.equal(leave(), true);
});
