# Sudoku 3D Web Game

## Backend Product Requirements Document (PRD)

**Document status:** Implementation-ready specification\
**Version:** 1.1\
**Scope:** Backend only\
**Database:** MongoDB\
**Backend stack:** Node.js + Express + Mongoose\
**Authentication:** JWT + HTTP-only cookie\
**Primary audience:** Codex / software implementation agent

------------------------------------------------------------------------

# 1. Purpose

This document defines the backend for the existing Sudoku web
application.

The existing frontend already provides the initial user experience and
contains, or is intended to contain, the following concepts:

-   Login / registration
-   Sudoku gameplay
-   Difficulty selection
-   Game completion
-   Statistics
-   Achievements
-   Player rating / ranking

This backend PRD focuses only on the server-side implementation required
to support those features.

The backend must be authoritative for:

-   Authentication
-   User identity
-   Password verification
-   Sudoku puzzle generation
-   Sudoku solution validation
-   Game state
-   Game completion
-   Game results
-   Player statistics
-   Player rating
-   Achievement unlocking
-   Global player ranking

The backend must not trust the frontend for any security-sensitive
decision.

------------------------------------------------------------------------

# 2. Scope

## 2.1 Included in V1 backend

### Authentication

-   User registration
-   Email/password login
-   JWT authentication
-   Two-day authentication lifetime
-   Automatic authentication across browser refreshes
-   Logout
-   Current-user endpoint
-   Protected API routes
-   Password hashing
-   Authentication rate limiting

### Users

-   User account
-   Email
-   Password hash
-   Account timestamps
-   Basic player statistics
-   Rating
-   Ranking-related fields

### Sudoku

-   Puzzle generation
-   Four difficulty levels:
    -   Easy
    -   Medium
    -   Hard
    -   Expert
-   Unique-solution validation
-   Server-side move validation
-   Server-side completion validation
-   Game persistence
-   Active-game retrieval
-   Game history

### Results

-   Completion time
-   Mistakes
-   Hints used
-   Difficulty
-   Completion status
-   Rating impact
-   Result history

### Rating

-   Initial player rating
-   Rating changes after completed games
-   Rating history
-   Global ranking
-   Difficulty-aware rating calculation
-   Protection against obvious client-side rating manipulation

### Achievements

-   Achievement definitions
-   Achievement progress
-   Achievement unlocking
-   Achievement history
-   Achievement retrieval API

### Statistics

-   Games played
-   Games completed
-   Games abandoned
-   Best times by difficulty
-   Average completion time
-   Total mistakes
-   Total hints
-   Current rating
-   Highest rating
-   Achievements unlocked

------------------------------------------------------------------------

# 3. Explicitly Out of Scope

Do not implement these in this backend version:

-   Google login
-   Apple login
-   GitHub login
-   OAuth
-   Email verification
-   Password reset email
-   Two-factor authentication
-   Social login
-   Multiplayer games
-   Real-time matchmaking
-   Friend challenges
-   Chat
-   Payments
-   Subscriptions
-   Ads
-   Admin dashboard
-   Complex role-based access control
-   Public puzzle creation
-   User-generated puzzles
-   PWA/offline synchronization
-   Microservices
-   Redis unless later required for scaling/rate limiting
-   Anti-cheat infrastructure beyond server-authoritative validation

------------------------------------------------------------------------

# 4. Architecture

Use a modular monolithic backend.

``` text
Frontend
   |
   | HTTP / JSON
   v
Express API
   |
   +-------------------+
   |                   |
Controllers          Middleware
   |                   |
   v                   v
Services          JWT Authentication
   |
   +-----------------------------+
   |             |       |       |
 Auth Service  Game   Rating  Achievement
               Service Service Service
   |             |       |       |
   +-------------+-------+-------+
                 |
              Mongoose
                 |
              MongoDB
```

Use this request flow:

``` text
Route
  ↓
Middleware
  ↓
Controller
  ↓
Service
  ↓
Model
  ↓
MongoDB
```

This backend must use **MVC with a service layer**.

Because this is a REST API, there is no server-rendered HTML View layer.
The API response/serializer layer serves the role of the View by
converting internal data into safe JSON responses.

Responsibilities:

-   **Routes:** Define HTTP endpoints and attach middleware.
-   **Controllers:** Receive requests, call services, and return API
    responses.
-   **Services:** Contain business logic and orchestration.
-   **Models:** Define Mongoose schemas and database access.
-   **Middleware:** Authentication, authorization, validation, rate
    limiting, CORS, and error handling.
-   **Validators:** Validate request parameters, query strings, and
    bodies.
-   **Serializers / response helpers:** Control exactly which fields are
    sent to the frontend.

Controllers must remain thin.

Business logic must not be placed directly in routes or controllers.
MongoDB queries should not be scattered throughout controllers.

------------------------------------------------------------------------

# 5. Technology Requirements

## Backend

-   Node.js
-   Express
-   MongoDB
-   Mongoose
-   bcrypt
-   jsonwebtoken
-   cookie-parser
-   Zod or express-validator
-   helmet
-   cors
-   express-rate-limit

## Testing

-   Jest
-   Supertest

Avoid adding dependencies unless there is a concrete requirement.

------------------------------------------------------------------------

# 6. Environment Configuration

Never put MongoDB credentials, JWT secrets, database passwords, or other
secrets inside source code or the PRD.

Use environment variables.

Required variables:

``` env
PORT=5000

# MongoDB
MONGODB_URI=

# Authentication
JWT_SECRET=
JWT_EXPIRES_IN=2d

# CORS
CLIENT_URL=

NODE_ENV=development
```

## 6.1 MongoDB credentials required

The backend requires a MongoDB connection string. The recommended
approach is to provide **one `MONGODB_URI` environment variable** rather
than putting individual credentials throughout the codebase.

Depending on how MongoDB is hosted, the connection string will contain:

``` text
MongoDB host
MongoDB port (if not using the default)
Database name
MongoDB username
MongoDB password
Authentication database / authSource (if required)
TLS configuration (if required by the provider)
```

For example, the backend configuration conceptually looks like:

``` env
MONGODB_URI=mongodb://<USERNAME>:<PASSWORD>@<HOST>:<PORT>/<DATABASE>?authSource=admin
```

For MongoDB Atlas, the URI will normally look like:

