import { cloneBoard, DIGITS, isValidBoard, isValidMove } from './validator.js';

export function countSolutions(board, limit = 2) {
  if (!isValidBoard(board)) return 0;
  const working = cloneBoard(board);
  let count = 0;
  function search() {
    if (count >= limit) return;
    let best = null;
    for (let row = 0; row < 9; row++) for (let col = 0; col < 9; col++) {
      if (working[row][col]) continue;
      const candidates = DIGITS.filter((value) => isValidMove(working, row, col, value));
      if (!candidates.length) return;
      if (!best || candidates.length < best.candidates.length) best = { row, col, candidates };
    }
    if (!best) { count++; return; }
    for (const value of best.candidates) {
      working[best.row][best.col] = value;
      search();
      working[best.row][best.col] = 0;
      if (count >= limit) return;
    }
  }
  search();
  return count;
}

export const hasUniqueSolution = (board) => countSolutions(board, 2) === 1;

export function solveSudoku(board) {
  if (!isValidBoard(board)) return null;
  const working = cloneBoard(board);
  function search() {
    let best = null;
    for (let row = 0; row < 9; row++) for (let col = 0; col < 9; col++) {
      if (working[row][col]) continue;
      const candidates = DIGITS.filter((value) => isValidMove(working, row, col, value));
      if (!candidates.length) return false;
      if (!best || candidates.length < best.candidates.length) best = { row, col, candidates };
    }
    if (!best) return true;
    for (const value of best.candidates) {
      working[best.row][best.col] = value;
      if (search()) return true;
      working[best.row][best.col] = 0;
    }
    return false;
  }
  return search() ? working : null;
}
