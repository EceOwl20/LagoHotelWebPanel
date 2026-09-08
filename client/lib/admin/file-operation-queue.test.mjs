import assert from "node:assert/strict";
import { test } from "node:test";
import { enqueueFileOperation } from "./file-operation-queue.mjs";

function createGate() {
  let release;
  const promise = new Promise((resolve) => {
    release = resolve;
  });
  return { promise, release };
}

test("aynı hedefe gelen işlemleri geliş sırasıyla çalıştırır", async () => {
  const gate = createGate();
  const events = [];

  const first = enqueueFileOperation("/virtual/pages", async () => {
    events.push("first:start");
    await gate.promise;
    events.push("first:end");
  });
  const second = enqueueFileOperation("/virtual/pages", async () => {
    events.push("second:start");
    events.push("second:end");
  });

  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(events, ["first:start"]);

  gate.release();
  await Promise.all([first, second]);
  assert.deepEqual(events, [
    "first:start",
    "first:end",
    "second:start",
    "second:end",
  ]);
});

test("farklı hedeflerdeki işlemler birbirini bekletmez", async () => {
  const gate = createGate();
  const events = [];

  const pages = enqueueFileOperation("/virtual/pages", async () => {
    events.push("pages:start");
    await gate.promise;
    events.push("pages:end");
  });
  const users = enqueueFileOperation("/virtual/users", async () => {
    events.push("users");
  });

  await users;
  assert.deepEqual(events, ["pages:start", "users"]);

  gate.release();
  await pages;
});

test("başarısız işlem aynı hedefin kuyruğunu kilitlemez", async () => {
  await assert.rejects(
    enqueueFileOperation("/virtual/gallery", async () => {
      throw new Error("expected failure");
    }),
    /expected failure/
  );

  const result = await enqueueFileOperation(
    "/virtual/gallery",
    async () => "next operation completed"
  );
  assert.equal(result, "next operation completed");
});
