import { useEffect, useMemo, useState } from "react";
import { AXIS_META, HARNESSES, PRESETS } from "./data";
import { preferenceLabel, rankModels } from "./ranking";
import type { HardwareProfile, Harness, RankedModel } from "./types";

const SCAN_STEPS = ["Chip & cores", "Unified / system memory", "Achieved bandwidth", "Catalog fit"];

function Mark() {
  return (
    <svg className="mark" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M7 22 L16 8 L25 22" fill="none" stroke="#d7ff3c" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M11.5 22 L16 14.5 L20.5 22" fill="none" stroke="#4de3c1" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function fromPreset(id: string, ramGb?: number, gpuVramGb?: number): HardwareProfile {
  const preset = PRESETS.find((p) => p.id === id) ?? PRESETS[0];
  const ram = ramGb ?? preset.ramGb;
  const vram = gpuVramGb ?? preset.gpuVramGb;
  const ramScale = ram / preset.ramGb;
  const vramScale = vram / Math.max(preset.gpuVramGb, 1);
  const bandwidthGBs = Math.round(preset.bandwidthGBs * (0.72 + 0.28 * Math.min(ramScale, vramScale)));
  return {
    presetId: preset.id,
    name: preset.name,
    chip: preset.chip,
    cores: preset.cores,
    ramGb: ram,
    gpuVramGb: vram,
    gpuLabel: preset.gpuLabel,
    bandwidthGBs,
    kind: preset.kind,
  };
}

function mockConfig(model: RankedModel, harness: Harness) {
  return `# Simulated ${harness.configHint}
provider = "openai"
base_url = "http://127.0.0.1:4242/v1"
model = "${model.id}"
# ${model.name} · ${model.quant} · ${model.contextK}K ctx
# Expected ${model.tokPerSec[0]}–${model.tokPerSec[1]} tok/s`;
}

function AxisRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="axis">
      <span>{label}</span>
      <div className="bar" aria-hidden="true">
        <i style={{ width: `${value}%` }} />
      </div>
      <span className="axis-val">{value}</span>
    </div>
  );
}

