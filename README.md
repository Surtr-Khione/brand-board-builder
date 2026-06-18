# Brand Board Builder

AI-powered enterprise brand identity builder. Create comprehensive brand boards, export as JSON for LLMs, and share via unique URLs.

## Features

- **19 brand sections** organized into 5 phases: Discover, Strategy, Expression, Govern, Deploy
- **Light/Dark mode** color system with toggles
- **12 brand archetypes** with visual selector
- **StoryBrand framework** built-in
- **Email-gated saving** — captures leads to GoHighLevel
- **Shareable URLs** — each board gets a unique link
- **JSON export** — AI/LLM-ready brand files
- **Brand score** — completion tracking

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

## Deployment

### 1. Set Up Supabase (Free)

1. Go to supabase.com → New Project
2. Go to SQL Editor → paste contents of `supabase/migration.sql` → Run
3. Go to Settings → API → copy your Project URL and anon public key

### 2. Set Up GoHighLevel Webhook

1. In GHL, go to Automation → Workflows
2. Create a new workflow with trigger: Inbound Webhook
3. Copy the webhook URL

### 3. Deploy to Render

1. Push this repo to GitHub
2. Go to Render Dashboard → New Static Site
3. Connect your GitHub repo
4. Build Command: `npm run build` | Publish Directory: `dist`
5. Add environment variables in Render dashboard
6. Deploy!

## Tech Stack

React + Vite | Supabase | GoHighLevel | Render