``` env
MONGODB_URI=mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER>/<DATABASE>?retryWrites=true&w=majority
```

**Do not put the real MongoDB username or password in this PRD, source
code, Git repository, frontend code, screenshots, or API responses.**

The actual value must exist only in the backend `.env` file or the
deployment platform's secret/environment-variable manager.

### Information required from the project owner

Before starting backend implementation, provide:

1.  MongoDB connection URI, **or**
2.  MongoDB host
3.  MongoDB port
4.  MongoDB database name
5.  MongoDB username
6.  MongoDB password
7.  `authSource` if applicable
8.  Whether TLS/SSL is required

If a complete `MONGODB_URI` is provided, items 2-8 do not need to be
supplied separately.

### `.env.example`

The repository must contain placeholders only:

``` env
PORT=5000
MONGODB_URI=
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=2d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

The real `.env` file must be listed in `.gitignore`.

Optional:

``` env
BCRYPT_SALT_ROUNDS=12
LOGIN_RATE_LIMIT_WINDOW_MS=
LOGIN_RATE_LIMIT_MAX=
```

The `.env` file must never be committed.

Provide:

``` text
.env.example
```

with empty or placeholder values.

------------------------------------------------------------------------

# 7. Authentication Requirements

## 7.1 Registration

Endpoint:

``` http
POST /api/auth/register
```

Request:

``` json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Validation:

### Email

-   Required
-   Valid email format
-   Trimmed
-   Lowercase
-   Unique

### Password

-   Required
-   Minimum 8 characters
-   Never stored as plaintext

Registration flow:

``` text
Client
  ↓
Validate request
  ↓
Normalize email
  ↓
Check existing user
  ↓
Hash password
  ↓
Create User
  ↓
Create JWT
  ↓
Set HTTP-only cookie
  ↓
Return public user information
```

Successful response:

``` json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "...",
    "rating": 1000
  }
}
```

Never return:

-   Password
-   Password hash
-   JWT secret
-   Internal security fields

------------------------------------------------------------------------

# 8. Login

Endpoint:

``` http
POST /api/auth/login
```

Request:

``` json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Flow:

``` text
Normalize email
      ↓
Find user
      ↓
Compare password using bcrypt
      ↓
Generate JWT
      ↓
Set authentication cookie
      ↓
Update lastLoginAt
```

Invalid credentials must return the same generic error whether:

-   Email does not exist
-   Password is incorrect

Example:

``` json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password."
  }
}
```

Do not reveal whether an account exists.

------------------------------------------------------------------------

# 9. JWT Session Requirements

Authentication lifetime:

``` text
2 days
```

JWT payload should contain only minimal identity information:

``` json
{
  "userId": "ObjectId",
  "iat": 1234567890,
  "exp": 1234730690
}
```

Do not put:

-   Password
-   Password hash
-   Rating
-   Achievements
-   Game state
-   Statistics
-   Sensitive user information

inside the JWT.

## Cookie

Use an HTTP-only cookie.

Recommended production configuration:

``` javascript
{
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  maxAge: 2 * 24 * 60 * 60 * 1000
}
```

For local development, `secure` may be disabled when using HTTP.

The frontend should not store the JWT in localStorage.

------------------------------------------------------------------------

# 10. Authentication Persistence

The intended behavior is:

``` text
Day 0:
User logs in
       ↓
JWT valid for 2 days

Day 1:
User opens application
       ↓
JWT still valid
       ↓
No login form required

Day 2+:
JWT expired
       ↓
User must authenticate again
```

The backend must expose:

``` http
GET /api/auth/me
```

The frontend can call this endpoint when the application starts.

Response:

``` json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "...",
    "rating": 1042
  }
}
```

If the JWT is missing or expired:

``` http
401 Unauthorized
```

------------------------------------------------------------------------

# 11. Logout

Endpoint:

``` http
POST /api/auth/logout
```

The server clears the authentication cookie.

Response:

``` json
{
  "success": true
}
```

JWTs are stateless, so logout in V1 does not require a token blacklist.

If token revocation becomes necessary later, add a server-side
session/revocation mechanism.

------------------------------------------------------------------------

# 12. Authentication Middleware

Create:

``` text
auth.middleware.js
```

Responsibilities:

1.  Read JWT cookie.
2.  Verify signature.
3.  Verify expiration.
4.  Extract userId.
5.  Load user where necessary.
6.  Attach authenticated user information to the request.

Example:

``` javascript
req.user = {
  id: decoded.userId
};
```

Protected routes must reject unauthenticated requests.

------------------------------------------------------------------------

# 13. User Data Model

MongoDB collection:

``` text
users
```

Suggested model:

``` javascript
{
  _id: ObjectId,

  email: String,
  passwordHash: String,

  rating: Number,
  highestRating: Number,

  stats: {
    gamesPlayed: Number,
    gamesCompleted: Number,
    gamesAbandoned: Number,

    totalMistakes: Number,
    totalHints: Number,

    totalPlayTimeSeconds: Number,

    bestTimes: {
      easy: Number,
      medium: Number,
      hard: Number,
      expert: Number
    }
  },

  createdAt: Date,
  updatedAt: Date,
  lastLoginAt: Date
}
```

Defaults:

``` text
rating = 1000
highestRating = 1000

