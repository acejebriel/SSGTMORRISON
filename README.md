# Card Benefits Tracker

A mobile-friendly web app for Ace and Haley to track credit card benefits — ensuring no perk goes unused.

## Features

- **Card grid** grouped by issuer with collapsible tiles
- **Progress bars** showing `$used / $total` per benefit
- **Period-aware resets** — monthly, quarterly, semi-annual, annual; used amount auto-resets when a new period begins
- **Free night certificates** with expiration tracking — auto-rolls expired dates to same day next year
- **Urgent indicators** — red border + badge when a benefit period is ending soon with unused value
- **Summary bar** — total cards, remaining dollar value, unused free nights, urgent item count
- **Filter + search** — filter by All / Ace / Haley / Urgent / Has Unused; search by card name or issuer
- **Persistent storage** via Supabase — syncs across all devices and browsers
- **Shared password auth** — both Ace and Haley log in with the same password from any device

## Tech Stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/)
- [Tailwind CSS v3](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) (PostgreSQL, free tier)
- [dayjs](https://day.js.org/) for date handling
- Deploy to [Vercel](https://vercel.com/)

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/acejebriel/ssgtmorrison.git
cd ssgtmorrison
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. In the **SQL Editor**, paste and run `supabase/schema.sql`
3. Copy your **Project URL** and **anon public key** from Settings → API

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_APP_PASSWORD=choose-a-shared-password
```

> **Never commit `.env`** — it is gitignored.

### 4. Run locally

```bash
npm run dev
```

Open `http://localhost:5173` and sign in with the password you set.

---

## Deploy to Vercel

1. Push this repo to GitHub
2. [vercel.com](https://vercel.com) → Import project → select the repo
3. Under **Environment Variables**, add the three vars from your `.env`
4. Deploy — Vercel auto-detects Vite; `vercel.json` handles SPA routing

---

## Deploy to Netlify (alternative)

1. New site → Import from Git
2. Build command: `npm run build`; Publish directory: `dist`
3. Add environment variables in Site Settings → Environment
4. Add a `public/_redirects` file: `/* /index.html 200`

---

## Adding or editing cards

Edit `src/data/cards.json`. Each card:

```json
{
  "id": "unique-id",
  "issuer": "Amex",
  "name": "Card Display Name",
  "num": "last-4-digits",
  "owner": "ace",
  "benefits": [
    {
      "key": "globally-unique-benefit-key",
      "name": "Benefit description",
      "used": 0,
      "total": 200,
      "period": "annual"
    }
  ],
  "freeNights": [
    {
      "label": "Free night award",
      "exp": "2027-04-01"
    }
  ]
}
```

**Period values:**

| Value | Meaning |
|-------|---------|
| `monthly` | Resets every calendar month |
| `quarterly` | Resets every calendar quarter |
| `annual` | Resets every calendar year |
| `Jan-Jun` | Fixed Jan 1 – Jun 30 window |
| `Jul-Dec` | Fixed Jul 1 – Dec 31 window |
| `Jan-Mar` | Fixed Jan 1 – Mar 31 window |
| `Apr-Jun` | Fixed Apr 1 – Jun 30 window |
| `Jul-Sep` | Fixed Jul 1 – Sep 30 window |
| `Oct-Dec` | Fixed Oct 1 – Dec 31 window |

> **Important:** `key` must be globally unique across all cards. Changing a `key` loses its saved state in Supabase.

---

## Database schema (`supabase/schema.sql`)

### `benefit_state`
| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | matches `benefit.key` |
| `card_id` | text | card's `id` |
| `used` | numeric | current used amount |
| `notes` | text | user notes |
| `reset_period` | text | last active period key — detects rollovers |
| `updated_at` | timestamptz | |

### `free_night_state`
| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | `{cardId}-fn{index}` |
| `card_id` | text | card's `id` |
| `used` | boolean | whether it's been redeemed |
| `exp` | text | ISO date (may be auto-rolled) |
| `updated_at` | timestamptz | |
