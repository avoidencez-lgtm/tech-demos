import { useMemo, useState } from 'react'
import { renderMarkdown } from './lib/markdown'
import {
  discoverSkills,
  initialize,
  loadSkillMarkdown,
  readSkillMetadata,
  type LogEntry,
} from './mock/mcp'
import {
  SERVER_INFO,
  tokensForCatalog,
  tokensForSkill,
  type MockSkill,
  type SkillIndexEntry,
  type SkillMetadata,
} from './mock/skills'

type StepId = 1 | 2 | 3 | 4
type ViewMode = 'source' | 'rendered'

const STEPS: { id: StepId; title: string; copy: string }[] = [
  { id: 1, title: 'Connect', copy: 'Handshake an MCP server' },
  { id: 2, title: 'Discover', copy: 'Read skill://index.json' },
  { id: 3, title: 'Metadata', copy: 'Inspect name, URI, _meta' },
  { id: 4, title: 'Load', copy: 'Fetch SKILL.md on demand' },
]

function stepState(id: StepId, current: StepId): 'todo' | 'active' | 'done' {
  if (id < current) return 'done'
  if (id === current) return 'active'
  return 'todo'
}

export default function App() {
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState<StepId>(1)
  const [connected, setConnected] = useState(false)
  const [catalog, setCatalog] = useState<SkillIndexEntry[]>([])
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<SkillMetadata | null>(null)
  const [loadedSkill, setLoadedSkill] = useState<MockSkill | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [view, setView] = useState<ViewMode>('source')

  const catalogTokens = catalog.length ? tokensForCatalog() : 0
  const skillTokens = loadedSkill ? tokensForSkill(loadedSkill) : 0
  const contextTokens = catalogTokens + skillTokens
  const contextCap = 1800

  const selectedEntry = useMemo(
    () => catalog.find((skill) => skill.name === selectedName) ?? null,
    [catalog, selectedName],
  )

  function appendLogs(entries: LogEntry[]) {
    setLogs((current) => [...entries, ...current].slice(0, 24))
  }

  function reset() {
    setBusy(false)
    setStep(1)
    setConnected(false)
    setCatalog([])
    setSelectedName(null)
    setMetadata(null)
    setLoadedSkill(null)
    setLogs([])
    setView('source')
  }

  async function onConnect() {
    setBusy(true)
    try {
      const result = await initialize()
      appendLogs(result.logs)
      setConnected(true)
      setStep(2)
    } finally {
      setBusy(false)
    }
  }

  async function onDiscover() {
    setBusy(true)
    try {
      const result = await discoverSkills()
      appendLogs(result.logs)
      setCatalog(result.skills)
      setStep(3)
    } finally {
      setBusy(false)
    }
  }

  async function onInspect(name: string) {
    setBusy(true)
    setSelectedName(name)
    setLoadedSkill(null)
    setView('source')
    try {
      const result = await readSkillMetadata(name)
      appendLogs(result.logs)
      setMetadata(result.metadata)
      setStep(3)
    } finally {
      setBusy(false)
    }
  }

  async function onLoad() {
    if (!selectedName) return
    setBusy(true)
    try {
      const result = await loadSkillMarkdown(selectedName)
      appendLogs(result.logs)
      setLoadedSkill(result.skill)
      setStep(4)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <p className="eyebrow">SEP-2640 · io.modelcontextprotocol/skills</p>
          <h1>Skills over MCP</h1>
          <p className="lede">
            Play the extension flow from{' '}
            <a href="https://x.com/dani_avila7/status/2099325795822956575">
              Daniel San’s bookmark
            </a>
            : connect a server, discover the catalog, inspect metadata, then load{' '}
            <code>SKILL.md</code> only when you need it. Offline mock — no live MCP
            process required.
          </p>
        </div>
        <div className="top-actions">
          <span className="badge">mock · acme-ops-mcp</span>
          <button className="ghost" type="button" onClick={reset}>
            Replay
          </button>
        </div>
      </header>

      <nav className="stepper" aria-label="Discovery flow">
        {STEPS.map((item) => (
          <div key={item.id} className="step" data-state={stepState(item.id, step)}>
            <span className="step-index">{item.id}</span>
            <div>
              <h2>{item.title}</h2>
              <p>{item.copy}</p>
            </div>
          </div>
        ))}
      </nav>

      <main className="workspace">
        <section className="panel server-card">
          <p className="panel-label">MCP server</p>
          <h2 className="server-name">{connected ? SERVER_INFO.name : 'Not connected'}</h2>
          <p className="server-meta">
            {connected
              ? `v${SERVER_INFO.version} · ${SERVER_INFO.protocolVersion}`
              : 'Initialize to advertise the skills extension.'}
          </p>
          <div className="kv">
            <div>
              <span>extension</span>
              <strong>io.modelcontextprotocol/skills</strong>
            </div>
            <div>
              <span>index</span>
              <strong>skill://index.json</strong>
            </div>
            <div>
              <span>skills</span>
              <strong>{catalog.length ? `${catalog.length} discovered` : '—'}</strong>
            </div>
          </div>
          <div className="meter">
            <div className="meter-head">
              <span>Context so far</span>
              <span>
                {contextTokens} tok · catalog {catalogTokens} · body {skillTokens}
              </span>
            </div>
            <div className="meter-track" aria-hidden="true">
              <div
                className="meter-catalog"
                style={{ width: `${(catalogTokens / contextCap) * 100}%` }}
              />
              <div
                className="meter-skill"
                style={{ width: `${(skillTokens / contextCap) * 100}%` }}
              />
            </div>
          </div>
        </section>

        <section className="panel catalog">
          <p className="panel-label">Available skills</p>
          {catalog.length === 0 ? (
            <div className="empty" style={{ minHeight: 220 }}>
              <div>
                <h2>Nothing listed yet</h2>
                <p>Discover the catalog after the server handshake.</p>
              </div>
            </div>
          ) : (
            <div className="skill-list">
              {catalog.map((skill) => (
                <button
                  key={skill.name}
                  className="skill-card"
                  type="button"
                  data-selected={selectedName === skill.name}
                  onClick={() => void onInspect(skill.name)}
                  disabled={busy}
                >
                  <header>
                    <h3>{skill.name}</h3>
                    <small>{skill.type}</small>
                  </header>
                  <p>{skill.description}</p>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="panel detail">
          {!connected && (
            <div className="empty">
              <div>
                <h2>Start at the server</h2>
                <p>
                  A host checks whether the connected MCP server supports the skills
                  extension, then walks discover → metadata → load.
                </p>
                <p style={{ marginTop: 18 }}>
                  <button className="primary" type="button" onClick={() => void onConnect()} disabled={busy}>
                    {busy ? 'Initializing…' : '1. Connect MCP server'}
                  </button>
                </p>
              </div>
            </div>
          )}

          {connected && catalog.length === 0 && (
            <div className="empty">
              <div>
                <h2>Extension is on</h2>
                <p>
                  {SERVER_INFO.name} advertised{' '}
                  <code>io.modelcontextprotocol/skills</code>. Read the well-known
                  index next — names and descriptions only.
                </p>
                <p style={{ marginTop: 18 }}>
                  <button className="primary" type="button" onClick={() => void onDiscover()} disabled={busy}>
                    {busy ? 'Reading index…' : '2. Discover available skills'}
                  </button>
                </p>
              </div>
            </div>
          )}

          {connected && catalog.length > 0 && !metadata && (
            <div className="empty">
              <div>
                <h2>Pick a skill</h2>
                <p>
                  The catalog is cheap context. Click a skill on the left to fetch
                  resource metadata without pulling the full markdown.
                </p>
              </div>
            </div>
          )}

          {metadata && selectedEntry && (
            <>
              <div className="detail-head">
                <div>
                  <p className="eyebrow">{loadedSkill ? 'Loaded SKILL.md' : 'Skill metadata'}</p>
                  <h2>{metadata.name}</h2>
                  <p className="uri">{metadata.uri}</p>
                </div>
                <div className="top-actions">
                  {!loadedSkill ? (
                    <button className="secondary" type="button" onClick={() => void onLoad()} disabled={busy}>
                      {busy ? 'Reading resource…' : '4. Load SKILL.md'}
                    </button>
                  ) : (
                    <div className="tabs" role="tablist">
                      <button
                        className="tab"
                        type="button"
                        data-active={view === 'source'}
                        onClick={() => setView('source')}
                      >
                        Source
                      </button>
                      <button
                        className="tab"
                        type="button"
                        data-active={view === 'rendered'}
                        onClick={() => setView('rendered')}
                      >
                        Rendered
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="detail-body">
                {!loadedSkill && (
                  <>
                    <div className="meta-grid">
                      <div className="meta-item">
                        <span>description</span>
                        <p>{metadata.description}</p>
                      </div>
                      <div className="meta-item">
                        <span>mimeType</span>
                        <p>{metadata.mimeType}</p>
                      </div>
                      <div className="meta-item">
                        <span>author</span>
                        <p>{metadata._meta['io.modelcontextprotocol.skills/author']}</p>
                      </div>
                      <div className="meta-item">
                        <span>version</span>
                        <p>{metadata._meta['io.modelcontextprotocol.skills/version']}</p>
                      </div>
                    </div>
                    <pre className="json-block">{JSON.stringify(metadata, null, 2)}</pre>
                  </>
                )}
                {loadedSkill && view === 'source' && (
                  <pre className="md-block">{loadedSkill.body}</pre>
                )}
                {loadedSkill && view === 'rendered' && (
                  <div
                    className="markdown"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(loadedSkill.body) }}
                  />
                )}
              </div>
            </>
          )}
        </section>
      </main>

      <aside className="log-dock">
        <div className="log-head">
          <span>MCP protocol log</span>
          <span>{logs.length ? `${logs.length} events` : 'waiting'}</span>
        </div>
        <div className="log-list">
          {logs.length === 0 ? (
            <div className="log-idle">
              <span className="log-dir">idle</span>
              <span className="log-method">—</span>
              <span className="log-summary">Connect to start the mocked JSON-RPC exchange.</span>
            </div>
          ) : (
            logs.map((entry) => (
              <details key={entry.id} className="log-row" data-dir={entry.direction}>
                <summary>
                  <span className="log-dir">{entry.direction}</span>
                  <span className="log-method">{entry.method}</span>
                  <span className="log-summary">{entry.summary}</span>
                </summary>
                <pre className="json-block">
                  {JSON.stringify(entry.payload, null, 2)}
                </pre>
              </details>
            ))
          )}
        </div>
      </aside>
    </div>
  )
}
