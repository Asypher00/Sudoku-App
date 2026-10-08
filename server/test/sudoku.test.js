import { test } from '@jest/globals';
import assert from 'node:assert/strict';
import { generateSudoku, hasUniqueSolution, isComplete, isValidBoard, isValidMove, solveSudoku, calculateDifficulty } from '../src/services/sudoku/index.js';

test('generated puzzles have the requested clue range and exactly one solution', () => {
  for (const difficulty of ['easy', 'medium', 'hard', 'expert']) {
    const { puzzle, solution } = generateSudoku(difficulty);
    assert.equal(isValidBoard(puzzle), true);
    assert.equal(isComplete(solution), true);
    assert.equal(hasUniqueSolution(puzzle), true);
    assert.equal(calculateDifficulty(puzzle), difficulty);
    assert.deepEqual(solveSudoku(puzzle), solution);
  }
});

test('move validation rejects row, column, and box conflicts', () => {
  const board = Array.from({ length: 9 }, () => Array(9).fill(0));
  board[0][0] = 1;
  assert.equal(isValidMove(board, 0, 4, 1), false);
  assert.equal(isValidMove(board, 4, 0, 1), false);
  assert.equal(isValidMove(board, 1, 1, 1), false);
  assert.equal(isValidMove(board, 4, 4, 1), true);
  board[0][1] = 1;
  assert.equal(isValidBoard(board), false);
});
