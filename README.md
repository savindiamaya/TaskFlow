# TaskFlow — Full-Stack Kanban Task Management

A modern Trello-like task board built as **separate frontend and backend projects**, with role-based access, drag-and-drop status columns, advanced filtering, notifications, dark mode, and dashboard analytics.

## Live demo

| Item | URL |
|------|-----|
| Frontend | https://frontend-lake-phi-25.vercel.app |
| Backend API | https://backend-theta-liard-23.vercel.app |
| Health check | https://backend-theta-liard-23.vercel.app/api/health |

### Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Admin (seeded) | `admin@taskflow.com` | `Admin@12345` |
| User (seeded) | `demo@taskflow.com` | `Demo@12345` |

Admins are **not** created via registration — only through the seed script / database.

## How to log in as Admin (local)

1. Make sure the backend was seeded (`npm run setup` inside `backend/`).
2. Open http://localhost:3000/auth
3. Sign in with the **seeded admin** account:

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

## Project overview

TaskFlow is a full-stack internship assignment app:

- **Users** manage personal Kanban boards (create, claim, filter, and drag tasks).
- **Admins** oversee all users and tasks, activate/deactivate accounts, and reassign work.
- **Realtime** Socket.IO notifications cover assignment, status changes, and due-date reminders.
- **Security** uses JWT auth, bcrypt password hashing, Zod validation, and role-based route guards.

## Technology stack

| Layer | Stack |
|-------|--------|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, @dnd-kit, Socket.IO client, Recharts |
| Backend | Express.js, TypeScript, Prisma ORM, **PostgreSQL (Neon)**, JWT, bcrypt, Socket.IO, Zod |
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
├── backend/                 # Express REST API + Socket.IO
│   ├── prisma/              # Prisma schema (PostgreSQL)
│   ├── src/                 # Routes, middleware, services
│   └── .env.example
├── frontend/                # Next.js UI
│   └── src/
├── Docs/Screenshorts/       # Application screenshots
├── render.yaml              # Optional Render Blueprint
├── submission.txt           # Final assignment submission details
└── README.md
```

## Setup instructions

### Prerequisites
- Node.js 20+
- npm
- A PostgreSQL database (Neon free tier works for local + production)

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env → set PostgreSQL DATABASE_URL (Neon connection string)
npm install
npm run setup      # prisma generate + db push + seed admin/demo
npm run dev        # http://localhost:5000
```

### Connecting PostgreSQL (Neon)

1. Create a free Neon project at https://console.neon.tech (or use an existing Postgres URL).
2. Set your connection string in `backend/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/neondb?sslmode=require"
```

3. Then run `npm run setup` (or `npx prisma generate && npx prisma db push && npm run db:seed`).

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
| `DATABASE_URL` | Prisma PostgreSQL URL | `postgresql://USER:PASS@HOST/neondb?sslmode=require` |
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

See also `backend/.env.example` and `frontend/.env.example`.

## API overview

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/health` | Public | Health check |
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

Both apps are live on **Vercel** with a **Neon Postgres** database.

| App | Vercel project | URL |
|-----|----------------|-----|
| Frontend | `frontend` | https://frontend-lake-phi-25.vercel.app |
| Backend | `backend` | https://backend-theta-liard-23.vercel.app |

### Redeploy (CLI)

```bash
# Backend
cd backend
vercel --prod

# Frontend (set API URLs)
cd frontend
vercel --prod -e NEXT_PUBLIC_API_URL=https://backend-theta-liard-23.vercel.app/api \
  -e NEXT_PUBLIC_SOCKET_URL=https://backend-theta-liard-23.vercel.app \
  -b NEXT_PUBLIC_API_URL=https://backend-theta-liard-23.vercel.app/api \
  -b NEXT_PUBLIC_SOCKET_URL=https://backend-theta-liard-23.vercel.app
```

### Environment variables (production)

**Backend:** `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL` (frontend origin), `ADMIN_*`  
**Frontend:** `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`

> Note: Vercel serverless does not keep long-lived Socket.IO connections; notifications still work over REST. Due-date reminders run via a daily Vercel Cron job.

### Local database

Use a Neon / Postgres `DATABASE_URL` in `backend/.env` (see `.env.example`), then:

```bash
cd backend
npm run setup
npm run dev
```

### Production checklist

- [x] Backend `/api/health` returns `{ "status": "ok" }`
- [x] Frontend deployed and points at the live API
- [x] Admin login works with seeded credentials
- [ ] Claim the Neon DB before it expires (see `submission.txt`) so it stays permanent


## Application screenshots

### 1. Kanban Task Board
Full drag-and-drop Kanban board with real-time updates, status columns, priority badges, tags, search, and multi-criteria filters.
![Kanban Board](Docs/Screenshorts/user%20dashboard.png)

### 2. Analytics & Productivity Statistics
Task status breakdown, priority distribution charts, and personal progress metrics.
![User Stats](Docs/Screenshorts/user%20stats%20page.png)

### 3. Admin Dashboard
System-wide metrics and visual charts tracking task completion and high-priority workloads across all users.
![Admin Dashboard](Docs/Screenshorts/admin%20dashboard.png)

### 4. Admin User Management
User administration interface allowing admins to monitor activities, view user-specific task boards, and activate/deactivate accounts.
![User Management](Docs/Screenshorts/user%20management.png)

### 5. Authentication
Secure sign-in and role-based redirecting for administrators and standard users.
![Login Page](Docs/Screenshorts/login%20page.png)

### 6. User Profile & Security Settings
User settings for updating display name, avatar, and password credentials.
![User Profile](Docs/Screenshorts/user%20profile%20.png)

## Final submission

See [`submission.txt`](submission.txt) for the assignment hand-in file (GitHub link, live URLs, admin credentials, and contact info).

## Author

**Savindi Amaya**  
GitHub: [github.com/savindiamaya](https://github.com/savindiamaya)  
Email: a.savindiamaya@gmail.com
