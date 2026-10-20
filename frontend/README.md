# SRI-KO LMS — Frontend

Single-page application for SRI-KO LMS, built with **React 19, Vite 8 and Tailwind CSS 4**. It contains the public website, the student portal and the admin portal (loaded on demand).

> Full documentation — features, environment variables and API reference — is in the [main README](../README.md). Deployment is covered in the [Vercel Deployment Guide](../VERCEL_DEPLOYMENT.md).

## Quick start

```bash
npm install
cp env.example .env      # set VITE_API_URL to your backend, e.g. http://localhost:5000/api
npm run dev              # http://localhost:5173
```

Requires Node.js 22.12 or newer.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Build the production bundle into `dist/`. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run ESLint. |

## Deployment

Deploy as a Vercel project with **Root Directory = `frontend`**. [`vercel.json`](vercel.json) adds the SPA rewrites (so deep links like `/admin/attendance` work on refresh) and long-term caching for hashed assets. Set `VITE_API_URL` to the deployed backend and `VITE_ENABLE_SOCKET=false`, then redeploy whenever `VITE_*` values change. Step-by-step instructions: [Vercel Deployment Guide](../VERCEL_DEPLOYMENT.md).
