# Homepage Redesign: Three Pillars + Layout Restructure

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the homepage to equally highlight three professional pillars (Data Engineering, Business Automation, AI Engineering), restructure layouts to differentiate from the Santifer fork, and expose the AI chatbot as a hero CTA.

**Architecture:** Content changes go in `src/i18n.ts` (PT/EN). Layout changes go in `src/App.tsx`. FloatingChat gets a new prop for external open control. Email updates touch `src/i18n.ts`, `src/about-i18n.ts`, and `src/FloatingChat.tsx`.

**Tech Stack:** React, TypeScript, Tailwind CSS, Framer Motion, Lucide icons

---

### Task 1: Update email everywhere

**Files:**
- Modify: `src/i18n.ts:20` (PT email), `src/i18n.ts:576` (EN email)
- Modify: `src/about-i18n.ts:58` (PT email), `src/about-i18n.ts:114` (EN email)

- [ ] **Step 1: Update email in i18n.ts**

In `src/i18n.ts`, change both occurrences:

```typescript
// Line 20 (PT)
email: 'pvictor.business@gmail.com',

// Line 576 (EN)
email: 'pvictor.business@gmail.com',
```

- [ ] **Step 2: Update email in about-i18n.ts**

In `src/about-i18n.ts`, change both occurrences:

```typescript
// Line 58 (PT)
email: 'pvictor.business@gmail.com',

// Line 114 (EN)
email: 'pvictor.business@gmail.com',
```

- [ ] **Step 3: Grep for any remaining old emails**

Run: `grep -rn "paulovictordasilvarp\|hello@psilva" src/`
Expected: No matches

- [ ] **Step 4: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: "Done" with no errors

- [ ] **Step 5: Commit**

```bash
git add src/i18n.ts src/about-i18n.ts
git commit -m "chore: update email to pvictor.business@gmail.com"
```

---

### Task 2: Update hero rotating roles and add three-pillar content to i18n

**Files:**
- Modify: `src/i18n.ts:19` (PT greetingRoles), `src/i18n.ts:575` (EN greetingRoles)
- Modify: `src/i18n.ts:61-84` (PT summary), `src/i18n.ts:617-640` (EN summary)

- [ ] **Step 1: Update greetingRoles in PT**

In `src/i18n.ts` at line 19, replace:

```typescript
greetingRoles: ['Senior Data Engineer', 'Automation Specialist', 'AI Engineer'],
```

- [ ] **Step 2: Update greetingRoles in EN**

In `src/i18n.ts` at line 575, replace:

```typescript
greetingRoles: ['Senior Data Engineer', 'Automation Specialist', 'AI Engineer'],
```

- [ ] **Step 3: Add three-pillar cards to PT summary**

In `src/i18n.ts`, replace the `summary.cards` array (PT section, around line 75) with:

```typescript
cards: [
  {
    title: 'Data Engineering',
    desc: 'Pipelines escaláveis, dados confiáveis. Snowflake, dbt, AWS.',
  },
  {
    title: 'Automação Empresarial',
    desc: '300+ empresas no piloto automático. 8 anos, zero erros.',
  },
  {
    title: 'AI Engineering',
    desc: 'LLMs, MCP, RAG em produção. Claude, GPT, AI PM.',
  },
],
```

- [ ] **Step 4: Add three-pillar cards to EN summary**

In `src/i18n.ts`, replace the `summary.cards` array (EN section, around line 631) with:

```typescript
cards: [
  {
    title: 'Data Engineering',
    desc: 'Scalable pipelines, reliable data. Snowflake, dbt, AWS.',
  },
  {
    title: 'Business Automation',
    desc: '300+ businesses on autopilot. 8 years, zero errors.',
  },
  {
    title: 'AI Engineering',
    desc: 'LLMs, MCP, RAG in production. Claude, GPT, AI PM.',
  },
],
```

- [ ] **Step 5: Add stats banner content to PT**

Add after the `summary` section in PT (around line 84):

```typescript
statsBanner: [
  { value: '10+', label: 'anos de experiência' },
  { value: '300+', label: 'clientes atendidos' },
  { value: '8', label: 'anos sem erros' },
  { value: '0', label: 'pacotes de suporte' },
],
```

