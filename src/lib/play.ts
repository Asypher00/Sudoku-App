import type { Board } from './sudoku';
export type Level = 'easy' | 'medium' | 'hard';
export type Notes = number[][][];
export type PlayGame = { id: string; difficulty: Level; puzzle: Board; solution: Board; board: Board; notes: Notes; seconds: number; mistakes: number; hintsUsed: number; completed: boolean };
export const emptyNotes = (): Notes => Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => []));
export async function playRequest(path = '', method = 'GET', body?: unknown) {
  const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/play${path}`, { method, credentials: 'include', ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Could not save your game.');
  return data as { games: PlayGame[]; game: PlayGame; activity: string[] };
}
let pending: PlayGame | null = null;
let running: Promise<void> | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let report: (message: string) => void = () => {};
export function queueSave(game: PlayGame, onStatus: (message: string) => void) {
  pending = structuredClone(game); report = onStatus;
  clearTimeout(timer);
  report('Saving…');
  timer = setTimeout(() => { void flushPlaySaves().catch(() => {}); }, 250);
}
export async function flushPlaySaves(): Promise<void> {
  clearTimeout(timer);
  if (running) { await running; if (pending) return flushPlaySaves(); return; }
  running = (async () => {
    while (pending) {
      const snapshot = pending; pending = null;
      const { board, notes, seconds, mistakes, hintsUsed } = snapshot;
      try { await playRequest(`/${snapshot.id}`, 'PUT', { board, notes, seconds, mistakes, hintsUsed }); }
      catch (error) { pending ||= snapshot; report('Save failed. Check your connection; your changes are still here.'); throw error; }
    }
    report('Saved to your account');
  })();
  try { await running; } finally { running = null; }
}

export function streaks(days: string[], today: string) {
  const unique = new Set(days);
  const previous = (day: string) => { const date = new Date(`${day}T12:00:00Z`); date.setUTCDate(date.getUTCDate() - 1); return date.toISOString().slice(0, 10); };
  let current = 0;
  for (let day = unique.has(today) ? today : previous(today); unique.has(day); day = previous(day)) current++;
  let best = 0, run = 0, last = '';
  for (const day of [...unique].sort()) { run = last === previous(day) ? run + 1 : 1; best = Math.max(best, run); last = day; }
  return { current, best };
}
export const localDay = () => new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

export function applyNumber(game: PlayGame, row: number, col: number, value: number, notesMode: boolean): PlayGame {
  if (game.completed || game.mistakes >= 3 || game.puzzle[row][col]) return game;
  if (notesMode) {
    if (game.board[row][col]) return game;
    const notes = structuredClone(game.notes);
    notes[row][col] = notes[row][col].includes(value) ? notes[row][col].filter((number) => number !== value) : [...notes[row][col], value].sort();
    return { ...game, notes };
  }
  if (value !== game.solution[row][col]) return { ...game, mistakes: Math.min(3, game.mistakes + 1) };
  const board = game.board.map((line, r) => line.map((cell, c) => r === row && c === col ? value : cell));
  const notes = structuredClone(game.notes); notes[row][col] = [];
  return { ...game, board, notes, completed: board.every((line, r) => line.every((cell, c) => cell === game.solution[r][c])) };
}
