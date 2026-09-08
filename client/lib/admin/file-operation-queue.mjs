import path from "node:path";

const queueStoreKey = Symbol.for("lago.admin.file-operation-queue");
const pendingOperations = globalThis[queueStoreKey] || new Map();
globalThis[queueStoreKey] = pendingOperations;

export function enqueueFileOperation(targetPath, operation) {
  if (typeof operation !== "function") {
    throw new TypeError("Kuyruk işlemi bir fonksiyon olmalıdır.");
  }

  const queueKey = path.resolve(String(targetPath));
  const previousOperation = pendingOperations.get(queueKey) || Promise.resolve();
  const execution = previousOperation.catch(() => undefined).then(operation);

  let trackedExecution;
  trackedExecution = execution.finally(() => {
    if (pendingOperations.get(queueKey) === trackedExecution) {
      pendingOperations.delete(queueKey);
    }
  });

  pendingOperations.set(queueKey, trackedExecution);
  return trackedExecution;
}
