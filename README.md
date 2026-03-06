# Mini Project 1 — StoryEngine

Built for Mudita Studios. Paste a raw customer success story and get a full content suite — case study, LinkedIn posts, Twitter/X thread, video script, and outbound emails — powered by Claude AI.

## Client Brief

See [PROPOSAL.md](./PROPOSAL.md) for the full client brief, including project purpose, audience, deliverables, and inspiration.

## Live Site

[https://storyengine-black.vercel.app/](https://storyengine-black.vercel.app/)

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **AI:** Anthropic Claude API (claude-sonnet-4-5) with streaming responses
- **Deployment:** Vercel

## Getting Started
```bash
npm install
```

Create a `.env` file with your Anthropic API key:
```
ANTHROPIC_API_KEY=your-key-here
```

Then run:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.