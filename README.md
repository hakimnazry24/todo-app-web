# ToDo

A bold, no-nonsense task list. Sign up, log in, add tasks, and knock them over
from **Pending** into **Finished**.

- **Frontend** — React 18 + Vite + React Router, neobrutalism styling
- **Backend** — NestJS 11 + Prisma 6
- **Database** — PostgreSQL 16
- **Auth** — `@nestjs/passport` + `passport-jwt` + `@nestjs/jwt`, with
  database-backed sessions that expire after 30 minutes

---

## Run it with Docker

```bash
cp .env.example .env
# Put a real secret in JWT_SECRET — compose refuses to start without one:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

docker compose up --build
```

| Service  | URL                     |
| -------- | ----------------------- |
| Frontend | http://localhost:8080   |
| API      | http://localhost:3000/api |
| Postgres | localhost:5432          |

The backend container applies `prisma migrate deploy` before it starts, so the
schema is created on first boot. Data lives in the `postgres_data` volume and
survives `docker compose down`; `docker compose down -v` wipes it.

## Run it locally for development

Start just the database:

```bash
docker compose up -d postgres
```

**Backend**

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate deploy   # or: npx prisma migrate dev
npm run start:dev           # http://localhost:3000/api
```

**Frontend**

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

Vite proxies `/api` to `http://localhost:3000`, so the browser makes
same-origin requests in development too.

---

## How authentication works

1. **Sign up** (`POST /api/auth/signup`) takes a username, password and phone
   number. The password is hashed with bcrypt (12 rounds); usernames are unique.
2. **Log in** (`POST /api/auth/login`) inserts a row into `sessions` with
   `expires_at = now + 30 minutes`, then signs a JWT carrying
   `{ sub: <user id>, sid: <session id> }` with a matching 30-minute `exp`.
3. **Every authenticated request** sends `Authorization: Bearer <token>`.
   `JwtStrategy` lets passport-jwt verify the signature and `exp`, then looks
   the `sid` up in Postgres and rejects the request if the session is missing,
   revoked, or past `expires_at`. Validating server-side on each call is what
   makes step 4 immediate.
4. **Logout** (`POST /api/auth/logout`) stamps `revoked_at`, which kills the
   token right away even though it has not expired yet.
5. **In the browser**, the navbar counts the session down. When it hits zero
   the client clears its state and returns to the login screen with
   "Your session expired. Please log in again." Any `401` from the API does the
   same thing.

Change the window with `SESSION_TTL_MINUTES` — it drives the session row, the
JWT `exp` and the on-screen countdown together.

---

## API

| Method   | Path                       | Auth | Body                                  |
| -------- | -------------------------- | ---- | ------------------------------------- |
| `POST`   | `/api/auth/signup`         | –    | `{ username, password, phoneNumber }` |
| `POST`   | `/api/auth/login`          | –    | `{ username, password }`              |
| `POST`   | `/api/auth/logout`         | ✔    | –                                     |
| `GET`    | `/api/auth/me`             | ✔    | –                                     |
| `GET`    | `/api/tasks`               | ✔    | –                                     |
| `POST`   | `/api/tasks`               | ✔    | `{ name, description }`               |
| `PATCH`  | `/api/tasks/:id/complete`  | ✔    | –                                     |
| `GET`    | `/api/health`              | –    | –                                     |

Task queries are always scoped by the authenticated user's id, so one account
can never read or complete another account's tasks.

---

## Layout

```
backend/
  prisma/schema.prisma      User, Session, Task
  prisma/migrations/        checked-in SQL, applied with `migrate deploy`
  src/auth/                 strategy, guard, service, controller
  src/tasks/                list / create / complete
  src/users/
  src/prisma/               global PrismaService
frontend/
  src/api/                  fetch wrapper + endpoint helpers
  src/context/              AuthContext (token, expiry timer, auto-logout)
  src/components/           Button, Field, Modal, Navbar, TaskCard
  src/pages/                Login, Signup, Tasks
  src/styles/global.css     neobrutalism design tokens
```

## Design

White canvas, black structure, red (`#E63946`) and yellow (`#FFD500`) as
accents only. 3px borders, hard offset shadows, square corners, heavy uppercase
display type, and buttons that press down into their own shadow.
