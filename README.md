# ScholarTrack

ScholarTrack is a simple student management system built with plain HTML, CSS, JavaScript, and a Node.js backend. It includes account registration and login, student records, and marks entry by subject and exam.

## Features

- User registration and login
- Protected student management dashboard
- Add and delete students
- Add, update, and delete marks
- Neon Postgres compatible
- Vercel deployment ready

## Folder Structure

```text
project/
|-- api/                 # Vercel serverless entry
|-- backend/             # Express app, routes, middleware, utilities
|-- public/              # HTML, CSS, and frontend JavaScript
|-- sql/                 # Database schema
|-- .env.example
|-- package.json
|-- server.js            # Local development entry
`-- vercel.json
```

## Local Setup

1. Create a Neon database and copy the connection string.
2. Copy `.env.example` to `.env`.
3. Fill in `DATABASE_URL` and `JWT_SECRET`.
4. Install dependencies:

```bash
npm install
```

5. Start the app:

```bash
npm run dev
```

6. Open `http://localhost:3000`.

The app automatically runs the SQL schema in `sql/schema.sql` when it starts.

## Neon Setup

- Create a project in Neon.
- Copy the Postgres connection string into `DATABASE_URL`.
- Keep `sslmode=require` in the connection string.

## Vercel Deployment

1. Push the project to GitHub.
2. Import the repo into Vercel.
3. Add these environment variables in Vercel:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `COOKIE_NAME`
   - `NODE_ENV=production`
4. Deploy.

Static frontend files are served from `public/`, and API requests are handled by `api/index.js`.
