# BrainBolt — Low-Level Design (LLD)

## 1. Module Responsibilities

### 1.1 `src/lib/adaptive.ts` — Adaptive Algorithm Engine
**Responsibility:** Determine next difficulty level based on user performance.

**Key Function:** `computeNextState(state, isCorrect, now)`
- Input: Current adaptive state, whether answer is correct, current timestamp
- Output: New difficulty, momentum, streak, maxStreak, recent answers window
- Handles: Ping-pong prevention, inactivity decay, boundary clamping

**Pseudocode:**
```
function computeNextState(state, isCorrect):
  // 1. Check inactivity (>30min → decay streak, reduce momentum)
  if lastAnswerAt && elapsed > 30min:
    streak = 0
    momentum -= 0.2

  // 2. Update streak
  if isCorrect: streak++ ; update maxStreak
  else: streak = 0

  // 3. Update momentum
  if isCorrect: momentum = min(1.0, momentum + 0.15)
  else: momentum = max(0.0, momentum - 0.30)

  // 4. Update rolling window (last 10 answers)
  recentAnswers.push(isCorrect).keepLast(10)

  // 5. Calculate difficulty change
  if isCorrect AND momentum >= 0.6 AND streak >= 2 AND windowAccuracy >= 60%:
    difficulty = min(10, difficulty + 1)
  else if !isCorrect:
    difficulty = max(1, difficulty - 1)

  return { newDifficulty, newMomentum, newStreak, ... }
```

### 1.2 `src/lib/scoring.ts` — Score Calculation Engine
**Responsibility:** Calculate points awarded per answer.

**Formula:**
```
scoreDelta = 0                           (if wrong)
scoreDelta = (difficulty × 10) × min(1 + streak × 0.1, 3.0)  (if correct)
```

### 1.3 `src/lib/redis.ts` — Cache Layer
**Responsibility:** Provide Redis connection singleton and cache helpers.

| Function | Purpose |
|----------|---------|
| `cacheGet<T>(key)` | Retrieve cached JSON value |
| `cacheSet(key, data, ttl)` | Store JSON value with TTL |
| `cacheDel(key)` | Delete cached key |

### 1.4 `src/lib/rate-limit.ts` — Rate Limiter
**Responsibility:** Prevent API abuse using sliding window counter.

- Uses Redis sorted sets with timestamps as scores
- Window: 60 seconds, Max requests: 30
- Fails open (allows request if Redis is unavailable)

### 1.5 `src/lib/prisma.ts` — Database Client
**Responsibility:** Singleton Prisma client to prevent connection pool exhaustion in development.

---

## 2. API Schemas

### 2.1 `GET /api/v1/quiz/next`
**Request:**
```json
{
  "userId": "string (query param, required)",
  "sessionId": "string (query param, optional)"
}
```

**Response (200):**
```json
{
  "questionId": "uuid",
  "difficulty": 5,
  "prompt": "What is the time complexity of binary search?",
  "choices": ["O(n)", "O(log n)", "O(n²)", "O(1)"],
  "category": "tech",
  "sessionId": "uuid",
  "stateVersion": 12,
  "currentScore": 450,
  "currentStreak": 3,
  "maxStreak": 7,
  "currentDifficulty": 5,
  "momentum": 0.45
}
```

### 2.2 `POST /api/v1/quiz/answer`
**Request:**
```json
{
  "userId": "uuid",
  "sessionId": "uuid",
  "questionId": "uuid",
  "answer": 1,
  "stateVersion": 12,
  "answerIdempotencyKey": "uuid"
}
```

**Response (200):**
```json
{
  "correct": true,
  "correctAnswer": 1,
  "newDifficulty": 6,
  "newStreak": 4,
  "maxStreak": 7,
  "scoreDelta": 70,
  "totalScore": 520,
  "momentum": 0.6,
  "stateVersion": 13,
  "streakReset": false,
  "inactivityDecay": false,
  "leaderboardRankScore": 3,
  "leaderboardRankStreak": 5
}
```

**Error (409 - State Conflict):**
```json
{
  "error": "State version conflict. Please refresh and try again.",
  "staleVersion": true
}
```

### 2.3 `GET /api/v1/quiz/metrics`
**Request:** `userId` (query param)

**Response (200):**
```json
{
  "currentDifficulty": 5,
  "streak": 3,
  "maxStreak": 7,
  "totalScore": 520,
  "totalAnswered": 42,
  "totalCorrect": 31,
  "accuracy": 73.81,
  "momentum": 0.6,
  "difficultyHistogram": {
    "1": { "total": 5, "correct": 5 },
    "2": { "total": 8, "correct": 7 },
    "...": "..."
  },
  "recentPerformance": [
    { "difficulty": 5, "correct": true, "scoreDelta": 70, "streakAtAnswer": 4, "answeredAt": "..." }
  ]
}
```

### 2.4 `GET /api/v1/leaderboard/score`
**Request:** `limit` (optional, default 20), `userId` (optional)

**Response (200):**
```json
{
  "leaderboard": [
    { "userId": "uuid", "username": "alice", "totalScore": 1200, "rank": 1 }
  ],
  "userRank": { "userId": "uuid", "username": "bob", "totalScore": 520, "rank": 3 },
  "total": 10
}
```

