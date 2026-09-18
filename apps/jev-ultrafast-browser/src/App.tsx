import { useEffect, useMemo, useState } from 'react'
import {
  GOAL,
  HEADLINE,
  RESULTS,
  START_URL,
  STEPS,
  compatibleTargets,
  formatCalls,
  formatMs,
  targetFor,
  totalsThrough,
  type ActionTarget,
  type Operation,
  type PageState,
  type Step,
} from './mock/scenario'

type Mode = 'inspect' | 'realtime' | 'compare'
type Phase = 'idle' | 'deciding' | 'done'

function pct(n: number) {
  return `${Math.round(n * 100)}%`
}

function actionLabel(action: ActionTarget) {
  return action.value ? `${action.name} · ${action.value}` : action.name
}

function searchIndex(page: PageState) {
  if (page.kind === 'form') return page.trip === 'round' ? 7 : 6
  if (page.kind === 'calendar' || page.kind === 'suggest-to') return 8
  if (page.kind === 'suggest-from') return 7
  if (page.kind === 'results') return 5
  return 2
}

function travelerIndex(page: PageState) {
  if (page.kind === 'form') return page.trip === 'round' ? 6 : 5
  return undefined
}

function FlightsMock({
  page,
  actions,
  hotIndex,
  executed,
}: {
  page: PageState
  actions: ActionTarget[]
  hotIndex?: number
  executed: boolean
}) {
  const mark = (index: number) => ({
    'data-hot': hotIndex === index && !executed,
    'data-done': hotIndex === index && executed,
  })

  const badge = (index: number) => <span className="badge-n">[{index}]</span>

  return (
    <div className="flights">
      <div className="flights-brand">
        <h2>Flights</h2>
        <span>mock · Zürich → London · Sep 20, 2026</span>
      </div>

      {page.kind !== 'loading' && (
        <>
          <div className="trip-group" {...mark(1)}>
            {badge(1)}
            <div className="chip" data-on={page.trip === 'round'}>
              Round trip
            </div>
            <div className="chip" data-on={page.trip === 'oneway'}>
              One way
            </div>
            <div className="chip">Multi-city</div>
          </div>

          <div className="fields">
            <div className="field" {...mark(2)}>
              {badge(2)}
              <small>Where from?</small>
              <strong>{page.fromQuery || page.from || 'City or airport'}</strong>
            </div>
            <div className="field" {...mark(page.kind === 'suggest-from' ? 5 : 3)}>
              {badge(page.kind === 'suggest-from' ? 5 : 3)}
              <small>Where to?</small>
              <strong>{page.toQuery || page.to || 'City or airport'}</strong>
            </div>
            <div
              className="field"
              {...mark(page.kind === 'suggest-from' ? 6 : page.kind === 'suggest-to' ? 7 : 4)}
            >
              {badge(page.kind === 'suggest-from' ? 6 : page.kind === 'suggest-to' ? 7 : 4)}
              <small>Departure</small>
              <strong>{page.date || 'Select date'}</strong>
              {page.trip === 'round' && <em>Return empty · [5]</em>}
            </div>
          </div>
          <button className="search-btn" type="button" {...mark(searchIndex(page))}>
            {badge(searchIndex(page))}
            Search flights
          </button>
          <div className="trip-row" style={{ marginTop: 8 }}>
            <div className="chip" {...(travelerIndex(page) !== undefined ? mark(travelerIndex(page)!) : {})}>
              {travelerIndex(page) !== undefined ? badge(travelerIndex(page)!) : null}
              {page.travelers}
            </div>
            {page.kind === 'results' && (
              <div className="chip" data-on="true" {...mark(9)}>
                {badge(9)}
                12 results · Best
              </div>
            )}
          </div>
        </>
      )}

      {page.kind === 'suggest-from' && (
        <div className="suggest-list">
          <div className="suggest" {...mark(3)}>
            {badge(3)}
            <small>suggestion</small>
            <strong>Zürich (ZRH)</strong>
            <em>Zürich Airport</em>
          </div>
          <div className="suggest" {...mark(4)}>
            {badge(4)}
            <small>suggestion</small>
            <strong>Zurich Airport</strong>
            <em>Same airport, English label</em>
          </div>
        </div>
      )}

      {page.kind === 'suggest-to' && (
        <div className="suggest-list">
          {[
            [4, 'London (All airports)', 'LON'],
            [5, 'London Heathrow (LHR)', 'LHR'],
            [6, 'London Gatwick (LGW)', 'LGW'],
          ].map(([index, name, code]) => (
            <div key={String(index)} className="suggest" {...mark(Number(index))}>
              {badge(Number(index))}
              <small>suggestion</small>
              <strong>{name}</strong>
              <em>{code}</em>
            </div>
          ))}
        </div>
      )}

      {page.kind === 'calendar' && (
        <div className="calendar">
          <div className="cal-head">
            <span>September 2026</span>
            <span>Sun 20 is the goal</span>
          </div>
          <div className="cal-grid">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <span key={d}>{d}</span>
            ))}
            {Array.from({ length: 2 }, (_, i) => (
              <div key={`pad-${i}`} className="cal-day" data-muted="true" />
            ))}
            {Array.from({ length: 30 }, (_, i) => {
              const day = i + 1
              const indexed = day === 19 ? 5 : day === 20 ? 6 : day === 21 ? 7 : undefined
              return (
                <div
                  key={day}
                  className="cal-day"
                  data-goal={day === 20}
                  {...(indexed ? mark(indexed) : {})}
                >
                  {indexed ? badge(indexed) : null}
                  {day}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {page.kind === 'loading' && (
        <div className="loading">
          <div>
            <div className="spinner" />
            <div className="status-pill" style={{ padding: '10px 14px' }} {...mark(1)}>
              {badge(1)}
              Searching ZRH → LON · Sun, Sep 20
            </div>
          </div>
        </div>
      )}

      {page.kind === 'results' && (
        <div className="results-list">
          {RESULTS.map((row, i) => (
            <div key={row.id} className="result-card" {...mark(6 + i)}>
              {badge(6 + i)}
              <div>
                <small>{row.carrier}</small>
                <strong>
                  {row.flight} · {row.route}
                </strong>
                <em>
                  {row.time} · {row.dur}
                </em>
              </div>
              <div className="price">{row.price}</div>
            </div>
          ))}
        </div>
      )}

      <p className="empty-note" style={{ marginTop: 16 }}>
        {actions.length} indexed controls on this observation. Overlays are the action
        space — Jev never sees a screenshot in the default loop.
      </p>
    </div>
  )
}

function ProbabilityList({
  title,
  items,
  picked,
}: {
  title: string
  items: { key: string; label: string; value: number }[]
  picked?: string
}) {
  return (
    <div>
      <p className="panel-label">{title}</p>
      <div className={title.startsWith('operation') ? 'op-row' : 'target-list'}>
        {items.map((item) => (
          <div
            key={item.key}
            className={title.startsWith('operation') ? 'op' : 'target'}
            data-pick={picked === item.key}
          >
            <b>{item.label}</b>
            <div className="meter" aria-hidden="true">
              <i style={{ width: pct(item.value) }} />
            </div>
            <span className="pct">{pct(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const [mode, setMode] = useState<Mode>('inspect')
  const [cursor, setCursor] = useState(0)
  const [phase, setPhase] = useState<Phase>('idle')
  const [playing, setPlaying] = useState(false)

  const step: Step | undefined = STEPS[cursor]
  const visibleStep = step ?? STEPS[0]
  const hot = targetFor(visibleStep)
  const totals = totalsThrough(phase === 'idle' ? 0 : cursor + 1)
  const finished = phase === 'done' && cursor === STEPS.length - 1

  useEffect(() => {
    if (!playing) return
    if (phase === 'done' && cursor >= STEPS.length - 1) {
      setPlaying(false)
      return
    }
    const delay =
      mode === 'realtime' ? Math.max(220, (STEPS[cursor]?.decision.jevLatencyMs ?? 180) + 80) : 900
    const timer = window.setTimeout(() => {
      advance()
    }, delay)
    return () => window.clearTimeout(timer)
  }, [playing, phase, cursor, mode])

  function reset() {
    setCursor(0)
    setPhase('idle')
    setPlaying(false)
  }

  function advance() {
    if (phase === 'idle') {
      setPhase('deciding')
      setCursor(0)
      return
    }
    if (phase === 'deciding') {
      if (cursor >= STEPS.length - 1) {
        setPhase('done')
        setPlaying(false)
        return
      }
      setCursor((n) => n + 1)
      return
    }
    if (phase === 'done' && cursor < STEPS.length - 1) {
      setPhase('deciding')
      setCursor((n) => n + 1)
    }
  }

  const opItems = useMemo(() => {
    const ops: Operation[] = ['CLICK', 'TYPE_TEXT', 'WAIT', 'DONE', 'SELECT']
    return ops
      .map((key) => ({
        key,
        label: key,
        value: visibleStep.decision.operationProbs[key] ?? 0,
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [visibleStep])

  const clickItems = compatibleTargets(visibleStep.actions, 'CLICK')
    .map((action) => ({
      key: String(action.index),
      label: `[${action.index}] ${action.name}`,
      value:
        action.index === visibleStep.decision.clickTarget
          ? 0.76
          : Math.max(0.04, 0.24 / Math.max(1, compatibleTargets(visibleStep.actions, 'CLICK').length)),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  const typeItems = compatibleTargets(visibleStep.actions, 'TYPE_TEXT').map((action) => ({
    key: String(action.index),
    label: `[${action.index}] ${action.name}`,
    value: action.index === visibleStep.decision.typeTextTarget ? 0.82 : 0.18,
  }))

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <p className="eyebrow">TypeSafe Jev · indexed action space</p>
          <h1>Jev Ultrafast</h1>
          <p className="lede">
            Play the core idea from{' '}
            <a href="https://x.com/tonysimons_/status/2100656340817633313">Tony Simons’ bookmark</a>{' '}
            and{' '}
            <a href="https://github.com/browser-use/jev-ultrafast">browser-use/jev-ultrafast</a>
            : turn the page into numbered controls, then pick <code>operation + target</code> in one
            TypeSafe request. Mock Zürich → London flight search — no live browser, no API keys.
          </p>
        </div>
        <div className="top-actions">
          <span className="badge">offline mock · 11 decisions</span>
          <button className="ghost" type="button" onClick={reset}>
            Reset
          </button>
          <button
            className="secondary"
            type="button"
            onClick={() => {
              setPlaying(false)
              advance()
            }}
            disabled={finished}
          >
            {phase === 'idle' ? 'Start demo' : 'Choose next'}
          </button>
          <button
            className="primary"
            type="button"
            onClick={() => {
              if (phase === 'idle') setPhase('deciding')
              setPlaying((on) => !on)
            }}
            disabled={finished}
          >
            {playing ? 'Pause' : 'Run automatically'}
          </button>
        </div>
      </header>

      <section className="claims" aria-label="Published measurements">
        <div className="claim">
          <span>Recorded Flights run</span>
          <strong>7.073 s</strong>
          <em>Zürich → London, 1× playback</em>
        </div>
        <div className="claim">
          <span>Browser protocol calls</span>
          <strong>1,092 → 101</strong>
          <em>90.8% fewer CDP / snapshot calls</em>
        </div>
        <div className="claim">
          <span>Median wall clock</span>
          <strong>25% faster</strong>
          <em>9.450 s → 7.092 s across 3 pairs</em>
        </div>
        <div className="claim">
          <span>TypeSafe requests</span>
          <strong>22 → 17</strong>
          <em>One request per decision cycle</em>
        </div>
      </section>

      <section className="goal-bar">
        <div>
          <p className="panel-label">Natural-language goal</p>
          <p>{GOAL}</p>
        </div>
        <div className="modes" role="tablist" aria-label="Replay mode">
          {([
            ['inspect', 'Inspect'],
            ['realtime', 'Realtime'],
            ['compare', 'Compare'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              className="tab"
              type="button"
              data-active={mode === id}
              onClick={() => setMode(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <main className="workspace">
        <section className="panel browser">
          <div className="chrome">
            <div className="dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
            <div className="url">{START_URL}</div>
          </div>
          <FlightsMock
            page={visibleStep.page}
            actions={visibleStep.actions}
            hotIndex={phase === 'idle' ? undefined : hot}
            executed={phase !== 'deciding'}
          />
        </section>

        <section className="panel decision">
          {phase === 'idle' ? (
            <div>
              <p className="panel-label">One TypeSafe request</p>
              <div className="decision-head">
                <h2>Page → element table → op + target</h2>
                <p>
                  A naive agent screenshots, walks the accessibility tree, then asks an LLM what to
                  do and where. Jev snapshots visible controls once, then speculative heads share
                  that state.
                </p>
              </div>
              <pre className="shot">{`page → element table → operation
                     click_target
                     type_text_target
                     select_target
              CLICK [7] ─── use matching target
          TYPE_TEXT [3] ─── small LLM writes text`}</pre>
            </div>
          ) : (
            <>
              <div className="decision-head">
                <p className="panel-label">
                  Decision {visibleStep.id} / {STEPS.length} · Jev {visibleStep.decision.jevLatencyMs} ms
                  {visibleStep.decision.textLatencyMs
                    ? ` · text helper ${visibleStep.decision.textLatencyMs} ms`
                    : ''}
                </p>
                <h2>
                  {visibleStep.decision.operation}
                  {hot ? ` [${hot}]` : ''}
                </h2>
                <p>{visibleStep.decision.note}</p>
              </div>

              <ProbabilityList title="operation" items={opItems} picked={visibleStep.decision.operation} />

              {clickItems.length > 0 && (
                <ProbabilityList
                  title="click_target (speculative)"
                  items={clickItems}
                  picked={
                    visibleStep.decision.operation === 'CLICK'
                      ? String(visibleStep.decision.clickTarget)
                      : undefined
                  }
                />
              )}

              {typeItems.length > 0 && (
                <ProbabilityList
                  title="type_text_target (speculative)"
                  items={typeItems}
                  picked={
                    visibleStep.decision.operation === 'TYPE_TEXT'
                      ? String(visibleStep.decision.typeTextTarget)
                      : undefined
                  }
                />
              )}

              <div className="shot">
                <div>
                  execute <strong>{visibleStep.decision.operation}</strong>
                  {hot ? ` [${hot}]` : ''}
                  {visibleStep.decision.text ? ` “${visibleStep.decision.text}”` : ''}
                </div>
                {visibleStep.decision.text && (
                  <div className="helper">
                    small LLM → {visibleStep.decision.text} · {visibleStep.decision.textLatencyMs} ms
                  </div>
                )}
              </div>

              <div>
                <p className="panel-label">Current action space</p>
                <div className="action-table">
                  {visibleStep.actions.map((action) => (
                    <div
                      key={action.index}
                      className="action-row"
                      data-hot={hot === action.index}
                    >
                      <span>[{action.index}]</span>
                      <span>{action.role}</span>
                      <span>{actionLabel(action)}</span>
                      <span>{action.ops.join(' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>
      </main>

      <section className="footer-grid">
        <aside className="panel timeline">
          <p className="panel-label">Step timeline</p>
          <div className="tl-list">
            {STEPS.map((item, index) => {
              const reached = phase !== 'idle' && index <= cursor
              return (
                <button
                  key={item.id}
                  className="tl-item"
                  type="button"
                  data-current={phase !== 'idle' && index === cursor}
                  data-done={reached && index < cursor}
                  onClick={() => {
                    setPlaying(false)
                    setCursor(index)
                    setPhase('deciding')
                  }}
                >
                  <span className="tl-t">{formatMs(item.elapsedMs)}</span>
                  <span className="tl-op">{item.decision.operation}</span>
                  <span>
                    {item.decision.operation === 'TYPE_TEXT'
                      ? `TYPE_TEXT [${item.decision.typeTextTarget}] “${item.decision.text}”`
                      : item.decision.operation === 'CLICK'
                        ? `CLICK [${item.decision.clickTarget}]`
                        : item.decision.operation}
                  </span>
                  <span className="tl-t">{item.jevCalls} calls</span>
                </button>
              )
            })}
          </div>
        </aside>

        <aside className="panel compare">
          <p className="panel-label">
            {mode === 'compare' ? 'Naive per-step agent vs Jev' : 'Call-count contrast'}
          </p>
          <div className="compare-pair">
            <div className="arm" data-kind="naive">
              <h3>Naive per-step agent</h3>
              <div className="bar-track" aria-hidden="true">
                <i style={{ width: `${(totals.naiveCalls / HEADLINE.naiveCalls) * 100}%` }} />
              </div>
              <div className="kv">
                <div>
                  <span>protocol calls</span>
                  <strong>
                    {formatCalls(totals.naiveCalls)} / {formatCalls(HEADLINE.naiveCalls)}
                  </strong>
                </div>
                <div>
                  <span>clock</span>
                  <strong>{formatMs(totals.naiveMs)}</strong>
                </div>
                <div>
                  <span>model requests</span>
                  <strong>
                    {totals.naiveRequests} · median {HEADLINE.naiveRequests}
                  </strong>
                </div>
              </div>
              <ul>
                <li>Screenshot + AX tree every step</li>
                <li>Plan, then locate, then act</li>
                <li>Repeated node walks and geometry</li>
              </ul>
            </div>
            <div className="arm" data-kind="jev">
              <h3>TypeSafe Jev</h3>
              <div className="bar-track" aria-hidden="true">
                <i style={{ width: `${(totals.jevCalls / HEADLINE.jevCalls) * 100}%` }} />
              </div>
              <div className="kv">
                <div>
                  <span>protocol calls</span>
                  <strong>
                    {formatCalls(totals.jevCalls)} / {formatCalls(HEADLINE.jevCalls)}
                  </strong>
                </div>
                <div>
                  <span>clock</span>
                  <strong>{formatMs(totals.jevMs)}</strong>
                </div>
                <div>
                  <span>Jev requests</span>
                  <strong>
                    {totals.jevRequests} · median {HEADLINE.jevRequests}
                  </strong>
                </div>
              </div>
              <ul>
                <li>One atomic snapshot per cycle</li>
                <li>Op + target heads in one request</li>
                <li>LLM text only on TYPE_TEXT</li>
              </ul>
            </div>
          </div>
        </aside>
      </section>
    </div>
  )
}
