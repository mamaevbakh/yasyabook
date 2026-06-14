"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowRight, BookOpen } from "lucide-react";

const unlockedKey = "yasyabook-unlocked";

type AccessGateProps = {
  children: React.ReactNode;
};

export function AccessGate({ children }: AccessGateProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const tabIdRef = useRef("");
  const [checking, setChecking] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const tabId = getTabId();
      tabIdRef.current = tabId;
      setUnlocked(sessionStorage.getItem(unlockedKey) === tabId);
      setChecking(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!checking && !unlocked) inputRef.current?.focus();
  }, [checking, unlocked]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (code === process.env.NEXT_PUBLIC_ACCESS_CODE) {
      const tabId = tabIdRef.current || getTabId();
      tabIdRef.current = tabId;
      sessionStorage.setItem(unlockedKey, tabId);
      setUnlocked(true);
      setError("");
      return;
    }

    setError("That code does not match. Please try again.");
    setCode("");
    inputRef.current?.focus();
  }

  if (checking) {
    return (
      <main className="gate-shell" aria-label="Loading">
        <div className="loading-orb" />
      </main>
    );
  }

  if (unlocked) return children;

  return (
    <main className="gate-shell">
      <div className="gate-glow gate-glow-left" />
      <div className="gate-glow gate-glow-right" />
      <section className="gate-card">
        <div className="gate-mark">
          <BookOpen size={22} strokeWidth={1.8} />
        </div>
        <p className="eyebrow">Private study archive</p>
        <h1>Welcome to YasyaBook</h1>
        <p className="gate-copy">
          A quiet place for lessons, ideas, and everything worth remembering.
        </p>

        <form onSubmit={handleSubmit} className="gate-form">
          <label htmlFor="access-code">Access code</label>
          <div className="gate-input-row">
            <input
              ref={inputRef}
              id="access-code"
              type="password"
              value={code}
              onChange={(event) => {
                setCode(event.target.value);
                setError("");
              }}
              placeholder="Enter your code"
              autoComplete="off"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "access-error" : undefined}
            />
            <button type="submit" aria-label="Open notebook">
              <ArrowRight size={19} />
            </button>
          </div>
          <p id="access-error" className="gate-error" aria-live="polite">
            {error}
          </p>
        </form>
      </section>
      <p className="gate-footer">Your learning, thoughtfully collected.</p>
    </main>
  );
}

function getTabId() {
  const state = (history.state ?? {}) as Record<string, unknown>;
  if (typeof state.yasyabookTabId === "string") {
    return state.yasyabookTabId;
  }

  const tabId = crypto.randomUUID();
  history.replaceState({ ...state, yasyabookTabId: tabId }, "");
  return tabId;
}
