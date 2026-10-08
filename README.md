# Nudoku

A polished, responsive Sudoku game built with React and Vite. It includes generated puzzles with unique solutions, three difficulty levels, keyboard and touch input, hints, mistake tracking, pause/resume, an elapsed timer, completion feedback, and account-based progress persistence.

## Run locally

Use Node.js 20 or later and two terminals in the project directory.

**Terminal 1 — backend:**

```bash
cd server
npm install
npm run dev
```

The local `server/.env` is configured with the Atlas connection and a generated JWT secret. Keep it private. On a fresh checkout, copy `server/.env.example` to `server/.env` and supply `MONGODB_URI` (use the `nudoku` database), a random `JWT_SECRET` of at least 32 characters, and `CLIENT_URL=http://localhost:5173`.

**Terminal 2 — frontend:**

```bash
npm install
npm run dev
```

Open http://localhost:5173. Both `localhost:5173` and `127.0.0.1:5173` work in development. Vite forwards `/api` requests to the backend on port 3000. Restart Vite after changing its proxy configuration. Confirm that http://localhost:3000/api/health returns `{"success":true,"status":"ok"}`. Keep both terminals running. If port 5173 is busy, stop the other process before starting the frontend.

## Test authentication

1. Click **New here? Sign up**.
2. Enter your email address (up to 254 characters) and a password of at least 8 characters, then click **Sign up**.
3. Confirm the difficulty chooser opens and the account bar shows your email address. Choose Easy, Medium, or Hard.
4. Refresh the page to confirm your session persists.
5. Click **Log out**. Confirm the login form appears; refresh to confirm you remain logged out.
6. Enter the same email address and password, then click **Log in**. Confirm the same account opens.
7. Try an incorrect password and a duplicate signup to confirm errors appear.

Accounts are stored in Atlas under `nudoku.users`; passwords are hashed with bcrypt. Authentication uses an HTTP-only session cookie. Email addresses act as usernames and are case insensitive. The API retains legacy username support for existing clients. Each account has a MongoDB save for Easy, Medium, and Hard. Selecting a difficulty resumes its saved puzzle. Hard uses expert puzzles (22–26 clues). Reset replaces only the selected difficulty. Completed puzzles are replaced on the next selection; lost puzzles require Try Again or Reset. Three mistakes end a game. Notes toggle candidate numbers without affecting answers or mistakes. Daily streaks count calendar days on which a user opens a difficulty in their local timezone; repeat visits on one day count once. Legacy shared browser saves are not imported because they have no account owner.

If the backend cannot connect, check Atlas **Network Access** for your current IP, **Database Access** for the database user's permissions, and whether the cluster is active. The Compass connection string is also valid for the backend.

## Quality checks

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

The game screen requires a backend session.
