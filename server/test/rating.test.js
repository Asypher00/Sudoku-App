import { test } from '@jest/globals';
import assert from 'node:assert/strict';
import { calculateRatingChange } from '../src/services/rating.service.js';
import { publicGame, publicUser } from '../src/serializers.js';

test('rating reflects difficulty and penalties and stays bounded', () => {
  const base = { elapsedSeconds: 600, mistakes: 0, hintsUsed: 0 };
  const easy = calculateRatingChange({ ...base, difficulty: 'easy' });
  const expert = calculateRatingChange({ ...base, difficulty: 'expert' });
  assert.ok(expert > easy);
  assert.ok(calculateRatingChange({ ...base, difficulty: 'expert', mistakes: 100, hintsUsed: 100 }) >= -25);
  assert.ok(calculateRatingChange({ ...base, difficulty: 'expert', elapsedSeconds: 1 }) <= 35);
});

test('serializers omit solution, password hash, and email from game data', () => {
  const game = publicGame({ _id: 'game1', solution: [[1]], puzzle: [], currentBoard: [], difficulty: 'easy', status: 'in_progress' });
  const user = publicUser({ _id: 'user1', email: 'player@example.com', passwordHash: 'secret', rating: 1000 });
  assert.equal('solution' in game, false);
  assert.equal('passwordHash' in user, false);
  assert.equal('email' in game, false);
});