- [ ] **Step 6: Add stats banner content to EN**

Add after the `summary` section in EN (around line 640):

```typescript
statsBanner: [
  { value: '10+', label: 'years of experience' },
  { value: '300+', label: 'clients served' },
  { value: '8', label: 'years error-free' },
  { value: '0', label: 'support packages' },
],
```

- [ ] **Step 7: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: "Done" with no errors

- [ ] **Step 8: Commit**

```bash
git add src/i18n.ts
git commit -m "feat: update hero roles to three pillars and add stats banner content"
```

---

### Task 3: Add Business Automation section content to i18n

**Files:**
- Modify: `src/i18n.ts` (add `automation` section to both PT and EN)

- [ ] **Step 1: Add automation section to PT**

In `src/i18n.ts`, add after the `projects` section (around line 215) in the PT object:

```typescript
automation: {
  title: 'Automação para Empresas',
  banner: '300+ empresas no piloto automático desde 2018. Zero tickets de suporte.',
  closing: 'De microempresas a grandes corporações. Se é repetitivo, deveria ser automatizado.',
  categories: [
    { icon: 'workflow', title: 'Automação de Processos', desc: 'Workflows que rodam seu negócio sem você' },
    { icon: 'table', title: 'Automação de Planilhas', desc: 'Excel e Google Sheets no piloto automático' },
    { icon: 'dollarSign', title: 'Automação Financeira', desc: 'Relatórios, conciliação, fluxo de caixa' },
    { icon: 'fileText', title: 'Nota Fiscal', desc: 'Emissão e rastreamento de NF-e/NFS-e automatizados' },
    { icon: 'scale', title: 'Processos Jurídicos', desc: 'Gestão de contratos, prazos e protocolos' },
    { icon: 'users', title: 'CRM & Funil de Vendas', desc: 'Leads capturados, acompanhados e convertidos' },
    { icon: 'messageCircle', title: 'WhatsApp & Atendimento', desc: 'Chatbots, respostas automáticas, roteamento' },
    { icon: 'plug', title: 'Integrações ERP', desc: 'Omie, Bling, Tiny conectados a tudo' },
    { icon: 'receipt', title: 'Cobranças & Recebíveis', desc: 'Cobranças no automático, nada escapa' },
    { icon: 'barChart', title: 'Relatórios & Dashboards', desc: 'Visibilidade em tempo real, zero trabalho manual' },
  ],
},
```

- [ ] **Step 2: Add automation section to EN**

In `src/i18n.ts`, add after the `projects` section in the EN object:

```typescript
automation: {
  title: 'Business Automation',
  banner: '300+ businesses running on autopilot since 2018. Zero support tickets.',
  closing: 'From micro-businesses to enterprises. If it\'s repetitive, it should be automated.',
  categories: [
    { icon: 'workflow', title: 'Process Automation', desc: 'Workflows that run your business without you' },
    { icon: 'table', title: 'Spreadsheet Automation', desc: 'Excel & Google Sheets on autopilot' },
    { icon: 'dollarSign', title: 'Financial Automation', desc: 'Reports, reconciliation, cash flow' },
    { icon: 'fileText', title: 'Nota Fiscal', desc: 'NF-e/NFS-e emission and tracking automated' },
    { icon: 'scale', title: 'Legal Processes', desc: 'Contract management, deadlines, filings' },
    { icon: 'users', title: 'CRM & Sales Pipelines', desc: 'Leads captured, followed up, closed' },
    { icon: 'messageCircle', title: 'WhatsApp & Customer Service', desc: 'Chatbots, auto-responses, routing' },
    { icon: 'plug', title: 'ERP Integrations', desc: 'Omie, Bling, Tiny connected to everything' },
    { icon: 'receipt', title: 'Billing & Collections', desc: 'Collections on autopilot, nothing slips' },
    { icon: 'barChart', title: 'Reports & Dashboards', desc: 'Real-time visibility, zero manual work' },
  ],
},
```

- [ ] **Step 3: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: "Done" with no errors

- [ ] **Step 4: Commit**

```bash
git add src/i18n.ts
git commit -m "feat: add business automation section content (PT/EN)"
```

---

### Task 4: Add AI Engineering section content to i18n

**Files:**
- Modify: `src/i18n.ts` (add `aiEngineering` section to both PT and EN)

