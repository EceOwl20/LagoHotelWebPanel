import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { installPanelNavigationGuard, leavesCurrentPanel, PANEL_LEAVE_EVENT } from "./panel-navigation-guard.mjs";

function click(href, options = {}) {
  const event = new Event("click", { cancelable: true });
  const anchor = { href, target: options.target || "", hasAttribute: name => name === "download" && options.download };
  Object.defineProperties(event, {
    button: { value: options.button || 0 }, ctrlKey: { value: options.ctrlKey }, metaKey: { value: options.metaKey },
    shiftKey: { value: options.shiftKey }, altKey: { value: options.altKey },
    target: { value: { closest: () => anchor } },
  });
  return event;
}
function harness(hotel = "lago") {
  const win = new EventTarget(), doc = new EventTarget();
  const prefix = hotel === "azura" ? "/tr/panel/azura" : "/tr/panel";
  win.location = { href: `https://panel.test${prefix}/icerikler` };
  let state = { dirty: true, busy: false }, approved = false, prompts = 0, alerts = 0;
  win.confirm = () => { prompts++; return approved; }; win.alert = () => { alerts++; };
  const dispose = installPanelNavigationGuard(win, doc, () => state);
  return { win, doc, dispose, state: next => { state = next; }, approve: value => { approved = value; },
    counts: () => ({ prompts, alerts }) };
}

function unload() {
  const event = new Event("beforeunload", { cancelable: true });
  Object.defineProperty(event, "returnValue", { value: undefined, writable: true });
  return event;
}

for (const hotel of ["lago", "azura"]) test(`${hotel}: cancel keeps dirty editor; accept allows menu and hotel navigation`, () => {
  const h = harness(hotel);
  for (const path of ["/tr/panel/blog", "/tr/panel/oteller", "/tr/panel/azura/dashboard"]) {
    const cancelled = click(`https://panel.test${path}`);
    assert.equal(h.doc.dispatchEvent(cancelled), false);
    assert.equal(cancelled.defaultPrevented, true);
  }
  h.approve(true);
  assert.equal(h.doc.dispatchEvent(click("https://panel.test/tr/panel/oteller")), true);
  // Accepting a transition must not erase the dirty state if navigation fails.
  h.approve(false);
  assert.equal(h.doc.dispatchEvent(click("https://panel.test/tr/panel/blog")), false);
  h.state({ dirty: false, busy: false });
  const before = h.counts().prompts;
  assert.equal(h.doc.dispatchEvent(click("https://panel.test/tr/panel/blog")), true);
  assert.equal(h.counts().prompts, before);
  h.dispose();
});

test("new tabs, downloads, hashes and current URL do not prompt", () => {
  const location = { href: "https://panel.test/tr/panel/icerikler" };
  for (const options of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }, { target: "_blank" }, { download: true }]) {
    assert.equal(leavesCurrentPanel(click("https://panel.test/tr/panel/blog", options), location), false);
  }
  for (const url of [location.href, `${location.href}#section`, "https://external.test/page"]) {
    assert.equal(leavesCurrentPanel(click(url), location), false);
  }
});

test("save in flight blocks leaving; native unload and logout respect dirty state", () => {
  const h = harness();
  assert.equal(h.win.dispatchEvent(new Event(PANEL_LEAVE_EVENT, { cancelable: true })), false);
  assert.equal(h.win.dispatchEvent(unload()), false);
  h.approve(true); h.state({ dirty: false, busy: true });
  assert.equal(h.win.dispatchEvent(new Event(PANEL_LEAVE_EVENT, { cancelable: true })), false);
  assert.equal(h.counts().alerts, 1);
  h.state({ dirty: false, busy: false });
  assert.equal(h.win.dispatchEvent(unload()), true);
  assert.equal(h.win.dispatchEvent(new Event(PANEL_LEAVE_EVENT, { cancelable: true })), true);
  h.dispose();
});

test("unmount removes listeners and does not leave stale prompts", () => {
  const h = harness(); h.dispose();
  assert.equal(h.doc.dispatchEvent(click("https://panel.test/tr/panel/blog")), true);
  assert.equal(h.win.dispatchEvent(new Event(PANEL_LEAVE_EVENT, { cancelable: true })), true);
  assert.equal(h.win.dispatchEvent(unload()), true);
  assert.deepEqual(h.counts(), { prompts: 0, alerts: 0 });
});

test("both content pages and both logout buttons are wired without changing section-switch flows", () => {
  const source = path => readFileSync(new URL(`../../app/[locale]/panel/${path}`, import.meta.url), "utf8");
  assert.match(source("icerikler/page.js"), /usePanelNavigationGuard\(hasUnsavedChanges, saving\)/);
  assert.match(source("icerikler/page.js"), /setShowUnsavedModal\(true\)/);
  assert.match(source("azura/icerikler/page.jsx"), /usePanelNavigationGuard\(dirtyCount > 0/);
  for (const file of ["components/SideBar.jsx", "components/TopBar.jsx"]) {
    assert.match(source(file), /if \(!requestPanelLeave\(\)\) return;/);
  }
});