gamesPlayed = 0
gamesCompleted = 0
gamesAbandoned = 0
totalMistakes = 0
totalHints = 0
totalPlayTimeSeconds = 0
```

Create a unique index:

``` text
email
```

Create an index for ranking:

``` text
rating
```

------------------------------------------------------------------------

# 14. Sudoku Game Model

MongoDB collection:

``` text
games
```

Suggested schema:

``` javascript
{
  _id: ObjectId,

  userId: ObjectId,

  difficulty: "easy" | "medium" | "hard" | "expert",

  puzzle: [[Number]],
  solution: [[Number]],
  currentBoard: [[Number]],

  status: "in_progress" | "completed" | "abandoned",

  elapsedSeconds: Number,

  mistakes: Number,
  hintsUsed: Number,

  startedAt: Date,
  lastPlayedAt: Date,
  completedAt: Date,

  ratingBefore: Number,
  ratingChange: Number,
  ratingAfter: Number,

  createdAt: Date,
  updatedAt: Date
}
```

Index:

``` text
{ userId: 1, status: 1 }
```

Index:

``` text
{ userId: 1, createdAt: -1 }
```

------------------------------------------------------------------------

# 15. Critical Security Decision: Solution Storage

The backend needs the Sudoku solution to validate completion.

The solution may be stored in MongoDB.

However:

## Never return the solution in normal gameplay responses.

For example, this is prohibited:

``` json
{
  "puzzle": [],
  "solution": []
}
```

Normal gameplay responses should contain:

``` json
{
  "game": {
    "id": "...",
    "difficulty": "medium",
    "puzzle": [],
    "currentBoard": [],
    "status": "in_progress"
  }
}
```

The server internally retrieves the solution when validating:

``` text
POST /api/games/:gameId/complete
```

------------------------------------------------------------------------

# 16. Sudoku Engine

Create a dedicated module:

``` text
services/sudoku/
```

Recommended structure:

``` text
sudoku/
├── generator.js
├── solver.js
├── validator.js
├── difficulty.js
└── index.js
```

Required functions:

``` text
generateSudoku()
solveSudoku()
hasUniqueSolution()
isValidMove()
isValidBoard()
isComplete()
calculateDifficulty()
```

The frontend must never be authoritative for Sudoku validity.

------------------------------------------------------------------------

# 17. Difficulty Levels

Support:

``` text
easy
medium
hard
expert
```

Initial configurable clue ranges:

``` javascript
{
  easy: {
    minClues: 38,
    maxClues: 45
  },

  medium: {
    minClues: 32,
    maxClues: 37
  },

  hard: {
    minClues: 27,
    maxClues: 31
  },

  expert: {
    minClues: 22,
    maxClues: 26
  }
}
```

These are starting configuration values.

The generator must guarantee:

``` text
Valid Sudoku
+
Unique solution
```

Difficulty can later become more sophisticated.

------------------------------------------------------------------------

# 18. Game Creation

Endpoint:

``` http
POST /api/games
```

Request:

``` json
{
  "difficulty": "medium"
}
```

Backend:

1.  Authenticate user.
2.  Validate difficulty.
3.  Generate puzzle.
4.  Generate/store solution.
5.  Create game.
6.  Set currentBoard = puzzle.
7.  Set status = in_progress.
8.  Set startedAt.
9.  Return game without solution.

Response:

``` json
{
  "success": true,
  "game": {
    "id": "...",
    "difficulty": "medium",
    "puzzle": [],
    "currentBoard": [],
    "status": "in_progress",
    "elapsedSeconds": 0,
    "mistakes": 0,
    "hintsUsed": 0
  }
}
```

------------------------------------------------------------------------

# 19. Active Game

Endpoint:

``` http
GET /api/games/active
```

Return the authenticated user's unfinished game.

V1 rule:

``` text
One active game per user.
```

If no active game exists:

``` json
{
  "success": true,
  "game": null
}
```

When creating a new game, the backend should prevent accidental creation
of multiple active games unless the existing game is explicitly
abandoned.

------------------------------------------------------------------------

# 20. Game Retrieval

Endpoint:

``` http
GET /api/games/:gameId
```

The query must always include ownership:

``` javascript
Game.findOne({
  _id: gameId,
  userId: req.user.id
});
```

Never do:

``` javascript
Game.findById(gameId);
```

and return the result directly.

This prevents users from accessing another player's games.

------------------------------------------------------------------------

# 21. Saving Game State

Endpoint:

``` http
PATCH /api/games/:gameId
```

Allowed fields:

``` json
{
  "currentBoard": [],
  "elapsedSeconds": 312
}
```

The backend must not blindly trust:

``` json
{
  "status": "completed",
  "ratingChange": 500
}
```

Client-controlled fields such as rating changes must never be accepted.

The server controls:

-   Status
-   Completion
-   Rating
-   Statistics
-   Achievement unlocking

------------------------------------------------------------------------

# 22. Move Validation

Endpoint:

``` http
POST /api/games/:gameId/move
```

Request:

``` json
{
  "row": 3,
  "col": 5,
  "value": 7
}
```

Backend verifies:

1.  User owns game.
2.  Game is in progress.
3.  Row is 0-8.
4.  Column is 0-8.
5.  Value is 1-9.
6.  Target cell is not an original clue.
7.  Move does not violate Sudoku rules.

Response:

``` json
{
  "success": true,
  "valid": true,
  "currentBoard": [],
  "mistakes": 0
}
```

Invalid:

``` json
{
  "success": true,
  "valid": false,
  "mistakes": 1,
  "reason": "conflict"
}
```

The backend increments mistakes.

The frontend must not be trusted to send the correct mistake count.

------------------------------------------------------------------------

# 23. Completion

Endpoint:

``` http
POST /api/games/:gameId/complete
```

The backend retrieves the stored game and validates:

1.  User owns game.
2.  Game is still in progress.
3.  Board contains no empty cells.
4.  Board is a valid Sudoku.
5.  Board matches the generated solution.

Only then:

``` text
status = completed
completedAt = current timestamp
```

The backend then:

``` text
Save result
↓
Update user statistics
↓
Calculate rating change
↓
Update user rating
↓
Update highest rating if applicable
↓
Evaluate achievements
↓
Return completion result
```

------------------------------------------------------------------------

# 24. Timer Integrity

Do not trust a client-provided elapsed time as the authoritative value.

The game stores:

``` text
startedAt
lastPlayedAt
completedAt
elapsedSeconds
```

For V1, the backend should use server-side timestamps as the
authoritative source where possible.

The frontend may display a live timer, but the backend should calculate
or sanity-check final elapsed time.

Do not allow a client to submit:

``` json
{
  "elapsedSeconds": 1
}
```

for a game that clearly took substantially longer according to server
timestamps.

V1 does not need sophisticated anti-cheat detection, but obvious
timestamp manipulation must not directly control ratings.

------------------------------------------------------------------------

# 25. Hints

Endpoint:

``` http
POST /api/games/:gameId/hint
```

Backend:

1.  Authenticate user.
2.  Verify game ownership.
3.  Verify game is active.
4.  Select an empty cell.
5.  Retrieve correct value from solution.
6.  Apply hint.
7.  Increment hintsUsed.
8.  Persist game.

Response:

``` json
{
  "success": true,
  "hint": {
    "row": 3,
    "col": 5,
    "value": 7
  },
  "hintsUsed": 1
}
```

The frontend should not choose the correct answer.

------------------------------------------------------------------------

# 26. Game Abandonment

Endpoint:

``` http
POST /api/games/:gameId/abandon
```

The backend:

``` text
status = abandoned
```

Set:

``` text
lastPlayedAt
updatedAt
```

Update user statistics:

``` text
gamesAbandoned += 1
```

An abandoned game must not produce a rating increase.

------------------------------------------------------------------------

# 27. Game History

Endpoint:

``` http
GET /api/games/history?page=1&limit=20
```

Return only the authenticated user's games.

Do not return the solution.

Recommended fields:

``` json
{
  "id": "...",
  "difficulty": "hard",
  "status": "completed",
  "elapsedSeconds": 742,
  "mistakes": 3,
  "hintsUsed": 1,
  "ratingChange": 18,
  "ratingAfter": 1068,
  "completedAt": "..."
}
```

Support:

-   Pagination
-   Difficulty filter
-   Status filter
-   Sorting by newest first

------------------------------------------------------------------------

# 28. Player Rating System

The frontend already contains a rating concept.

V1 should use a simple deterministic rating system rather than
attempting to build a sophisticated competitive ranking algorithm.

## Starting rating

Every new player starts at:

``` text
1000
```

## Rating principles

Rating should be influenced by:

-   Difficulty
-   Completion
-   Completion time
-   Mistakes
-   Hints

A player who consistently completes harder puzzles efficiently should
generally accumulate more rating than a player who only completes easier
puzzles.

However, the system must remain explainable.

------------------------------------------------------------------------

# 29. Rating Calculation

Create:

``` text
rating.service.js
```

Recommended process:

``` text
Game completed
     ↓
