# TaskFlow — Full-Stack Kanban Task Management

A modern Trello-like task board built as **separate frontend and backend projects**, with role-based access, drag-and-drop status columns, advanced filtering, notifications, dark mode, and dashboard analytics.

## How to log in as Admin

1. Make sure the backend was seeded (`npm run setup` inside `backend/`).
2. Open http://localhost:3000/auth
3. Sign in with the **seeded admin** account (admins cannot register from the UI):

| Field | Value |
|-------|-------|
| Email | `admin@taskflow.com` |
| Password | `Admin@12345` |

4. After login you are redirected to **`/admin`** (Admin Dashboard).
5. Use the top nav:
   - **Dashboard** → totals + charts
   - **Users** → search / activate / deactivate / view user tasks
   - **Board** → full kanban for all tasks (`/admin/board`)

Normal users who register go to **`/dashboard`** instead.

## Connecting MongoDB Atlas (required)

This project uses **MongoDB Atlas** through Prisma.

1. In Atlas → **Connect** → choose **Drivers** → **Node.js**.
2. Copy the connection string. It looks like:

```text
mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/?retryWrites=true&w=majority
```

3. Replace `USERNAME` / `PASSWORD` with your DB user credentials.
4. Add a database name before `?`, e.g. `/taskflow?`:

```text
mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/taskflow?retryWrites=true&w=majority
```

5. Put it in `backend/.env`:

```env
DATABASE_URL="mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/taskflow?retryWrites=true&w=majority"
```

6. In Atlas → **Network Access**, allow your IP (or `0.0.0.0/0` for development).

7. Then run:

```bash
cd backend
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

After that, users/tasks/notifications are stored in MongoDB Atlas.

## Live demo credentials

| Role | Email | Password |
|------|-------|----------|
| Admin (seeded) | `admin@taskflow.com` | `Admin@12345` |
| User (seeded) | `demo@taskflow.com` | `Demo@12345` |

Admins are **not** created via registration — only through the seed script / database.

## Technology stack

| Layer | Stack |
|-------|--------|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, @dnd-kit, Socket.IO client, Recharts |
| Backend | Express.js, TypeScript, Prisma ORM, **MongoDB Atlas**, JWT, bcrypt, Socket.IO, Zod |
| Architecture | Separate `frontend/` and `backend/` projects communicating over REST + WebSockets |

## Features

### Core
- **Roles & permissions** — Normal users register/login, create tasks, claim unassigned tasks for themselves, manage own work. Admins view all users/tasks and reassign freely.
- **Task model** — Title, description, status (`todo` / `doing` / `done`), creator, assignee, priority, tags, due date, timestamps.
- **Drag-and-drop board** — Move cards between To Do, Doing, Done; status persists in the database.

### Advanced
- Search (title / description)
- Filters: status, priority, assignee, due date, tags
- Sorting: newest, oldest, priority, due date, recently updated
- Priority: Low / Medium / High
- Due date badges: today, soon, overdue
- Tags: Bug, Feature, Urgent, Documentation, and more
- Notifications: assigned, reassigned, status changed, due soon, overdue
- Real-time notifications via Socket.IO
- Responsive layout (mobile / tablet / desktop)
- Dark / light mode
- Dashboard statistics with progress chart
- Admin user management (activate / deactivate)

## Project structure

```
├── backend/          # Express REST API + Socket.IO
│   ├── prisma/       # Schema & SQLite DB
│   └── src/          # Routes, middleware, services
├── frontend/         # Next.js UI
│   └── src/
└── README.md
```

## Setup instructions

### Prerequisites
- Node.js 20+
- npm

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env → set MongoDB Atlas DATABASE_URL
npm install
npm run setup      # prisma generate + db push + seed admin/demo
npm run dev        # http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev        # http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) and sign in with the demo credentials above.

## Environment variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | API port | `5000` |
| `DATABASE_URL` | Prisma DB URL | `file:./dev.db` |
| `JWT_SECRET` | Secret for signing JWTs | long random string |
| `JWT_EXPIRES_IN` | Token lifetime | `7d` |
| `CLIENT_URL` | Allowed frontend origin(s), comma-separated | `http://localhost:3000` |
| `ADMIN_EMAIL` | Seeded admin email | `admin@taskflow.com` |
| `ADMIN_PASSWORD` | Seeded admin password | `Admin@12345` |
| `ADMIN_NAME` | Seeded admin display name | `System Admin` |

### Frontend (`frontend/.env.local`)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend REST base URL | `http://localhost:5000/api` |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.IO server URL | `http://localhost:5000` |

## API overview

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register normal user |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/me` | Auth | Current user |
| GET | `/api/tasks` | Auth | List/filter tasks |
| GET | `/api/tasks/stats` | Auth | Dashboard stats |
| POST | `/api/tasks` | Auth | Create task |
| PATCH | `/api/tasks/:id` | Auth | Update / assign |
| PATCH | `/api/tasks/:id/status` | Auth | Drag-drop status change |
| DELETE | `/api/tasks/:id` | Auth | Delete (owner/admin) |
| GET | `/api/users` | Admin | All users |
| GET | `/api/users/assignable` | Auth | Active users for assignment UI |
| PATCH | `/api/users/:id/active` | Admin | Activate / deactivate |
| GET | `/api/notifications` | Auth | List notifications |
| PATCH | `/api/notifications/:id/read` | Auth | Mark one read |
| POST | `/api/notifications/read-all` | Auth | Mark all read |

## Deployment

Deploy **frontend** and **backend** separately.

### Backend (Render / Railway / Fly.io)
1. Set root to `backend`
2. Build: `npm install && npx prisma generate && npm run build`
3. Start: `npx prisma db push && npm run db:seed && npm start`
4. For production, switch Prisma `provider` to `postgresql` and set `DATABASE_URL` to your Postgres URL
5. Set `CLIENT_URL` to your deployed frontend URL and a strong `JWT_SECRET`

### Frontend (Vercel)
1. Set root to `frontend`
2. Set env: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL` pointing at the deployed API
3. Deploy

### Production PostgreSQL tip

In `backend/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then set `DATABASE_URL=postgresql://USER:PASS@HOST:5432/DB`.

## Application screenshots

Add screenshots after deploying (board, filters, admin users, dark mode, stats):

1. Capture the Kanban board with three columns
2. Capture the filter bar and a task dialog
3. Capture Stats and Admin Users tabs
4. Place images in `docs/screenshots/` and embed them here:

```markdown
![Board](docs/screenshots/board.png)
![Stats](docs/screenshots/stats.png)
![Dark mode](docs/screenshots/dark.png)
```

## Author

**Savindi Amaya** — [github.com/savindiamaya](https://github.com/savindiamaya)
