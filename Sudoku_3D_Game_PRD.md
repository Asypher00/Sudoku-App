# Sudoku 3D Web Game

## Product Requirements Document (PRD) for Codex

**Document status:** Implementation-ready specification\
**Version:** 1.0\
**Stack:** MERN + Three.js\
**Primary audience:** Codex / software implementation agent\
**Target platform:** Responsive web application, desktop-first with
mobile support

------------------------------------------------------------------------

## 1. Product Overview

Build a polished Sudoku game as a full-stack MERN web application.

The application allows users to:

1.  Create an account using only an email address and password.
2.  Sign in and remain authenticated across sessions.
3.  Start Sudoku games at different difficulty levels.
4.  Play Sudoku in an interactive 9x9 board.
5.  Receive immediate visual feedback for invalid moves.
6.  Track game state, completion, mistakes, elapsed time, and basic
    personal statistics.
7.  Resume an unfinished game.
8.  View a lightweight history/statistics page.
9.  Experience a visually rich interface containing tasteful 3D elements
    and explanatory diagrams.

The product should feel like a modern game rather than an enterprise
dashboard. The 3D layer should enhance the experience without
interfering with Sudoku usability.

### Core product principle

**The Sudoku board is the hero.**

3D effects, animations, illustrations, and decorative objects must never
reduce readability, input speed, accessibility, or performance.

------------------------------------------------------------------------

# 2. Goals

## 2.1 Primary goals

-   Build a complete playable Sudoku game.
-   Use MERN throughout the application.
-   Implement simple email/password authentication.
-   Persist users and game data in MongoDB.
-   Provide server-backed game persistence.
-   Support multiple users with isolated game/history data.
-   Provide deterministic Sudoku validation.
-   Generate valid Sudoku puzzles.
-   Provide multiple difficulty levels.
-   Provide responsive desktop and mobile UI.
-   Add polished 3D visuals using Three.js.
-   Include useful diagrams explaining Sudoku concepts and game state.
-   Produce clean, modular code that Codex can implement incrementally.

## 2.2 Secondary goals

-   Track basic player statistics.
-   Allow users to resume an unfinished game.
-   Provide a visually appealing landing page.
-   Provide a game-completion experience.
-   Make the architecture easy to extend later.

------------------------------------------------------------------------

# 3. Non-Goals

The first version should NOT include:

-   Social login.
-   Google/Apple/GitHub authentication.
-   Email verification.
-   Password reset email workflows.
-   Two-factor authentication.
-   OAuth.
-   User-to-user messaging.
-   Multiplayer Sudoku.
-   Real-time competitive matchmaking.
-   Payments.
-   Subscriptions.
-   Ads.
-   Chat.
-   Complex admin roles.
-   Leaderboards requiring anti-cheat infrastructure.
-   Native mobile applications.
-   Microservices.

Keep authentication intentionally simple while still storing passwords
securely.

------------------------------------------------------------------------

# 4. Target Users

## 4.1 Guest user

A visitor who can:

-   View the landing page.
-   Understand how Sudoku works.
-   See the visual/game preview.
-   Register or log in.

Depending on implementation preference, guests may optionally be allowed
to preview a puzzle, but persistent gameplay should require
authentication.

## 4.2 Authenticated player

A registered user who can:

-   Start games.
-   Play games.
-   Save/resume games.
-   Complete games.
-   View personal statistics.
-   View game history.
-   Log out.

There is only one application-level user role in V1:

**USER**

------------------------------------------------------------------------

# 5. User Flow

``` mermaid
flowchart TD
    A[Landing Page] --> B{Authenticated?}
    B -- No --> C[Login]
    B -- No --> D[Register]
    B -- Yes --> E[Dashboard]

    D --> F[Create Account]
    F --> E

    C --> E

    E --> G[Start New Game]
    E --> H[Resume Game]
    E --> I[Statistics]
    E --> J[Game History]

    G --> K[Select Difficulty]
    K --> L[Generate / Load Puzzle]
    L --> M[Sudoku Game]

    H --> M

    M --> N{Game State}
    N -- Playing --> M
    N -- Completed --> O[Completion Screen]
    O --> P[Save Result]
    P --> E

    M --> Q[Pause / Leave]
    Q --> E
```

------------------------------------------------------------------------

# 6. Functional Requirements

## FR-001: Registration

The system must allow a user to register using:

-   Email
-   Password

### Validation

Email:

-   Required.
-   Must have valid email format.
-   Must be normalized to lowercase.
-   Must be unique.

Password:

-   Required.
-   Minimum 8 characters.
-   Should be validated on the backend.
-   Must never be stored as plaintext.

### Registration response

On successful registration:

-   Create user record.
-   Authenticate the user.
-   Return an authenticated session/token.
-   Redirect to dashboard.

------------------------------------------------------------------------

## FR-002: Login

The user enters:

