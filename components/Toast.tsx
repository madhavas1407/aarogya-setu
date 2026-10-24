"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type Notify = (message: string) => void;

export function useToast() {
  const [message, setMessage] = useState("");
  const timer = useRef<number | undefined>(undefined);

  // Each new message restarts the timer, so an older timeout can no longer hide a newer message early.
  const notify = useCallback<Notify>((text) => {
    window.clearTimeout(timer.current);
    setMessage(text);
    timer.current = window.setTimeout(() => setMessage(""), 3600);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);
  return { message, notify };
}

export function Toast({ message }: { message: string }) {
  return <div className="toast" role="status" aria-live="polite" data-visible={message ? "true" : "false"}>{message}</div>;
}
