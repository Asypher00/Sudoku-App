import { cloneBoard } from './validator.js';
import { hasUniqueSolution } from './solver.js';
import { difficulties } from './difficulty.js';

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}
const order = () => shuffle([0, 1, 2]).flatMap((band) => shuffle([0, 1, 2]).map((row) => band * 3 + row));

export function generateSudoku(difficulty) {
  const range = difficulties[difficulty];
  if (!range) throw new Error('Invalid difficulty');
  // Retry whole grids: greedy removal may stall before the requested clue count.
  for (let attempt = 0; attempt < 12; attempt++) {
    const rows = order();
    const cols = order();
    const digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const solution = rows.map((row) => cols.map((col) => digits[(3 * (row % 3) + Math.floor(row / 3) + col) % 9]));
    const puzzle = cloneBoard(solution);
    const target = range.minClues + Math.floor(Math.random() * (range.maxClues - range.minClues + 1));
    let remaining = 81;
    for (const cell of shuffle(Array.from({ length: 81 }, (_, index) => index))) {
      if (remaining <= target) break;
      const row = Math.floor(cell / 9);
      const col = cell % 9;
      const previous = puzzle[row][col];
      puzzle[row][col] = 0;
      if (hasUniqueSolution(puzzle)) remaining--;
      else puzzle[row][col] = previous;
    }
    if (remaining >= range.minClues && remaining <= range.maxClues) return { puzzle, solution };
  }
  throw new Error(`Unable to generate ${difficulty} puzzle; please retry`);
}
