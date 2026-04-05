import { useState, useMemo, useEffect, useRef } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { Activity } from 'lucide-react'
import {
  generateTimeSeries,
  generateCountryData,
  generateSourceData,
  generateKpis,
} from './observability-data'
import {
  useSessionDuration,
  useScrollDepth,
  useEventLog,
  type LiveEvent,
} from './use-live-telemetry'
import type { Lang } from './i18n'

/* ---------- styling constants ---------- */
const GRID_COLOR = 'rgba(255,255,255,0.06)'
const TICK_COLOR = 'rgba(255,255,255,0.5)'
const TOOLTIP_BG = 'hsl(20 20% 10%)'
const PRIMARY = 'hsl(var(--primary))'
const ACCENT = 'hsl(var(--accent))'
const GOLD = 'hsl(var(--gold))'

/* ---------- types ---------- */
interface Props {
  lang: Lang
  t: { observability: Record<string, unknown> }
  AnimatedSection: React.ComponentType<{
    children: React.ReactNode
    className?: string
    delay?: number
  }>
}

type TimeRange = '7d' | '30d' | '90d'

/* ---------- helpers ---------- */
const daysFor: Record<TimeRange, number> = { '7d': 7, '30d': 30, '90d': 90 }

function isDarkMode(): boolean {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
}

function tooltipStyle() {
  const dark = isDarkMode()
  return {
    backgroundColor: dark ? TOOLTIP_BG : 'hsl(0 0% 98%)',
    border: '1px solid rgba(128,128,128,0.2)',
    borderRadius: '8px',
    color: dark ? '#fff' : '#111',
    fontSize: '12px',
  }
}

/** Isolated component — re-renders every second without affecting parent */
function SessionTimerCard({ label }: { label: string }) {
  const s = useSessionDuration()
  const formatted = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  return (
    <div className="rounded-xl bg-card border border-border p-4">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="text-2xl font-bold tabular-nums mt-1">{formatted}</p>
    </div>
  )
}

