# 📋 TaskFlow Assignment - Submission & Deployment Guide

This guide contains all remaining steps to complete and submit the assignment from another device.

---

## ✅ 1. Completed So Far (දැනට කර ඇති දේ)
- **Screenshots Added:** All 6 UI screenshots captured and stored in `Docs/Screenshorts/`.
- **README.md Updated:** Screenshots, project overview, tech stack, and API docs are fully updated in `README.md`.
- **Submission Template Created:** `submission.txt` created and ready for your contact and deployment URLs.

---

## 📌 2. Next Steps on Other Device (අනෙක් Device එකෙන් කළ යුතු දේ)

### Step 1: Push Code to GitHub (වෙනත් Account එකකට හෝ දැනට ඇති එකට)

1. අලුත් GitHub account එකේ empty repository එකක් හදන්න (නම: `TaskFlow`, Public, don't add README/license).
2. Terminal එකෙන් run කරන්න:
   ```bash
   # අලුත් repo URL එක set කරන්න:
   git remote set-url origin <YOUR-GITHUB-REPO-URL>

   # Changes ටික commit කර push කරන්න:
   git add .
   git commit -m "docs: add screenshots, submission template and finalize readme"
   git push -u origin master
   ```

---

### Step 2: Deploy Free Cloud Database (MySQL)

Local database එක cloud එකට deploy කළ යුතුය:
- **Option A - Aiven.io (Recommended free MySQL):**
  1. [Aiven.io](https://aiven.io) හි free account එකක් සාදන්න.
  2. Create a free **MySQL** service.
  3. `Service URI` (Connection string) එක copy කරගන්න (`mysql://avnadmin:PASSWORD@HOST:PORT/defaultdb?ssl-mode=REQUIRED`).
- **Option B - Railway.app:**
  1. [Railway.app](https://railway.app) වෙත ගොස් New Project -> Provision MySQL.
  2. `DATABASE_URL` එක copy කරගන්න.

---

### Step 3: Deploy Backend on Render.com

1. [Render.com](https://render.com) වෙත ගොස් Login වන්න.
2. **New Web Service** -> Connect your GitHub Repository.
3. Configure settings:
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npx prisma db push && npm run db:seed && npm start`
4. **Environment Variables:**
   - `DATABASE_URL`: Cloud MySQL connection string එක
   - `PORT`: `5000`
   - `JWT_SECRET`: `supersecretrandomkey123456789`
   - `JWT_EXPIRES_IN`: `7d`
   - `CLIENT_URL`: `*` (පසුව Vercel URL එක දෙන්න)
   - `ADMIN_EMAIL`: `admin@taskflow.com`
   - `ADMIN_PASSWORD`: `Admin@12345`
   - `ADMIN_NAME`: `System Admin`
5. **Deploy Web Service** ක්ලික් කරන්න. Deploy වූ පසු API URL එක ලැබේ (e.g., `https://taskflow-backend.onrender.com`).

---

### Step 4: Deploy Frontend on Vercel.com

1. [Vercel.com](https://vercel.com) වෙත ගොස් Login වන්න.
2. **Add New Project** -> Import your GitHub repository.
3. **Root Directory:** `frontend` folder එක තෝරන්න.
4. **Environment Variables:**
   - `NEXT_PUBLIC_API_URL`: `https://[your-render-backend-url]/api`
   - `NEXT_PUBLIC_SOCKET_URL`: `https://[your-render-backend-url]`
5. **Deploy** ක්ලික් කරන්න. Deploy වූ පසු Frontend URL එක ලැබේ (e.g., `https://taskflow.vercel.app`).
6. *(Render backend එකේ `CLIENT_URL` එකට Vercel URL එක update කරන්න).*

---

### Step 5: Final Submission

1. [submission.txt](submission.txt) open කර:
   - Your Name, Email, Phone
   - GitHub Repo URL
   - Deployed Frontend URL (Vercel)
   - Deployed Backend URL (Render)
2. Submit this file as requested in the assignment instructions.