Determine difficulty factor
     ↓
Determine performance score
     ↓
Calculate rating delta
     ↓
Clamp delta to safe range
     ↓
Update user rating
     ↓
Store rating history
```

Suggested difficulty factors:

``` javascript
{
  easy: 1.0,
  medium: 1.25,
  hard: 1.5,
  expert: 1.8
}
```

These are configuration values and should not be hardcoded into
controllers.

------------------------------------------------------------------------

# 30. Performance Score

The rating service should calculate a normalized performance score.

Inputs:

``` text
difficulty
elapsedSeconds
mistakes
hintsUsed
```

Do not use a raw linear formula where extremely fast times produce
unlimited rating.

The rating calculation should have reasonable bounds.

For example:

``` text
Base difficulty points
        ↓
Time modifier
        ↓
Mistake modifier
        ↓
Hint modifier
        ↓
Final performance score
```

The final rating change must be bounded.

Recommended V1 bounds:

``` text
Minimum rating change: -25
Maximum rating change: +35
```

A completed game should normally produce a non-negative rating change if
the player performs within the expected range.

A poor performance can produce a small or zero increase rather than
allowing arbitrary rating inflation.

------------------------------------------------------------------------

# 31. Rating History

MongoDB collection:

``` text
ratingHistory
```

Schema:

``` javascript
{
  _id: ObjectId,

  userId: ObjectId,
  gameId: ObjectId,

  ratingBefore: Number,
  ratingChange: Number,
  ratingAfter: Number,

  difficulty: String,

  elapsedSeconds: Number,
  mistakes: Number,
  hintsUsed: Number,

  createdAt: Date
}
```

Indexes:

``` text
{ userId: 1, createdAt: -1 }
```

``` text
{ gameId: 1 }
```

The rating history creates an audit trail.

------------------------------------------------------------------------

# 32. Important Rating Integrity Rule

The client must never send:

``` json
{
  "rating": 5000,
  "ratingChange": 1000
}
```

The server calculates all rating values.

The only rating inputs accepted from the gameplay layer are
authoritative game results already validated by the backend.

------------------------------------------------------------------------

# 33. Ranking

Endpoint:

``` http
GET /api/leaderboard
```

Return ranked users by:

``` text
rating DESC
```

Example:

``` json
{
  "success": true,
  "players": [
    {
      "rank": 1,
      "userId": "...",
      "rating": 1540,
      "gamesCompleted": 48
    },
    {
      "rank": 2,
      "userId": "...",
      "rating": 1498,
      "gamesCompleted": 52
    }
  ]
}
```

Do not expose:

-   Email addresses
-   Password hashes
-   Private account information

V1 can display an anonymized identifier such as:

``` text
Player #A81F
```

or a generated public username if the frontend later introduces one.

Since the current product only requires email/password authentication,
do not automatically expose email addresses on the public leaderboard.

------------------------------------------------------------------------

# 34. Ranking Scope

V1 ranking is global across all registered users.

Future extensions may support:

-   Daily ranking
-   Weekly ranking
-   Monthly ranking
-   Friends ranking
-   Country ranking
-   Difficulty-specific ranking

Do not implement these now.

------------------------------------------------------------------------

# 35. Achievements

The frontend contains an achievements section, so achievements become
part of the backend in this version.

Achievements should be server-authoritative.

The client should never send:

``` json
{
  "achievementUnlocked": true
}
```

The backend evaluates achievement conditions.

------------------------------------------------------------------------

# 36. Achievement Model

Use two concepts:

## Achievement definitions

Collection:

``` text
achievements
```

Example:

``` javascript
{
  _id: ObjectId,

  code: "FIRST_WIN",

  name: "First Solve",

  description: "Complete your first Sudoku.",

  category: "progress",

  criteria: {
    type: "games_completed",
    target: 1
  },

  points: 10,

  isActive: true,

  createdAt: Date,
  updatedAt: Date
}
```

## User achievements

Collection:

``` text
userAchievements
```

Schema:

``` javascript
{
  _id: ObjectId,

  userId: ObjectId,
  achievementId: ObjectId,

  unlockedAt: Date,

  progress: Number
}
```

Unique index:

``` text
{ userId: 1, achievementId: 1 }
```

This prevents duplicate achievement unlocks.

------------------------------------------------------------------------

# 37. Initial Achievement Set

Implement a small V1 set.

### FIRST_WIN

``` text
Complete your first Sudoku.
```

Target:

``` text
1 completed game
```

### TEN_WINS

``` text
Complete 10 Sudoku games.
```

Target:

``` text
10 completed games
```

### FIFTY_WINS

``` text
Complete 50 Sudoku games.
```

Target:

``` text
50 completed games
```

### HARD_SOLVER

``` text
Complete a Hard Sudoku.
```

Target:

``` text
1 hard completion
```

### EXPERT_SOLVER

``` text
Complete an Expert Sudoku.
```

Target:

``` text
1 expert completion
```

### NO_MISTAKES

``` text
Complete a Sudoku without mistakes.
```

Target:

``` text
mistakes = 0
```

### SPEED_SOLVER

``` text
Complete an Easy Sudoku within the configured speed threshold.
```

The exact threshold must be configurable.

### CONSISTENT_PLAYER

``` text
Complete 5 games.
```

This can later be replaced with a true streak achievement.

------------------------------------------------------------------------

# 38. Achievement Evaluation

Create:

``` text
achievement.service.js
```

After a valid game completion:

``` text
Game completion
      ↓
