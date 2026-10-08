import { app } from './app.js';
import { connectDatabase } from './config/database.js';
import { env, validateEnv } from './config/env.js';
import { seedAchievements } from './services/achievement.service.js';

try {
  validateEnv();
  await connectDatabase();
  await seedAchievements();
  app.listen(env.port, () => console.log(`Sudoku API listening on http://localhost:${env.port}`));
} catch (error) {
  console.error(`Backend startup failed: ${error.message}`);
  process.exitCode = 1;
}
