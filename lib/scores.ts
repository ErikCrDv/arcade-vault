import type { SavedScoreEntry } from "@/lib/user";

export function saveScore(entry: Omit<SavedScoreEntry, "at">) {
  try {
    const all: SavedScoreEntry[] = JSON.parse(localStorage.getItem("av_scores") || "[]");
    all.push({ ...entry, at: Date.now() });
    localStorage.setItem("av_scores", JSON.stringify(all));
  } catch {
    // localStorage no disponible; se ignora, igual que en la referencia.
  }
}
