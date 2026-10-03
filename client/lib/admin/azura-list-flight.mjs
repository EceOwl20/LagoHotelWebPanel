import { createHash } from "node:crypto";

// Shared across route bundles in one server process. No completed-result cache.
const symbol = Symbol.for("lago.azura-list-flight.v1");
const state = globalThis[symbol] ||= new WeakMap();

export function shareAzuraList({ connection, resource, version = 2, fetchImpl, write = false }, run) {
  let flights = state.get(fetchImpl);
  if (!flights) { flights = new Map(); state.set(fetchImpl, flights); }
  const key = createHash("sha256").update(JSON.stringify([
    connection.url, connection.token, resource, version,
  ])).digest("hex");
  if (write) {
    flights.delete(key);
    return Promise.resolve().then(run).finally(() => flights.delete(key));
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
