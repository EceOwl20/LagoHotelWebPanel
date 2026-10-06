// Limit filesystem operations, not recursive directory walks (which could deadlock).
export function createMediaScanLimit(concurrency = 4) {
  if (!Number.isInteger(concurrency) || concurrency < 1) throw new TypeError("Invalid concurrency");
  let active = 0;
  const queue = [];
  function drain() {
    while (active < concurrency && queue.length) {
      const { operation, resolve, reject } = queue.shift();
      active++;
      Promise.resolve().then(operation).then(resolve, reject).finally(() => {
        active--;
        drain();
      });
    }
  }
  return (operation) => new Promise((resolve, reject) => {
    queue.push({ operation, resolve, reject });
    drain();
  });
}
