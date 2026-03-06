# Mini Project 1 — Storyengine

AI-powered micro-SaaS prototype built for **Mudita Studios** as part of OIM3690. Scrapes Twitter/X to discover emerging AI builders, scores them on founder potential across multiple dimensions, and manages candidates through a recruiting pipeline.

## Client Brief

See [PROPOSAL.md](./PROPOSAL.md) for the full client brief, including project purpose, audience, deliverables, and inspiration.

## Live Site

<!-- TODO: Add GitHub Pages or deployment link here -->
*Coming soon*

## Status

This project is currently in the **proposal stage**. The working prototype has been built and is functional locally — deployment and presentation materials are in progress.

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Database:** SQLite with Drizzle ORM
- **API:** Twitter/X via twitterapi.io
- **UI:** Kanban pipeline, candidate scoring dashboard, configurable search queries

## Getting Started

```bash
npm install
cp .env.example .env  # Add your TWITTER_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.
