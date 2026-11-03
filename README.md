# Tradiary

> **Your trading diary, with analytics.**
> The free, professional-grade trading journal for serious traders — comparable in scope to TradeZella, Tradervue, and Edgewonk, completely free.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-tradiary.app-5B6CFF?style=flat-square)](https://tradairy.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-22D3EE?style=flat-square)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://cloud.mongodb.com)

---

## Table of Contents

1. [Features](#features)
2. [Architecture Overview](#architecture-overview)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Getting Started](#getting-started)
6. [Environment Variables](#environment-variables)
7. [MetaTrader 5 Integration](#metatrader-5-integration)
8. [Available Scripts](#available-scripts)
9. [Deployment](#deployment)
10. [Design System](#design-system)
11. [API Reference](#api-reference)

---

## Features

### Core Journaling

| Feature | Description |
|---|---|
| **Trade Logging** | Log entries, exits, screenshots, tags, emotion, execution grade, and notes across stocks, forex, crypto, futures, and options |
| **Analytics Dashboard** | Equity curve, win rate, profit factor, expectancy, avg win/loss, max drawdown, and R-multiple tracking |
| **Calendar P&L View** | Daily P&L heatmap to spot patterns, streaks, and trading frequency at a glance |
| **Trade Replay** | Replay any closed trade on an interactive candlestick chart (powered by TradingView Lightweight Charts) with entry/exit markers, SL/TP levels, and multi-timeframe support |
| **Playbooks** | Document and track your trading strategies — with named rules, example screenshots, and per-trade discipline scoring |
| **Journal** | Free-form daily journal with mood tagging |
| **Goals** | Set and track financial and performance goals |
| **Mistakes Log** | Tag recurring trading errors per trade and review your most costly patterns |
| **Watchlist** | Track symbols you're monitoring across asset classes |
| **Risk Calculator** | Position-size any trade in seconds from account size, entry, and stop-loss |

### Reporting & Sharing

| Feature | Description |
|---|---|
| **PDF Reports** | Download branded performance reports with equity curve, summary statistics, and a full trades table |
| **Trade Card Sharing** | Generate a shareable social image for any closed trade |
| **Data Export** | Download all your trades as CSV from Settings |

### Automation & Integrations

| Feature | Description |
|---|---|
| **MetaTrader 5 Bridge EA** | MQL5 Expert Advisor that auto-pushes trade open/close/modify events to Tradiary via webhook — zero manual logging |
| **MT5 Offline Recovery** | Background cron job scans orphaned MT5 trades and auto-resolves them using Yahoo Finance / Binance historical candle data when MetaTrader was offline |
| **CSV Import** | Bulk-import trades from a CSV file |
| **In-App Notifications** | Weekly performance summaries, streak breaks, goal achievements, and trade auto-resolution alerts |

### Platform & UX

| Feature | Description |
|---|---|
| **Google & Email Auth** | Sign in with Google or email + password; both providers can share one account |
| **Dark / Light Mode** | Dark by default; fully themed with CSS custom properties |
| **Fully Responsive** | Mobile bottom-nav layout, tablet/desktop sidebar — fully usable on any screen |
| **PWA-Ready** | Web manifest + maskable icons for "Add to Home Screen" on mobile |
| **Onboarding Tour** | 4-step welcome tour with optional sample data to explore the app immediately |
| **Timezone-Aware** | All dates displayed in the user's configured timezone |

---

## Architecture Overview

```
Tradiary (monorepo)
├── client/     React 18 + Vite SPA     →  Vercel
└── server/     Node.js + Express API   →  Render / Railway
                        ↓
                  MongoDB Atlas
                        ↓
                  Cloudinary (screenshots + avatars)
                        ↓
                  Brevo (transactional email)
                        ↓
                  Yahoo Finance / Binance (market data — keyless)
```

### Auth Flow

- **JWT access token** (15 min) returned in response body → stored in Redux memory (never `localStorage`)
- **Refresh token** (30 days) stored in an `httpOnly Secure` cookie
- Silent rotation via `POST /api/auth/refresh`
- `tokenVersion` on the User document globally invalidates all refresh tokens on password change or logout-all

### Security Model

| Layer | Implementation |
|---|---|
| HTTP headers | `helmet` — CSP, HSTS, X-Frame-Options, etc. |
| CORS | Locked to `CLIENT_ORIGIN` env var (comma-separated allowlist) |
| Rate limiting | `express-rate-limit` on all routes; stricter limits on auth endpoints |
| Passwords | `bcrypt` with 12 rounds |
| Brute-force | Account lockout after 5 failed logins (15 min cooldown) |
| Integration tokens | SHA-256 hashed before storage; raw token shown exactly once |
| Input validation | `express-validator` on all POST/PATCH handlers |

### MT5 Orphan Recovery Pipeline

```
MT5 EA offline
      ↓
Trade remains "open" past ORPHAN_THRESHOLD_HOURS (default: 4h)
      ↓
Cron job (every 2h) scans orphaned metatrader trades
      ↓
  Has SL or TP?
  ├── Yes → Fetch historical candles (Yahoo / Binance)
  │         Walk candles chronologically for SL/TP trigger
  │         ├── Trigger found → Auto-close at trigger price + notify user
  │         └── No trigger    → Flag "needs_review" + notify user
  └── No  → Flag "needs_review" immediately + notify user
```

---

## Tech Stack

### Frontend (`/client`)

| Layer | Library / Version |
|---|---|
| Framework | React 18 + Vite 5 |
| Routing | React Router v6 |
| Styling | TailwindCSS v3 + CSS custom properties |
| State management | Redux Toolkit + React-Redux |
| Data fetching | Axios + custom hooks |
| Forms | React Hook Form + Zod |
| Charts | Recharts (analytics) + TradingView Lightweight Charts (trade replay) |
| Icons | Lucide React |
| Dates | date-fns |
| Fonts | Inter (UI) · Manrope (display) · JetBrains Mono (prices) |

### Backend (`/server`)

| Layer | Library / Version |
|---|---|
| Runtime | Node.js 20+ |
| Framework | Express 4 |
| Database | MongoDB Atlas + Mongoose 8 |
| Auth | jsonwebtoken + bcrypt |
| Google OAuth | google-auth-library |
| Validation | express-validator |
| Security | helmet + cors + express-rate-limit |
| File uploads | Multer + Cloudinary SDK |
| Email | Brevo transactional API |
| PDF generation | PDFKit |
| Scheduled jobs | node-cron |
| Logging | morgan |

---

## Project Structure

```
Tradiary/
├── client/
│   ├── public/                  Favicons, icons, manifest, og-image
│   ├── scripts/
│   │   └── generate-brand-assets.mjs  Brand asset generation script
│   └── src/
│       ├── api/                 Axios instance + per-resource endpoint modules
│       ├── app/                 Redux store configuration
│       ├── assets/brand/        SVG icon source
│       ├── components/
│       │   ├── layout/          AppShell, Sidebar, Topbar, MobileNav, AuthLayout
│       │   ├── notifications/   NotificationBell + dropdown
│       │   ├── onboarding/      OnboardingTour (4-step)
│       │   └── ui/              Button, Input, Card, Badge, Modal, Toast,
│       │                        Logo, EmptyState, Skeleton, …
│       ├── features/            Redux slices (auth, ui, trades, analytics, …)
│       ├── hooks/               Custom React hooks
│       ├── pages/
│       │   ├── app/             DashboardPage, TradesPage, TradeDetailPage,
│       │   │                    CalendarPage, PlaybooksPage, StrategyDetailPage,
│       │   │                    JournalPage, GoalsPage, MistakesPage,
│       │   │                    WatchlistPage, RiskCalculatorPage, SettingsPage
│       │   └── auth/            SignInPage, SignUpPage, ForgotPasswordPage, …
│       ├── routes/              AppRouter, ProtectedRoute
│       ├── styles/              index.css (design tokens + Tailwind base)
│       ├── utils/               format.js (date / currency helpers)
│       ├── App.jsx
│       └── main.jsx
│
└── server/
    ├── server.js                Entry point
    └── src/
        ├── app.js               Express app, middleware, route mounting
        ├── config/              db.js, cloudinary.js, mailer.js
        ├── controllers/         analyticsController, authController,
        │                        journalController, metatraderController,
        │                        notificationsController, replayController,
        │                        reportsController, strategyController,
        │                        tradeController, uploadController,
        │                        usersController, watchlistController
        ├── jobs/
        │   ├── resolveOrphanedTrades.js   MT5 offline recovery cron
        │   └── weeklyNotification.js      Weekly summary cron
        ├── middleware/          auth.js, errorHandler.js, rateLimiter.js, validate.js
        ├── models/              User, Trade, Account, Strategy, Goal,
        │                        JournalEntry, WatchlistItem, Notification,
        │                        IntegrationToken, CandleCache
        ├── routes/              index.js + per-resource routers
        │                        (accounts, analytics, auth, goals, health,
        │                         integrations, journal, notifications,
        │                         reports, strategies, trades, uploads,
        │                         users, watchlist)
        ├── services/
        │   ├── marketData.js          Yahoo Finance / Binance data fetching
        │   └── marketDataCache.js     MongoDB-backed candle cache layer
        └── utils/               response.js, email.js, tokens.js
```

---

## Getting Started

### Prerequisites

- **Node.js ≥ 20** and **npm ≥ 10**
- A [MongoDB Atlas](https://cloud.mongodb.com) cluster (free M0 tier is sufficient)
- A [Cloudinary](https://cloudinary.com) account (free tier, for screenshot and avatar uploads)
- A [Brevo](https://brevo.com) account (free tier, for transactional email)

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/tradiary.git
cd tradiary

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Configure Environment Variables

```bash
# Server
cp server/.env.example server/.env
# Fill in MONGO_URI, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET,
# GOOGLE_CLIENT_ID, CLOUDINARY_*, BREVO_API_KEY, CLIENT_ORIGIN

# Client
cp client/.env.example client/.env
# Fill in VITE_GOOGLE_CLIENT_ID, VITE_SITE_URL (http://localhost:5173 for dev)
```

See the [Environment Variables](#environment-variables) section for all options.

### 3. Generate Brand Assets (first time only)

```bash
cd client
node scripts/generate-brand-assets.mjs
# Outputs: favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png,
#          icon-maskable-512.png, site.webmanifest → client/public/
```

### 4. Run in Development

Open **two terminals**:

```bash
# Terminal 1 — API server
cd server
npm run dev        # starts on http://localhost:5000

# Terminal 2 — React client
cd client
npm run dev        # starts on http://localhost:5173
```

| Endpoint | URL |
|---|---|
| App | http://localhost:5173 |
| API health check | http://localhost:5000/api/health |

---

## Environment Variables

### Server (`server/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | ✅ | — | `development` or `production` |
| `PORT` | | `5000` | HTTP port |
| `MONGO_URI` | ✅ | — | MongoDB Atlas connection string |
| `JWT_ACCESS_SECRET` | ✅ | — | Secret for access tokens — generate with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_ACCESS_EXPIRES_IN` | | `15m` | Access token TTL |
| `JWT_REFRESH_SECRET` | ✅ | — | Secret for refresh tokens (must differ from access secret) |
| `JWT_REFRESH_EXPIRES_IN` | | `30d` | Refresh token TTL |
| `GOOGLE_CLIENT_ID` | | — | Google OAuth client ID |
| `CLOUDINARY_CLOUD_NAME` | | — | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | | — | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | | — | Cloudinary API secret |
| `BREVO_API_KEY` | | — | Brevo transactional email API key |
| `EMAIL_FROM_NAME` | | — | Sender display name (e.g. `Tradiary`) |
| `EMAIL_FROM_ADDRESS` | | — | Verified sender email address |
| `CLIENT_ORIGIN` | ✅ | — | Comma-separated list of allowed frontend origins (no trailing slash) |
| `WEEKLY_SUMMARY_CRON` | | `0 8 * * 0` | Cron schedule for weekly notifications (UTC). Only runs in `production`. |
| `MARKET_DATA_PROVIDER` | | `yahoo` | `yahoo` (keyless, all asset classes) or `binance` (keyless, crypto only) |
| `ORPHAN_RESOLVE_CRON` | | `0 */2 * * *` | Cron schedule for the MT5 orphan recovery job. Set to `''` to disable. |
| `ORPHAN_THRESHOLD_HOURS` | | `4` | Hours a MetaTrader trade must be open with no close event before it's considered orphaned |
| `ORPHAN_CANDLE_TF` | | `1h` | Candle timeframe used when scanning for SL/TP triggers. Use `1d` if Yahoo rate-limits are hit. |

### Client (`client/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | | Backend URL. In dev the Vite proxy handles this automatically; in production set to your deployed API URL. |
| `VITE_GOOGLE_CLIENT_ID` | | Google OAuth client ID (same value as the server) |
| `VITE_SITE_URL` | | Deployed URL used for OG meta tags (e.g. `https://tradiary.app`) |

---

## MetaTrader 5 Integration

Tradiary ships a first-class MetaTrader 5 Expert Advisor that automatically syncs all trades to your journal with zero manual entry.

### How It Works

1. The **Tradiary Bridge EA** (`tradiary-bridge.mq5`) attaches to any one chart in MT5.
2. On every trade open/close/modify event it fires `OnTradeTransaction`, builds a JSON payload, and enqueues it to be sent via `WebRequest` on the next `OnTimer` tick — so it **never blocks the trading thread**.
3. The server authenticates the webhook using an `X-Tradiary-Token` header (SHA-256 hashed before storage, shown to the user exactly once).
4. Duplicate deliveries are handled gracefully via a sparse unique index on `(userId, externalId)`.
5. On EA startup, a **history sync** runs after a configurable delay to replay any close events that Tradiary missed while the EA was not running.

### Setup

1. Download `tradiary-bridge.mq5` from **Settings → Integrations** in the Tradiary app.
2. In MT5, go to **Tools → Options → Expert Advisors** and check **Allow WebRequest for listed URL**. Add your Tradiary API webhook URL:
   ```
   https://your-tradiary-domain.com/api/integrations/metatrader/webhook
   ```
3. Open **Settings → Integrations** in Tradiary, generate an API token, and copy it.
4. In MT5, drag the EA onto any one chart. Set the `InpApiToken` input to your token and `InpApiUrl` to your webhook URL.

### Webhook Events

| Event | Description |
|---|---|
| `trade_open` | Fired when a position is entered. Creates an open trade record. Idempotent — safe to re-deliver. |
| `trade_close` | Fired when a position is exited. Computes P&L and R-multiple. If the open event was missed, creates a full closed record. |
| `trade_modify` | Fired when SL or TP is changed on a live position. Patches the open trade record. |

### Offline Recovery

When MetaTrader is offline (PC off, internet down, etc.), the EA cannot deliver close events. The server's orphan recovery job detects these cases automatically:

- Scans for `metatrader`-sourced trades still `open` past `ORPHAN_THRESHOLD_HOURS`
- Fetches historical candle data and walks candles chronologically to find the first SL or TP trigger
- **Auto-closes** the trade at the trigger price and notifies the user (tagged `auto-resolved`)
- If no trigger is found or market data is unavailable, flags the trade as `needs_review` and notifies the user

---

## Available Scripts

### Server

| Command | Description |
|---|---|
| `npm run dev` | Start with nodemon (auto-restart on file changes) |
| `npm start` | Start for production |

### Client

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production bundle → `client/dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | ESLint check (zero warnings policy) |
| `npm run format` | Prettier format all source files |
| `node scripts/generate-brand-assets.mjs` | Generate favicons, PWA icons, and web manifest |

---

## Deployment

### Frontend → Vercel

1. Push the repo to GitHub.
2. Import the project on [vercel.com](https://vercel.com).
3. Set **Root Directory** to `client`.
4. Add all `VITE_*` environment variables in the Vercel dashboard.
5. Vercel auto-detects Vite — no extra build configuration needed.
6. `client/vercel.json` handles SPA rewrites for client-side routing.

### Backend → Render

1. Create a new **Web Service** on [render.com](https://render.com).
2. Set **Root Directory** to `server`.
3. **Build Command:** `npm install`
4. **Start Command:** `node server.js`
5. Add all environment variables from `server/.env.example`.
6. Set `NODE_ENV=production` and `CLIENT_ORIGIN` to your Vercel deployment URL.
7. `/api/health` is pre-configured for Render's health-check probes.

### Alternative → Railway

Railway works with minimal configuration:

1. Create a new project and connect your GitHub repo.
2. Add a service pointing at the `/server` directory.
3. Set all environment variables and deploy.

### Post-Deployment Checklist

- [ ] `CLIENT_ORIGIN` matches your Vercel deployment URL exactly (no trailing slash)
- [ ] `VITE_API_URL` points to your Render/Railway backend URL
- [ ] Google OAuth production origins are added in [Google Cloud Console](https://console.cloud.google.com)
- [ ] Paste your deployed URL into [Twitter Card Validator](https://cards-dev.twitter.com/validator) to verify OG preview
- [ ] Visit `/api/health` on the deployed API — should return `{ "status": "ok" }`
- [ ] Test MetaTrader webhook by executing a trade with the EA attached

---

## Design System

### Brand Identity

| Element | Value |
|---|---|
| **Name** | Tradiary = "Tra" + "diary" — the diary that captures your trading |
| **Tagline** | "Your trading diary, with analytics." |
| **Short tagline** | "Trade. Journal. Improve." |
| **Icon** | Bold "T" whose stem is a candlestick body + wick, on an indigo→cyan gradient rounded square |
| **Wordmark** | Manrope 700, letter-spacing −0.02em — "Tra" in `--text`, "diary" in `--brand-cyan` |

### Colour Tokens

| Token | Dark | Light | Usage |
|---|---|---|---|
| `--bg` | `#0B1220` | `#F6F8FC` | Page background |
| `--surface` | `#111A2E` | `#FFFFFF` | Card / panel background |
| `--brand-indigo` | `#5B6CFF` | `#4F5DF0` | Primary CTAs, links |
| `--brand-cyan` | `#22D3EE` | `#0891B2` | Accents, wordmark |
| `--gain` | `#22C55E` | `#16A34A` | Positive P&L **only** |
| `--loss` | `#EF4444` | `#DC2626` | Negative P&L **only** |

> [!CAUTION]
> `--gain` and `--loss` are reserved exclusively for profit/loss meaning. **Never use them decoratively.**

### Theme

- Dark mode is the default (`data-theme="dark"` on `<html>`)
- Light mode toggled via Redux `toggleTheme()` → sets `data-theme="light"`
- User preference is persisted in `localStorage` and synced to their User document

### Typography

| Role | Font |
|---|---|
| UI body, labels, small text | Inter |
| Headings, wordmark, large numbers | Manrope |
| Prices, P&L values, code | JetBrains Mono |

---

## API Reference

All endpoints are prefixed with `/api`. All authenticated endpoints require a valid JWT access token as a `Bearer` header, except the MetaTrader webhook which uses `X-Tradiary-Token`.

### Auth

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/register` | Register with email + password |
| `POST` | `/auth/login` | Login; sets `httpOnly` refresh cookie |
| `POST` | `/auth/google` | Google OAuth sign-in/sign-up |
| `POST` | `/auth/refresh` | Rotate refresh token; returns new access token |
| `POST` | `/auth/logout` | Clear refresh token cookie |
| `POST` | `/auth/forgot-password` | Send password reset email |
| `POST` | `/auth/reset-password` | Reset password with token |
| `GET` | `/auth/verify-email` | Verify email address with token |

### Trades

| Method | Path | Description |
|---|---|---|
| `GET` | `/trades` | List trades (paginated, filterable) |
| `POST` | `/trades` | Create a trade |
| `GET` | `/trades/:id` | Get a single trade |
| `PATCH` | `/trades/:id` | Update a trade |
| `DELETE` | `/trades/:id` | Delete a trade |
| `GET` | `/trades/:id/replay-data` | Get candle + marker data for trade replay |

### Analytics

| Method | Path | Description |
|---|---|---|
| `GET` | `/analytics/summary` | Aggregate stats (win rate, P&L, profit factor, drawdown, etc.) |
| `GET` | `/analytics/equity-curve` | Cumulative equity curve data points |
| `GET` | `/analytics/calendar` | Daily P&L for the calendar heatmap |

### Other Resources

| Prefix | Resources |
|---|---|
| `/accounts` | Trading accounts (CRUD) |
| `/strategies` | Playbooks / strategies (CRUD) |
| `/journal` | Daily journal entries (CRUD) |
| `/goals` | Goals (CRUD + progress) |
| `/watchlist` | Watchlist items (CRUD) |
| `/notifications` | In-app notifications (list, mark read, clear) |
| `/reports` | PDF report download, trade card image generation |
| `/uploads` | Screenshot and avatar upload (Cloudinary) |
| `/users` | Profile update, password change, data export, account deletion |
| `/integrations` | MetaTrader webhook + token management |
| `/health` | `GET /health` → `{ status: "ok" }` |

---

## License

MIT © Tradiary
