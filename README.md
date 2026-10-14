# SkinLove

A skincare recommendation web app built for East Africa — product discovery, skin-type matching, AI skincare chat, nearby store finder, wishlist, and an admin dashboard.

**Live app:** https://skinlove-two.vercel.app
**API:** https://skinlove.onrender.com

## Features

- **Authentication** — register / login with JWT (7-day sessions), profile with saved skin type
- **Products** — browse and filter by skin type, type, and search; each product can show an uploaded photo or a placeholder icon
- **Wishlist** — save products to your personal list
- **AI Chat** — built-in app guide + skincare assistant powered by Google Gemini (streamed replies). It knows the SkinLove app, its live product catalogue and Kampala stores.
- **Find Stores** — locate nearby stores, sorted by real GPS distance (Haversine)
- **Admin dashboard** — tabbed panel to manage products (including image uploads), stores, users, wishlist activity and analytics
- **Support escalation** — if a user asks the AI to speak to a human, an alert is raised for admins, who can reply directly into the user's chat from the Support tab
- **Realtime activity feed** — admins receive live events (logins, sign-ups, support requests, wishlist saves, product/store changes) over Server-Sent Events

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, hosted on Vercel |
| Backend | Node.js + Express, hosted on Render |
| Database | PostgreSQL (Neon) |
| Auth | JWT + bcrypt |
| AI | Google Gemini (streamed, app-aware) |
| Maps/Distance | Browser Geolocation + Haversine |

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

The frontend never talks to Neon directly — all data requests go through the backend, keeping database credentials hidden from users.

## AI Assistant

The AI Chat is more than a skincare bot — it is the built-in guide to the SkinLove app itself. On every request the backend builds a system prompt that includes:

- **App knowledge** — what each tab does and how to use it (Products, Wishlist, Find Stores, Profile, Admin) and the supported skin types.
- **Live product catalogue** — pulled from the database at request time, so the assistant recommends real items with current names and UGX prices.
- **Live store list** — the actual Kampala stores and opening hours.
- **The user's skin type** — so advice is personalised.

Because the catalogue and stores are read live, anything an admin adds or changes is reflected in the assistant's answers immediately. Replies are streamed token-by-token to the browser as plain text.

When a user asks to speak to a real person, the backend raises a **support request** (deduplicated within 30 minutes) that appears on the admin dashboard, sets an `X-Support-Escalated` response header so the user sees a confirmation, and instructs the assistant to acknowledge the hand-off. Admins can then send a **reply** from the Support tab, which is written into that user's chat history and shows up in their chat (the chat polls history every few seconds).

The admin panel subscribes to a realtime **activity feed** over Server-Sent Events (`GET /api/admin/events`, authenticated with the JWT). A small in-process event bus (`realtime.js`) publishes logins, sign-ups, support requests, wishlist changes and product/store changes as they happen.

## Repository Layout

```
.
├── index.html             ← Vite entry
├── main.jsx               ← React bootstrap
├── SkinLove.jsx           ← the whole app (auth, products, stores, chat, profile, admin)
├── SkinLove.css
├── vite.config.js
├── vercel.json
├── public/
│   └── images/            ← static images (served at /images/...)
├── database/
│   ├── schema.sql         ← tables
│   └── seed.sql           ← demo users, products, Kampala stores
├── legacy/                ← original static landing page (archived)
└── skinlove-backend/      ← Render API root directory
    ├── index.js           ← includes GET /health (cron keep-alive)
    ├── realtime.js        ← in-process event bus for the admin live feed
    ├── db/client.js
    ├── routes/{auth,products,wishlist,stores,chat,users,admin}.js
    └── middleware/{authMiddleware,adminMiddleware}.js
```

## API Endpoints

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | /api/auth/register | – | name, email, password, skin_type → JWT |
| POST | /api/auth/login | – | returns JWT (7 days) |
| POST | /api/auth/logout | user | clear token |
| GET | /api/auth/me | user | current user |
| GET | /api/products | – | `?skin_type=` `&type=` `&search=` |
| GET | /api/products/:id | – | single product |
| POST/PUT/DELETE | /api/products(/:id) | admin | create / update / soft delete |
| GET | /api/wishlist | user | wishlist with product details |
| POST/DELETE | /api/wishlist/:productId | user | add / remove |
| GET | /api/stores | – | all stores |
| GET | /api/stores/nearby?lat=&lng= | – | Haversine distance sort |
| POST | /api/chat | user | Gemini, app-aware, streamed; alerts admin if user asks for a human |
| GET | /api/chat/history | user | last 20 messages |
| GET/PUT | /api/users/me | user | profile: name, skin_type |
| GET | /api/admin/users | admin | users + order counts |
| PUT | /api/admin/users/:id/deactivate | admin | deactivate (`?activate=true` to restore) |
| GET | /api/admin/analytics | admin | skin types, top products, monthly signups |
| GET | /api/admin/support | admin | support requests (`?status=all`) |
| PUT | /api/admin/support/:id/resolve | admin | resolve (`?reopen=true` to reopen) |
| POST | /api/admin/support/:id/reply | admin | send a reply into the user's chat |
| GET | /api/admin/logins | admin | recent login/sign-up activity (`?limit=`) |
| GET | /api/admin/wishlist | admin | all wishlist saves + most-favorited summary |
| GET/POST/PUT/DELETE | /api/admin/stores(/:id) | admin | manage store merchandise |
| GET | /api/admin/events | admin | Server-Sent Events stream of live activity |
| GET | /health | – | keep-alive ping |

## Demo Accounts

| Account | Email | Password | Role |
|---|---|---|---|
| Admin | admin@skinlove.com | SkinLove2026 | admin |
| Demo | demo@skinlove.com | demo1234 | user |

## Local Development

### Backend

```bash
cd skinlove-backend
npm install
cp .env.example .env      # fill in DATABASE_URL, JWT_SECRET, GEMINI_API_KEY
npm run dev               # http://localhost:3001/health
```

### Frontend

```bash
npm install
npm run dev               # http://localhost:5173
```

### Environment Variables

**Backend (`skinlove-backend/.env`)**

| Key | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `JWT_SECRET` | long random string for signing tokens |
| `GEMINI_API_KEY` | Google Gemini API key for the AI chat |
| `FRONTEND_URL` | allowed CORS origin(s), comma-separated |
| `PORT` | server port (Render sets this automatically) |
| `GEMINI_MODEL` | *(optional)* chat model — default `gemini-flash-lite-latest` |
| `GEMINI_API_URL` | *(optional)* override the Gemini API base URL |

**Frontend (Vercel → Environment Variables)**

| Key | Description |
|---|---|
| `VITE_API_URL` | backend base URL, e.g. `https://skinlove.onrender.com` (build-time) |

## Database Setup

In the Neon SQL Editor, run these in order (once):

1. `database/schema.sql` — creates all tables
2. `database/seed.sql` — seeds demo users, products, and Kampala stores

## Deployment

- **Database** → [neon.tech](https://neon.tech) (free tier)
- **Backend** → [render.com](https://render.com) — root directory `skinlove-backend`, build `npm install`, start `node index.js`
- **Frontend** → [vercel.com](https://vercel.com) — Vite preset, output `dist`, set `VITE_API_URL` at build time

See [DEPLOYMENT.md](DEPLOYMENT.md) for the full step-by-step guide.

## License

Built for East Africa
