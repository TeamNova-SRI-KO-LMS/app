# SRI-KO LMS — Backend API

REST API for SRI-KO LMS, built with **Node.js, Express 5 and MongoDB (Mongoose)**, with optional real-time notifications over Socket.IO.

> Full documentation — features, environment variables and API reference — is in the [main README](../README.md). Deployment is covered in the [Vercel Deployment Guide](../VERCEL_DEPLOYMENT.md).

## Quick start

```bash
npm install
cp env.example .env      # then fill in MONGODB_URI, JWT_SECRET, ...
npm run dev              # http://localhost:5000 (auto-reload)
```

Requires Node.js 22.12 or newer. Check the API with `GET /api/health`.

## Entry points

| File | Purpose |
| --- | --- |
| `app.js` | Builds and exports the Express app (routes, CORS, database check, JSON error handling). Vercel runs this file as a single Vercel Function. |
| `server.js` | Long-running server for `npm run dev` / `npm start`: HTTP listener plus Socket.IO. When imported (as Vercel does), it only re-exports the app. |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start with nodemon (auto-reload). |
| `npm start` | Start with Node.js. |

## Deployment

Deploy as a Vercel project with **Root Directory = `backend`** (see [`vercel.json`](vercel.json)) and configure the variables from [`env.example`](env.example). Step-by-step instructions: [Vercel Deployment Guide](../VERCEL_DEPLOYMENT.md).
