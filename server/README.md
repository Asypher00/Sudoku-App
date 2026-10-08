# Sudoku backend

Node.js, Express, and MongoDB API for the existing Vite frontend. It listens on port 3000 by default.

## Run locally

1. Start MongoDB. MongoDB Atlas or a local `mongod` instance works. A replica set enables transactional completion; a standalone server works but cannot make a multi-document completion atomic.
2. Copy `.env.example` to `.env` inside `server/` and set `MONGODB_URI` and a unique `JWT_SECRET` of at least 32 characters. Keep `CLIENT_URL=http://localhost:5173` if using the default Vite address.
3. In `server/`, run `npm install` and `npm run dev`.
4. Open `http://localhost:3000/api/health` to check the API.

The frontend must send cookies on every authenticated request:

```js
await fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ email: 'player@example.com', password: 'password123' }),
});

const response = await fetch('http://localhost:3000/api/games', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ difficulty: 'medium' }),
});
```

Use `http://localhost:5173` as the frontend address when `CLIENT_URL` has that value. `http://127.0.0.1:5173` is a different origin and needs an explicit `CLIENT_URL` change. The frontend calls the authentication API for email signup, login, logout, and session restoration. Gameplay now uses `/api/play` for separate per-account Easy, Medium, and Hard saves, including pencil notes, mistakes, hints, and elapsed time. Hard maps to the expert generator. Play-day history in the user document powers daily streaks.

## Routes

| Purpose | Endpoints |
| --- | --- |
| Health | `GET /api/health` |
| Authentication | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` |
| Resumable frontend play | `GET /api/play`, `POST /api/play/:difficulty`, `PUT /api/play/:id` |
| Games | `POST /api/games`, `GET /api/games/active`, `GET /api/games/history`, `GET/PATCH /api/games/:gameId`, `POST /api/games/:gameId/move`, `POST /api/games/:gameId/hint`, `POST /api/games/:gameId/complete`, `POST /api/games/:gameId/abandon` |
| Player | `GET /api/stats`, `GET /api/achievements`, `GET /api/achievements/me`, `GET /api/achievements/progress` |
| Ranking | `GET /api/leaderboard` |

Run `npm test`, `npm run lint`, and `npm run build` in `server/` to check the backend. Set `MONGODB_TEST_URI` to run the full database integration test; it uses a unique temporary database and drops its collections afterward.
