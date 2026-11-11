"use client";

// Sesión y puntuaciones simuladas en localStorage (claves idénticas a la plantilla).
//   "av_user"   → User | null
//   "av_scores" → ScoreEntry[]

import { useCallback, useMemo, useSyncExternalStore } from "react";

export type User = { name: string }; // nombre en MAYÚSCULAS, máx. 10 caracteres
export type ScoreEntry = { game: string; score: number; name: string; at: number };

const USER_KEY = "av_user";
const SCORES_KEY = "av_scores";
const CHANGE_EVENT = "av:session-change";

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function parseUser(raw: string | null): User | null {
  try {
    const parsed = JSON.parse(raw || "null");
    return parsed && typeof parsed.name === "string" ? (parsed as User) : null;
  } catch {
    return null;
  }
}

/**
 * Usuario simulado. En el servidor y durante la hidratación devuelve `null`;
 * después de montar lee `av_user`. Todas las instancias (nav, formulario, salón)
 * se mantienen sincronizadas mediante un evento propio.
 */
export function useUser() {
  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(USER_KEY),
    () => null,
  );
  const user = useMemo(() => parseUser(raw), [raw]);

  const login = useCallback((u: User) => {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(u));
    } catch {}
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(USER_KEY);
    } catch {}
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { user, login, logout };
}

/** Agrega una entrada a `av_scores`. */
export function saveScore(entry: ScoreEntry) {
  let all: ScoreEntry[] = [];
  try {
    const parsed = JSON.parse(localStorage.getItem(SCORES_KEY) || "[]");
    if (Array.isArray(parsed)) all = parsed;
  } catch {}
  all.push(entry);
  try {
    localStorage.setItem(SCORES_KEY, JSON.stringify(all));
  } catch {}
}
