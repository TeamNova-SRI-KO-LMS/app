# TeamNova SRI-KO LMS Backend

This is the backend for the LMS project, built with Express.js and Node.js.

## Prerequisites

- Node.js installed on your machine.

## Setup Instructions

1. Clone the repository or navigate to this project folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server (uses Nodemon for automatic restarts):
   ```bash
   npm run dev
   ```
   *Alternatively, start the server without Nodemon:*
   ```bash
   npm start
   ```

## API Endpoints

- `GET /` - Returns a simple response indicating the server is running.
- `GET /api/admin/analytics?period=30&year=2026` - Returns admin-only overview,
  growth, revenue, course, and activity analytics.
- `GET /api/admin/analytics/export?format=csv&period=30` - Downloads an admin-only
  analytics report as CSV or PDF (`format=pdf`).

Analytics endpoints require an administrator JWT in the `Authorization: Bearer <token>`
header.

The server will be running at `http://localhost:3000` by default.