-   Email
-   Password

The backend verifies credentials.

If valid:

-   Create authenticated session.
-   Return authentication information.
-   Load user dashboard.

If invalid:

-   Return generic authentication error.
-   Do not reveal whether the email exists.

------------------------------------------------------------------------

# 7. Authentication Architecture

Use:

-   Node.js
-   Express
-   MongoDB
-   bcrypt/bcryptjs for password hashing
-   JWT for authentication

Recommended architecture:

``` text
React Client
    |
    | POST /api/auth/login
    v
Express Auth Controller
    |
    v
Auth Service
    |
    +--> MongoDB User
    |
    +--> bcrypt password comparison
    |
    +--> JWT generation
    |
    v
Authenticated Response
```

### Password storage

Never store:

``` text
password: "mypassword123"
```

Store:

``` text
passwordHash: "$2b$..."
```

### JWT

JWT should contain only minimal identity information, for example:

``` json
{
  "userId": "ObjectId",
  "iat": 1234567890,
  "exp": 1234567890
}
```

Do not put:

-   Passwords
-   Full user profiles
-   Game state
-   Sensitive information

inside the token.

### Preferred token handling

Use an HTTP-only, secure cookie for the JWT.

Recommended cookie properties:

-   `httpOnly: true`
-   `secure: true` in production
-   `sameSite: "lax"` or stricter configuration where compatible
-   Appropriate expiration

The frontend should not need to manually store the JWT in localStorage.

------------------------------------------------------------------------

# 8. User Data Model

MongoDB collection:

`users`

Suggested schema:

