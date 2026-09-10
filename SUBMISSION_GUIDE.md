# TaskFlow — Finish live deployment (පහත steps 3කින් deploy කරන්න)

Documentation, screenshots, seed credentials, and `submission.txt` template are ready.
**Only live URLs are left** — cloud accounts must be created in the browser (no tokens on this machine).

---

## A) Free MySQL — Aiven (5 minutes)

1. Open https://aiven.io → Sign up (GitHub OK).
2. Create service → **MySQL** → **Free** plan.
3. Copy **Service URI** (looks like `mysql://avnadmin:...@...aivencloud.com:..../defaultdb?ssl-mode=REQUIRED`).

---

## B) Backend — Render (5 minutes)

1. Open https://render.com → Sign up with GitHub.
2. **New** → **Blueprint** → select `savindiamaya/TaskFlow` (uses root `render.yaml`).
   - Or **New Web Service** → same repo → Root Directory = `backend`.
3. Build: `npm install && npx prisma generate && npm run build`  
   Start: `npx prisma db push && npm run db:seed && npm start`
4. Set env:
   - `DATABASE_URL` = Aiven URI from A
   - `CLIENT_URL` = `*` temporarily (later set to Vercel URL)
   - `JWT_SECRET` = any long random string
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` = defaults in README
5. Deploy → copy URL e.g. `https://taskflow-api.onrender.com`
6. Test: open `https://YOUR-API/api/health`

---

## C) Frontend — Vercel (5 minutes)

1. Open https://vercel.com → Sign up with GitHub.
2. **Add New Project** → `savindiamaya/TaskFlow` → Root Directory = `frontend`.
3. Env:
   - `NEXT_PUBLIC_API_URL` = `https://YOUR-API/api`
   - `NEXT_PUBLIC_SOCKET_URL` = `https://YOUR-API`
4. Deploy → copy URL e.g. `https://taskflow.vercel.app`
5. On Render, set `CLIENT_URL` = that Vercel URL → Redeploy API.

---

## D) Fill `submission.txt`

Replace the PENDING lines with:

- Frontend (Vercel): `https://...`
- Backend API (Render): `https://...`
- Phone / LinkedIn (your real contact)

Email is already filled: `a.savindiamaya@gmail.com`

---

## Admin login (for reviewers)

- Email: `admin@taskflow.com`
- Password: `Admin@12345`
