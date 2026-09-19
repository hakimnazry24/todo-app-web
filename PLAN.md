# ToDo — Implementation Plan

## 1. Repository layout

```
to-do-app/
├── docker-compose.yml          # postgres + backend + frontend
├── .env.example                # shared env template
├── README.md
├── backend/                    # NestJS + Prisma + PostgreSQL
│   ├── Dockerfile
│   ├── prisma/
│   │   ├── schema.prisma       # User, Session, Task models
│   │   └── migrations/         # checked-in SQL, applied with `migrate deploy`
│   └── src/
│       ├── main.ts             # global /api prefix, CORS, ValidationPipe
│       ├── app.module.ts
│       ├── prisma/             # PrismaService (global module)
│       ├── auth/               # signup / login / logout / me, JWT + session guard
│       ├── users/
│       └── tasks/              # list / create / complete
└── frontend/                   # React (Vite + TS) + React Router
    ├── Dockerfile              # build -> nginx, proxies /api to backend
    ├── nginx.conf
    └── src/
        ├── api/                # fetch wrapper, auto-logout on 401
        ├── context/AuthContext.tsx
        ├── components/         # Button, Input, Card, TaskCard, Navbar
        ├── pages/              # Login, Signup, Tasks
        └── styles/             # neobrutalism design tokens
```

## 2. Data model (PostgreSQL / Prisma)

| Table (Prisma model) | Columns |
|---|---|
| `users` (`User`) | `id` uuid PK, `username` unique, `password_hash`, `phone_number`, `created_at` |
| `sessions` (`Session`) | `id` uuid PK (= the session id inside the JWT), `user_id` FK, `expires_at`, `revoked_at` nullable, `created_at` |
| `tasks` (`Task`) | `id` uuid PK, `user_id` FK, `name`, `description`, `status` enum (`PENDING` \| `COMPLETED`), `completed_at` nullable, `created_at` |

The initial migration SQL is generated offline with `prisma migrate diff` and committed, so the container can run `prisma migrate deploy` at start-up without a shadow database.

## 3. Authentication & authorization

Built on the official NestJS auth modules — `@nestjs/passport`, `passport-jwt`,
`@nestjs/jwt` and `bcryptjs` — which handle signing, verification and hashing.

- **Sign up** — `POST /api/auth/signup { username, password, phoneNumber }`. Username uniqueness enforced; password hashed with bcrypt (`bcryptjs`, no native build needed in Docker).
- **Login** — `POST /api/auth/login { username, password }`. On success a `sessions` row is created with `expires_at = now + 30 min`, and a JWT carrying `{ sub: userId, sid: sessionId }` is signed with `expiresIn: 30m`.
- **Every request** — `JwtAuthGuard` + Passport JWT strategy verifies the signature *and* loads the `sid` session row from the database via Prisma: rejects if missing, revoked, or past `expires_at`. So the session id is genuinely validated server-side on each call, and the 30-minute window is enforced in two independent places.
- **Logout** — `POST /api/auth/logout` sets `revoked_at = now`, which immediately invalidates the token even before its 30 minutes are up.
- **Frontend** — token + expiry kept in `localStorage`; a timer logs the user out when the 30 minutes elapse, and any `401` from the API clears auth and bounces to `/login`.

## 4. API surface

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/signup` | – | Create account |
| POST | `/api/auth/login` | – | Get JWT + session |
| POST | `/api/auth/logout` | ✔ | Revoke session |
| GET | `/api/auth/me` | ✔ | Current user (session probe on app load) |
| GET | `/api/tasks` | ✔ | All tasks of the logged-in user |
| POST | `/api/tasks` | ✔ | Create task `{ name, description }` |
| PATCH | `/api/tasks/:id/complete` | ✔ | Move task to completed |

## 5. Frontend screens

1. **/login** — username + password, link to sign up.
2. **/signup** — username, password, phone number.
3. **/tasks** (protected) — navbar with `ToDo` wordmark + Logout button; `+ ADD TASK` button opens a modal with task name, description and a `CREATE TASK` submit. Below, a two-column board: **PENDING** (left, yellow) with a `COMPLETE` button on each card, and **COMPLETED** (right, red) where completed cards land.

## 6. Neobrutalism design language

White page background; red `#E63946` and yellow `#FFD500` used only as accents on panels, badges and buttons.
Tokens: `3px solid #000` borders, hard offset shadows `6px 6px 0 #000`, zero border-radius, heavy uppercase headings (Archivo Black / system fallback), and a press effect that translates the element into its own shadow on `:active`.

## 7. Deployment

- `backend/Dockerfile` — multi-stage `node:22-alpine`: install deps → `prisma generate` → `nest build` → slim runtime image that runs `prisma migrate deploy` before booting the API.
- `frontend/Dockerfile` — multi-stage: `vite build` → `nginx:alpine` serving the SPA, with `/api` reverse-proxied to the backend container.
- `docker-compose.yml` — `postgres:16-alpine` (named volume + healthcheck), backend waiting on a healthy database, frontend on port `8080`.

## 8. Build order

1. Scaffold repo, `.env.example`, `.gitignore`, `README.md`.
2. Backend: Prisma schema + migration → `PrismaService` → auth module → tasks module → wire into `AppModule`; `npm install` and build.
3. Frontend: design tokens + primitives → auth context/API client → pages → router; `npm install` and build.
4. Dockerfiles + `docker-compose.yml`.
5. Verify both builds compile.