Update statistics
      ↓
Evaluate achievement rules
      ↓
Find newly satisfied achievements
      ↓
Create userAchievement records
      ↓
Return newly unlocked achievements
```

Example response:

``` json
{
  "success": true,
  "completion": {
    "time": 412,
    "mistakes": 0,
    "hintsUsed": 0,
    "ratingChange": 21,
    "rating": 1021
  },
  "newAchievements": [
    {
      "code": "FIRST_WIN",
      "name": "First Solve",
      "points": 10
    },
    {
      "code": "NO_MISTAKES",
      "name": "Clean Solve",
      "points": 15
    }
  ]
}
```

------------------------------------------------------------------------

# 39. Achievements API

## Get all achievement definitions

``` http
GET /api/achievements
```

Returns:

``` json
{
  "success": true,
  "achievements": []
}
```

## Get current user's achievements

``` http
GET /api/achievements/me
```

Returns:

``` json
{
  "success": true,
  "achievements": [
    {
      "code": "FIRST_WIN",
      "name": "First Solve",
      "description": "Complete your first Sudoku.",
      "unlocked": true,
      "unlockedAt": "..."
    }
  ]
}
```

## Get achievement progress

``` http
GET /api/achievements/progress
```

Example:

``` json
{
  "success": true,
  "progress": [
    {
      "code": "TEN_WINS",
      "current": 7,
      "target": 10,
      "unlocked": false
    }
  ]
}
```

------------------------------------------------------------------------

# 40. Statistics

Endpoint:

``` http
GET /api/stats
```

Response:

``` json
{
  "success": true,
  "stats": {
    "gamesPlayed": 25,
    "gamesCompleted": 20,
    "gamesAbandoned": 5,

    "averageTime": 612,

    "bestTimes": {
      "easy": 240,
      "medium": 430,
      "hard": 790,
      "expert": 1200
    },

    "totalMistakes": 42,
    "totalHints": 8,

    "rating": 1142,
    "highestRating": 1180,

    "achievementsUnlocked": 4
  }
}
```

Statistics must be derived from server-controlled data.

------------------------------------------------------------------------

# 41. Statistics Consistency

Avoid letting multiple API requests accidentally increment statistics
twice.

Completion must be idempotent.

If:

``` http
POST /api/games/:gameId/complete
```

is called twice:

-   The first valid request completes the game.
-   The second request must not:
    -   Increase gamesCompleted again.
    -   Increase rating again.
    -   Unlock achievements again.
    -   Add another rating history entry.

Return:

``` text
GAME_ALREADY_COMPLETED
```

or return the already-recorded result without mutating data.

Use a MongoDB transaction where appropriate.

------------------------------------------------------------------------

# 42. MongoDB Transaction Requirements

When completing a game, the following operations are logically
connected:

``` text
Game completion
+
User statistics update
+
User rating update
+
Rating history insert
+
Achievement unlock
```

Use a MongoDB transaction if the deployment supports MongoDB
transactions.

Conceptually:

``` text
BEGIN TRANSACTION

validate game
mark completed
update user stats
update rating
insert rating history
insert achievements

COMMIT
```

If an operation fails:

``` text
ROLLBACK
```

This prevents partial completion states.

------------------------------------------------------------------------

# 43. API Route Structure

``` text
/api
│
├── /health
│
├── /auth
│   ├── POST /register
│   ├── POST /login
│   ├── POST /logout
│   └── GET  /me
│
├── /games
│   ├── POST / 
│   ├── GET  /active
│   ├── GET  /history
│   ├── GET  /:gameId
│   ├── PATCH /:gameId
│   ├── POST /:gameId/move
│   ├── POST /:gameId/hint
│   ├── POST /:gameId/complete
│   └── POST /:gameId/abandon
│
├── /stats
│   └── GET /
│
├── /achievements
│   ├── GET /
│   ├── GET /me
│   └── GET /progress
│
└── /leaderboard
    └── GET /
