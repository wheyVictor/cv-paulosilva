# CLAUDE.md

> **Caution, we are in production.** All changes deploy automatically via Vercel CI on merge to main.

## Communication

Be terse. No filler. Lead with action, not reasoning. One sentence > three.

## Workflow

- **Always feature branches + PRs.** Never push to main directly.
- **Every agent task uses `isolation: "worktree"`.** Multiple tasks = multiple agents, each in its own worktree.
- Use superpowers plugin skills for all non-trivial work (brainstorming → writing-plans → subagent-driven-development → finishing-a-development-branch).
- Run `npm test` and `npm run build` before every commit.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Framer Motion
- **Backend:** Vercel serverless functions (Node.js)
- **Chatbot:** Claude API (Haiku 4.5) via SSE streaming
- **CI/CD:** GitHub Actions → Vercel auto-deploy on push to main
- **Testing:** Vitest (unit), Playwright (e2e)
- **i18n:** PT-BR / EN, translations in `src/i18n.ts`
- **SEO:** Prerendered SSR, JSON-LD, Open Graph, sitemap

## Key Files

- `src/App.tsx` — main homepage component
- `src/i18n.ts` — all translations (PT/EN)
- `api/chat.js` — chatbot serverless function
- `api/_prompt.js` — embedded chatbot system prompt
- `scripts/prerender.tsx` — SSR prerender script
- `vercel.json` — headers, redirects, rewrites

## Brand

- **Company:** A.A.T (Auto All Tech)
- **Tagline:** "Conquer time" (EN) / "Conquiste o tempo" (PT)
- **Email:** pvictor.business@gmail.com
- **Three pillars:** Data Engineering, Business Automation, AI Engineering