- [ ] **Step 1: Add AI engineering section to PT**

In `src/i18n.ts`, add after the `automation` section in the PT object:

```typescript
aiEngineering: {
  title: 'AI Engineering',
  subtitle: 'LLMs, agentes e infraestrutura de IA em produção',
  highlights: [
    { icon: 'sparkles', title: 'Claude Code', desc: 'Power user — desenvolvimento assistido por IA com Claude Code CLI' },
    { icon: 'server', title: 'MCP Servers', desc: 'Desenvolvimento de servidores Model Context Protocol para integração de ferramentas' },
    { icon: 'database', title: 'RAG Pipelines', desc: 'Arquitetura de pipelines de Retrieval-Augmented Generation em produção' },
    { icon: 'bot', title: 'Integrações LLM', desc: 'Claude, GPT e modelos open-source integrados a workflows empresariais' },
    { icon: 'briefcase', title: 'AI Product Management', desc: 'Gestão de produto de IA — do conceito à produção' },
    { icon: 'cpu', title: 'GPT Integrations', desc: 'Assistentes customizados e fine-tuning para casos de uso específicos' },
  ],
},
```

- [ ] **Step 2: Add AI engineering section to EN**

In `src/i18n.ts`, add after the `automation` section in the EN object:

```typescript
aiEngineering: {
  title: 'AI Engineering',
  subtitle: 'LLMs, agents, and AI infrastructure in production',
  highlights: [
    { icon: 'sparkles', title: 'Claude Code', desc: 'Power user — AI-assisted development with Claude Code CLI' },
    { icon: 'server', title: 'MCP Servers', desc: 'Model Context Protocol server development for tool integration' },
    { icon: 'database', title: 'RAG Pipelines', desc: 'Retrieval-Augmented Generation pipeline architecture in production' },
    { icon: 'bot', title: 'LLM Integrations', desc: 'Claude, GPT, and open-source models integrated into business workflows' },
    { icon: 'briefcase', title: 'AI Product Management', desc: 'AI product management — from concept to production' },
    { icon: 'cpu', title: 'GPT Integrations', desc: 'Custom assistants and fine-tuning for specific use cases' },
  ],
},
```

- [ ] **Step 3: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: "Done" with no errors

- [ ] **Step 4: Commit**

```bash
git add src/i18n.ts
git commit -m "feat: add AI engineering section content (PT/EN)"
```

---

### Task 5: Add hero AI chatbot CTA content to i18n

**Files:**
- Modify: `src/i18n.ts` (add `heroCta` to both PT and EN)

- [ ] **Step 1: Add heroCta to PT**

In `src/i18n.ts`, add to the PT root object (near the greeting fields around line 18):

```typescript
heroCta: "Não quer rolar? Pergunte à minha IA",
```

- [ ] **Step 2: Add heroCta to EN**

In `src/i18n.ts`, add to the EN root object (near the greeting fields around line 574):

```typescript
heroCta: "Don't want to scroll? Ask my AI",
```

- [ ] **Step 3: Commit**

```bash
git add src/i18n.ts
git commit -m "feat: add hero AI chatbot CTA text (PT/EN)"
```

---

### Task 6: Make FloatingChat externally controllable

**Files:**
- Modify: `src/FloatingChat.tsx:26-27` (add props for external open)
- Modify: `src/main.tsx:69-86` (pass open state through)

- [ ] **Step 1: Add onOpenChange and externalOpen props to FloatingChat**

In `src/FloatingChat.tsx`, update the component signature at line 26:

```typescript
export default function FloatingChat({ lang, externalOpen, onOpenChange }: { lang: 'pt' | 'en'; externalOpen?: boolean; onOpenChange?: (open: boolean) => void }) {
```

- [ ] **Step 2: Sync external open state**

In `src/FloatingChat.tsx`, after the existing `useState(false)` at line 27, add:

```typescript
  const [open, setOpenInternal] = useState(false)

  const setOpen = useCallback((value: boolean) => {
    setOpenInternal(value)
    onOpenChange?.(value)
  }, [onOpenChange])

  useEffect(() => {
    if (externalOpen !== undefined && externalOpen !== open) {
      setOpenInternal(externalOpen)
    }
  }, [externalOpen])
```