```

------------------------------------------------------------------------

# 44. Backend Repository Structure

Recommended:

``` text
server/
├── src/
│   ├── config/
│   │   ├── db.js
│   │   ├── env.js
│   │   └── security.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── game.controller.js
│   │   ├── stats.controller.js
│   │   ├── achievement.controller.js
│   │   └── leaderboard.controller.js
│   │
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── game.service.js
│   │   ├── sudoku/
│   │   │   ├── generator.js
│   │   │   ├── solver.js
│   │   │   ├── validator.js
│   │   │   └── difficulty.js
│   │   ├── rating.service.js
│   │   ├── achievement.service.js
│   │   └── stats.service.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Game.js
│   │   ├── RatingHistory.js
│   │   ├── Achievement.js
│   │   └── UserAchievement.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── game.routes.js
│   │   ├── stats.routes.js
│   │   ├── achievement.routes.js
│   │   └── leaderboard.routes.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   ├── validation.middleware.js
│   │   └── rateLimit.middleware.js
│   │
│   ├── utils/
│   │   ├── errors.js
│   │   ├── response.js
│   │   └── constants.js
│   │
│   ├── app.js
│   └── server.js
│
├── tests/
│   ├── unit/
│   └── integration/
│
├── .env.example
├── package.json
└── README.md
```

------------------------------------------------------------------------

# 45. Error Handling

All APIs should use a consistent format.

Success:

``` json
{
  "success": true,
  "data": {}
}
```

Error:

``` json
{
  "success": false,
  "error": {
    "code": "INVALID_MOVE",
    "message": "The selected number conflicts with the current board."
  }
}
```

Suggested codes:

``` text
VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
INVALID_CREDENTIALS
EMAIL_ALREADY_EXISTS
INVALID_MOVE
GAME_ALREADY_COMPLETED
GAME_NOT_ACTIVE
ACTIVE_GAME_EXISTS
INVALID_GAME_STATE
INVALID_DIFFICULTY
ACHIEVEMENT_NOT_FOUND
INTERNAL_SERVER_ERROR
```

Do not expose stack traces in production.

------------------------------------------------------------------------

# 46. Security Requirements

Mandatory:

-   bcrypt password hashing
-   Never log passwords
-   Never return password hashes
-   JWT signature verification
-   JWT expiration
-   HTTP-only authentication cookie
-   Secure cookie in production
-   Input validation
-   MongoDB query validation
-   CORS configuration
-   Helmet
-   Rate limiting
-   Environment variables for secrets
-   No `.env` in Git
-   Authorization on every game endpoint
-   Ownership checks on every game query
-   Server-authoritative rating
-   Server-authoritative achievements
-   Server-authoritative completion
-   No solution in normal gameplay responses

------------------------------------------------------------------------

# 47. Login Rate Limiting

Protect:

``` text
POST /api/auth/login
POST /api/auth/register
```

against brute-force attempts.

Example starting configuration:

``` text
100 requests / 15 minutes / IP
```

The exact production limits should be configurable.

Do not permanently lock users out because of a few failed attempts.

------------------------------------------------------------------------

# 48. CORS

CORS must be **strictly restricted to the current Sudoku frontend**.

For the current development setup:

``` env
CLIENT_URL=http://localhost:5173
```

The backend must allow only the exact value configured in `CLIENT_URL`.

Example:

``` javascript
cors({
  origin: process.env.CLIENT_URL,
  credentials: true
})
```

Required behavior:

-   Allow the configured frontend origin only.
-   Allow credentials because JWT authentication uses an HTTP-only
    cookie.
-   Reject requests from unrelated origins.
-   Do not use `origin: "*"` because credentials/cookies are required.
-   Do not use a permissive list such as `["*"]`.
-   Do not allow arbitrary origins dynamically.
-   Keep the frontend origin in an environment variable so it can be
    changed without modifying source code.

For production, replace `CLIENT_URL` with the exact deployed frontend
URL:

``` env
CLIENT_URL=https://your-frontend-domain.com
```

If the frontend is moved to another domain, update `CLIENT_URL`
explicitly. Do not broaden CORS as a workaround.

The backend should also configure the authentication cookie consistently
with the deployment environment, including `secure` and `sameSite`
settings.

------------------------------------------------------------------------

# 49. Backend Folder Structure

Use the following **MVC + Service Layer** structure:

``` text
server/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── env.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── game.controller.js
│   │   ├── stats.controller.js
│   │   ├── achievement.controller.js
│   │   └── leaderboard.controller.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   ├── rateLimit.middleware.js
│   │   ├── validate.middleware.js
│   │   └── notFound.middleware.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Game.js
│   │   ├── RatingHistory.js
│   │   ├── Achievement.js
│   │   └── UserAchievement.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── game.routes.js
│   │   ├── stats.routes.js
│   │   ├── achievement.routes.js
│   │   └── leaderboard.routes.js
│   │
│   ├── services/
│   │   ├── auth/
│   │   │   └── auth.service.js
│   │   ├── sudoku/
│   │   │   ├── generator.js
│   │   │   ├── solver.js
│   │   │   ├── validator.js
│   │   │   └── difficulty.js
│   │   ├── game/
│   │   │   └── game.service.js
│   │   ├── rating/
│   │   │   └── rating.service.js
│   │   ├── achievement/
│   │   │   └── achievement.service.js
│   │   └── stats/
│   │       └── stats.service.js
│   │
│   ├── validators/
│   │   ├── auth.validator.js
│   │   ├── game.validator.js
│   │   └── common.validator.js
│   │
│   ├── serializers/
│   │   ├── user.serializer.js
│   │   ├── game.serializer.js
│   │   └── leaderboard.serializer.js
│   │
│   ├── utils/
│   │   ├── jwt.js
│   │   ├── password.js
│   │   └── errors.js
│   │
│   ├── app.js
│   └── server.js
│
├── tests/
│   ├── unit/
│   └── integration/
│
├── .env
├── .env.example
├── .gitignore
└── package.json
```

### MVC responsibility rule

``` text
Route
  ↓
Middleware
  ↓
Controller
  ↓
Service
  ↓
Model
  ↓
MongoDB

Service
  ↓
Serializer
  ↓
Controller
  ↓
JSON Response
```

Do not put business logic in route files.

Do not put MongoDB queries directly in controllers unless they are
trivial and there is a clear reason.

Do not put Sudoku algorithms in controllers or models.

Do not return raw Mongoose documents directly when the response contains
private fields such as `passwordHash`.

The frontend remains completely separate from the backend:

``` text
client/
server/
```

Required indexes:

### Users

``` text
email UNIQUE
rating DESC
```

### Games

``` text
userId + status
userId + createdAt DESC
```

### RatingHistory

``` text
userId + createdAt DESC
gameId
```

### UserAchievement

``` text
userId + achievementId UNIQUE
userId + unlockedAt DESC
```

### Achievements

``` text
code UNIQUE
```

------------------------------------------------------------------------

# 50. Backend Tests

## Authentication

Test:

-   Register valid user
-   Register duplicate email
-   Password is hashed
-   Login valid credentials
-   Login wrong password
-   Login unknown email
-   JWT cookie created
-   JWT expires
-   `/me` with valid JWT
-   `/me` without JWT
-   Logout clears cookie
-   Protected route without authentication returns 401

## Sudoku

Test:

-   Valid board
-   Invalid row
-   Invalid column
-   Invalid box
-   Solver
-   Generator
-   Unique solution
-   Four difficulty levels

## Game

Test:

-   Create game
-   Retrieve game
-   Retrieve active game
-   Update game
-   Make valid move
-   Reject invalid move
-   Reject modification of clue
-   Complete valid game
-   Reject invalid completion
-   Abandon game
-   Game ownership

## Rating

Test:

-   New user starts at 1000
-   Valid completion changes rating
-   Difficulty affects calculation
-   Rating delta is bounded
-   Rating history created
-   Client cannot directly set rating
-   Completion cannot apply rating twice

## Achievements

Test:

-   First completion unlocks FIRST_WIN
-   Ten completions unlock TEN_WINS
-   Hard completion unlocks HARD_SOLVER
-   Expert completion unlocks EXPERT_SOLVER
-   Zero-mistake completion unlocks NO_MISTAKES
-   Duplicate unlock is impossible

## Security

Test:

-   User A cannot access User B's game
-   User A cannot access User B's achievements
-   User A cannot modify User B's rating
-   User cannot submit arbitrary rating changes
-   User cannot mark a game completed from the client
-   User cannot retrieve another user's private statistics

------------------------------------------------------------------------

# 51. API Integration Tests

Use Supertest.

Minimum end-to-end test:

``` text
Register
   ↓
