// Observe once; keep the source mounted after it has entered the preload margin.
export function observeMediaPreview(element, activate, Observer = globalThis.IntersectionObserver) {
  if (!Observer) {
    activate();
    return () => {};
  }
  let active = true;
  const observer = new Observer((entries) => {
    if (active && entries.some((entry) => entry.isIntersecting)) {
      active = false;
      observer.disconnect();
      activate();
    }
  }, { rootMargin: "200px", threshold: 0 });
  observer.observe(element);
  return () => {
    active = false;
    observer.disconnect();
  };
}