export default function App() {
  const [presetId, setPresetId] = useState(PRESETS[0].id);
  const [ramGb, setRamGb] = useState(PRESETS[0].ramGb);
  const [gpuVramGb, setGpuVramGb] = useState(PRESETS[0].gpuVramGb);
  const [preference, setPreference] = useState(0.5);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [harnessId, setHarnessId] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);
  const [scanStep, setScanStep] = useState(0);

  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0];
  const hardware = useMemo(() => fromPreset(presetId, ramGb, gpuVramGb), [presetId, ramGb, gpuVramGb]);
  const ranked = useMemo(() => rankModels(hardware, preference), [hardware, preference]);
  const paired = ranked.find((m) => m.id === selectedId) ?? ranked.find((m) => m.fits) ?? ranked[0];
  const harness = HARNESSES.find((h) => h.id === harnessId) ?? null;
  const fitting = ranked.filter((m) => m.fits).length;

  useEffect(() => {
    setScanning(true);
    setScanStep(0);
    setSelectedId(null);
    const timers = [180, 380, 620, 860].map((ms, i) => window.setTimeout(() => setScanStep(i + 1), ms));
    const done = window.setTimeout(() => setScanning(false), 980);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(done);
    };
  }, [presetId]);

  function choosePreset(id: string) {
    const next = PRESETS.find((p) => p.id === id);
    if (!next) return;
    setPresetId(id);
    setRamGb(next.ramGb);
    setGpuVramGb(next.gpuVramGb);
  }

  const gpuCeiling = preset.kind === "apple" ? Math.max(preset.ramGb, 128) : 80;
  const ramMin = preset.kind === "cloud" ? 32 : 8;
  const ramMax = preset.kind === "cloud" ? 256 : 128;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <Mark />
          <div>
            <p className="eyebrow">Magnitude playground</p>
            <h1>Which local models fit this machine?</h1>
            <p className="lede">
              Pick a hardware profile. We rank complete model configs across Speed, Accuracy,
              Intelligence, and Memory — then optionally pair one with an agent harness.
            </p>
          </div>
        </div>
        <div className="pills">
          <span className="pill">simulated · no CLI required</span>
          <span className="pill">inspired by @magnitudedev/cli</span>
        </div>
      </header>

      <div className="shell">
        <aside className="panel side">
          <p className="section-label">
            <span>Machine</span>
            <span>{PRESETS.length} presets</span>
          </p>
          <div className="presets">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`preset${p.id === presetId ? " active" : ""}`}
                onClick={() => choosePreset(p.id)}
              >
                <span className="preset-name">{p.name}</span>
                <span className="preset-sub">{p.subtitle}</span>
              </button>
            ))}
          </div>

          <div className="stats">
            <div className="stat">
              <span>Chip</span>
              <strong>{hardware.chip}</strong>
            </div>
            <div className="stat">
              <span>Bandwidth</span>
              <strong>{hardware.bandwidthGBs} GB/s</strong>
            </div>
            <div className="stat">
              <span>Cores</span>
              <strong>{hardware.cores}</strong>
            </div>
            <div className="stat">
              <span>Accel</span>
              <strong>{hardware.gpuLabel}</strong>
            </div>
          </div>

          <div className="tweak">
            <label>
              System RAM
              <b>{ramGb} GB</b>
            </label>
            <input
              type="range"
              min={ramMin}
              max={ramMax}
              step={4}
              value={ramGb}
              onChange={(e) => setRamGb(Number(e.target.value))}
            />
          </div>
          <div className="tweak">
            <label>
              {preset.kind === "apple" ? "Unified memory window" : "GPU VRAM"}
              <b>{gpuVramGb} GB</b>
            </label>
            <input
              type="range"
              min={preset.kind === "apple" ? 8 : 0}
              max={gpuCeiling}
              step={preset.kind === "apple" ? 8 : 4}
              value={gpuVramGb}
              onChange={(e) => setGpuVramGb(Number(e.target.value))}
            />
          </div>
          <p className="note">
            Tweaks re-score the catalog instantly. This is a mock profiler — Magnitude would
            measure achieved bandwidth on the real machine.
          </p>
        </aside>

        <main className="main">
          <section className="panel toolbar">
            <div className="pref">
              <div className="pref-top">
                <span>Fastest</span>
                <strong>{preferenceLabel(preference)}</strong>
                <span>Smartest</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={preference}
                onChange={(e) => setPreference(Number(e.target.value))}
                aria-label="Fast versus smart preference"
              />
            </div>
            <div className="count">
              {fitting}/{ranked.length} fit · {hardware.ramGb} GB RAM
            </div>
          </section>

          {scanning ? (
            <section className="panel scan" aria-live="polite">
              <div className="scan-line" />
              <p className="section-label">
                <span>Profiling {hardware.name}</span>
                <span>demo scan</span>
              </p>
              <ol>
                {SCAN_STEPS.map((step, i) => (
                  <li key={step} className={scanStep > i ? "on" : ""}>
                    {step}
                    <em>{scanStep > i ? "ok" : "…"}</em>
                  </li>
                ))}
              </ol>
            </section>
          ) : (
            <section className="cards">
              {ranked.map((model) => (
                <article
                  key={model.id}
                  className={`panel card${selectedId === model.id ? " selected" : ""}${model.fits ? "" : " nofit"}`}
                >
                  <div className="card-top">
                    <div>
                      <div className="rank">#{model.rank}</div>
                      <h2>{model.name}</h2>
                      <p className="meta">
                        {model.params} · {model.quant} · {model.contextK}K context
                      </p>
                    </div>
                    <div className="badges">
                      {model.badge && <span className={`badge ${model.badge}`}>{model.badge}</span>}
                      {model.vision && <span className="badge">vision</span>}
                      {model.moe && <span className="badge">MoE</span>}
                      {model.speculative && <span className="badge">speculative</span>}
                      {!model.fits && <span className="badge warn">won't fit</span>}
                    </div>
                  </div>

                  <div className="metrics">
                    <span>
                      tok/s <b>~{model.tokPerSec[0]}–{model.tokPerSec[1]}</b>
                    </span>
                    <span>
                      footprint <b>{model.memoryUsedGb} GB</b>
                    </span>
                    <span>
                      headroom <b>{model.headroomGb} GB</b>
                    </span>
                  </div>

                  <div className="axes">
                    {AXIS_META.map((axis) => (
                      <AxisRow key={axis.key} label={axis.label} value={model.scores[axis.key]} />
                    ))}
                  </div>

                  <div className="card-actions">
                    <span className="tiny">
                      {model.quantKind === "qat"
                        ? "Quantization-aware — holds accuracy at 4-bit."
                        : "Post-train quant — smaller file, more quality loss."}
                    </span>
                    <button
                      type="button"
                      className={`pick${selectedId === model.id ? "" : " ghost"}`}
                      onClick={() => setSelectedId(model.id)}
                      disabled={!model.fits}
                    >
                      {selectedId === model.id ? "Selected" : "Use this"}
                    </button>
                  </div>
                </article>
              ))}
            </section>
          )}

          <section className="panel harness">
            <p className="section-label">
              <span>Pair with a harness</span>
              <span>optional</span>
            </p>
            <div className="harness-grid">
              {HARNESSES.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  className={`chip${harnessId === h.id ? " active" : ""}`}
                  onClick={() => setHarnessId(h.id === harnessId ? null : h.id)}
                >
                  {h.name}
                </button>
              ))}
            </div>
            {paired && harness && (
              <div className="pair">
                <h3>
                  {paired.name} → {harness.name}
                </h3>
                <p>
                  {harness.hint}. Magnitude would write {harness.configHint} and point the agent at
                  a local OpenAI-compatible server. Nothing is installed in this demo.
                </p>
                <pre>{mockConfig(paired, harness)}</pre>
              </div>
            )}
          </section>
        </main>
      </div>

      <p className="footer">
        Morning demo of the Magnitude idea: profile hardware, rank local models, connect an
        agent. Bookmark:{" "}
        <a href="https://x.com/akshay_pachaar/status/2095906342154424750">
          @akshay_pachaar
        </a>
        . Source:{" "}
        <a href="https://github.com/magnitudedev/magnitude">magnitudedev/magnitude</a>.
      </p>
    </div>
  );
}
