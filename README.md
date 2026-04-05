# psilva.io

Interactive bilingual portfolio (PT-BR / EN) with AI chatbot, observability dashboard, and data storytelling.

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4 + Motion
- **Charts:** Recharts (lazy-loaded)
- **Chatbot:** Claude API (streaming SSE)
- **Deployment:** Vercel (prerendered HTML + client hydration)
- **SEO:** JSON-LD structured data, sitemap, bilingual hreflang, prerender

## Local Development

```bash
# Install dependencies
npm install

# Create .env.local with your Claude API key (optional, for chatbot)
echo "ANTHROPIC_API_KEY=your_key_here" > .env.local

# Start dev server (frontend + chatbot API)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

The dev server includes a built-in API proxy — the chatbot works out of the box with `npm run dev`. No Vercel CLI or additional setup needed.

Without an API key, the site works normally — only the chatbot will show an error message.

## Build

```bash
npm run build    # tsc + vite build + sitemap + prerender
npm run preview  # preview production build
```

## Deploy

The site deploys to Vercel. API routes (`api/chat.js`) run as serverless functions automatically.

Set `ANTHROPIC_API_KEY` in your Vercel project environment variables.

## Project Structure

```
src/
  App.tsx                # Homepage (experience, projects, education, contact)
  ObservabilitySection   # Analytics dashboard with live telemetry
  FloatingChat.tsx       # AI chatbot (Claude streaming)
  GlobalNav.tsx          # Navigation + language/theme toggle
  AboutPage.tsx          # About page
  PrivacyPolicy.tsx      # Privacy policy
  i18n.ts                # All translations (PT-BR + EN)
  articles/              # Routing + SEO infrastructure
api/
  chat.js                # Claude streaming endpoint (Vercel serverless)
dev-server.ts            # Local dev API proxy (Vite plugin)
chatbot-prompt.txt       # System prompt for the AI chatbot
scripts/
  generate-sitemap.ts    # Sitemap generator
  prerender.tsx          # SSR prerender for SEO
```

## License

All rights reserved.
