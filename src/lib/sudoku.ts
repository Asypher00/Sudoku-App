export type Board = number[][];
export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

const BASE = 3;
const SIDE = BASE * BASE;
const clues: Record<Difficulty, number> = { easy: 42, medium: 36, hard: 30, expert: 26 };

const shuffled = <T,>(items: T[]) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
};

const pattern = (row: number, col: number) => (BASE * (row % BASE) + Math.floor(row / BASE) + col) % SIDE;
const rows = () => shuffled([0,1,2]).flatMap((band) => shuffled([0,1,2]).map((row) => band * BASE + row));

export function createSolvedBoard(): Board {
  const rowOrder = rows();
  const colOrder = rows();
  const digits = shuffled([1,2,3,4,5,6,7,8,9]);
  return rowOrder.map((row) => colOrder.map((col) => digits[pattern(row, col)]));
}

export function countSolutions(board: Board, limit = 2): number {
  let count = 0;
  const working = board.map((row) => [...row]);

  function solve() {
    if (count >= limit) return;
    let targetRow = -1;
    let targetCol = -1;
    let candidates: number[] = [];

    for (let row = 0; row < SIDE; row++) {
      for (let col = 0; col < SIDE; col++) {
        if (working[row][col]) continue;
        const possible = [1,2,3,4,5,6,7,8,9].filter((value) => isValidMove(working, row, col, value));
        if (!candidates.length || possible.length < candidates.length) {
          targetRow = row;
          targetCol = col;
          candidates = possible;
        }
      }
    }

    if (targetRow === -1) {
      count++;
      return;
    }

    for (const value of candidates) {
      working[targetRow][targetCol] = value;
      solve();
      working[targetRow][targetCol] = 0;
      if (count >= limit) return;
    }
  }

  solve();
  return count;
}

export function isValidMove(board: Board, row: number, col: number, value: number) {
  for (let index = 0; index < SIDE; index++) {
    if (index !== col && board[row][index] === value) return false;
    if (index !== row && board[index][col] === value) return false;
  }
  const startRow = Math.floor(row / BASE) * BASE;
  const startCol = Math.floor(col / BASE) * BASE;
  for (let r = startRow; r < startRow + BASE; r++) {
    for (let c = startCol; c < startCol + BASE; c++) {
      if ((r !== row || c !== col) && board[r][c] === value) return false;
    }
  }
  return true;
}

export function generatePuzzle(difficulty: Difficulty) {
  const solution = createSolvedBoard();
  const puzzle = solution.map((row) => [...row]);
  const cells = shuffled(Array.from({ length: 81 }, (_, index) => index));
  let remaining = 81;

  for (const cell of cells) {
    if (remaining <= clues[difficulty]) break;
    const row = Math.floor(cell / 9);
    const col = cell % 9;
    const previous = puzzle[row][col];
    puzzle[row][col] = 0;
    if (countSolutions(puzzle) !== 1) puzzle[row][col] = previous;
    else remaining--;
  }

  return { puzzle, solution };
}

export const cloneBoard = (board: Board) => board.map((row) => [...row]);