``` javascript
{
  _id: ObjectId,
  email: String,
  passwordHash: String,

  stats: {
    gamesPlayed: Number,
    gamesCompleted: Number,
    gamesWon: Number,
    totalMistakes: Number,
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

### Indexes

Create a unique index on:

``` text
email
```

------------------------------------------------------------------------

# 9. Sudoku Game Requirements

## 9.1 Board

Standard Sudoku:

-   9 rows
-   9 columns
-   81 cells
-   9 3x3 subgrids

Values:

``` text
1-9
```

Empty cells:

``` text
0 / null
```

The game must enforce:

-   No duplicate number in a row.
-   No duplicate number in a column.
-   No duplicate number in a 3x3 box.

------------------------------------------------------------------------

# 10. Sudoku Puzzle Representation

Use two distinct boards.

### Solution board

The complete valid Sudoku:

``` javascript
solution: [
  [5,3,4,6,7,8,9,1,2],
  ...
]
```

### Puzzle board

The playable board containing blanks:

``` javascript
puzzle: [
  [5,3,0,0,7,0,0,0,0],
  ...
]
```

### Player board

The user's current state:

``` javascript
currentBoard: [
  [5,3,0,6,7,0,0,0,0],
  ...
]
```

The backend should retain the solution so the server can validate
completion.

------------------------------------------------------------------------

# 11. Difficulty Levels

V1 should support:

-   Easy
-   Medium
-   Hard
-   Expert

Difficulty should primarily control puzzle complexity rather than simply
removing a fixed number of cells.

Recommended initial ranges can be configurable:

``` javascript
difficultyConfig = {
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

These are starting parameters, not hard product guarantees.

The generator must always verify that the resulting puzzle has a unique
solution.

------------------------------------------------------------------------

# 12. Sudoku Generation

Implement a server-side Sudoku generator.

Recommended algorithm:

### Step 1

Generate a complete valid Sudoku solution.

### Step 2

Copy the solution into a puzzle board.

### Step 3

Randomly remove values.

### Step 4

After each removal, check whether the puzzle still has exactly one
solution.

### Step 5

Continue until the target difficulty range is reached.

### Step 6

Return:

``` json
{
  "puzzle": [],
  "solution": [],
  "difficulty": "medium"
}
```

### Important

The frontend must not be responsible for authoritative puzzle
generation.

The backend owns puzzle generation and validation.

------------------------------------------------------------------------

# 13. Sudoku Validation

Create reusable server-side functions:

``` text
isValidMove(board, row, col, value)
isValidRow(board, row)
isValidColumn(board, col)
isValidBox(board, row, col)
isComplete(board)
hasUniqueSolution(board)
solveSudoku(board)
generateSudoku()
```

Validation must be deterministic.

Example:

``` text
User places 7 at row 3, column 5

        |
        v
Check row
        |
        v
Check column
        |
        v
Check 3x3 box
        |
        v
Valid?
  /      \
Yes       No
 |         |
Place 7   Reject
```

------------------------------------------------------------------------

# 14. Game State

Each active game should maintain:

``` javascript
{
  userId,
  puzzle,
  solution,
  currentBoard,

  difficulty,

  status: "in_progress",
  startedAt,
  lastPlayedAt,
  completedAt,

  elapsedSeconds,
  mistakes,

  hintsUsed,
  createdAt,
  updatedAt
}
```

Possible status values:

``` text
in_progress
completed
abandoned
```

------------------------------------------------------------------------

# 15. Game Persistence

When a player makes meaningful progress, the game should be persisted.

Do not make every keystroke result in an immediate database write.

Recommended approach:

-   Update UI immediately.
-   Debounce persistence.
-   Save after a short idle period.
-   Save on page navigation/unload where practical.
-   Save on explicit pause/exit.
-   Save on completion.

The server remains authoritative for persisted game state.

------------------------------------------------------------------------

# 16. Game API

Base URL:

``` text
/api
```

## Authentication

### POST `/api/auth/register`

Request:

``` json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:

``` json
{
  "user": {
    "id": "..."
    "email": "user@example.com"
  }
}
```

------------------------------------------------------------------------

### POST `/api/auth/login`

Request:

``` json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:

``` json
{
  "user": {
    "id": "...",
    "email": "user@example.com"
  }
}
```

Authentication cookie is set by the backend.

------------------------------------------------------------------------

### POST `/api/auth/logout`

Clears the authentication cookie.

------------------------------------------------------------------------

### GET `/api/auth/me`

Returns authenticated user.

Response:

``` json
{
  "user": {
    "id": "...",
    "email": "..."
  }
}
```

------------------------------------------------------------------------

# 17. Game APIs

## POST `/api/games`

Create a new game.

Request:

``` json
{
  "difficulty": "medium"
}
```

Response:

``` json
{
  "game": {
    "id": "...",
    "difficulty": "medium",
    "puzzle": [],
    "currentBoard": [],
    "status": "in_progress",
    "elapsedSeconds": 0,
    "mistakes": 0
  }
}
```

Do not expose the complete solution in normal gameplay responses.

------------------------------------------------------------------------

## GET `/api/games/active`

Returns the user's current unfinished game.

------------------------------------------------------------------------

## GET `/api/games/:gameId`

Returns a game belonging to the authenticated user.

Never allow one user to retrieve another user's game.

------------------------------------------------------------------------

## PATCH `/api/games/:gameId`

Update game state.

Request:

``` json
{
  "currentBoard": [],
  "elapsedSeconds": 312,
  "mistakes": 2,
  "hintsUsed": 1
}
```

The backend must verify ownership.

------------------------------------------------------------------------

## POST `/api/games/:gameId/move`

Validate a move.

Request:

``` json
{
  "row": 3,
  "col": 5,
  "value": 7
}
```

Response:

``` json
{
  "valid": true,
  "mistakes": 0
}
```

For an invalid move:

``` json
{
  "valid": false,
  "mistakes": 1,
  "reason": "conflict"
}
```

------------------------------------------------------------------------

## POST `/api/games/:gameId/complete`

Attempts to complete the game.

The backend must verify:

1.  Board is complete.
2.  Board is valid.
3.  Board matches the generated solution.

If valid:

``` json
{
  "completed": true,
  "elapsedSeconds": 845,
  "mistakes": 3
}
```

------------------------------------------------------------------------

## GET `/api/games/history`

Returns the authenticated user's historical games.

Support pagination.

Example:

``` text
GET /api/games/history?page=1&limit=20
```

------------------------------------------------------------------------

# 18. Statistics API

### GET `/api/stats`

Returns:

``` json
{
  "gamesPlayed": 25,
  "gamesCompleted": 20,
  "averageTime": 612,
  "bestTimes": {
    "easy": 240,
    "medium": 430,
    "hard": 790,
    "expert": 1200
  },
  "totalMistakes": 42
}
```

------------------------------------------------------------------------

# 19. Frontend Architecture

Use React.

Recommended structure:

``` text
client/
├── src/
│   ├── components/
│   │   ├── sudoku/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── game/
│   │   ├── statistics/
│   │   ├── layout/
│   │   └── three/
│   │
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── GamePage.jsx
│   │   ├── StatisticsPage.jsx
│   │   └── HistoryPage.jsx
│   │
│   ├── hooks/
│   ├── services/
│   ├── context/
│   ├── store/
│   ├── utils/
│   ├── routes/
│   └── App.jsx
```

------------------------------------------------------------------------

# 20. Backend Architecture

Recommended:

``` text
server/
├── src/
│   ├── config/
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── game.controller.js
│   │   └── stats.controller.js
│   │
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── sudoku.service.js
│   │   ├── game.service.js
│   │   └── stats.service.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   └── Game.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── game.routes.js
│   │   └── stats.routes.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   └── validation.middleware.js
│   │
│   ├── utils/
│   ├── app.js
│   └── server.js
```

------------------------------------------------------------------------

# 21. Recommended Technology Choices

## Frontend

-   React
-   React Router
-   CSS / Tailwind CSS
-   Three.js
-   React Three Fiber
-   Drei
-   Axios or fetch

## Backend

-   Node.js
-   Express
-   MongoDB
-   Mongoose
-   bcrypt
-   jsonwebtoken
-   cookie-parser
-   express-validator or Zod

## Development

-   ESLint
-   Prettier
-   Jest
-   Supertest
-   React Testing Library

Avoid unnecessary dependencies.

------------------------------------------------------------------------

# 22. 3D Visual Design

The application should have a clear 3D visual identity.

Use Three.js / React Three Fiber for decorative and interactive
elements.

## 22.1 Landing page 3D hero

Create a floating 3D Sudoku cube/grid.

Concept:

``` text
             ┌─────────────┐
            /  3D TILE    /|
           /      7      / |
          ┌─────────────┐  |
          │      3      │  |
          │             │ /
          │      9      │/
          └─────────────┘
```

The object can:

-   Slowly rotate.
-   Float vertically.
-   React subtly to pointer movement.
-   Contain Sudoku-like numbered tiles.
-   Use soft lighting.
-   Have depth and shadows.

Do not make it rotate continuously at a distracting speed.

------------------------------------------------------------------------

# 23. Sudoku Board Visual Design

The actual Sudoku board should remain primarily 2D for usability.

Use subtle depth:

-   Raised tiles.
-   Soft shadows.
-   Press animations.
-   Slight 3D transform on hover.
-   Highlighted 3x3 blocks.
-   Animated number placement.

Example:

``` text
┌─────────┬─────────┬─────────┐
│ 5  3  · │ ·  7  · │ ·  ·  · │
│ 6  ·  · │ 1  9  5 │ ·  ·  · │
│ ·  9  8 │ ·  ·  · │ ·  6  · │
├─────────┼─────────┼─────────┤
│ 8  ·  · │ ·  6  · │ ·  ·  3 │
│ 4  ·  · │ 8  ·  3 │ ·  ·  1 │
│ 7  ·  · │ ·  2  · │ ·  ·  6 │
├─────────┼─────────┼─────────┤
│ ·  6  · │ ·  ·  · │ 2  8  · │
│ ·  ·  · │ 4  1  9 │ ·  ·  5 │
│ ·  ·  · │ ·  8  · │ ·  7  9 │
└─────────┴─────────┴─────────┘
```

------------------------------------------------------------------------

# 24. 3D Components

Create reusable components:

``` text
ThreeScene
SudokuHero
FloatingNumberTile
FloatingCube
ParticleBackground
GameCompletionScene
DifficultyVisual
```

The 3D scene should support:

-   Responsive resizing.
-   Reduced-motion mode.
-   WebGL capability detection.
-   Graceful fallback.

If WebGL is unavailable, show a static CSS/SVG visual instead.

------------------------------------------------------------------------

# 25. Diagrams

The application should include diagrams where they improve
understanding.

Potential diagrams:

### Sudoku structure

Show:

``` text
9 x 9 Board
    |
    +-- 9 Rows
    |
    +-- 9 Columns
    |
    +-- 9 Blocks
```

### How a move is validated

``` mermaid
flowchart LR
    A[Player enters number] --> B[Check row]
    B --> C[Check column]
    C --> D[Check 3x3 block]
    D --> E{Valid?}
    E -->|Yes| F[Place number]
    E -->|No| G[Show conflict]
```

### Game lifecycle

``` mermaid
stateDiagram-v2
    [*] --> InProgress
    InProgress --> Paused
    Paused --> InProgress
    InProgress --> Completed
    InProgress --> Abandoned
    Completed --> [*]
    Abandoned --> [*]
```

------------------------------------------------------------------------

# 26. Game UI

The game page should contain:

``` text
┌──────────────────────────────────────────────┐
│ Sudoku                         12:42   ⚙     │
├──────────────────────────────────────────────┤
│                                              │
│              SUDOKU BOARD                    │
│                                              │
│                                              │
├──────────────────────────────────────────────┤
│ 1  2  3  4  5  6  7  8  9                    │
│                                              │
│  Mistakes: 2       Hints: 1                  │
│                                              │
│       [ Pause ]      [ New Game ]             │
└──────────────────────────────────────────────┘
```

------------------------------------------------------------------------

# 27. Interaction Requirements

## Cell selection

When a cell is selected:

-   Highlight selected cell.
-   Highlight same row.
-   Highlight same column.
-   Highlight same 3x3 box.
-   Highlight matching numbers.

## Number entry

Support:

-   Mouse/touch.
-   Keyboard numbers 1-9.
-   Delete/backspace to clear.

## Invalid move

For an invalid value:

-   Brief red/error animation.
-   Increment mistake counter.
-   Do not permanently damage the board.
-   Provide accessible text feedback.

## Valid move

For a valid value:

-   Number appears with subtle animation.
-   Related cells update their highlights.

------------------------------------------------------------------------

# 28. Timer

The timer should:

-   Start when gameplay begins.
-   Continue while game is active.
-   Stop when game is completed.
-   Pause when the game is paused.
-   Persist elapsed time.

Do not depend exclusively on client-side elapsed time.

Store timestamps so the backend can reconstruct/verify elapsed duration.

------------------------------------------------------------------------

# 29. Hint System

V1 can include a basic hint mechanism.

A hint:

-   Selects one empty cell.
-   Reveals the correct value.
-   Increments `hintsUsed`.

The backend must determine the correct value.

Optional V1 rule:

-   Hints count toward the game statistics.
-   A game using hints can still be completed normally.

------------------------------------------------------------------------

# 30. Dashboard

Authenticated users see:

``` text
Welcome back

[ Continue Game ]

[ New Game ]

Difficulty:
[ Easy ] [ Medium ] [ Hard ] [ Expert ]

Your Stats

Games Played       25
Completed          20
Best Time          4:12
Total Mistakes     42

Recent Games
--------------------------------
Medium    08:32    Completed
Hard      14:21    Completed
Easy      05:03    Completed
```

Include a small 3D decorative element, but keep the dashboard
information-first.

------------------------------------------------------------------------

# 31. Game Completion

When the user completes a Sudoku:

-   Stop timer.
-   Validate completion on backend.
-   Save result.
-   Update statistics.
-   Show completion animation.

Possible completion scene:

-   3D Sudoku tiles rise/fall.
-   Numbers briefly animate.
-   Confetti or particles can appear.
-   Display:
    -   Difficulty
    -   Time
    -   Mistakes
    -   Hints

Buttons:

``` text
[ Play Again ]
[ Choose Difficulty ]
[ Dashboard ]
```

------------------------------------------------------------------------

# 32. History Page

Show the user's previous games.

Columns:

``` text
Date
Difficulty
Time
Mistakes
Hints
Status
```

Pagination:

``` text
Previous   1  2  3   Next
```

Only the authenticated user's games are accessible.

------------------------------------------------------------------------

# 33. Responsive Design

Support:

-   Desktop
-   Laptop
-   Tablet
-   Mobile

The Sudoku board must always fit inside the viewport.

Mobile controls should be touch-friendly.

Recommended minimum interactive target:

``` text
44px
```

Do not allow the 3D scene to consume most of the mobile screen.

------------------------------------------------------------------------

# 34. Accessibility

Requirements:

-   Semantic HTML.
-   Keyboard navigation.
-   Visible focus states.
-   Sufficient contrast.
-   Accessible button labels.
-   Screen-reader labels for cells.
-   Do not rely solely on color for errors.
-   Respect `prefers-reduced-motion`.
-   Provide non-WebGL fallback visuals.

Each Sudoku cell should have a useful accessible description, such as:

``` text
Row 3, Column 5, Block 2, empty
```

------------------------------------------------------------------------

# 35. Security Requirements

Even though authentication is intentionally basic, security must not be
basic.

Mandatory:

-   Hash passwords using bcrypt.
-   Never log passwords.
-   Never return password hashes.
-   Validate request bodies.
-   Authenticate protected routes.
-   Authorize game ownership.
-   Sanitize/validate MongoDB inputs.
-   Configure CORS correctly.
-   Use HTTP-only cookies for authentication.
-   Add rate limiting to login/register endpoints.
-   Use environment variables for secrets.
-   Never commit `.env`.

Environment variables:

``` text
PORT=
MONGODB_URI=
JWT_SECRET=
CLIENT_URL=
NODE_ENV=
```

------------------------------------------------------------------------

# 36. Error Handling

Use consistent API error format:

``` json
{
  "success": false,
  "error": {
    "code": "INVALID_MOVE",
    "message": "The selected number conflicts with the current board."
  }
}
```

Suggested error codes:

``` text
VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
INVALID_CREDENTIALS
EMAIL_ALREADY_EXISTS
INVALID_MOVE
GAME_ALREADY_COMPLETED
INVALID_GAME_STATE
INTERNAL_SERVER_ERROR
```

------------------------------------------------------------------------

# 37. Frontend State Management

Do not introduce a complex global state library unless necessary.

Recommended initial approach:

-   React Context for authentication.
-   Local state/reducer for active Sudoku game.
-   Server state handled through API service/hooks.

Possible game reducer:

``` text
SELECT_CELL
SET_VALUE
CLEAR_VALUE
SET_ERROR
INCREMENT_MISTAKES
SET_TIMER
PAUSE_GAME
RESUME_GAME
COMPLETE_GAME
LOAD_GAME
RESET_GAME
```

------------------------------------------------------------------------

# 38. API Service Layer

Create a centralized API layer.

Example:

``` text
services/
├── apiClient.js
├── authApi.js
├── gameApi.js
└── statsApi.js
```

Components should not contain raw Axios/fetch calls everywhere.

Bad:

``` javascript
axios.post(...)
```

inside every component.

Preferred:

``` javascript
gameApi.makeMove(gameId, row, col, value)
```

------------------------------------------------------------------------

# 39. Database Models

## User

``` javascript
const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  passwordHash: {
    type: String,
    required: true
  },

  stats: {
    gamesPlayed: {
      type: Number,
      default: 0
    },

    gamesCompleted: {
      type: Number,
      default: 0
    },

    totalMistakes: {
      type: Number,
      default: 0
    }
  },

  createdAt: Date,
  updatedAt: Date
});
```

## Game

``` javascript
const GameSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard", "expert"],
    required: true
  },

  puzzle: {
    type: [[Number]],
    required: true
  },

  solution: {
    type: [[Number]],
    required: true
  },

  currentBoard: {
    type: [[Number]],
    required: true
  },

  status: {
    type: String,
    enum: ["in_progress", "completed", "abandoned"],
    default: "in_progress"
  },

  elapsedSeconds: {
    type: Number,
    default: 0
  },

  mistakes: {
    type: Number,
    default: 0
  },

  hintsUsed: {
    type: Number,
    default: 0
  },

  startedAt: Date,
  lastPlayedAt: Date,
  completedAt: Date
}, {
  timestamps: true
});
```

------------------------------------------------------------------------

# 40. Backend Authorization Rule

Every game query must be scoped by authenticated user.

Never do:

``` javascript
Game.findById(gameId)
```

and return the result directly.

Prefer:

``` javascript
Game.findOne({
  _id: gameId,
  userId: req.user.id
});
```

This prevents horizontal privilege escalation.

------------------------------------------------------------------------

# 41. Game Completion Integrity

The frontend must never be trusted to declare victory.

Bad:

``` text
Frontend says "completed": true
Backend saves it.
```

Correct:

``` text
Frontend submits board
        |
        v
Backend validates board
        |
        +--> Complete?
        |
        +--> Matches solution?
        |
        v
Save completion
```

------------------------------------------------------------------------

# 42. Performance Requirements

Target:

-   Initial page load should feel fast.
-   Sudoku interactions should feel immediate.
-   Avoid unnecessary React re-renders.
-   Keep Three.js scenes lightweight.
-   Avoid huge 3D assets.
-   Lazy-load Three.js-heavy components where possible.
-   Do not render unnecessary 3D scenes on the game board.
-   Optimize textures and models.

The game itself should remain usable on average laptops and modern
mobile devices.

------------------------------------------------------------------------

# 43. Three.js Performance Rules

Do:

-   Reuse geometries.
-   Reuse materials.
-   Keep polygon counts low.
-   Use instancing where appropriate.
-   Dispose resources when components unmount.
-   Pause animation when tab is hidden.
-   Use `requestAnimationFrame` through the rendering framework.

Do not:

-   Add unnecessarily complex 3D models.
-   Use large textures for simple objects.
-   Render dozens of independent expensive effects.
-   Run physics simulations for decorative objects.

------------------------------------------------------------------------

# 44. Testing Requirements

## Backend unit tests

Test:

-   Sudoku solver.
-   Sudoku generator.
-   Unique solution detection.
-   Move validation.
-   Completion validation.
-   Difficulty configuration.
-   Password hashing.
-   Authentication logic.

## API integration tests

Test:

-   Register.
-   Duplicate registration.
-   Login.
-   Invalid login.
-   Logout.
-   `/me`.
-   Create game.
-   Get active game.
-   Update game.
-   Make move.
-   Complete game.
-   Unauthorized access.
-   Accessing another user's game.

## Frontend tests

Test:

-   Login form.
-   Registration form.
-   Sudoku cell selection.
-   Number entry.
-   Invalid move feedback.
-   Timer.
-   Game completion.
-   Dashboard rendering.
-   Protected routes.

------------------------------------------------------------------------

# 45. Test Cases

### Authentication

  Test                                     Expected
  ---------------------------------------- --------------------
  Register valid user                      Account created
  Register duplicate email                 409/error
  Login valid credentials                  Authenticated
  Login wrong password                     Generic auth error
  Login unknown email                      Generic auth error
  Access protected route unauthenticated   401
  Logout                                   Session cleared

### Sudoku

  Test                      Expected
  ------------------------- ---------------------
  Valid row move            Accepted
  Duplicate row value       Rejected
  Duplicate column value    Rejected
  Duplicate box value       Rejected
  Complete valid board      Completed
  Invalid completed board   Rejected
  Generated puzzle          Has solution
  Generated puzzle          Has unique solution

------------------------------------------------------------------------

# 46. Routes

Frontend routes:

``` text
/
 /login
 /register
 /dashboard
 /game/:gameId
 /statistics
 /history
```

Protected:

``` text
/dashboard
/game/:gameId
/statistics
/history
```

Public:

``` text
/
/login
/register
```

------------------------------------------------------------------------

# 47. Suggested Landing Page

Structure:

``` text
------------------------------------------------
NAVBAR
Logo | How It Works | Login | Register
------------------------------------------------

             [3D Sudoku Hero]

        Solve. Think. Improve.

    A modern Sudoku experience built
    around focused gameplay.

          [Start Playing]

------------------------------------------------
           HOW SUDOKU WORKS

       [Sudoku Diagram]

  Rows | Columns | 3x3 Blocks

------------------------------------------------
             FEATURES

    Smart Puzzles
    Personal Progress
    Multiple Difficulties

------------------------------------------------
             FOOTER
------------------------------------------------
```

------------------------------------------------------------------------

# 48. Visual Design Direction

Use a modern, premium game aesthetic.

Recommended characteristics:

-   Dark/light capable design.
-   Strong typography.
-   Rounded cards.
-   Subtle depth.
-   Soft shadows.
-   Controlled gradients.
-   Smooth transitions.
-   High-quality 3D illustrations.
-   Clear numerical typography.

Avoid:

-   Excessive neon.
-   Overly animated backgrounds.
-   Clutter.
-   Heavy glassmorphism everywhere.
-   Distracting particle effects.
-   Game-board animations that delay input.

------------------------------------------------------------------------

# 49. Component Design

Core Sudoku components:

``` text
SudokuBoard
 ├── SudokuRow
 │    ├── SudokuCell
 │    ├── SudokuCell
 │    └── ...
 └── ...

NumberPad
GameTimer
GameToolbar
MistakeCounter
HintButton
PauseModal
CompletionModal
```

Reusable cell props:

``` javascript
{
  value,
  row,
  col,
  isSelected,
  isGiven,
  isConflicting,
  isSameNumber,
  isHighlighted,
  onSelect,
  onChange
}
```

------------------------------------------------------------------------

# 50. Suggested Repository Structure

``` text
sudoku-game/
│
├── client/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   ├── tests/
│   └── package.json
│
├── docs/
│   ├── architecture.md
│   ├── api.md
│   └── sudoku-algorithm.md
│
├── .env.example
├── .gitignore
├── README.md
└── package.json
```

Use npm workspaces or another simple monorepo mechanism if convenient.

Do not introduce Docker/Kubernetes unless explicitly required later.

------------------------------------------------------------------------

# 51. Development Phases

## Phase 1: Project foundation

Implement:

-   Repository.
-   Client.
-   Server.
-   MongoDB connection.
-   Environment configuration.
-   Basic Express setup.
-   Basic React setup.
-   Health endpoint.

Acceptance:

``` text
GET /api/health
```

returns successful response.

------------------------------------------------------------------------

## Phase 2: Authentication

Implement:

-   User model.
-   Registration.
-   Login.
-   Logout.
-   JWT cookie.
-   Auth middleware.
-   `/me`.
-   Protected routes.

Acceptance:

A user can register, log in, refresh the browser, and remain
authenticated.

------------------------------------------------------------------------

## Phase 3: Sudoku engine

Implement:

-   Board representation.
-   Validator.
-   Solver.
-   Generator.
-   Unique solution checker.
-   Difficulty system.

Acceptance:

Automated tests demonstrate that generated puzzles are valid and
solvable.

------------------------------------------------------------------------

## Phase 4: Game backend

Implement:

-   Game model.
-   Game creation.
-   Active game.
-   Game retrieval.
-   Move validation.
-   Persistence.
-   Completion.
-   History.

Acceptance:

A user can create and resume a game.

------------------------------------------------------------------------

## Phase 5: Sudoku UI

Implement:

-   Board.
-   Cell selection.
-   Number pad.
-   Keyboard support.
-   Timer.
-   Mistakes.
-   Hints.
-   Completion.

Acceptance:

A user can complete a full Sudoku game end-to-end.

------------------------------------------------------------------------

## Phase 6: Dashboard and statistics

Implement:

-   Dashboard.
-   Statistics.
-   History.
-   Resume game.
-   Difficulty selection.

------------------------------------------------------------------------

## Phase 7: 3D visual system

Implement:

-   Three.js setup.
-   3D landing hero.
-   Floating number tiles.
-   Completion animation.
-   Decorative 3D elements.
-   Reduced-motion fallback.

------------------------------------------------------------------------

## Phase 8: Polish

Implement:

-   Responsive design.
-   Accessibility.
-   Loading states.
-   Error states.
-   Empty states.
-   Performance optimization.
-   Animation polish.

------------------------------------------------------------------------

## Phase 9: Testing

Run:

-   Unit tests.
-   API tests.
-   Frontend tests.
-   Build.
-   Lint.
-   Production build.

------------------------------------------------------------------------

# 52. Codex Implementation Rules

Codex should follow these rules during implementation.

## Rule 1: Implement incrementally

Do not generate the entire application in one uncontrolled change.

Work phase-by-phase.

## Rule 2: Preserve separation of concerns

Frontend:

``` text
UI -> hooks/state -> API service
```

Backend:

``` text
Route -> Controller -> Service -> Model
```

## Rule 3: Sudoku logic belongs in services

Do not bury Sudoku algorithms inside React components.

## Rule 4: Backend is authoritative

The backend owns:

-   Puzzle generation.
-   Solution.
-   Move validation.
-   Completion validation.
-   User ownership.
-   Persistent game state.

## Rule 5: Never expose solution unnecessarily

The frontend should not receive the solution during normal gameplay.

## Rule 6: Never trust client ownership

Every protected game request must use:

``` text
authenticatedUserId + gameId
```

## Rule 7: Keep dependencies minimal

Before installing a package, determine whether the requirement can be
implemented cleanly with existing dependencies.

## Rule 8: Write tests alongside core logic

Especially:

-   Sudoku generator.
-   Solver.
-   Validator.
-   Auth.
-   Game ownership.

## Rule 9: Do not compromise gameplay for visuals

3D effects are secondary to usability.

------------------------------------------------------------------------

# 53. Definition of Done

The application is considered V1 complete when:

### Authentication

-   [ ] User can register.
-   [ ] User can log in.
-   [ ] Passwords are hashed.
-   [ ] User remains authenticated after refresh.
-   [ ] User can log out.
-   [ ] Protected routes work.

### Sudoku

-   [ ] Four difficulty levels exist.
-   [ ] Generated puzzles are valid.
-   [ ] Generated puzzles have unique solutions.
-   [ ] Users can enter numbers.
-   [ ] Invalid moves are detected.
-   [ ] Timer works.
-   [ ] Mistakes are tracked.
-   [ ] Hints work.
-   [ ] Game completion is verified server-side.

### Persistence

-   [ ] Active game can be resumed.
-   [ ] Completed games are stored.
-   [ ] History is available.
-   [ ] Statistics are calculated.

### Visuals

-   [ ] Landing page has a 3D hero.
-   [ ] Game has subtle depth/animation.
-   [ ] Completion has a 3D/animated experience.
-   [ ] Diagrams explain Sudoku.
-   [ ] Reduced-motion mode works.
-   [ ] WebGL fallback exists.

### Quality

-   [ ] Responsive.
-   [ ] Accessible.
-   [ ] Tested.
-   [ ] Linted.
-   [ ] Production build succeeds.
-   [ ] No secrets committed.
-   [ ] API errors are consistent.
-   [ ] Users cannot access other users' games.

------------------------------------------------------------------------

# 54. Future Extension Points

Do not implement these in V1, but keep the architecture extensible for:

-   Daily Sudoku.
-   Global leaderboard.
-   Friend challenges.
-   Multiplayer.
-   Puzzle sharing.
-   Custom puzzle creation.
-   User profiles.
-   Achievements.
-   Streaks.
-   More sophisticated difficulty rating.
-   Sudoku variants.
-   PWA/offline support.
-   Social login.
-   Password reset.
-   Email verification.

------------------------------------------------------------------------

# 55. Final Codex Prompt

Use the following as the initial implementation instruction after adding
this PRD to the repository:

> Read `docs/PRD.md` completely before modifying the codebase.
>
> Build the Sudoku application according to the PRD.
>
> Start with Phase 1 only.
>
> Before writing code:
>
> 1.  Inspect the repository.
> 2.  Identify the current project structure.
> 3.  Identify existing dependencies.
> 4.  Avoid replacing working infrastructure unnecessarily.
> 5.  State the files you intend to create/change.
>
> Then implement Phase 1.
>
> After implementation:
>
> 1.  Run tests.
> 2.  Run lint.
> 3.  Run the production build.
> 4.  Fix failures.
> 5.  Summarize exactly what changed.
> 6.  Do not implement later phases until instructed.
>
> Follow the PRD's architecture and security requirements. Keep the
> implementation modular and production-oriented.

------------------------------------------------------------------------

# 56. Acceptance Criteria Summary

The final V1 should provide this complete flow:

``` text
Visitor
   |
   v
Landing Page
   |
   v
Register/Login
   |
   v
Dashboard
   |
   v
Choose Difficulty
   |
   v
Server Generates Valid Puzzle
   |
   v
Sudoku Game
   |
   +--> Select Cell
   |
   +--> Enter Number
   |
   +--> Validate Move
   |
   +--> Save Progress
   |
   +--> Use Hint
   |
   v
Complete Board
   |
   v
Server Validates Solution
   |
   v
Completion Screen
   |
   +--> Save Statistics
   |
   v
Dashboard / History
```

The result should be a clean MERN Sudoku application with secure basic
authentication, server-authoritative gameplay, persistent user-specific
game state, polished responsive UI, and a restrained 3D visual layer.