Receive authentication cookie
   ↓
GET /auth/me
   ↓
Create game
   ↓
Retrieve active game
   ↓
Make moves
   ↓
Complete game
   ↓
Verify statistics
   ↓
Verify rating
   ↓
Verify rating history
   ↓
Verify achievements
   ↓
Verify leaderboard
```

------------------------------------------------------------------------

# 52. Health Endpoint

Implement:

``` http
GET /api/health
```

Response:

``` json
{
  "success": true,
  "status": "ok"
}
```

Optionally verify MongoDB connectivity in a separate readiness endpoint
later.

------------------------------------------------------------------------

# 53. API Response Principle

Never expose MongoDB documents directly from controllers.

Bad:

``` javascript
res.json(user);
```

Preferred:

``` javascript
res.json({
  success: true,
  user: {
    id: user._id,
    email: user.email,
    rating: user.rating
  }
});
```

Create response serializers where useful.

------------------------------------------------------------------------

# 54. Important Frontend Integration Contract

The backend must provide predictable responses so the existing frontend
can consume them.

The frontend should not need to know:

-   MongoDB
-   Mongoose
-   bcrypt
-   JWT internals
-   Rating algorithm internals
-   Achievement evaluation internals

The frontend should only consume APIs.

------------------------------------------------------------------------

# 55. Backend State Ownership

## Backend owns

``` text
User identity
Passwords
JWT validity
Puzzle
Solution
Game state
Mistakes
Hints
Completion
Elapsed-time validation
Statistics
Rating
Rating history
Achievements
Leaderboard
```

## Frontend owns

``` text
Visual state
Selected cell
Animations
3D rendering
Temporary input state
Loading indicators
Error presentation
Timer display
```

The frontend can optimistically update UI, but the backend remains
authoritative.

------------------------------------------------------------------------

# 56. Rating and Achievement Event Flow

The central completion flow should be:

``` text
POST /games/:id/complete
             |
             v
      Authenticate user
             |
             v
       Load game + user
             |
             v
       Verify ownership
             |
             v
       Validate board
             |
             v
        Is complete?
          /       \
        No         Yes
        |           |
      Reject        v
             Mark completed
                    |
                    v
             Update statistics
                    |
                    v
             Calculate rating
                    |
                    v
             Save rating history
                    |
                    v
          Evaluate achievements
                    |
                    v
          Commit transaction
                    |
                    v
              Return result