### 2.5 `GET /api/v1/leaderboard/streak` — Same shape, `maxStreak` instead of `totalScore`

---

## 3. Database Schema with Indexes

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Questions
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  difficulty INT NOT NULL,
  prompt TEXT NOT NULL,
  choices TEXT[] NOT NULL,
  correct_index INT NOT NULL,
  category VARCHAR DEFAULT 'general'
);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);

-- User State (1:1 with users)
CREATE TABLE user_state (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_difficulty INT DEFAULT 1,
  streak INT DEFAULT 0,
  max_streak INT DEFAULT 0,
  total_score INT DEFAULT 0,
  total_answered INT DEFAULT 0,
  total_correct INT DEFAULT 0,
  momentum FLOAT DEFAULT 0.0,
  recent_answers BOOLEAN[] DEFAULT '{}',
  last_question_id UUID,
  last_answer_at TIMESTAMPTZ,
  state_version INT DEFAULT 1,
  session_id UUID
);

-- Answer Log
CREATE TABLE answer_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  difficulty INT NOT NULL,
  answer INT NOT NULL,
  correct BOOLEAN NOT NULL,
  score_delta INT NOT NULL,
  streak_at_answer INT NOT NULL,
  idempotency_key VARCHAR UNIQUE NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_answer_log_user_time ON answer_log(user_id, answered_at);
CREATE UNIQUE INDEX idx_answer_log_idempotency ON answer_log(idempotency_key);

-- Leaderboard Score
CREATE TABLE leaderboard_score (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_score INT DEFAULT 0,
  username VARCHAR DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_leaderboard_score_desc ON leaderboard_score(total_score DESC);

-- Leaderboard Streak
CREATE TABLE leaderboard_streak (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  max_streak INT DEFAULT 0,
  username VARCHAR DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_leaderboard_streak_desc ON leaderboard_streak(max_streak DESC);
```

---

## 4. Cache Strategy

| Key Pattern | Data | TTL | Invalidation |
|-------------|------|-----|-------------|
| `user:state:{userId}` | User state JSON | 5 min | On every answer submission |
| `questions:pool:{difficulty}` | Array of questions | 10 min | On question pool change |
| `leaderboard:score` | Top N score entries | 10 sec | On every answer submission |
| `leaderboard:streak` | Top N streak entries | 10 sec | On every answer submission |
| `ratelimit:{userId}` | Sorted set of timestamps | 60 sec | Auto-expiry |
| `idempotency:{key}` | Answer result JSON | 1 hour | Auto-expiry |

### Real-Time Guarantee
- User state cache is **invalidated on every answer submission** before the next question is served
- Leaderboard cache has a **10-second TTL** — leaderboard polls every 10 seconds on the frontend
- Score, streak, difficulty, and momentum are always computed from the database within the answer transaction

### Metrics Caching
- Metrics are **not cached** since they involve aggregate queries that change per answer
- If load becomes an issue, metrics could be cached per-user with a 30-second TTL

---

## 5. Leaderboard Update Strategy

1. Score and streak leaderboard tables are **denormalized** (separate from user_state)
2. On every answer submission, within the same database transaction:
   - `leaderboard_score.total_score` is updated
   - `leaderboard_streak.max_streak` is updated
3. Leaderboard cache keys are **invalidated** after the transaction
4. User's rank is calculated via PostgreSQL `COUNT` query (`COUNT(*) + 1 WHERE score > user_score`)
5. Frontend polls leaderboard every **10 seconds** with the user's ID to show their current rank

---

## 6. Consistency Model

### Strong Consistency (Per-User)
- All state updates (score, streak, difficulty, leaderboard) happen in a **single Prisma `$transaction`**
- Optimistic locking via `stateVersion` prevents concurrent updates from corrupting state
- Idempotency key prevents duplicate score/streak updates

### Eventual Consistency (Cross-User)
- Leaderboard rankings are eventually consistent with a **10-second window** (cache TTL)
- This trade-off is acceptable since exact real-time ordering across all users is not critical

---

## 7. Edge Case Handling Details

### Ping-Pong Prevention
```
Scenario: User alternates correct/wrong/correct/wrong
Without stabilizer: Difficulty oscillates 5→6→5→6→5→6...

With momentum hysteresis:
  Answer 1 (correct):  momentum=0.15, streak=1 → No increase (momentum < 0.6)
  Answer 2 (wrong):    momentum=0.00, streak=0 → Decrease to 4
  Answer 3 (correct):  momentum=0.15, streak=1 → No increase
  Answer 4 (wrong):    momentum=0.00, streak=0 → Decrease to 3
  Result: Difficulty settles DOWN, not oscillating. Correct behavior.
```

### Streak Decay
```
User answers correctly, builds 10-streak, leaves for 45 minutes.
On next request (GET /quiz/next):
  - Checks lastAnswerAt: 45min ago > 30min threshold
  - Streak reset to 0
  - Momentum reduced by 0.2
  - stateVersion incremented
```

### Idempotent Submission
```
Request 1: POST /quiz/answer { ..., answerIdempotencyKey: "abc123" }
  → Processes normally, caches result in Redis and creates DB record

Request 2: POST /quiz/answer { ..., answerIdempotencyKey: "abc123" }
  → Finds "abc123" in Redis cache → Returns cached result with { duplicate: true }
  → Score, streak, difficulty NOT modified again
```