Remove the old `const [open, setOpen] = useState(false)` line.

- [ ] **Step 3: Create a global chat open event system**

In `src/main.tsx`, update the GlobalChat component to support an event-based open trigger. Add before the GlobalChat function (around line 69):

```typescript
// Global event for opening chat from anywhere (hero CTA)
const OPEN_CHAT_EVENT = 'open-floating-chat'

export function openFloatingChat() {
  window.dispatchEvent(new CustomEvent(OPEN_CHAT_EVENT))
}
```

- [ ] **Step 4: Wire up event listener in GlobalChat**

In `src/main.tsx`, update the GlobalChat component:

```typescript
function GlobalChat() {
  const { pathname } = useLocation()
  const [hydrated, setHydrated] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  useEffect(() => setHydrated(true), [])

  useEffect(() => {
    const handler = () => setChatOpen(true)
    window.addEventListener(OPEN_CHAT_EVENT, handler)
    return () => window.removeEventListener(OPEN_CHAT_EVENT, handler)
  }, [])

  if (!hydrated) return null

  const ptSlugs = getPtSlugs()
  const lang = ptSlugs.has(pathname) ? 'pt' : 'en'

  return (
    <ChatErrorBoundary>
      <Suspense fallback={null}>
        <FloatingChat lang={lang} externalOpen={chatOpen} onOpenChange={setChatOpen} />
      </Suspense>
    </ChatErrorBoundary>
  )
}
```

- [ ] **Step 5: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: "Done" with no errors

- [ ] **Step 6: Commit**

```bash
git add src/FloatingChat.tsx src/main.tsx
git commit -m "feat: make FloatingChat externally controllable via event"
```

---

### Task 7: Restructure hero section (asymmetric layout + AI CTA)

**Files:**
- Modify: `src/App.tsx:1430-1513` (hero section)

- [ ] **Step 1: Add import for openFloatingChat**

At the top of `src/App.tsx`, add:

```typescript
import { openFloatingChat } from './main'
```

- [ ] **Step 2: Add new icon imports**

In `src/App.tsx` line 4, add to the lucide-react import:

```typescript
MessageSquareText, Workflow, Table, DollarSign, Scale, Plug, BarChart3, Cpu, Server
```

- [ ] **Step 3: Replace hero section layout**

In `src/App.tsx`, replace the hero section (lines 1430-1513) with the new asymmetric layout:

