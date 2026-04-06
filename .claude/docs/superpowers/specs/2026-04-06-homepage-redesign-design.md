# Homepage Redesign: Three Pillars + Layout Restructure

## Goal

Redesign the homepage to equally highlight three professional pillars (Data Engineering, Business Automation, AI Engineering), differentiate from the Santifer fork's layout, and make the AI chatbot visible as a hero CTA.

## Pillars

### Data Engineering
- Snowflake architecture & cost optimization
- dbt modeling (modular, incremental)
- AWS pipelines (S3, Lambda, Kinesis, Glue)
- High-volume event & telemetry pipelines

### Business Automation
- **Key stat**: 300+ clients, 8 years running, zero errors, no support package
- Categories (10):
  1. Process Automation
  2. Spreadsheet Automation (Excel, Google Sheets)
  3. Financial Automation (reports, reconciliation, cash flow)
  4. Nota Fiscal (NF-e/NFS-e emission & tracking)
  5. Legal Processes (contracts, deadlines, filings)
  6. CRM & Sales Pipelines (leads, follow-ups, closing)
  7. WhatsApp & Customer Service (chatbots, auto-responses, routing)
  8. ERP Integrations (Omie, Bling, Tiny)
  9. Billing & Collections (cobranças, contas a receber)
  10. Automated Reports & Dashboards (real-time visibility)

### AI Engineering
- Claude Code (power user)
- MCP server development
- RAG pipeline architecture
- LLM integrations (Claude, GPT)
- AI product management
- GPT integrations

## Layout Changes

### Hero (asymmetric, not centered)
- **Left-aligned oversized name** with small photo + verification badge (not the current large centered photo)
- **Rotating roles**: "Senior Data Engineer" / "Automation Specialist" / "AI Engineer"
- **Three-pillar cards** side by side, equal weight:
  | Data Engineering | Business Automation | AI Engineering |
  |---|---|---|
  | Scalable pipelines, reliable data | 300+ businesses on autopilot | LLMs, MCP, RAG in production |
  | Snowflake, dbt, AWS | 8 years, zero errors | Claude, GPT, AI PM |
- **AI chatbot CTA** in hero: "Don't want to scroll? Ask my AI" button that opens the FloatingChat
- **Stats banner** below hero: animated counters — `10+ years | 300+ clients | 8 years zero errors | No support package`

### Experience (zigzag)
- Alternating left/right layout instead of current vertical stack
- Left: Data Meaning (role, highlights, industries)
- Right: Bento grid of sub-projects (BusinessOS, WebSEO, ERP, GPTs, etc.)
- Left: Keyrus
- Right: Previous roles
- Remove all Jacobo AI agent references

### Business Automation (new section)
- Placed between Projects and Education
- Full-width gradient banner: "300+ businesses running on autopilot since 2018. Zero support tickets."
- 10 category cards in responsive grid (5x2 desktop, 2-col mobile) with icons and one-liner descriptions
- Closing line: "From micro-businesses to enterprises. If it's repetitive, it should be automated."

### AI Engineering (new section)
- Same visual weight as Business Automation section
- Highlights: Claude Code, MCP servers, RAG pipelines, LLM integrations, AI PM
- Existing Claude Code card content moves here

### Projects (masonry grid)
- Staggered/masonry layout instead of uniform 3-column grid
- Varied card sizes based on project importance

### Education, Skills, CTA
- Keep existing content and structure

## Other Changes
- Email updated to `pvictor.business@gmail.com` everywhere
- Jacobo references removed from experience section
- Bilingual: all new content in PT-BR and EN

## Section Order (final)
1. Hero (asymmetric + 3 pillars + AI CTA + stats)
2. Story/Summary
3. Experience (zigzag)
4. Projects (masonry)
5. Business Automation (new)
6. AI Engineering (new)
7. Observability
8. Education & Certifications
9. Skills & Stack
10. CTA / Contact

## Files to modify
- `src/i18n.ts` — new content for automation & AI sections, updated roles, email, remove Jacobo
- `src/App.tsx` — hero restructure, zigzag experience, new sections, masonry projects, AI CTA
- `src/about-i18n.ts` — update email
- `src/FloatingChat.tsx` — expose open trigger for hero CTA
- `src/AboutPage.tsx` — update email if referenced
