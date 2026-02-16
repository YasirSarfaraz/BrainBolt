# ⚡ BrainBolt — Adaptive Infinite Quiz Platform

An AI-powered adaptive quiz platform that generates questions dynamically using **Google Gemini**, adjusting difficulty based on user performance with a momentum-based hysteresis algorithm. Features live leaderboards, streak multipliers, comprehensive performance metrics, and a fully **database-configurable UI**.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)
![Gemini](https://img.shields.io/badge/Gemini-2.0_Flash-blue?logo=google)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)
![Redis](https://img.shields.io/badge/Redis-7-red?logo=redis)
![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)

---

## 🚀 Setup Instructions (After Cloning)

### Prerequisites

- **Node.js** 20+ and **npm**
- **Docker** and **Docker Compose** (for PostgreSQL and Redis)
- **Gemini API Key** (free at [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey))

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your Gemini API key:
# GEMINI_API_KEY="your-actual-api-key-here"
```

**Environment variables in `.env`:**

```env
DATABASE_URL="postgresql://brainbolt:brainbolt@localhost:5432/brainbolt?schema=public"
REDIS_URL="redis://localhost:6379"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
GEMINI_API_KEY="your-gemini-api-key-here"  # ← Replace this
```

### Step 3: Start Docker Containers

```bash
# Start PostgreSQL and Redis
docker compose up -d postgres redis

# Verify containers are running
docker ps
```

### Step 4: Setup Database

```bash
# Apply database schema
npx prisma db push

# Seed database with initial questions and config
npx prisma db seed
```

This creates:

- 64 seed questions across 10 difficulty levels
- 21 configuration entries for UI customization
- Database schema with users, questions, leaderboards, etc.

### Step 5: (Optional) Pre-generate AI Questions

```bash
# Generate 200 AI questions (20 per difficulty level) for instant loading
npm run pool:refill

# Check pool status
npm run pool:stats
```

**Note:** Free tier Gemini API has rate limits (20 requests/day). The app works perfectly with seed questions and will auto-refill the pool gradually in the background.

### Step 6: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Alternative: Docker Quick Start

```bash
# Set your Gemini API key in .env first
docker-compose up --build
```

This starts PostgreSQL, Redis, and the Next.js app automatically, including database migrations and seed data.

---

## 📋 Features

### 🤖 AI-Powered Questions (Gemini Integration)

- **Dynamic question generation** via Google Gemini 2.0 Flash
- Structured prompts enforce consistent JSON format with exactly 4 choices
- Questions are **saved to the database** for answer verification and metrics
- **Automatic fallback** to seeded questions if Gemini is unavailable
- Category-aware generation across 10 categories
- Difficulty-aware prompts (Beginner → PhD-level)

### 🔧 Database-Configurable UI

- **21 configuration entries** stored in PostgreSQL `app_config` table
- All UI elements read from database config via `ConfigContext`
- **Feature flags** to enable/disable leaderboard, metrics, dark mode, and Gemini
- **Auto-refresh** every 60 seconds — change config, see updates live
- Configurable: app title, logo emoji, difficulty labels, categories, leaderboard size, scoring params, adaptive thresholds

### ✅ Core Quiz Features

- **Adaptive Difficulty** — Momentum-based algorithm with hysteresis prevents ping-pong instability
- **Infinite Quiz** — One question at a time, auto-serves next question
- **Streak System** — Multiplier up to 3x, resets on wrong answer, decays after 30min inactivity
- **Live Leaderboards** — Score and streak boards with configurable auto-refresh
- **Real-Time Metrics** — Difficulty histogram, accuracy, momentum, recent performance

### 🎨 Frontend

- **Reusable Component Library** — Button, Card, Badge, Input, Modal, ProgressBar, ThemeToggle, Skeleton
- **Design System Tokens** — 80+ CSS custom properties, no hardcoded values
- **Dark/Light Mode** — Full theme support with system preference detection
- **Responsive Design** — Mobile-first with adaptive layouts
- **Lazy Loading** — Code splitting for LeaderboardView and MetricsView
- **"✨ AI Generated" Badge** — Visual indicator when question came from Gemini

### 🛡 Edge Cases

| Edge Case             | Solution                                  |
| --------------------- | ----------------------------------------- |
| Gemini API failure    | Automatic fallback to seeded DB questions |
| Ping-pong instability | Momentum >= 0.6 threshold + min 2-streak  |
| Duplicate submissions | `answerIdempotencyKey` in Redis + DB    |
| Race conditions       | Optimistic locking via `stateVersion`   |
| Streak decay          | Reset after 30 minutes of inactivity      |
| Rate limiting         | 30 req/min per user via Redis sorted sets |

---

## 🗂 Project Structure

```
brainbolt/
├── prisma/
│   ├── schema.prisma          # DB schema + AppConfig model
│   └── seed.ts                # 50 fallback questions + 21 config entries
├── src/
│   ├── app/
│   │   ├── api/v1/
│   │   │   ├── auth/           # login, register
│   │   │   ├── config/         # GET /config (DB-driven)
│   │   │   ├── quiz/           # next (Gemini), answer, metrics
│   │   │   └── leaderboard/    # score, streak
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                 # 8 reusable components
│   │   ├── AuthScreen.tsx      # Login/register (reads config)
│   │   ├── Navbar.tsx          # Nav (reads config + feature flags)
│   │   ├── QuizView.tsx        # Quiz (reads config + shows AI badge)
│   │   ├── LeaderboardView.tsx # Leaderboard (reads config for size/interval)
│   │   └── MetricsView.tsx     # Metrics dashboard
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── ConfigContext.tsx    # DB config with 60s auto-refresh
│   ├── lib/
│   │   ├── gemini.ts           # Gemini AI question generation
│   │   ├── adaptive.ts         # Adaptive difficulty algorithm
│   │   ├── scoring.ts          # Score calculation engine
│   │   ├── prisma.ts           # Prisma client singleton
│   │   ├── redis.ts            # Redis client & cache helpers
│   │   └── rate-limit.ts       # Token bucket rate limiter
│   └── styles/
│       ├── tokens.css          # Design system tokens
│       └── globals.css         # Global styles & animations
├── docker-compose.yml
├── Dockerfile
└── docs/LLD.md
```

---

## 🧠 Architecture

```
┌─────────────────────────────────────────────┐
│                  Frontend                    │
│  ConfigContext ← GET /api/v1/config          │
│  AuthContext   ← POST /api/v1/auth/*         │
│  QuizView      ← GET /api/v1/quiz/next      │
│                ← POST /api/v1/quiz/answer    │
│  Leaderboard   ← GET /api/v1/leaderboard/*  │
│  Metrics       ← GET /api/v1/quiz/metrics   │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│              Next.js API Routes              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │ Gemini   │  │ Adaptive │  │  Scoring   │  │
│  │ AI Gen   │  │Algorithm │  │  Engine    │  │
│  └────┬─────┘  └──────────┘  └───────────┘  │
│       │                                      │
│  ┌────▼─────────────────────────────────┐    │
│  │     Redis Cache Layer                │    │
│  │  • User state (5min)                 │    │
│  │  • Config (60s)                      │    │
│  │  • Leaderboard (10s)                 │    │
│  │  • Rate limiting                     │    │
│  └────┬─────────────────────────────────┘    │
│       │                                      │
│  ┌────▼─────────────────────────────────┐    │
│  │     PostgreSQL (Prisma ORM)          │    │
│  │  • users, questions, user_state      │    │
│  │  • answer_log, leaderboards          │    │
│  │  • app_config (21 entries)           │    │
│  └──────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│            Google Gemini API                 │
│  Model: gemini-2.0-flash                    │
│  Structured JSON output                     │
│  Difficulty-aware prompts                   │
└──────────────────────────────────────────────┘
```

---

## ⚙️ Database Configuration

All these settings are stored in the `app_config` table and can be changed at runtime:

| Key                               | Default                         | Category    | Description                      |
| --------------------------------- | ------------------------------- | ----------- | -------------------------------- |
| `app_title`                     | BrainBolt                       | ui          | App title shown in navbar & auth |
| `app_subtitle`                  | Adaptive Infinite Quiz Platform | ui          | Subtitle on auth screen          |
| `app_logo_emoji`                | ⚡                              | ui          | Logo emoji                       |
| `difficulty_labels`             | Beginner→Expert                | ui          | Labels per difficulty level      |
| `categories`                    | 8 categories                    | ui          | Question categories              |
| `leaderboard_size`              | 20                              | leaderboard | Number of entries shown          |
| `leaderboard_refresh_interval`  | 10000                           | leaderboard | Auto-refresh in ms               |
| `scoring_base_multiplier`       | 10                              | scoring     | Points per difficulty            |
| `scoring_streak_increment`      | 0.1                             | scoring     | Streak bonus per correct         |
| `scoring_max_streak_multiplier` | 3.0                             | scoring     | Max streak bonus cap             |
| `momentum_increase`             | 0.15                            | adaptive    | Momentum gain on correct         |
| `momentum_decrease`             | 0.30                            | adaptive    | Momentum loss on wrong           |
| `momentum_threshold`            | 0.60                            | adaptive    | Required to increase difficulty  |
| `min_streak_to_increase`        | 2                               | adaptive    | Min streak for difficulty up     |
| `inactivity_timeout_min`        | 30                              | adaptive    | Minutes before streak decay      |
| `enable_gemini`                 | true                            | features    | Enable AI question generation    |
| `enable_leaderboard`            | true                            | features    | Show leaderboard tab             |
| `enable_metrics`                | true                            | features    | Show metrics tab                 |
| `enable_dark_mode`              | true                            | features    | Show theme toggle                |

---

## 🔌 API Reference

| Method | Endpoint                          | Description                     |
| ------ | --------------------------------- | ------------------------------- |
| POST   | `/api/v1/auth/register`         | Register new user               |
| POST   | `/api/v1/auth/login`            | Login by username               |
| GET    | `/api/v1/quiz/next?userId=X`    | Get next question (Gemini AI)   |
| POST   | `/api/v1/quiz/answer`           | Submit answer (idempotent)      |
| GET    | `/api/v1/quiz/metrics?userId=X` | Get user metrics                |
| GET    | `/api/v1/leaderboard/score`     | Top N by score                  |
| GET    | `/api/v1/leaderboard/streak`    | Top N by streak                 |
| GET    | `/api/v1/config`                | Get all app config (cached 60s) |

---

## � Development Commands

| Command                  | Description                                      |
| ------------------------ | ------------------------------------------------ |
| `npm install`          | Install dependencies                             |
| `npm run dev`          | Start development server (http://localhost:3000) |
| `npm run build`        | Build for production                             |
| `npm start`            | Start production server                          |
| `npx prisma db push`   | Apply schema changes to database                 |
| `npx prisma db seed`   | Seed database with questions and config          |
| `npx prisma studio`    | Open Prisma Studio (database GUI)                |
| `npm run pool:stats`   | Check AI question pool status                    |
| `npm run pool:refill`  | Pre-generate 200 AI questions                    |
| `docker compose up -d` | Start all services in background                 |
| `docker compose down`  | Stop all services                                |
| `docker ps`            | List running containers                          |

---

## 💻 Local Development (without Docker)

If you prefer running PostgreSQL and Redis locally instead of Docker:

```bash
# Prerequisites: Node.js 20+, PostgreSQL, Redis running locally

npm install

# Set up environment
cp .env.example .env
# Edit .env: add your GEMINI_API_KEY and adjust DATABASE_URL/REDIS_URL

npx prisma db push
npx prisma db seed
npm run dev
```

---

## 🏗 Tech Stack

| Layer            | Technology                           |
| ---------------- | ------------------------------------ |
| AI               | Google Gemini 2.5 Flash             |
| Frontend         | Next.js 14, React 18, TypeScript     |
| Styling          | CSS Modules + Design Tokens          |
| Backend          | Next.js API Routes                   |
| Database         | PostgreSQL 16 + Prisma ORM           |
| Cache            | Redis 7 (ioredis)                    |
| Config           | Database-driven via app_config table |
| Containerization | Docker + Docker Compose              |

---

## 📜 License

MIT
