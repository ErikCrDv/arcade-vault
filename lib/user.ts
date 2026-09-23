export interface SessionUser {
  name: string;
}

export interface SavedScoreEntry {
  game: string; // Game.id
  score: number;
  name: string;
  at: number; // Date.now()
}
