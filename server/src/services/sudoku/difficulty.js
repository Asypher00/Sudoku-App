export const difficulties = {
  easy: { minClues: 38, maxClues: 45 }, medium: { minClues: 32, maxClues: 37 },
  hard: { minClues: 27, maxClues: 31 }, expert: { minClues: 22, maxClues: 26 },
};

export function calculateDifficulty(board) {
  const clues = board.flat().filter(Boolean).length;
  return Object.entries(difficulties).find(([, range]) => clues >= range.minClues && clues <= range.maxClues)?.[0] || null;
}
