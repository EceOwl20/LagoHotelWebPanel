"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const HEARTBEAT_INTERVAL_MS = 30_000;
const BLOCKED_RETRY_INTERVAL_MS = 15_000;

function isCurrentEffect(generationRef, generation) {
  return generationRef.current === generation;
}

async function postLockAction(endpoint, body, options = {}) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    keepalive: options.keepalive === true,
  });
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

export function useEditLock(resourceId, endpoint) {
  const clientIdRef = useRef(null);
  const lockTokenRef = useRef("");
  const lockResourceIdRef = useRef("");
  const generationRef = useRef(0);
  const activeResourceIdRef = useRef(resourceId);
  const [lockState, setLockState] = useState(() => ({
    status: resourceId ? "acquiring" : "not-required",
    lock: null,
    error: "",
  }));

  if (!clientIdRef.current) {
    clientIdRef.current = crypto.randomUUID();
  }
  activeResourceIdRef.current = resourceId;

  const acquire = useCallback(async (action = "acquire") => {
    if (!resourceId) return false;

    setLockState((current) => ({
      ...current,
      status: "acquiring",
      error: "",
    }));

    const { response, payload } = await postLockAction(endpoint, {
      action,
      clientId: clientIdRef.current,
    });

    if (!response.ok) {
      lockTokenRef.current = "";
      lockResourceIdRef.current = "";
      setLockState({
        status: response.status === 409 ? "blocked" : "error",
        lock: payload.lock || null,
        error: payload.error || "Düzenleme kilidi alınamadı.",
      });
      return false;
    }

    lockTokenRef.current = payload.lockToken;
    lockResourceIdRef.current = resourceId;
    setLockState({ status: "owned", lock: payload.lock, error: "" });
    return true;
  }, [endpoint, resourceId]);

  useEffect(() => {
    if (!resourceId) {
      setLockState({ status: "not-required", lock: null, error: "" });
      return undefined;
    }

    const generation = ++generationRef.current;
    let disposed = false;
    let effectLockToken = "";

    const start = async () => {
      const { response, payload } = await postLockAction(endpoint, {
        action: "acquire",
        clientId: clientIdRef.current,
      });

      if (disposed) {
        if (response.ok && activeResourceIdRef.current !== resourceId) {
          await postLockAction(
            endpoint,
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

      effectLockToken = payload.lockToken;
      lockTokenRef.current = payload.lockToken;
      lockResourceIdRef.current = resourceId;
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
        const sameResourceWasRestarted =
          !isCurrentEffect(generationRef, generation) &&
          activeResourceIdRef.current === resourceId;
        if (sameResourceWasRestarted) return;

        const lockToken = effectLockToken || lockTokenRef.current;
        if (lockTokenRef.current === lockToken) {
          lockTokenRef.current = "";
          lockResourceIdRef.current = "";
        }

        if (lockToken) {
          postLockAction(
            endpoint,
            { action: "release", lockToken },
            { keepalive: true }
          ).catch(() => undefined);
        }
      }, 0);
    };
  }, [endpoint, resourceId]);

  useEffect(() => {
    if (!resourceId || lockState.status !== "owned") return undefined;

    let heartbeatInFlight = false;
    const interval = setInterval(async () => {
      if (heartbeatInFlight || !lockTokenRef.current) return;
      heartbeatInFlight = true;

      try {
        const { response, payload } = await postLockAction(endpoint, {
          action: "heartbeat",
          lockToken: lockTokenRef.current,
        });

        if (!response.ok) {
          lockTokenRef.current = "";
          lockResourceIdRef.current = "";
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
        lockResourceIdRef.current = "";
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
  }, [endpoint, lockState.status, resourceId]);

  useEffect(() => {
    if (!resourceId || lockState.status !== "blocked") return undefined;

    const interval = setInterval(() => {
      acquire("acquire").catch(() => undefined);
    }, BLOCKED_RETRY_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [acquire, lockState.status, resourceId]);

  return {
    ...lockState,
    editable:
      !resourceId ||
      (lockState.status === "owned" && lockResourceIdRef.current === resourceId),
    lockToken: lockTokenRef.current,
    retry: () => acquire("acquire"),
    takeover: () => acquire("takeover"),
  };
}

export default function usePageEditLock(pageId) {
  const endpoint = pageId ? `/api/admin/pages/${pageId}/lock` : "";
  return useEditLock(pageId, endpoint);
}
