import test from "node:test";
import assert from "node:assert/strict";
import { observeMediaPreview } from "./observe-media-preview.mjs";

test("preview activates only near viewport, once, and disconnects", () => {
  let callback, options, observed, disconnects = 0, activations = 0;
  class Observer {
    constructor(cb, opts) { callback = cb; options = opts; }
    observe(element) { observed = element; }
    disconnect() { disconnects++; }
  }
  const element = {};
  const cleanup = observeMediaPreview(element, () => activations++, Observer);
  assert.equal(observed, element);
  assert.equal(options.rootMargin, "200px");
  assert.equal(activations, 0);
  callback([{ isIntersecting: false }]);
  assert.equal(activations, 0);
  callback([{ isIntersecting: true }]);
  callback([{ isIntersecting: true }]);
  assert.equal(activations, 1);
  assert.equal(disconnects, 1);
  cleanup();
});

test("unmounted previews ignore queued observer callbacks", () => {
  let callback, activations = 0;
  class Observer {
    constructor(cb) { callback = cb; }
    observe() {}
    disconnect() {}
  }
  const cleanup = observeMediaPreview({}, () => activations++, Observer);
  cleanup();
  callback([{ isIntersecting: true }]);
  assert.equal(activations, 0);
});

test("unsupported browsers load previews without an observer", () => {
  let activations = 0;
  const cleanup = observeMediaPreview({}, () => activations++, null);
  assert.equal(activations, 1);
  cleanup();
});