```

------------------------------------------------------------------------

# 57. Completion Response

A successful completion should return everything the completion screen
needs.

Example:

``` json
{
  "success": true,

  "completion": {
    "gameId": "...",
    "difficulty": "hard",
    "elapsedSeconds": 742,
    "mistakes": 2,
    "hintsUsed": 0
  },

  "rating": {
    "before": 1080,
    "change": 24,
    "after": 1104
  },

  "newAchievements": [
    {
      "code": "HARD_SOLVER",
      "name": "Hard Solver",
      "points": 20
    }
  ]
}
```

------------------------------------------------------------------------

# 58. Public vs Private Data

## Public leaderboard data

Allowed:

``` text
Rank
Public player identifier
Rating
Completed games
```

## Private data

Never expose publicly:

``` text
Email
Password hash
Game history
Detailed mistakes
Detailed hints
Authentication information
```

The current V1 does not require a public username.

If the frontend needs a display name later, add it as a separate product
requirement.

------------------------------------------------------------------------

# 59. Performance Requirements

The backend should:

-   Use MongoDB indexes.
-   Paginate game history.
-   Paginate leaderboard if necessary.
-   Avoid returning complete game collections.
-   Avoid returning Sudoku solutions.
-   Avoid unnecessary database queries.
-   Keep controllers thin.
-   Keep Sudoku algorithms isolated and testable.

Puzzle generation may be computationally expensive.

If generation becomes slow, optimize the generator before introducing
queues or microservices.

Do not introduce distributed infrastructure prematurely.

------------------------------------------------------------------------

# 60. Implementation Phases

## Phase 1: Backend foundation

Implement:

-   Server
-   Express
-   MongoDB connection
-   Environment configuration
-   Health endpoint
-   Error middleware
-   Basic project structure

Acceptance:

``` http
GET /api/health
```

works.

------------------------------------------------------------------------

## Phase 2: Authentication

Implement:

-   User model
-   bcrypt
-   Registration
-   Login
-   JWT
-   HTTP-only cookie
-   Logout
-   `/me`
-   Auth middleware
-   Rate limiting

Acceptance:

``` text
Register
→ Login
→ Refresh browser
→ Still authenticated
→ Logout
→ Protected route rejected
```

------------------------------------------------------------------------

## Phase 3: Sudoku engine

Implement:

-   Board representation
-   Validator
-   Solver
-   Unique solution checker
-   Generator
-   Difficulty configuration

Acceptance:

-   Generated puzzles are valid.
-   Generated puzzles have exactly one solution.
-   All four difficulty levels work.

------------------------------------------------------------------------

## Phase 4: Game persistence

Implement:

-   Game model
-   Create game
-   Active game
-   Get game
-   Save game
-   Move validation
-   Hint
-   Abandon
-   Complete
-   History

Acceptance:

``` text
Create
→ Play
→ Leave
→ Resume
→ Complete
```

works.

------------------------------------------------------------------------

## Phase 5: Statistics

Implement:

-   User statistics
-   Best times
-   Average time
-   Mistakes
-   Hints
-   Completed games
-   Abandoned games

Acceptance:

Statistics accurately reflect completed games.

------------------------------------------------------------------------

## Phase 6: Rating

Implement:

-   Initial rating
-   Rating service
-   Rating calculation
-   Rating history
-   Rating update on completion
-   Leaderboard

Acceptance:

``` text
Complete game
→ Rating calculated server-side
→ Rating saved
→ Rating history created
→ Leaderboard updated
```

------------------------------------------------------------------------

## Phase 7: Achievements

Implement:

-   Achievement model
-   Achievement definitions
-   User achievements
-   Achievement evaluation
-   Achievement progress
-   Achievement APIs

Acceptance:

Completing qualifying games automatically unlocks the correct
achievements exactly once.

------------------------------------------------------------------------

## Phase 8: Security hardening

Verify:

-   Cookie configuration
-   CORS
-   Helmet
-   Rate limiting
-   Input validation
-   Authorization
-   Ownership checks
-   No secret leakage
-   No solution leakage
-   No rating manipulation

------------------------------------------------------------------------

## Phase 9: Integration testing

Run:

``` text
npm test
npm run lint
npm run build
```

and all backend integration tests.

------------------------------------------------------------------------

# 61. Definition of Done

## Authentication

-   [ ] Registration works
-   [ ] Login works
-   [ ] Passwords are hashed
-   [ ] JWT expires after 2 days
-   [ ] Authentication survives refresh within 2 days
-   [ ] Logout works
-   [ ] Protected routes work
-   [ ] Rate limiting works

## Sudoku

-   [ ] Four difficulties work
-   [ ] Puzzles are valid
-   [ ] Puzzles have unique solutions
-   [ ] Server validates moves
-   [ ] Server validates completion
-   [ ] Solution is never returned during normal gameplay

## Games

-   [ ] Games persist
-   [ ] Active game can be resumed
-   [ ] Game history works
-   [ ] Abandonment works
-   [ ] Completion is idempotent

## Statistics

-   [ ] Games played tracked
-   [ ] Games completed tracked
-   [ ] Games abandoned tracked
-   [ ] Mistakes tracked
-   [ ] Hints tracked
-   [ ] Best times tracked
-   [ ] Average time calculated

## Rating

-   [ ] New user starts at 1000
-   [ ] Rating calculated server-side
-   [ ] Rating delta bounded
-   [ ] Rating history stored
-   [ ] Highest rating tracked
-   [ ] Leaderboard works
-   [ ] Client cannot manipulate rating

## Achievements

-   [ ] Achievement definitions exist
-   [ ] Achievement progress works
-   [ ] Achievements unlock automatically
-   [ ] Duplicate unlocks are impossible
-   [ ] User achievements can be retrieved

## Security

-   [ ] No plaintext passwords
-   [ ] No secrets committed
-   [ ] HTTP-only JWT cookie
-   [ ] CORS restricted
-   [ ] Rate limiting
-   [ ] Ownership validation
-   [ ] No cross-user game access
-   [ ] No cross-user private data access

------------------------------------------------------------------------

# 62. Codex Implementation Prompt

Use this prompt after adding this PRD to the repository:

> Read the backend PRD completely before modifying the codebase.
>
> The existing Sudoku frontend has already been developed. Your job is
> to build the backend described in this document without unnecessarily
> modifying the frontend.
>
> Before writing code:
>
> 1.  Inspect the repository.
> 2.  Identify the existing frontend structure.
> 3.  Identify the package manager.
> 4.  Identify existing dependencies.
> 5.  Determine whether a backend already exists.
> 6.  Inspect existing API calls or frontend service files.
> 7.  Identify exactly what backend contracts the frontend currently
>     expects.
> 8.  Do not expose or commit secrets.
> 9.  Do not replace working infrastructure unnecessarily.
> 10. State the files you intend to create or modify.
>
> Implement the backend incrementally in the following order:
>
> Phase 1: Backend foundation.
>
> Phase 2: Authentication.
>
> Phase 3: Sudoku engine.
>
> Phase 4: Game persistence.
>
> Phase 5: Statistics.
>
> Phase 6: Rating.
>
> Phase 7: Achievements.
>
> Phase 8: Security hardening.
>
> Phase 9: Integration tests.
>
> Do not implement later phases before the current phase is working and
> tested.
>
> Use the architecture:
>
> ``` text
> Route → Controller → Service → Model
> ```
>
> Keep Sudoku algorithms inside dedicated Sudoku services.
>
> Keep authentication logic inside the authentication service.
>
> Keep rating logic inside the rating service.
>
> Keep achievement logic inside the achievement service.
>
> The backend is authoritative.
>
> Never trust the frontend for:
>
> -   Completion
> -   Mistake count
> -   Rating
> -   Rating changes
> -   Achievements
> -   User ownership
> -   Sudoku validity
>
> After each phase:
>
> 1.  Run tests.
> 2.  Run lint.
> 3.  Run the relevant build/check commands.
> 4.  Fix failures.
> 5.  Summarize exactly what changed.
>
> Do not proceed to the next phase until the current phase is stable.

------------------------------------------------------------------------

# 63. Future Extension Points

Keep the architecture extensible for:

-   Daily Sudoku
-   Seasonal leaderboards
-   Friend challenges
-   Streaks
-   Rating seasons
-   More sophisticated rating algorithms
-   User profiles
-   Public usernames
-   Country/region leaderboards
-   Difficulty-specific ratings
-   Sudoku variants
-   Custom puzzles
-   Multiplayer
-   Social login
-   Password reset
-   Email verification
-   Two-factor authentication

These are not part of this backend V1.

------------------------------------------------------------------------

# 64. Final Backend Flow

The completed backend should support:

``` text
User
 |
 +--> Register
 |
 +--> Login
 |      |
 |      +--> JWT valid for 2 days
 |
 +--> Dashboard
        |
        +--> Create Sudoku
        |       |
        |       +--> Server generates puzzle
        |
        +--> Play
        |       |
        |       +--> Server validates moves
        |       +--> Server saves progress
        |
        +--> Complete
                |
                +--> Server validates solution
                |
                +--> Save game result
                |
                +--> Update statistics
                |
                +--> Calculate rating
                |
                +--> Save rating history
                |
                +--> Evaluate achievements
                |
                +--> Return completion result
                        |
                        +--> Frontend shows result
                        |
                        +--> Leaderboard reflects rating
                        |
                        +--> Achievements section reflects unlocks
```

The result is a modular MERN backend that supports the current Sudoku
frontend while leaving clear extension points for more advanced
competitive and social features later.
