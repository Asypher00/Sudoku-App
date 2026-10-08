import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';
const source = ts.transpileModule(readFileSync(new URL('../src/lib/play.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { applyNumber, emptyNotes, streaks } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const game = () => ({ id: 'test', difficulty: 'medium', puzzle: Array.from({ length: 9 }, () => Array(9).fill(0)), solution: Array.from({ length: 9 }, () => Array(9).fill(1)), board: Array.from({ length: 9 }, () => Array(9).fill(0)), notes: emptyNotes(), seconds: 0, mistakes: 0, hintsUsed: 0, completed: false });
test('pencil notes toggle without changing answers or mistakes, then clear on an answer', () => {
  const original = game();
  const noted = applyNumber(original, 0, 0, 9, true);
  assert.deepEqual(noted.notes[0][0], [9]); assert.equal(noted.mistakes, 0); assert.equal(noted.board[0][0], 0);
  assert.deepEqual(original.notes[0][0], []);
  assert.deepEqual(applyNumber(noted, 0, 0, 9, true).notes[0][0], []);
  const answered = applyNumber(noted, 0, 0, 1, false);
  assert.equal(answered.board[0][0], 1); assert.deepEqual(answered.notes[0][0], []);
});
test('three wrong answers end play and cannot become eight out of three', () => {
  let current = game();
  for (let count = 0; count < 8; count++) current = applyNumber(current, 0, 0, 9, false);
  assert.equal(current.mistakes, 3);
  assert.equal(applyNumber(current, 0, 0, 1, false), current);
  assert.equal(applyNumber(current, 0, 0, 2, true), current);
});
test('given cells and completed games cannot be edited', () => {
  const current = game(); current.puzzle[0][0] = 1;
  assert.equal(applyNumber(current, 0, 0, 9, false), current);
  current.completed = true;
  assert.equal(applyNumber(current, 1, 1, 9, true), current);
});
test('daily streak starts at zero, counts each day once, crosses months, and resets after gaps', () => {
  assert.deepEqual(streaks([], '2026-10-08'), { current: 0, best: 0 });
  assert.deepEqual(streaks(['2026-10-08', '2026-10-08'], '2026-10-08'), { current: 1, best: 1 });
  assert.deepEqual(streaks(['2026-09-30', '2026-10-01', '2026-10-02'], '2026-10-03'), { current: 3, best: 3 });
  assert.deepEqual(streaks(['2026-09-30', '2026-10-01', '2026-10-02', '2026-10-08'], '2026-10-08'), { current: 1, best: 3 });
  assert.deepEqual(streaks(['2026-10-01'], '2026-10-08'), { current: 0, best: 1 });
});
