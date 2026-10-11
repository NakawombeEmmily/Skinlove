# SkinLove — Deployment Guide (Vercel + Render + Neon)

October 2026 · Four-Terrain Journey: Savannah Mastery · Tsavo Fluency · Ethical Savannah · Agent Savannah

## Architecture

```
User Browser
    ↓  loads UI
VERCEL (React + Vite Frontend)
    ↓  HTTP API calls (fetch)
RENDER (Node.js + Express Backend)
    ↓  SQL queries
NEON (PostgreSQL Database)
```

Vercel never talks to Neon directly. All data requests go through Render, which keeps
database credentials hidden from users.

## Repository layout

```
.                          ← Vercel frontend root (Vite + React)
├── index.html             ← Vite entry
├── main.jsx               ← React bootstrap
├── SkinLove.jsx           ← the whole app (auth, products, stores, chat, profile, admin)
├── SkinLove.css
├── package.json
├── vite.config.js
├── vercel.json            ← REACT_APP_API_URL / VITE_API_URL
├── database/
│   ├── schema.sql         ← Deliverable 1: tables
│   └── seed.sql           ← demo users, products, Kampala stores
├── legacy/                ← original static landing page (archived)
└── skinlove-backend/      ← Deliverable 2: Render API root directory
    ├── index.js           ← includes GET /health (cron keep-alive)
    ├── package.json
    ├── .env.example
    ├── db/client.js
    ├── routes/{auth,products,wishlist,stores,chat,users,admin}.js
    └── middleware/{authMiddleware,adminMiddleware}.js
```

## API summary

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | /api/auth/register | – | name, email, password, skin_type → JWT |
| POST | /api/auth/login | – | returns JWT (7 days) |
| POST | /api/auth/logout | user | clear token |
| GET | /api/auth/me | user | current user |
| GET | /api/products | – | ?skin_type= &type= &search= |
| GET | /api/products/:id | – | single product |
| POST/PUT/DELETE | /api/products(/:id) | admin | create / update / soft delete |
| GET | /api/wishlist | user | wishlist with product details |
| POST/DELETE | /api/wishlist/:productId | user | add / remove |
| GET | /api/stores | – | all stores |
| GET | /api/stores/nearby?lat=&lng= | – | Haversine distance sort |
| POST | /api/chat | user | Anthropic claude-sonnet-4-6, streamed |
| GET | /api/chat/history | user | last 20 messages |
| GET/PUT | /api/users/me | user | profile: name, skin_type |
| GET | /api/admin/users | admin | users + order counts |
| PUT | /api/admin/users/:id/deactivate | admin | deactivate (?activate=true to restore) |
| GET | /api/admin/analytics | admin | skin types, top products, monthly signups |
| POST/PUT | /api/admin/products(/:id) | admin | product management |
| GET | /health | – | keep-alive ping for cron-job.org |

---

## Step 1 — Set Up Neon Database

1. Go to neon.tech and create a free account.
2. Click **New Project** and name it `skinlove`.
3. Copy the connection string — it looks like `postgresql://user:pass@host/skinlove`.
4. Open the **SQL Editor** in the Neon dashboard.
5. Paste the whole of `database/schema.sql` and run it.
6. Paste the whole of `database/seed.sql` and run it (run seed once only).
7. Save your connection string — you need it in Step 2.

Seeded logins:

| Account | Email | Password | Role |
|---|---|---|---|
| Admin | admin@skinlove.com | SkinLove2026 | admin |
| Demo | demo@skinlove.com | demo1234 | user |

## Step 2 — Deploy Backend to Render

1. Push `skinlove-backend/` to GitHub (either its own repo, or keep it inside this repo).
2. On render.com click **New → Web Service** and connect the repo.
3. If the backend lives inside this repo, set **Root Directory** to `skinlove-backend`.
4. Set **Build Command**: `npm install`
5. Set **Start Command**: `node index.js`
6. Add these environment variables:

   | Key | Value |
   |---|---|
   | DATABASE_URL | your Neon connection string |
   | JWT_SECRET | any long random string |
   | ANTHROPIC_API_KEY | your Anthropic key |
   | FRONTEND_URL | https://skinlove.vercel.app |
   | PORT | 3001 (Render sets this automatically) |

7. Click **Create Web Service**. Copy the URL — `https://skinlove-api.onrender.com`.
8. Smoke test: open `https://skinlove-api.onrender.com/health` → `{"status":"ok"}`.

## Step 3 — Deploy Frontend to Vercel

1. Push this repo to GitHub.
2. On vercel.com click **New Project** → import the repo.
3. Framework preset: **Vite** (build `npm run build`, output `dist`).
4. Under Environment Variables add:
   `REACT_APP_API_URL = https://skinlove-api.onrender.com`
   (and `VITE_API_URL` with the same value — Vite only exposes `VITE_`-prefixed vars)
5. Click **Deploy** → your app is live at `https://skinlove.vercel.app`.

## Step 4 — Test the Full Flow

1. Open your Vercel URL.
2. **Sign up** with your email and pick a skin type.
3. Log in — check Profile shows the saved skin type.
4. Browse **Products**, filter by skin type, tap ♡ to wishlist an item.
5. Open **AI Chat** and ask a skincare question (reply streams in).
6. **Find Stores** → allow GPS → stores sort by real distance from your position.
7. Log in as `admin@skinlove.com` / `SkinLove2026` → **Admin** tab → add a product,
   deactivate a user, check analytics.

## Step 5 — Add a Custom Domain

1. Buy a domain (skinlove.ug) at Register.ug or Namecheap (~$10–15/year).
2. Vercel → project → **Settings → Domains** → **Add Domain** → `skinlove.ug`.
3. Copy the DNS records Vercel shows you.
4. Add those records at your registrar.
5. Wait 10–30 minutes — the site is live at `skinlove.ug` with free SSL.

## Step 6 — Keep Render Awake (Free Tier)

Render sleeps after 15 minutes of idle; the first request then takes ~30 seconds.
`GET /health` already exists in `index.js`.

1. Create a free account at cron-job.org.
2. Create a cronjob with URL `https://skinlove-api.onrender.com/health`.
3. Set the schedule to every 10 minutes.

---

## Quick reference

| What | Where | Free tier limit |
|---|---|---|
| Frontend hosting | vercel.com | 100 GB bandwidth/month |
| Backend hosting | render.com | sleeps after 15 min idle |
| Database | neon.tech | 0.5 GB storage |
| Keep-alive ping | cron-job.org | unlimited |
| AI chatbot | anthropic.com | pay per API call |
| Custom domain | register.ug / namecheap.com | ~$10–15/year |

**When to upgrade**

- Render → $7/month once you have daily users who need instant responses.
- Neon → when the database passes 0.5 GB (thousands of users).
- Vercel free tier is generous; you likely will not need to upgrade for a long time.

## Local development

```bash
# backend (needs a DATABASE_URL — Neon works fine for this)
cd skinlove-backend
npm install
cp .env.example .env      # fill in DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY
npm run dev               # http://localhost:3001/health

# frontend
npm install
npm run dev               # http://localhost:5173
```

🌿 SkinLove — Built for East Africa · Powered by Vercel + Render + Neon
