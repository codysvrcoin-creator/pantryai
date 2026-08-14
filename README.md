# 🥗 PantryAI

Personal food assistant (PWA) to install on your iPhone home screen:
budget → pantry → AI weekly menu → shopping list → cook → consume. Built for
**strictly personal** use (a single person/household, no login, no social
features, no payments).

## ✨ Features

- **Local-first**: works offline (Zustand + `localStorage`); syncs with
  Supabase in the background whenever there's internet.
- **AI-powered weekly planner** (Gemini): generates a full menu that respects
  your budget, nutrition goals, current pantry, and preferences expressed in
  natural language. The arithmetic (calories, macros, prices, quantities) is
  always computed by the app, never by the AI.
- **Pantry** with fridge / pantry / freezer, manual entry, by dictation
  (several products at once), or by receipt photo (OCR with Gemini Vision).
- **Personal price memory**: remembers the last real price paid for each
  product and uses it to estimate the cost of your next shop.
- **Smart shopping list**: compares what you need with what you already
  have, rounds up to real package sizes, and prioritizes real prices over
  estimates.
- **Cook Mode**: large steps, timers, and a button to adjust the recipe on
  the fly with AI. When you finish, it automatically deducts the ingredients
  used from your pantry.
- **Installable PWA** on iOS: full screen, no Safari bar.

## 🧱 Tech stack

- [Next.js 14](https://nextjs.org/) (App Router) + TypeScript
- [Supabase](https://supabase.com/) (Postgres) as the sync backend
- [Google Gemini](https://aistudio.google.com/) (`gemini-flash-latest`, free
  tier) for menu generation, receipt OCR, and natural language understanding
- Tailwind CSS + shadcn/ui + Framer Motion
- Zustand with local persistence

## 🚀 How to self-host your own copy

This app is meant for each person to deploy with **their own** Supabase and
Gemini keys. No key or credential is included in this repository.

### 1. Clone the repository and install dependencies

```bash
git clone https://github.com/YOUR-USERNAME/YOUR-REPO.git
cd YOUR-REPO
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com/) and create a new project (the
   free plan is more than enough for personal use).
2. Open **SQL Editor → New query** and run, in this order, the contents of
   each of these files from the repo:
   1. `supabase/schema.sql`
   2. `supabase/schema_part3.sql`
   3. `supabase/schema_part4.sql`
3. Go to **Project Settings → API** and copy:
   - `Project URL` → this will be your `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → this will be your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> The database is designed for a single user: the RLS policies allow all
> operations without authentication. Don't expose this app publicly without
> adding your own auth layer if you're concerned about others accessing
> your data.

### 3. Get a Gemini API key (free)

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
2. Create a new API key. The free tier of `gemini-flash-latest` is enough
   for personal use.
3. This key will be your `GEMINI_API_KEY`.

### 4. Set up your environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in the three variables with what you got in
steps 2 and 3:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
GEMINI_API_KEY=your-gemini-key
```

`.env.local` is in `.gitignore`: it's never pushed to the repository.

### 5. Try it locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Deploy to Vercel

**Option A — from the web:**

1. Go to [vercel.com/new](https://vercel.com/new) and import your GitHub
   repository.
2. Under "Environment Variables", add the same three variables from
   `.env.local`.
3. Deploy.

**Option B — from the terminal:**

```bash
npm install -g vercel
vercel        # first deploy, follow the prompts
vercel --prod # subsequent deploys
```

If you use the CLI, add the environment variables in
**Vercel Dashboard → your project → Settings → Environment Variables** and
redeploy with `vercel --prod` for them to take effect.

### 7. Install it on your iPhone home screen

1. Open your deployment URL in **Safari** (it has to be Safari, not Chrome,
   for PWA mode to work on iOS).
2. Tap the **Share** icon (a square with an arrow pointing up).
3. Tap **"Add to Home Screen"**.
4. Open the app from the new icon: it will open full screen.

## 📁 Project structure

```
app/                    Next.js routes (pages + /api endpoints)
components/             UI components (pantry, week, shopping, cook...)
lib/                    Store (Zustand), AI logic, deterministic calculations
  ai/                   AI provider abstraction, prompts, and schemas
  supabase/             Client and sync logic
supabase/               SQL migrations (run in order)
public/                 Manifest, service worker, icons
```

## 🔒 Privacy

All your data (budget, pantry, plans, prices) lives first on your own
device and syncs only with **your own** Supabase project. No data is
shared with third parties except for the calls needed to the Gemini API to
generate content (menus, receipt reading, text interpretation).

## 📄 License

MIT — use it, modify it, and share it freely. See [`LICENSE`](./LICENSE).
