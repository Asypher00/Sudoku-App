export const publicUser = (user) => ({ id: String(user._id), email: user.email, username: user.username, rating: user.rating });
export const publicGame = (game) => ({
  id: String(game._id), difficulty: game.difficulty, puzzle: game.puzzle, currentBoard: game.currentBoard,
  status: game.status, elapsedSeconds: game.elapsedSeconds, mistakes: game.mistakes, hintsUsed: game.hintsUsed,
  startedAt: game.startedAt, lastPlayedAt: game.lastPlayedAt, completedAt: game.completedAt,
  ratingChange: game.ratingChange, ratingAfter: game.ratingAfter,
});
