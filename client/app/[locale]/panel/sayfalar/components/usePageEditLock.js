"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const HEARTBEAT_INTERVAL_MS = 30_000;
const BLOCKED_RETRY_INTERVAL_MS = 15_000;

function isCurrentEffect(generationRef, generation) {
  return generationRef.current === generation;
}

async function postLockAction(pageId, body, options = {}) {
  const response = await fetch(`/api/admin/pages/${pageId}/lock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    keepalive: options.keepalive === true,
  });
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

export default function usePageEditLock(pageId) {
  const clientIdRef = useRef(null);
  const lockTokenRef = useRef("");
  const generationRef = useRef(0);
  const [lockState, setLockState] = useState(() => ({
    status: pageId ? "acquiring" : "not-required",
    lock: null,
    error: "",
  }));

  if (!clientIdRef.current) {
    clientIdRef.current = crypto.randomUUID();
  }

  const acquire = useCallback(async (action = "acquire") => {
    if (!pageId) return false;

    setLockState((current) => ({
      ...current,
      status: "acquiring",
      error: "",
    }));

    const { response, payload } = await postLockAction(pageId, {
      action,
      clientId: clientIdRef.current,
    });

    if (!response.ok) {
      lockTokenRef.current = "";
      setLockState({
        status: response.status === 409 ? "blocked" : "error",
        lock: payload.lock || null,
        error: payload.error || "Düzenleme kilidi alınamadı.",
      });
      return false;
    }

    lockTokenRef.current = payload.lockToken;
    setLockState({ status: "owned", lock: payload.lock, error: "" });
    return true;
  }, [pageId]);

  useEffect(() => {
    if (!pageId) {
      setLockState({ status: "not-required", lock: null, error: "" });
      return undefined;
    }

    const generation = ++generationRef.current;
    let disposed = false;

    const start = async () => {
      const { response, payload } = await postLockAction(pageId, {
        action: "acquire",
        clientId: clientIdRef.current,
      });

      if (disposed) {
        if (response.ok && isCurrentEffect(generationRef, generation)) {
          await postLockAction(
            pageId,
            { action: "release", lockToken: payload.lockToken },
            { keepalive: true }
          ).catch(() => undefined);
        }
        return;
      }

      if (!response.ok) {
        setLockState({
          status: response.status === 409 ? "blocked" : "error",
          lock: payload.lock || null,
          error: payload.error || "Düzenleme kilidi alınamadı.",
        });
        return;
      }

      lockTokenRef.current = payload.lockToken;
      setLockState({ status: "owned", lock: payload.lock, error: "" });
    };

    setLockState({ status: "acquiring", lock: null, error: "" });
    start().catch((error) => {
      if (!disposed) {
        setLockState({
          status: "error",
          lock: null,
          error: error.message || "Düzenleme kilidi alınamadı.",
        });
      }
    });

    return () => {
      disposed = true;

      setTimeout(() => {
        if (!isCurrentEffect(generationRef, generation)) return;
        const lockToken = lockTokenRef.current;
        lockTokenRef.current = "";

        if (lockToken) {
          postLockAction(
            pageId,
            { action: "release", lockToken },
            { keepalive: true }
          ).catch(() => undefined);
        }
      }, 0);
    };
  }, [pageId]);

  useEffect(() => {
    if (!pageId || lockState.status !== "owned") return undefined;

    let heartbeatInFlight = false;
    const interval = setInterval(async () => {
      if (heartbeatInFlight || !lockTokenRef.current) return;
      heartbeatInFlight = true;

      try {
        const { response, payload } = await postLockAction(pageId, {
          action: "heartbeat",
          lockToken: lockTokenRef.current,
        });

        if (!response.ok) {
          lockTokenRef.current = "";
          setLockState({
            status: response.status === 409 ? "blocked" : "error",
            lock: payload.lock || null,
            error: payload.error || "Düzenleme kilidi yenilenemedi.",
          });
        } else {
          setLockState({ status: "owned", lock: payload.lock, error: "" });
        }
      } catch (error) {
        lockTokenRef.current = "";
        setLockState({
          status: "error",
          lock: null,
          error: error.message || "Düzenleme kilidi yenilenemedi.",
        });
      } finally {
        heartbeatInFlight = false;
      }
    }, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [lockState.status, pageId]);

  useEffect(() => {
    if (!pageId || lockState.status !== "blocked") return undefined;

    const interval = setInterval(() => {
      acquire("acquire").catch(() => undefined);
    }, BLOCKED_RETRY_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [acquire, lockState.status, pageId]);

  return {
    ...lockState,
    editable: !pageId || lockState.status === "owned",
    lockToken: lockTokenRef.current,
    retry: () => acquire("acquire"),
    takeover: () => acquire("takeover"),
  };
}
