# Student Feedback Manager

The existing MongoDB feedback collection and `name`, `rating`, and `comment` fields are preserved. The frontend is now React/Vite; the Express API owns all database and Gemini access.

## Requirements

- Node.js 20.19+ and npm
- MongoDB (local or hosted)
- A Gemini API key to use the AI features

## Setup

1. Copy `backend/.env.example` to `backend/.env` and set `MONGODB_URI` and `GEMINI_API_KEY`. Keep the key only in this server-side file; do not add it to frontend environment variables or commit it.
2. Start the API:

   ```sh
   cd backend
   npm install
   npm start
   ```

3. In a separate terminal, install and start the frontend:

   ```sh
   cd frontend
   npm install
   npm run dev
   ```

   Open the Vite URL (normally `http://localhost:5173`). Vite proxies `/api` requests to the backend on port 5000.

For production, build the frontend with `cd frontend && npm run build`, then start the backend. Express serves `frontend/dist`. Set `CORS_ORIGIN` to the frontend origin(s) if the frontend is hosted separately. The API can run without `GEMINI_API_KEY`; CRUD works and AI requests return a clear configuration error.

## Features

- React state and effects manage feedback loading, form submission, edit/delete, sentiment, summary, and assistant state.
- Shared components compose the submit form, feedback list/cards, header, and AI insights.
- Express routes and controllers implement validated create/read/update/delete operations.
- Gemini calls run only on the backend. The prompts include a few-shot sentiment classifier and summary prompt, plus a system prompt for the feedback assistant. Gemini safety settings filter unsafe content; AI responses are checked against expected types, ranges, and length limits.

## API

Base URL: `http://localhost:5000/api/feedback`

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/` | Create feedback (`name`, integer `rating` 1-5, optional `comment`) |
| `GET` | `/` | List feedback, newest first |
| `PUT` | `/:id` | Update one or more of `name`, `rating`, and `comment` |
| `DELETE` | `/:id` | Delete feedback |
| `POST` | `/ai/sentiment` | Analyze `{ "comment": "..." }` |
| `POST` | `/ai/summary` | Summarize up to 100 recent feedback records |
| `POST` | `/ai/assistant` | Ask `{ "question": "..." }` using up to 50 anonymous recent records |

Run backend validation tests with `cd backend && npm test`. Build the frontend with `cd frontend && npm run build`.