```tsx
      <header id="main-content" className="relative overflow-hidden">
        <GridSnakes />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent" />
        <div className="absolute top-0 right-[max(0px,calc(50%-40rem))] w-[600px] h-[600px] rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 hidden sm:block animate-[hero-glow_8s_ease-in-out_infinite]" style={{ backgroundColor: 'hsl(var(--hero-orb-primary))' }} />
        <div className="absolute bottom-0 left-[max(0px,calc(50%-40rem))] w-[550px] h-[550px] rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 hidden sm:block animate-[hero-glow_11s_ease-in-out_infinite_reverse]" style={{ backgroundColor: 'hsl(var(--hero-orb-accent))' }} />

        <div className="relative max-w-5xl mx-auto px-6 py-20 md:py-32">
          {/* Asymmetric: name left-aligned, small photo */}
          <div className="flex items-start gap-6 mb-8">
            <motion.div
              initial={hydrated ? { opacity: 0, scale: 0.8 } : false}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="relative shrink-0"
            >
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full bg-gradient-theme-30 blur-lg" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-white/5 border border-white/20 shadow-xl" />
                <div className="absolute inset-1.5 rounded-full bg-gradient-theme-50 p-[2px]">
                  <div className="w-full h-full rounded-full overflow-hidden">
                    <img src="/foto-avatar-sm.webp" alt="Paulo Victor Silva" className="w-full h-full object-cover" width={68} height={68} fetchPriority="high" />
                  </div>
                </div>
              </div>
              <motion.div
                initial={hydrated ? { scale: 0 } : false}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-gradient-theme flex items-center justify-center shadow-md border-2 border-background"
              >
                <BadgeCheck className="w-4 h-4 text-white" />
              </motion.div>
            </motion.div>

            <motion.div
              initial={hydrated ? { opacity: 0, x: -20 } : false}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <p className="text-lg text-muted-foreground mb-1">
                {lang === 'pt' ? 'Olá, eu sou' : "Hi, I'm"} <Link to={lang === 'pt' ? '/sobre-mim' : '/about'} className="text-gradient-theme font-semibold hover:opacity-80 transition-opacity">Paulo Silva</Link>
              </p>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                <span className="text-gradient-theme">{hydrated ? roleText : t.greetingRoles[0]}</span>
                {hydrated && <span className="inline-block w-[3px] h-[0.85em] bg-primary ml-1 rounded-sm translate-y-[2px]" style={{ animation: 'blink 1s step-end infinite' }} />}
              </h1>
            </motion.div>
          </div>

          {/* Role pills */}
          <div className="flex flex-wrap gap-3 mb-8">
            {t.greetingRoles.map((role, i) => (
              <span
                key={role}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 backdrop-blur-sm ${
                  hydrated && i === roleIndex
                    ? 'border border-[#20d6ee] bg-[#20d6ee]/15 text-foreground scale-105'
                    : 'border border-[#20d6ee]/30 bg-background/80 text-muted-foreground'
                }`}
              >
                {role}
              </span>
            ))}
          </div>

          {/* Three-pillar cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {t.summary.cards.map((card, i) => (
              <motion.div
                key={card.title}
                initial={hydrated ? { opacity: 0, y: 20 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                className="p-5 rounded-2xl bg-card/50 backdrop-blur-sm border border-border hover:border-primary/30 transition-colors"
              >
                <h3 className="font-display font-bold text-sm mb-1">{card.title}</h3>
                <p className="text-sm text-muted-foreground">{card.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* AI CTA button */}
          <motion.div
            initial={hydrated ? { opacity: 0, y: 10 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mb-8"
          >
            <button
              onClick={() => openFloatingChat()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/30 text-sm font-medium text-primary hover:bg-primary/20 hover:border-primary/50 transition-all"
            >
              <MessageSquareText className="w-4 h-4" />
              {t.heroCta}
            </button>
          </motion.div>

          {/* Stats banner */}
          <motion.div
            initial={hydrated ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="flex flex-wrap justify-start gap-6 md:gap-10 py-4 border-t border-border/50"
          >
            {t.statsBanner.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-2xl font-bold text-gradient-theme">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </header>
```

- [ ] **Step 4: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: "Done" with no errors

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat: restructure hero with asymmetric layout, three pillars, AI CTA"
```

---

### Task 8: Restructure experience section (zigzag layout)

**Files:**
- Modify: `src/App.tsx:1519-1797` (experience section)

- [ ] **Step 1: Replace experience section layout**

In `src/App.tsx`, replace the experience section (from `<section id="experience"` to its closing `</section>`) with a zigzag alternating layout.

The key structural changes:
- Data Meaning block and its bento grid sit side by side on desktop (left/right)
- Keyrus and Everis alternate sides
- On mobile, everything stacks vertically

Replace the section content inside the `<div className="max-w-5xl mx-auto px-6">` after the h2 heading:

```tsx
          {/* Competencies preamble — keep as-is */}
          <AnimatedSection delay={0.1}>
            <div className="mb-12 p-6 rounded-2xl bg-card/50">
              <p className="text-lg text-muted-foreground text-center max-w-3xl mx-auto mb-6">
                {t.summary.p2} <span className="text-foreground font-medium">{t.summary.p2Highlight}</span>{t.summary.p2End}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-w-3xl mx-auto">
                {t.coreCompetencies.items.map((item, i) => (
                  <div key={i} className="p-3 sm:p-4 rounded-xl bg-background/50 border border-border hover:border-accent/30 transition-colors group">
                    <div className="flex items-center sm:items-start gap-2 sm:mb-1 sm:min-h-[2.5rem]">
                      <Zap className="w-4 h-4 text-accent shrink-0" />
                      <span className="text-sm font-semibold group-hover:text-accent transition-colors leading-tight">{item.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6 hidden sm:block">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>

          {/* Zigzag: Data Meaning (left) + Bento (right) */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <AnimatedSection delay={0.1}>
              <div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#888] shrink-0">
                      <img src="/logo-datameaning.png" alt={t.experience.dataMeaning.company} className="w-full h-full object-contain p-1" width={40} height={40} loading="lazy" decoding="async" />
                    </div>
                    <h3 className="font-display text-2xl font-bold">{t.experience.dataMeaning.company}</h3>
                  </div>
                  <span className="text-sm text-muted-foreground">{t.experience.dataMeaning.location}</span>
                </div>
                <p className="text-primary font-medium mb-1">{t.experience.dataMeaning.role}</p>
                <p className="text-sm text-muted-foreground mb-4">{t.experience.dataMeaning.period}</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {t.experience.dataMeaning.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-4 mt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-3">{t.experience.dataMeaning.industries.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {t.experience.dataMeaning.industries.items.map((industry, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-primary/10 text-xs font-medium text-primary">{industry}</span>
                    ))}
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* Right: sub-project bento mini-grid */}
            <AnimatedSection delay={0.2}>
              <div className="grid grid-cols-2 gap-3">
                {/* BusinessOS */}
                <div className="col-span-2 p-5 rounded-2xl bg-gradient-to-br from-gold/15 via-gold/5 to-transparent border border-gold/30">
                  <h4 className="font-display font-bold mb-2">{t.experience.dataMeaning.businessOS.title}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{t.experience.dataMeaning.businessOS.desc}</p>
                  <div className="flex gap-2">
                    {t.experience.dataMeaning.businessOS.metrics.map((metric, i) => (
                      <div key={i} className="text-center p-2 rounded-lg bg-background/50 border border-gold/20 flex-1">
                        <div className="font-display text-lg font-bold text-gold">{metric.value}</div>
                        <div className="text-[10px] text-muted-foreground">{metric.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* WebSEO */}
                <div className="p-4 rounded-xl bg-card border border-border">
                  <Layout className="w-5 h-5 text-accent mb-2" />
                  <p className="font-medium text-sm mb-1">{t.experience.dataMeaning.webSeo.title}</p>
                  <p className="text-xs text-muted-foreground">{t.experience.dataMeaning.webSeo.desc}</p>
                </div>
                {/* ERP */}
                <div className="p-4 rounded-xl bg-card border border-border">
                  <Database className="w-5 h-5 text-primary mb-2" />
                  <p className="font-medium text-sm mb-1">{t.experience.dataMeaning.erp.title}</p>
                  <p className="text-xs text-muted-foreground">{t.experience.dataMeaning.erp.desc}</p>
                </div>
                {/* Event Pipelines (was jacobo) */}
                <div className="p-4 rounded-xl bg-card border border-border">
                  <Network className="w-5 h-5 text-primary mb-2" />
                  <p className="font-medium text-sm mb-1">{t.experience.dataMeaning.jacobo.title}</p>
                  <p className="text-xs text-muted-foreground">{t.experience.dataMeaning.jacobo.desc}</p>
                </div>
                {/* GenAI */}
                <div className="p-4 rounded-xl bg-card border border-border">
                  <Sparkles className="w-5 h-5 text-accent mb-2" />
                  <p className="font-medium text-sm mb-1">{t.experience.dataMeaning.genAI.title}</p>
                  <p className="text-xs text-muted-foreground">{t.experience.dataMeaning.genAI.desc}</p>
                </div>
              </div>
            </AnimatedSection>
          </div>

          {/* Zigzag: Keyrus (right-aligned on desktop) */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="hidden md:block" /> {/* empty left */}
            <AnimatedSection delay={0.1}>
              <div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#F5F3EE] flex items-center justify-center shrink-0">
                      <img src="/logo-keyrus.svg" alt={t.experience.lico.company} className="w-full h-full object-contain p-1" width={40} height={40} loading="lazy" decoding="async" />
                    </div>
                    <h3 className="font-display text-2xl font-bold">{t.experience.lico.company}</h3>
                  </div>
                  <span className="text-sm text-muted-foreground">{t.experience.lico.location}</span>
                </div>
                <p className="text-accent font-medium mb-1">{t.experience.lico.role}</p>
                <p className="text-sm text-muted-foreground mb-4">{t.experience.lico.period}</p>
                <p className="text-muted-foreground">{t.experience.lico.desc}</p>
              </div>
            </AnimatedSection>
          </div>

          {/* Zigzag: Everis (left-aligned) */}
          <div className="grid md:grid-cols-2 gap-8">
            <AnimatedSection delay={0.1}>
              <div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <Briefcase className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <h3 className="font-display text-2xl font-bold">{t.experience.everis.company}</h3>
                  </div>
                </div>
                <p className="text-primary font-medium mb-1">{t.experience.everis.role}</p>
                <p className="text-sm text-muted-foreground mb-2">{t.experience.everis.period}</p>
                <p className="text-muted-foreground">{t.experience.everis.desc}</p>
              </div>
            </AnimatedSection>
            <div className="hidden md:block" /> {/* empty right */}
          </div>
```

- [ ] **Step 2: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: "Done" with no errors

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: restructure experience section with zigzag layout"
```

---

### Task 9: Add Business Automation section to App.tsx

**Files:**
- Modify: `src/App.tsx` (add new section between Projects and Observability)

- [ ] **Step 1: Add automation section**

In `src/App.tsx`, after the projects `</section>` closing tag (around line 1916) and before the Observability `<Suspense>`, add:

```tsx
      {/* Business Automation */}
      <section id="automation" className="py-16 md:py-24 bg-muted/30" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 800px' }}>
        <div className="max-w-5xl mx-auto px-6">
          <AnimatedSection>
            <h2 className="font-display text-2xl font-semibold mb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Workflow className="w-5 h-5 text-primary" />
              </div>
              {t.automation.title}
            </h2>
          </AnimatedSection>

          {/* Stats banner */}
          <AnimatedSection delay={0.1}>
            <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 mb-8">
              <p className="text-lg md:text-xl font-display font-bold text-center text-gradient-theme">
                {t.automation.banner}
              </p>
            </div>
          </AnimatedSection>

          {/* Category grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
            {t.automation.categories.map((cat, i) => {
              const iconMap: Record<string, React.ReactNode> = {
                workflow: <Workflow className="w-5 h-5" />,
                table: <Table className="w-5 h-5" />,
                dollarSign: <DollarSign className="w-5 h-5" />,
                fileText: <FileText className="w-5 h-5" />,
                scale: <Scale className="w-5 h-5" />,
                users: <Users className="w-5 h-5" />,
                messageCircle: <MessageSquare className="w-5 h-5" />,
                plug: <Plug className="w-5 h-5" />,
                receipt: <Receipt className="w-5 h-5" />,
                barChart: <BarChart3 className="w-5 h-5" />,
              }
              return (
                <AnimatedSection key={cat.title} delay={0.1 + i * 0.05}>
                  <div className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors text-center group h-full">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3 text-primary group-hover:bg-primary/20 transition-colors">
                      {iconMap[cat.icon]}
                    </div>
                    <p className="font-medium text-sm mb-1">{cat.title}</p>
                    <p className="text-xs text-muted-foreground">{cat.desc}</p>
                  </div>
                </AnimatedSection>
              )
            })}
          </div>

          {/* Closing line */}
          <AnimatedSection delay={0.6}>
            <p className="text-center text-muted-foreground italic">{t.automation.closing}</p>
          </AnimatedSection>
        </div>
      </section>
```

- [ ] **Step 2: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: "Done" with no errors

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add business automation section with 10 category cards"
```

---

### Task 10: Add AI Engineering section to App.tsx

**Files:**
- Modify: `src/App.tsx` (add new section after Business Automation)

- [ ] **Step 1: Add AI engineering section**

In `src/App.tsx`, after the automation `</section>` closing tag and before Observability, add:

```tsx
      {/* AI Engineering */}
      <section id="ai-engineering" className="py-16 md:py-24" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 600px' }}>
        <div className="max-w-5xl mx-auto px-6">
          <AnimatedSection>
            <h2 className="font-display text-2xl font-semibold mb-2 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-accent" />
              </div>
              {t.aiEngineering.title}
            </h2>
            <p className="text-muted-foreground mb-8 ml-[52px]">{t.aiEngineering.subtitle}</p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {t.aiEngineering.highlights.map((item, i) => {
              const iconMap: Record<string, React.ReactNode> = {
                sparkles: <Sparkles className="w-5 h-5" />,
                server: <Server className="w-5 h-5" />,
                database: <Database className="w-5 h-5" />,
                bot: <Bot className="w-5 h-5" />,
                briefcase: <Briefcase className="w-5 h-5" />,
                cpu: <Cpu className="w-5 h-5" />,
              }
              return (
                <AnimatedSection key={item.title} delay={0.1 + i * 0.1}>
                  <div className="p-5 rounded-2xl bg-card border border-border hover:border-accent/30 transition-colors group h-full">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3 text-accent group-hover:bg-accent/20 transition-colors">
                      {iconMap[item.icon]}
                    </div>
                    <h3 className="font-display font-bold text-sm mb-1 group-hover:text-accent transition-colors">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </AnimatedSection>
              )
            })}
          </div>
        </div>
      </section>
```

- [ ] **Step 2: Remove Claude Code card from projects section**

In `src/App.tsx`, find the "Claude Code Power User" block (around line 1872-1914) and remove it entirely. This content now lives in the AI Engineering section.

- [ ] **Step 3: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: "Done" with no errors

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add AI engineering section, move Claude Code content there"
```

---

### Task 11: Convert projects grid to masonry/staggered layout

**Files:**
- Modify: `src/App.tsx` (projects section grid)

- [ ] **Step 1: Update projects grid to staggered layout**

In `src/App.tsx`, find the projects grid container (around the `<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">` line) and replace the grid with a staggered layout where the first two projects span full width or 2 columns:

```tsx
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                {allProjects.map((project, i) => (
                  <AnimatedSection key={project.title} delay={i * 0.1} className={i === 0 ? 'lg:col-span-2' : ''}>
                    <div className={`h-full p-5 rounded-2xl bg-card border border-border hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 flex flex-col`}>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-display font-bold text-sm">{project.title}</h3>
                        {project.badge && <span className="badge px-2 py-0.5 bg-primary/10 text-primary text-[10px]">{project.badge}</span>}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 flex-1">{parseBold(project.desc)}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {project.tech.map(t => (
                          <span key={t} className="px-2 py-0.5 text-[10px] rounded-md bg-muted text-muted-foreground">{t}</span>
                        ))}
                      </div>
                      {project.link && (
                        <a href={project.link.startsWith('http') ? project.link : `https://${project.link}`} target="_blank" rel="noopener noreferrer" className="mt-3 text-xs text-primary hover:underline">
                          {project.link}
                        </a>
                      )}
                    </div>
                  </AnimatedSection>
                ))}
              </div>
