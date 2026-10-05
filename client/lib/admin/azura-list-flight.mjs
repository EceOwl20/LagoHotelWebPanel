import { createHash } from "node:crypto";

// Shared across route bundles in one server process. No completed-result cache.
const symbol = Symbol.for("lago.azura-list-flight.v1");
const state = globalThis[symbol] ||= new WeakMap();

export function shareAzuraList({ connection, resource, version = 2, fetchImpl, write = false, variant = "list" }, run) {
  let flights = state.get(fetchImpl);
  if (!flights) { flights = new Map(); state.set(fetchImpl, flights); }
  const group = createHash("sha256").update(JSON.stringify([
    connection.url, connection.token, resource, version,
  ])).digest("hex");
  const key = `${group}:${variant}`;
  const invalidate = () => {
    for (const candidate of flights.keys()) if (candidate.startsWith(`${group}:`)) flights.delete(candidate);
  };
  if (write) {
    invalidate();
    return Promise.resolve().then(run).finally(invalidate);
  }
  let flight = flights.get(key);
  if (!flight) {
    flight = Promise.resolve().then(run);
    if (flights.size < 128) flights.set(key, flight);
    const clear = () => { if (flights.get(key) === flight) flights.delete(key); };
    flight.then(clear, clear);
  }
  // Consumers may transform/sort the response; never share mutable results.
  return flight.then(value => structuredClone(value));
}
