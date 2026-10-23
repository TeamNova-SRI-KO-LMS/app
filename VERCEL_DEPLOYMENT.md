# Vercel Deployment Guide

**SRI-KO LMS · TeamNova**

This guide explains how to deploy SRI-KO LMS to [Vercel](https://vercel.com) as two projects from this repository: the Express REST API and the React web application. It covers first-time setup, configuring the external services the platform depends on, verification, day-to-day operations and troubleshooting.

| | |
| --- | --- |
| **Repository** | [`TeamNova-SRI-KO-LMS/app`](https://github.com/TeamNova-SRI-KO-LMS/app), a monorepo with `backend/` and `frontend/` |
| **Hosting model** | Backend: the Express app runs as a single Vercel Function (Fluid compute). Frontend: a static Vite build served from Vercel's CDN. |
| **Runtime** | Node.js 24.x (both `package.json` files declare `"engines": { "node": ">=22.12.0" }`) |
| **Last verified** | 20 October 2026. `vercel build` succeeds for both projects with Vercel CLI 64.7.0. Platform limits are quoted from the Vercel documentation of October 2026. |
| **Audience** | Team members who deploy or operate the platform. For local development, see the [main README](README.md). |

---

## Contents

1. [Architecture on Vercel](#1-architecture-on-vercel)
2. [Prerequisites](#2-prerequisites)
3. [Deployment configuration in this repository](#3-deployment-configuration-in-this-repository)
4. [Step 1: Prepare MongoDB Atlas](#4-step-1-prepare-mongodb-atlas)
5. [Step 2: Deploy the backend API](#5-step-2-deploy-the-backend-api)
6. [Step 3: Deploy the frontend](#6-step-3-deploy-the-frontend)
7. [Step 4: Connect the two projects](#7-step-4-connect-the-two-projects)
8. [Step 5: Configure external services](#8-step-5-configure-external-services)
9. [Step 6: Create the first administrator](#9-step-6-create-the-first-administrator)
10. [Step 7: Verify the deployment](#10-step-7-verify-the-deployment)
11. [Environment variable reference](#11-environment-variable-reference)
12. [Environments, previews and continuous deployment](#12-environments-previews-and-continuous-deployment)
13. [Deploying with the Vercel CLI](#13-deploying-with-the-vercel-cli)
14. [Platform limits and behaviour](#14-platform-limits-and-behaviour)
15. [Security checklist](#15-security-checklist)
16. [Operations](#16-operations)
17. [Troubleshooting](#17-troubleshooting)
18. [References](#18-references)

---

## 1. Architecture on Vercel

The repository is deployed as **two Vercel projects**. Each project points at its own folder through the **Root Directory** setting.

| Vercel project | Root directory | Framework preset | What runs | Example production domain |
| --- | --- | --- | --- | --- |
| **Backend API** | `backend` | Express | `backend/app.js`, exported as one Vercel Function | `https://sri-ko-backend.vercel.app` |
| **Frontend** | `frontend` | Vite | The static build from `npm run build` (`dist/`), with SPA rewrites | `https://sri-ko.vercel.app` |

> The domains are examples. A project's production domain is derived from its project name, and you can add custom domains later (see [§16](#16-operations)).

```mermaid
flowchart LR
    U["Browser"] -->|"HTML, JS, CSS"| FE["Vercel project: frontend<br/>static Vite build + SPA rewrites"]
    U -->|"HTTPS /api/* with JWT bearer token"| BE["Vercel project: backend<br/>Express app as a Vercel Function"]
    BE --> DB[("MongoDB Atlas")]
    BE --> GD["Google Drive<br/>lecture materials, assignments"]
    BE --> SMTP["SMTP server<br/>password-reset codes"]
    BE --> ST["Stripe API<br/>payment verification"]
    BE --> GV["Google<br/>ID-token verification"]
    U --> SB["Supabase Storage<br/>course, event and announcement images"]
    U --> SJ["Stripe.js<br/>card checkout"]
    U --> GI["Google Identity Services<br/>Sign in with Google"]
```

### What differs from local development

| Concern | Local (`npm run dev` / `npm start`) | On Vercel |
| --- | --- | --- |
| Entry point | `backend/server.js`: HTTP listener on `PORT` (default `5000`) | `backend/app.js`: the exported Express app, with no listener |
| Real-time notifications | Socket.IO pushes notifications instantly | Socket.IO is off (`VITE_ENABLE_SOCKET=false`). Notifications refresh every 60 seconds and when the tab regains focus |
| Database connection | Connects at start-up and retries with back-off until it succeeds | Connects on the first request and is cached across warm invocations. Data routes return `503` until it succeeds |
| MongoDB DNS lookups | Public resolvers (8.8.8.8 / 1.1.1.1), a workaround for unreliable local networks | Vercel's own resolver. The workaround is disabled when `VERCEL` is set |
| File system | Writable, with a local `uploads/` fallback | Read-only. Files must go to Google Drive, Supabase Storage or MongoDB |
| Maximum request body | 50 MB (Express limit) | **4.5 MB** (Vercel limit) |
| Configuration | `backend/.env`, `frontend/.env` | Environment variables in each Vercel project |

---

## 2. Prerequisites

| Requirement | Used for | Notes |
| --- | --- | --- |
| **Vercel account or team** | Hosting | The Hobby plan is for personal, non-commercial use. Host the client's production deployment on a **Pro** team. |
| **GitHub access** | Git integration | The Vercel GitHub App must be installed on the `TeamNova-SRI-KO-LMS` organisation with access to `app`. An organisation owner approves the installation. |
| **MongoDB Atlas cluster** | Database | Holds the platform's database (the templates use `SriKo`). |
| **Google Cloud project** | Sign in with Google, course materials | An OAuth 2.0 *Web application* client. The **Google Drive API** must be enabled for lecture-material and assignment uploads. |
| **Supabase project** | Image uploads | A public Storage bucket (default `courses`) for course thumbnails, event photos and announcement images. |
| **SMTP mailbox** | Password reset | For example Google Workspace or Gmail with an app password. |
| **Stripe account** *(optional)* | Card payments | Use test-mode keys unless live payments have been approved. |
| **Node.js ≥ 22.12 and Vercel CLI ≥ 47.0.5** *(optional)* | Local builds, CLI deployments | The CLI is only needed for [§13](#13-deploying-with-the-vercel-cli). |

---

## 3. Deployment configuration in this repository

Everything Vercel needs is already committed. No code changes are required to deploy.

| File | Purpose |
| --- | --- |
| [`backend/app.js`](backend/app.js) | Builds and exports the Express app: CORS allowlist, JSON body limits, `GET /` and `GET /api/health`, a database guard on every data route, a JSON 404 for unknown `/api/*` paths and a JSON error handler. Vercel detects `app.js` as the Express entry point. |
| [`backend/server.js`](backend/server.js) | Local and long-running entry point only. It runs the HTTP server, Socket.IO and the connection retry, and only listens when executed directly (`require.main === module`). |
| [`backend/vercel.json`](backend/vercel.json) | `{ "framework": "express" }` selects the Express preset. |
| [`backend/.vercelignore`](backend/.vercelignore) | Keeps `.env*`, `node_modules`, `uploads` and logs out of CLI uploads. |
| [`backend/config/db.js`](backend/config/db.js) | Cached Mongoose connection (15-second server selection timeout, pool of 10), the `requireDatabase` guard (HTTP 503) and the status reported by `/api/health`. |
| [`backend/config/cors.js`](backend/config/cors.js) | Builds the allowed-origin list from `FRONTEND_URL` and `CORS_ORIGIN` (comma-separated, `*` wildcard). Shared by Express and Socket.IO. |
| [`backend/config/dns.js`](backend/config/dns.js) | Public-DNS workaround for Atlas lookups. Active only when `VERCEL` is not set. |
| [`frontend/vercel.json`](frontend/vercel.json) | Vite preset, a rewrite of every path to `index.html` for client-side routing, and one-year immutable caching for `/assets/*`. |
| [`frontend/.vercelignore`](frontend/.vercelignore) | Keeps local `.env*` files out of CLI uploads (Vite would bake their values into the bundle), along with `dist` and `node_modules`. |
| [`frontend/src/config/apiConfig.js`](frontend/src/config/apiConfig.js) | Resolves the API URL from `VITE_API_URL`, which must include `/api`. The base URL without `/api` is used for media links. |
| `backend/package.json`, `frontend/package.json` | `"engines": { "node": ">=22.12.0" }`, so Vercel builds with Node.js 24.x. |

---

## 4. Step 1: Prepare MongoDB Atlas

1. **Create a database user.** In **Atlas → Database Access → Add New Database User**, choose password authentication and grant the least privilege that works, ideally `readWrite` on the application database only. Use a long random password. If it contains reserved URL characters, percent-encode them in the connection string (for example `@` becomes `%40`).
2. **Allow Vercel to connect.** In **Atlas → Network Access → Add IP Address**, add `0.0.0.0/0` (*Allow access from anywhere*). Vercel Functions use dynamic outbound IP addresses by default. Fixed egress addresses require a paid Vercel option (Static IPs or Secure Compute); if your team has one, allow only those addresses.
3. **Copy the connection string.** In **Atlas → Connect → Drivers**, copy the `mongodb+srv://` URI and add the database name to its path:

   ```text
   mongodb+srv://<user>:<password>@<cluster-host>/SriKo?retryWrites=true&w=majority&appName=<app-name>
   ```

   > Without a database name the driver uses a database called `test`, and the deployment starts against an empty database. Use the same database name as your existing environment when data already exists.

4. **Note the cluster's region**, for example AWS Mumbai (`ap-south-1`). You will place the API function close to it in Step 2.
5. **Plan backups.** Free (M0) clusters do not include Atlas Cloud Backup. Before go-live, export the data regularly with `mongodump` or move to a tier with backups.

---

## 5. Step 2: Deploy the backend API

1. In the Vercel dashboard choose **Add New… → Project** and import **`TeamNova-SRI-KO-LMS/app`**.
2. **Project Name:** for example `sri-ko-backend`. This determines the production domain, `sri-ko-backend.vercel.app`.
3. **Root Directory:** click **Edit** and select **`backend`**.
4. **Framework Preset:** **Express** is read from `backend/vercel.json`. Leave the Build, Output and Install commands at their defaults, because the backend has no build step.
5. **Environment Variables:** add the backend variables from [§11.1](#111-backend-project). The minimum for a working deployment is `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL` and `GOOGLE_CLIENT_ID`. Use a temporary `FRONTEND_URL` such as `http://localhost:5173` and set the final value in Step 4. Add the Google Drive, SMTP and Stripe groups for the features you use.
6. Click **Deploy**.
7. **Place the function near the database.** Under **Settings → Functions → Function Region**, choose the region closest to the Atlas cluster, for example `bom1` (Mumbai) or `sin1` (Singapore). Save, then redeploy (**Deployments → ⋯ → Redeploy**).
8. **Verify the API.**

   ```bash
   curl https://sri-ko-backend.vercel.app/api/health
   ```

   A healthy deployment answers HTTP 200:

   ```json
   { "success": true, "status": "ok", "database": "connected", "environment": "vercel", "timestamp": "2026-10-20T08:00:00.000Z" }
   ```

   HTTP 503 with `"status": "degraded"` means the function runs but cannot reach MongoDB (see [§17](#17-troubleshooting)). `GET /` returns `{ "success": true, "name": "SRI-KO LMS API", "status": "running", "docs": "/api/health" }`.

---

## 6. Step 3: Deploy the frontend

1. Choose **Add New… → Project** again and import the **same repository**.
2. **Project Name:** for example `sri-ko`, giving the domain `sri-ko.vercel.app`.
3. **Root Directory:** **`frontend`**.
4. **Framework Preset:** **Vite**, with Build Command `npm run build` and Output Directory `dist`. These are the defaults.
5. **Environment Variables** (full list in [§11.2](#112-frontend-project)):

   | Variable | Value |
   | --- | --- |
   | `VITE_API_URL` | `https://sri-ko-backend.vercel.app/api`: the backend's **production domain** followed by `/api` |
   | `VITE_ENABLE_SOCKET` | `false` |
   | `VITE_GOOGLE_CLIENT_ID` | The OAuth client ID (the same value as the backend's `GOOGLE_CLIENT_ID`) |
   | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | The Supabase project URL and its anon (public) key |
   | `VITE_SUPABASE_BUCKET` | `courses` (optional; this is the default) |
   | `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_…` (optional, for card payments) |

6. Click **Deploy**, open the site, then refresh a deep link such as `/courses`. It must load the page, not a 404.

> **Important.** `VITE_*` values are compiled into the JavaScript bundle at **build time**. They are public, so never put a secret in a `VITE_*` variable, and redeploy after changing one.
>
> Point `VITE_API_URL` at the backend's **production domain**, never at a generated deployment URL such as `sri-ko-backend-<hash>-<team>.vercel.app`. Generated URLs change with every deployment, and under Vercel's default *Standard Protection* they require a Vercel login.

---

## 7. Step 4: Connect the two projects

The API only accepts browser requests from the origins listed in `FRONTEND_URL` (and `CORS_ORIGIN`). If neither is set, only `http://localhost:5173` is allowed.

1. Open the **backend** project → **Settings → Environment Variables** and set `FRONTEND_URL`:

   | Environment scope | Recommended value |
   | --- | --- |
   | **Production** | The exact production origin(s), for example `https://sri-ko.vercel.app` or `https://sri-ko.vercel.app,https://<custom-domain>` |
   | **Preview** *(optional)* | A wildcard for the frontend's preview URLs, for example `https://sri-ko-*-<team-slug>.vercel.app` |

   Format rules:
   - Give the scheme, host and optional port only, with no path and no trailing slash.
   - Separate entries with commas.
   - `*` matches letters, digits and hyphens only.

2. **Redeploy the backend.** Environment-variable changes only apply to new deployments.
3. Sign in on the production site. In the browser's developer tools (**Network** and **Console**), API calls should succeed with no CORS errors.

---

## 8. Step 5: Configure external services

### 8.1 Sign in with Google

1. In **Google Cloud Console → APIs & Services → Credentials**, open the OAuth 2.0 client of type *Web application*.
2. Under **Authorized JavaScript origins**, add every frontend origin users sign in from, such as `https://sri-ko.vercel.app` and any custom domain. Google does not accept wildcards, so Sign in with Google only works on origins listed explicitly. Preview URLs are normally not listed.
3. Use the same client ID for the backend's `GOOGLE_CLIENT_ID`, which verifies ID tokens, and the frontend's `VITE_GOOGLE_CLIENT_ID`.

### 8.2 Google Drive (lecture materials and assignment submissions)

The backend stores lecture materials and assignment files in Google Drive. If Drive is not configured or rejects an upload, the code falls back to writing to `uploads/` on local disk. That is impossible on Vercel and fails with `EROFS`. **Configure Drive before using these features in a deployment.**

Choose one authentication method:

| Method | Variables | Notes |
| --- | --- | --- |
| **A. OAuth refresh token** *(recommended)* | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` | Files are owned by the Google account that authorised the token and use its storage quota. Takes precedence when all three are set. |
| **B. Service account** | `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY` | Share every target folder with the service account as **Editor**. Service accounts have no Drive storage of their own, so keep the folders in a **Shared Drive** or uploads can fail with a storage-quota error. `GOOGLE_PRIVATE_KEY` can be pasted with real line breaks or with `\n` escapes. |

For **method A**:
- Generate the refresh token with the same OAuth client (for example in the [OAuth 2.0 Playground](https://developers.google.com/oauthplayground) with *Use your own OAuth credentials* selected) and the `https://www.googleapis.com/auth/drive` scope.
- If the OAuth consent screen's publishing status is **Testing**, Google expires refresh tokens after **7 days**. Publish the app, or use an internal Google Workspace app, so uploads do not stop working a week after deployment.

**Folders.** Copy each folder's ID from its URL (`https://drive.google.com/drive/folders/<FOLDER_ID>`) into:
- `GDRIVE_FOLDER_THUMBNAILS`
- `GDRIVE_FOLDER_VIDEOS`
- `GDRIVE_FOLDER_PDFS`
- `GDRIVE_FOLDER_IMAGES`
- `GDRIVE_FOLDER_ASSIGNMENTS`

A missing folder ID sends that file type to the Drive root.

**Visibility.** Uploaded files are shared as *anyone with the link can view*, so that they can be embedded in the course player. Do not upload confidential documents as course materials.

**Size.** Every request to the API is capped at **4.5 MB** on Vercel. Add lecture videos on the **YouTube / Link** tab of the course resource dialog rather than uploading video files through the API. YouTube watch URLs are converted to embeds automatically.

### 8.3 Supabase Storage (images)

The admin portal uploads course thumbnails (`thumbnails/`), event photos (`events/`) and announcement images (`announcements/`) straight from the browser to Supabase, so these files never pass through the API.

1. Create a **public** bucket named `courses`, or set `VITE_SUPABASE_BUCKET` to your bucket's name.
2. The app uploads with the public anon key and does not sign in to Supabase, so the bucket needs Storage policies for the `anon` role. Because uploads use `upsert: true`, it needs `INSERT`, `SELECT` and `UPDATE`. For example, in the Supabase SQL editor:

   ```sql
   create policy "SRI-KO image uploads (insert)" on storage.objects
     for insert to anon with check (bucket_id = 'courses');
   create policy "SRI-KO image uploads (select)" on storage.objects
     for select to anon using (bucket_id = 'courses');
   create policy "SRI-KO image uploads (update)" on storage.objects
     for update to anon using (bucket_id = 'courses');
   ```

3. Limit abuse of the public key. In the bucket settings, restrict **Allowed MIME types** to `image/*` and set a **file size limit** (for example 5 MB).

If `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is missing, the site still works and only image uploads are disabled.

### 8.4 Stripe (optional card payments)

- Set `STRIPE_SECRET_KEY` (`sk_test_…`) on the backend and `VITE_STRIPE_PUBLISHABLE_KEY` (`pk_test_…`) on the frontend, both from the same Stripe account and mode.
- No webhook is required. The API retrieves each PaymentIntent from Stripe and verifies its status, course and owning account before enrolling the student.
- Switch to live keys only with the client's approval. SRS constraint C-05 states that no card is charged in the current scope.
- Without `STRIPE_SECRET_KEY`, only the payment endpoints are affected. They answer *"Card payments are not configured on the server"*.

### 8.5 SMTP (password-reset email)

| Variable | Typical value (Gmail or Google Workspace) |
| --- | --- |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` / `SMTP_SECURE` | `465` / `true` (implicit TLS), or `587` / `false` (STARTTLS) |
| `SMTP_USER` / `SMTP_PASS` | The mailbox address and an **app password** (requires 2-Step Verification) |
| `SMTP_FROM` | For example `SRI-KO LMS <no-reply@your-domain>`. Defaults to `SMTP_USER` |

Without these variables, only the forgot-password flow fails, with *"Email service is not configured"*.

---

## 9. Step 6: Create the first administrator

Public registration only creates **student** or **instructor** accounts (an access-control fix tracked in issue #166). On a new database:

1. Register an account on the deployed site.
2. Promote it in MongoDB, either in **Atlas → Browse Collections → `users`** (edit `role` to `"admin"`) or with `mongosh`:

   ```js
   db.users.updateOne({ email: "admin@your-domain" }, { $set: { role: "admin" } })
   ```

3. Sign in at **`/admin/login`**. Create further administrators from **Admin → User Management**.

---

## 10. Step 7: Verify the deployment

| # | Area | Check | Expected result |
| --- | --- | --- | --- |
| 1 | API | `GET /api/health` | `200`, `"status":"ok"`, `"database":"connected"` |
| 2 | API | `GET /api/does-not-exist` | `404` with a JSON body |
| 3 | Frontend | Open the site and refresh `/courses` and `/admin/login` | The pages load; no Vercel 404 |
| 4 | CORS | Browser console while using the site | No CORS errors |
| 5 | Accounts | Register, sign in, sign out; Sign in with Google | All succeed |
| 6 | Security | `POST /api/auth/register` with `"role":"admin"` | `400`; no administrator is created |
| 7 | Security | `GET /api/join-us` without a token | `401` |
| 8 | Admin portal | Sign in at `/admin/login`; open Dashboard, Course Management and Attendance | Live data loads; course prices are shown in LKR |
| 9 | Attendance | A student marks today on **Profile**; refresh **Admin → Attendance** | The record appears on the correct day |
| 10 | Support assistant | Ask "What courses do you offer?" | The reply lists real courses and prices |
| 11 | Notifications | Publish an announcement or notification as an admin | Students see it within about 60 seconds |
| 12 | Password reset | Request a reset code | The email arrives within a minute |
| 13 | Uploads | Upload a course thumbnail, a lecture PDF under 4.5 MB and an assignment submission | All succeed |
| 14 | Payments *(if enabled)* | Pay with Stripe test card `4242 4242 4242 4242` | The student is enrolled |

---

## 11. Environment variable reference

Add variables under **Project → Settings → Environment Variables** and choose the environments (Production, Preview, Development) each one applies to. Mark secrets as **Sensitive**. Changes take effect on the **next deployment**.

### 11.1 Backend project

| Variable | Required | Example | Purpose and notes |
| --- | --- | --- | --- |
| `MONGODB_URI` | **Yes** | `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/SriKo?retryWrites=true&w=majority` | Database connection. Include the database name. |
| `JWT_SECRET` | **Yes** | Output of `openssl rand -hex 32` | Signs login tokens. There is no default, so sign-in fails without it. Changing it signs every user out. |
| `JWT_EXPIRE` | No | `7d` | Token lifetime. Default `7d`. |
| `FRONTEND_URL` | **Yes** | `https://sri-ko.vercel.app` | Allowed browser origins: comma-separated, with a `*` wildcard. Default `http://localhost:5173` only. |
| `CORS_ORIGIN` | No | `https://<custom-domain>` | Extra origins, merged with `FRONTEND_URL`. |
| `GOOGLE_CLIENT_ID` | For Google sign-in and Drive method A | `1234-abc.apps.googleusercontent.com` | Verifies Google ID tokens. Also the OAuth client for Drive. |
| `GOOGLE_CLIENT_SECRET` | Drive method A | (secret) | OAuth client secret. |
| `GOOGLE_REFRESH_TOKEN` | Drive method A | (secret) | Long-lived token with the Drive scope (see [§8.2](#82-google-drive-lecture-materials-and-assignment-submissions)). |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Drive method B | `uploader@project.iam.gserviceaccount.com` | Service-account identity. |
| `GOOGLE_PRIVATE_KEY` | Drive method B | `-----BEGIN PRIVATE KEY-----\n…` | Service-account key; `\n` escapes are accepted. |
| `GDRIVE_FOLDER_THUMBNAILS`, `GDRIVE_FOLDER_VIDEOS`, `GDRIVE_FOLDER_PDFS`, `GDRIVE_FOLDER_IMAGES`, `GDRIVE_FOLDER_ASSIGNMENTS` | Recommended with Drive | Drive folder IDs | Target folder per file type. A missing ID uploads to the Drive root. |
| `STRIPE_SECRET_KEY` | For card payments | `sk_test_…` | Stripe secret key. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | For password reset | `smtp.gmail.com`, `465`, `true`, … | Outgoing mail server. |
| `SMTP_FROM` | No | `SRI-KO LMS <no-reply@your-domain>` | Sender address. Defaults to `SMTP_USER`. |
| `BACKEND_URL` | No (local only) | `http://localhost:5000` | Builds links to locally stored uploads. Not used on Vercel. |
| `NODE_ENV` | No | `production` | Reported by `/api/health` outside Vercel only. |
| `PORT` | No (local only) | `5000` | Ignored on Vercel. |
| `VERCEL` | Set by Vercel | `1` | **Do not set manually.** It disables the local DNS workaround and enables `trust proxy`. |

### 11.2 Frontend project

| Variable | Required | Example | Purpose and notes |
| --- | --- | --- | --- |
| `VITE_API_URL` | **Yes** | `https://sri-ko-backend.vercel.app/api` | The API URL **including `/api`**; a trailing slash is ignored. Default `http://localhost:5000/api`. |
| `VITE_ENABLE_SOCKET` | **Yes, on Vercel** | `false` | Any other value enables Socket.IO, which needs a long-running server. |
| `VITE_GOOGLE_CLIENT_ID` | For Google sign-in | `1234-abc.apps.googleusercontent.com` | The same value as the backend's `GOOGLE_CLIENT_ID`. |
| `VITE_SUPABASE_URL` | For image uploads | `https://<project-ref>.supabase.co` | Supabase project URL. |
| `VITE_SUPABASE_ANON_KEY` | For image uploads | (public anon key) | Public by design. Protect the bucket with Storage policies ([§8.3](#83-supabase-storage-images)). |
| `VITE_SUPABASE_BUCKET` | No | `courses` | Default bucket. Default `courses`. |
| `VITE_STRIPE_PUBLISHABLE_KEY` | For card payments | `pk_test_…` | Stripe publishable key. |

> Every `VITE_*` value ends up in the public JavaScript bundle. Only public identifiers belong here.

---

## 12. Environments, previews and continuous deployment

**How deployments are triggered.** With the Git integration:
- Every push to a project's **production branch** creates a production deployment.
- Every push to another branch, and every pull request, creates a **preview deployment**. Vercel comments the preview URL on the pull request.

**Recommended branch mapping** (SDS §8.2):
- `main` → Production.
- `develop` and `feature/*` / `fix/*` → Preview.

Each branch also gets a stable alias, for example `https://sri-ko-git-develop-<team-slug>.vercel.app`.

**Deployment Protection.** Vercel's recommended *Standard Protection* requires a Vercel login for every deployment URL **except production domains**. Team members can open previews; the public cannot. For the API this means:

| Approach | How | Trade-off |
| --- | --- | --- |
| **Simple** | Give the frontend's **Preview** scope `VITE_API_URL=https://sri-ko-backend.vercel.app/api` (the production API) | Previews use production data. Good for UI review, not for destructive testing. |
| **Isolated staging** | Create a second backend project (for example `sri-ko-backend-staging`) whose production branch is `develop`, with its own database. Point the frontend's Preview `VITE_API_URL` at it and allow the preview origins in its `FRONTEND_URL`. | Fully separate data, at the cost of one more project to maintain. |

**Skipping unaffected builds.** By default both projects build on every push. To build a project only when its own folder changed, set **Settings → Build and Deployment → Ignored Build Step** to a custom command:

```bash
git diff HEAD^ HEAD --quiet -- .
```

The command runs inside the project's Root Directory. Exit code `0` (no changes) cancels the build, and `1` continues it. Cancelled builds still count towards deployment quotas.

---

## 13. Deploying with the Vercel CLI

The dashboard flow above is the recommended path. The CLI is useful to reproduce a production build locally or to deploy without pushing.

```bash
npm i -g vercel@latest            # version 47.0.5 or newer is required for Express
vercel login

# Link each folder to its existing Vercel project (creates a git-ignored .vercel/ folder)
vercel link --cwd backend
vercel link --cwd frontend

# Reproduce the production build locally
vercel pull --cwd backend --environment=production
vercel build --cwd backend

# Deploy a preview, then promote to production
vercel deploy --cwd backend
vercel deploy --cwd backend --prod

# Manage environment variables
vercel env ls --cwd backend
vercel env add JWT_SECRET production --cwd backend
```

> `vercel pull` writes the project's environment variables, **including secrets**, into `.vercel/` on your machine. That folder is git-ignored. Delete it when you are done and never commit it. Each project's `.vercelignore` keeps local `.env` files out of CLI uploads.

---

## 14. Platform limits and behaviour

| Limit | Value on Vercel | Effect on SRI-KO LMS |
| --- | --- | --- |
| Request and response body | **4.5 MB** (`413 FUNCTION_PAYLOAD_TOO_LARGE`) | Lecture-material and assignment uploads through the API must stay under 4.5 MB per request; add videos as links. Profile photos are resized in the browser (longest edge 512 px). Images go straight to Supabase. |
| Function duration | 300 s by default with Fluid compute; up to 800 s on Pro | Requests normally finish well under a second. A timeout returns `504 FUNCTION_INVOCATION_TIMEOUT`. |
| Memory / CPU | 2 GB / 1 vCPU by default | Sufficient. Uploaded files are buffered in memory, bounded by the body limit. |
| Function bundle | 250 MB uncompressed | The backend function is about 53 MB, mostly `googleapis`. |
| File system | Read-only, apart from a temporary directory that does not persist | Persistent files go to Google Drive, Supabase Storage or MongoDB. |
| Long-lived connections | WebSockets are in beta. Socket.IO rooms spanning several instances would need a shared adapter such as Redis | Socket.IO is disabled; notifications poll every 60 seconds. |
| In-memory state | Per function instance, lost when an instance stops | The support assistant's rate limit (20 messages per minute per user or IP) applies per instance, so it is best-effort on Vercel. |
| Static files | `express.static()` is ignored | The backend serves no static files; uploads use external storage. |
| Cold starts | The first request to a new instance also opens the MongoDB connection | Expect a slower first response after idle periods; later requests reuse the cached connection. |

---

## 15. Security checklist

- [ ] All secrets are Vercel environment variables marked **Sensitive**, and none is in a `VITE_*` variable.
- [ ] `JWT_SECRET` is a long random value used only in production. Rotate it if it is ever exposed; this signs everyone out.
- [ ] `FRONTEND_URL` (Production scope) lists exact origins only. Wildcards are used in the Preview scope only.
- [ ] The Atlas database user has least privilege and a strong password. `0.0.0.0/0` is used only because Vercel's IPs are dynamic.
- [ ] Deployment Protection stays on *Standard Protection*, so previews are visible to the team only.
- [ ] Stripe uses test keys unless live payments are approved.
- [ ] The Supabase bucket accepts images only, with a size limit, through explicit Storage policies.
- [ ] The Google OAuth client lists only real origins, and its consent screen is published (refresh-token validity).
- [ ] The first administrator was promoted manually; test accounts and sample data are removed.
- [ ] The deployed build includes the access-control fixes: role on registration (#166), Join Us management restricted to admins (#167), ownership checks (#168) and escaped search input (#169).

---

## 16. Operations

**Changing configuration.** Edit the variable, then redeploy (**Deployments → ⋯ → Redeploy**). Frontend `VITE_*` changes always need a new build.

**Rolling back.** In **Deployments**, open a previous production deployment and choose **Instant Rollback**. A rollback restores code and build output only. It does not undo database changes or environment-variable edits.

**Logs and monitoring.**
- **Project → Logs** shows runtime logs that you can filter by path and status code. The API returns JSON errors without stack traces, so use the logs to diagnose failures.
- Point an uptime monitor at `GET /api/health`.

**Custom domains.** Add the domain under **Settings → Domains**. Then:
1. Add the new origin to `FRONTEND_URL` and to the Google OAuth origins.
2. If the API's domain changed, update `VITE_API_URL`.
3. Redeploy the affected projects.

**Node.js upgrades.** `engines.node` is `>=22.12.0`, so Vercel uses its default LTS (currently 24.x). To pin a major version, set it to, for example, `"24.x"`.

**Releases.** Follow the team's release procedure: `release/*` → `main`, tagged with a SemVer version. Production deploys from `main`.

---

## 17. Troubleshooting

| Symptom | Likely cause | Resolution |
| --- | --- | --- |
| Backend build cannot find an entry point, or the framework is not detected | The Root Directory is not `backend` | Set **Settings → Build and Deployment → Root Directory** to `backend` and redeploy. |
| `/api/health` returns `503` `"degraded"` | Wrong `MONGODB_URI`, rejected credentials, or Atlas Network Access blocks Vercel | Check **Logs** for `MongoServerSelectionError` or `bad auth`. Fix the URI or user, allow `0.0.0.0/0`, then redeploy. |
| Sign-in fails with `500`; logs show `secretOrPrivateKey must have a value` | `JWT_SECRET` is missing | Set `JWT_SECRET` and redeploy. |
| Browser: *blocked by CORS policy* | The site's origin is not in `FRONTEND_URL` | Add the exact origin (scheme and host, no trailing slash) and redeploy the backend. |
| The site calls `http://localhost:5000` | `VITE_API_URL` was not set at build time | Set it in the frontend project and redeploy. |
| API calls return 404 for every route | `VITE_API_URL` is missing the `/api` suffix | Use `https://<backend-domain>/api`. |
| Refreshing a page shows a Vercel 404 | The frontend's Root Directory is not `frontend`, so the SPA rewrites are not applied | Set the Root Directory to `frontend` and redeploy. |
| API requests return a Vercel login page or `401` | `VITE_API_URL` points at a protected preview or generated deployment URL | Use the backend's production domain, or adjust Deployment Protection ([§12](#12-environments-previews-and-continuous-deployment)). |
| Google sign-in: *origin is not allowed* / `origin_mismatch` | The origin is missing from the OAuth client | Add it under **Authorized JavaScript origins**. The change can take a few minutes. |
| Password-reset email never arrives | `SMTP_*` is missing or wrong, or no app password is used | Check **Logs** for *Email service is not configured* or an SMTP authentication error. |
| *Image uploads are disabled* | `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` were not set at build time | Set them and redeploy the frontend. |
| Supabase: *new row violates row-level security policy* | The bucket has no Storage policies for `anon` | Add the policies in [§8.3](#83-supabase-storage-images). |
| Lecture or assignment upload fails with `EROFS` | Drive is not configured, its token expired, or its quota is full, so the local-disk fallback ran | Configure Drive ([§8.2](#82-google-drive-lecture-materials-and-assignment-submissions)) and check the refresh token's validity and the quota. |
| `413 FUNCTION_PAYLOAD_TOO_LARGE` | The request body is over 4.5 MB | Upload a smaller file, or add the material as a link. |
| Notifications appear after a delay | Expected on Vercel: polling every 60 seconds | No action needed. For instant pushes, host the backend on a long-running Node.js service with `VITE_ENABLE_SOCKET=true`. |
| *You're sending messages too quickly* in the assistant | Rate limit of 20 messages per minute | Wait a minute. |
| Mixed-content warnings | `VITE_API_URL` uses `http://` | Use the `https://` URL. |
| The first request after a quiet period is slow | Cold start plus a new database connection | Expected. Place the function in the region nearest to Atlas ([§5](#5-step-2-deploy-the-backend-api)). |

---

## 18. References

**Vercel documentation**
- [Express on Vercel](https://vercel.com/docs/frameworks/backend/express)
- [Vercel Functions limitations](https://vercel.com/docs/functions/limitations)
- [Supported Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
- [Deployment Protection](https://vercel.com/docs/deployment-protection)
- [Environment variables](https://vercel.com/docs/environment-variables)
- [Project settings, including the Ignored Build Step](https://vercel.com/docs/project-configuration/project-settings)
- [WebSockets](https://vercel.com/docs/functions/websockets)

**Project documentation**
- [README](README.md): features, local setup and API reference
- [`backend/env.example`](backend/env.example) and [`frontend/env.example`](frontend/env.example): annotated configuration templates
- Software Design Specification §8 (Deployment design) in the [documentation repository](https://github.com/TeamNova-SRI-KO-LMS/documentation). It still describes WSO2 Choreo; ADR-006 (proposed) records the move to Vercel.
- Issue [#175](https://github.com/TeamNova-SRI-KO-LMS/app/issues/175) (DDP-#86): the two-project Vercel deployment