```

The key change: first project gets `lg:col-span-2` to create the staggered/masonry effect.

- [ ] **Step 2: Verify build**

Run: `npm run build 2>&1 | tail -5`
Expected: "Done" with no errors

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: stagger projects grid with featured first card"
```

---

### Task 12: Remove Jacobo AI agent references

**Files:**
- Modify: `src/i18n.ts` (rename jacobo section)

- [ ] **Step 1: Verify jacobo content is already generic**

Check the current content of `t.experience.dataMeaning.jacobo` — based on exploration, it's already been renamed to "Pipelines de Eventos & Telemetria" and contains no "Jacobo" text in the display content. The key name `jacobo` in i18n.ts is internal only and doesn't render to users.

Run: `grep -n "jacobo\|Jacobo" src/i18n.ts | head -20`

If the content is already generic (event pipelines, not AI agent), no user-facing changes needed. The internal key name is acceptable.

- [ ] **Step 2: Commit (if changes were needed)**

```bash
git add src/i18n.ts
git commit -m "chore: clean up jacobo references"
```

---

### Task 13: Final verification and cleanup

**Files:**
- All modified files

- [ ] **Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass

- [ ] **Step 2: Run full build**

Run: `npm run build 2>&1 | tail -10`
Expected: "Done" with no errors, all prerender pages generated

- [ ] **Step 3: Visual check with dev server**

Run: `npm run dev`
Open browser and verify:
- Hero shows asymmetric layout with three pillar cards
- "Ask my AI" button opens the chat
- Stats banner shows animated counters
- Experience section zigzags left/right
- Business Automation section has 10 category cards
- AI Engineering section has 6 highlight cards
- Projects grid has staggered first card
- Email shows pvictor.business@gmail.com in contact/CTA

- [ ] **Step 4: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "chore: final cleanup and polish"
```
