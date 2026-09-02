export function createMemoryRateLimiter({ maxKeys = 5000 } = {}) {
  const buckets = new Map();

  function removeExpiredEntries(now) {
    for (const [key, bucket] of buckets) {
      const activeEntries = bucket.timestamps.filter(
        (timestamp) => now - timestamp < bucket.windowMs
      );

      if (activeEntries.length === 0) {
        buckets.delete(key);
      } else if (activeEntries.length !== bucket.timestamps.length) {
        buckets.set(key, { ...bucket, timestamps: activeEntries });
      }
    }
  }

  function ensureCapacity(now) {
    if (buckets.size < maxKeys) {
      return;
    }

    removeExpiredEntries(now);

    if (buckets.size >= maxKeys) {
      const oldestKey = buckets.keys().next().value;
      buckets.delete(oldestKey);
    }
  }

  function evaluate({ key, limit, windowMs, now = Date.now(), consume }) {
    if (!key || !Number.isInteger(limit) || limit < 1 || windowMs < 1) {
      throw new Error("Geçersiz rate limit yapılandırması.");
    }

    const storedBucket = buckets.get(key);
    const activeEntries = (storedBucket?.timestamps || []).filter(
      (timestamp) => now - timestamp < windowMs
    );

    if (activeEntries.length >= limit) {
      return {
        ok: false,
        remaining: 0,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((activeEntries[0] + windowMs - now) / 1000)
        ),
      };
    }

    if (consume) {
      if (!storedBucket) {
        ensureCapacity(now);
      }

      activeEntries.push(now);
      buckets.set(key, { timestamps: activeEntries, windowMs });
    } else if (storedBucket && activeEntries.length === 0) {
      buckets.delete(key);
    }

    return {
      ok: true,
      remaining: Math.max(0, limit - activeEntries.length),
      retryAfterSeconds: 0,
    };
  }

  return {
    check(options) {
      return evaluate({ ...options, consume: false });
    },
    consume(options) {
      return evaluate({ ...options, consume: true });
    },
    reset(key) {
      buckets.delete(key);
    },
    size() {
      return buckets.size;
    },
  };
}