/** Isolated component — re-renders on scroll without affecting parent */
function ScrollDepthCard({ label }: { label: string }) {
  const depth = useScrollDepth()
  return (
    <div className="rounded-xl bg-card border border-border p-4">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="text-2xl font-bold tabular-nums mt-1">{depth}%</p>
      <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${depth}%` }} />
      </div>
    </div>
  )
}

function generateSimulatedEvents(t: Record<string, string>): LiveEvent[] {
  const cities = ['Berlin', 'São Paulo', 'London', 'New York', 'Lisboa']
  const now = new Date()
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(now.getTime() - (5 - i) * 47000)
    const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
    const templates = [
      t.viewedProjects?.replace('{city}', cities[i % cities.length]),
      t.viewedExperience?.replace('{city}', cities[(i + 1) % cities.length]),
      t.chatStarted,
      t.themeChanged?.replace('{theme}', 'dark'),
      t.langSwitched?.replace('{lang}', 'EN'),
    ]
    return {
      id: i,
      time,
      event: templates[i % templates.length] ?? '',
      source: 'web',
    }
  })
}

/* ---------- KPI count-up hook ---------- */
function useCountUp(target: number, trigger: boolean, duration = 1500): number {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!trigger) return
    const start = performance.now()
    const step = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
      }
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [trigger, target, duration])

  return value
}

/* ---------- main component ---------- */
export default function ObservabilitySection({ lang, t, AnimatedSection }: Props) {
  const obs = t.observability as Record<string, unknown>
  const kpiLabels = obs.kpi as Record<string, string>
  const countryLabels = obs.countries as Record<string, string>
  const sourceLabels = obs.sources as Record<string, string>
  const timeRangeLabels = obs.timeRanges as Record<string, string>
  const eventStrings = obs.events as Record<string, string>
  const eventLogCols = obs.eventLogCols as Record<string, string>

  /* time range state */
  const [range, setRange] = useState<TimeRange>('30d')

  /* chart data */
  const timeSeries = useMemo(() => generateTimeSeries(daysFor[range]), [range])
  const countryData = useMemo(() => generateCountryData(countryLabels), [lang])
  const sourceData = useMemo(() => generateSourceData(sourceLabels), [lang])
  const kpis = useMemo(() => generateKpis(), [])

  /* live telemetry — timer and scroll are isolated in their own components to avoid re-rendering charts */
  const simulatedEvents = useMemo(() => generateSimulatedEvents(eventStrings), [lang])
  const { events, pushEvent } = useEventLog(simulatedEvents)

  /* push "you navigated" event on mount */
  const didPush = useRef(false)
  useEffect(() => {
    if (!didPush.current) {
      didPush.current = true
      pushEvent(eventStrings.youNavigated ?? '', 'you')
    }
  }, [pushEvent, eventStrings.youNavigated])

  /* KPI intersection observer */
  const kpiRef = useRef<HTMLDivElement>(null)
  const [kpiVisible, setKpiVisible] = useState(false)
  useEffect(() => {
    const el = kpiRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setKpiVisible(true)
          io.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const visitorsCount = useCountUp(kpis.visitors, kpiVisible)
  const countriesCount = useCountUp(kpis.countries, kpiVisible, 800)
  const conversationsCount = useCountUp(kpis.conversations, kpiVisible)

  /* derived values for chat narrative */
  const lastPoint = timeSeries[timeSeries.length - 1]
  const totalTokens = useMemo(
    () => timeSeries.reduce((s, p) => s + p.chats * 1200, 0),
    [timeSeries],
  )
  const chatNarrative = useMemo(() => {
    const tpl = obs.chatStory as string
    return tpl
      ?.replace('{conversations}', String(kpis.conversations))
      .replace('{tokens}', totalTokens.toLocaleString())
      .replace('{cost}', lastPoint?.tokenCost.toFixed(2) ?? '0')
  }, [obs.chatStory, kpis.conversations, totalTokens, lastPoint])


  /* dark pref percentages */
  const darkPct = 72
  const lightPct = 28

  const chartMargin = { top: 10, right: 10, left: 0, bottom: 0 }

  const sourcesLabel = (obs.sourcesTitle as string) ?? 'Sources'

  return (
    <section id="observability" style={{ contentVisibility: 'auto' }}>
      {/* 1. Heading */}
      <AnimatedSection delay={0} className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 mb-4">
          <Activity className="w-6 h-6 text-primary" />
          <h2 className="text-3xl font-bold tracking-tight">{obs.title as string}</h2>
        </div>
        <p className="text-muted-foreground text-sm max-w-2xl mx-auto">{obs.intro as string}</p>
      </AnimatedSection>

      {/* 2. KPI Counters */}
      <AnimatedSection delay={0.05}>
        <div ref={kpiRef} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {([
            { label: kpiLabels.visitors, value: visitorsCount },
            { label: kpiLabels.countries, value: countriesCount },
            { label: kpiLabels.conversations, value: conversationsCount },
          ] as const).map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-xl bg-card border border-border p-6 text-center"
            >
              <p className="text-4xl font-bold tabular-nums">{kpi.value.toLocaleString()}</p>
              <p className="text-muted-foreground text-sm mt-1">{kpi.label}</p>
            </div>
          ))}
        </div>
      </AnimatedSection>

      {/* 3. Traffic Area Chart */}
      <AnimatedSection delay={0.1}>
        <div className="rounded-xl bg-card border border-border p-6 mb-12">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <p className="text-muted-foreground text-sm">{obs.trafficStory as string}</p>
            <div className="flex gap-1">
              {(['7d', '30d', '90d'] as TimeRange[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    range === r
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {timeRangeLabels[r]}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={timeSeries} margin={chartMargin}>
              <defs>
                <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PRIMARY} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={PRIMARY} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fill: TICK_COLOR, fontSize: 11 }} />
              <YAxis tick={{ fill: TICK_COLOR, fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle()} />
              <Area
                type="monotone"
                dataKey="views"
                stroke={PRIMARY}
                fill="url(#viewsGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </AnimatedSection>

      {/* 4. Audience Breakdown */}
      <AnimatedSection delay={0.15}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {/* Countries */}
          <div className="rounded-xl bg-card border border-border p-6">
            <p className="text-muted-foreground text-sm mb-4">{obs.audienceStory as string}</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={countryData} layout="vertical" margin={chartMargin}>
                <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fill: TICK_COLOR, fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: TICK_COLOR, fontSize: 11 }}
                  width={70}
                />
                <Tooltip contentStyle={tooltipStyle()} />
                <Bar dataKey="value" fill={PRIMARY} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Sources */}
          <div className="rounded-xl bg-card border border-border p-6">
            <p className="text-sm font-medium mb-4">{sourcesLabel}</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sourceData} layout="vertical" margin={chartMargin}>
                <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fill: TICK_COLOR, fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: TICK_COLOR, fontSize: 11 }}
                  width={70}
                />
                <Tooltip contentStyle={tooltipStyle()} />
                <Bar dataKey="value" fill={ACCENT} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </AnimatedSection>

      {/* 5. Chat & LLM Cost */}
      <AnimatedSection delay={0.2}>
        <div className="rounded-xl bg-card border border-border p-6 mb-12">
          <p className="text-muted-foreground text-sm mb-4">{chatNarrative}</p>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={timeSeries} margin={chartMargin}>
              <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fill: TICK_COLOR, fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fill: TICK_COLOR, fontSize: 11 }} />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: TICK_COLOR, fontSize: 11 }}
                tickFormatter={(v: number) => `$${v}`}
              />
              <Tooltip contentStyle={tooltipStyle()} />
              <Bar yAxisId="left" dataKey="chats" fill={ACCENT} radius={[4, 4, 0, 0]} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="tokenCost"
                stroke={GOLD}
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </AnimatedSection>

      {/* 6. Live Signals */}
      <AnimatedSection delay={0.25}>
        <div className="mb-12">
          <p className="text-sm font-medium mb-4">{obs.liveTitle as string}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SessionTimerCard label={obs.sessionDuration as string} />

            {/* Theme Chosen */}
            <div className="rounded-xl bg-card border border-border p-4">
              <p className="text-muted-foreground text-sm">{obs.themeChosen as string}</p>
              <p className="text-2xl font-bold mt-1">{isDarkMode() ? '🌙 Dark' : '☀️ Light'}</p>
              <p className="text-muted-foreground text-xs mt-1">
                {isDarkMode()
                  ? (obs.darkPref as string)?.replace('{pct}', String(darkPct))
                  : (obs.lightPref as string)?.replace('{pct}', String(lightPct))}
              </p>
            </div>

            {/* Language Split */}
            <div className="rounded-xl bg-card border border-border p-4">
              <p className="text-muted-foreground text-sm">{obs.langSplit as string}</p>
              <div className="mt-2 flex h-4 w-full overflow-hidden rounded-full">
                <div className="h-full bg-primary" style={{ width: '55%' }} />
                <div className="h-full bg-accent" style={{ width: '45%' }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>PT 55%</span>
                <span>EN 45%</span>
              </div>
            </div>

            <ScrollDepthCard label={obs.scrollDepth as string} />
          </div>
        </div>
      </AnimatedSection>

      {/* 7. Event Log */}
      <AnimatedSection delay={0.3}>
        <div className="rounded-xl bg-card border border-border p-6">
          <p className="text-sm font-medium mb-4">{obs.eventLogTitle as string}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">{eventLogCols.time}</th>
                  <th className="pb-2 pr-4 font-medium">{eventLogCols.event}</th>
                  <th className="pb-2 font-medium">{eventLogCols.source}</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev, i) => (
                  <tr
                    key={ev.id}
                    className={i % 2 === 0 ? 'bg-transparent' : 'bg-muted/30'}
                  >
                    <td className="py-2 pr-4 tabular-nums text-muted-foreground">{ev.time}</td>
                    <td className="py-2 pr-4">{ev.event}</td>
                    <td
                      className={`py-2 ${
                        ev.source === 'you' ? 'text-primary font-medium' : 'text-muted-foreground'
                      }`}
                    >
                      {ev.source}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AnimatedSection>
    </section>
  )
}
