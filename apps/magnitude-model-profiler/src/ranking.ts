import { MODELS } from "./data";
import type { HardwareProfile, RankedModel } from "./types";

function clamp(n: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, n));
}

function contextGb(contextK: number) {
  // Rough KV-cache estimate for a long agent trajectory.
  return (contextK * 1024 * 2 * 2) / 1e9 + 0.4;
}

function acceleratorGb(hw: HardwareProfile) {
  if (hw.kind === "apple") return hw.ramGb * 0.82;
  return hw.gpuVramGb;
}

function estimateToks(hw: HardwareProfile, weightGb: number, speculative: boolean) {
  const accel = acceleratorGb(hw);
  const fullyOnAccel = weightGb <= accel;
  const spillPenalty = fullyOnAccel ? 1 : hw.kind === "apple" ? 0.72 : 0.32;
  const efficiency =
    hw.kind === "apple" ? 0.52 : hw.kind === "nvidia" ? 0.62 : hw.kind === "cloud" ? 0.7 : 0.22;
  const spec = speculative ? 1.32 : 1;
  const mid = (hw.bandwidthGBs / Math.max(weightGb, 0.8)) * efficiency * spillPenalty * spec;
  const lo = Math.max(4, Math.round(mid * 0.86));
  const hi = Math.max(lo + 2, Math.round(mid * 1.14));
  return [lo, hi] as [number, number];
}

function speedScore(tokHi: number) {
  // ~8 tok/s is barely usable for agents; ~80+ feels snappy.
  return clamp(((tokHi - 6) / 90) * 100);
}

function memoryScore(hw: HardwareProfile, used: number, weightGb: number) {
  const pool = hw.kind === "nvidia" || hw.kind === "cloud" ? hw.gpuVramGb + hw.ramGb * 0.25 : hw.ramGb;
  const headroom = pool - used;
  if (headroom < 0) return 0;
  const efficiency = clamp(100 - weightGb * 1.6, 18, 100);
  const comfort = clamp(38 + headroom * 2.4, 0, 100);
  return clamp(efficiency * 0.45 + comfort * 0.55);
}

function accuracyScore(baseAccuracy: number, quantKind: "qat" | "ptq", bits: number) {
  const qatBonus = quantKind === "qat" ? 8 : 0;
  const bitCurve = bits >= 8 ? 6 : bits >= 5 ? 2 : 0;
  return clamp(baseAccuracy + qatBonus + bitCurve - (4 - Math.min(bits, 4)) * 1.5);
}

export function rankModels(hw: HardwareProfile, preference: number): RankedModel[] {
  const pref = clamp(preference, 0, 1);
  const speedW = 0.48 * (1 - pref) + 0.1 * pref;
  const intelW = 0.08 * (1 - pref) + 0.42 * pref;
  const accW = 0.18 * (1 - pref) + 0.32 * pref;
  const memW = 0.26 * (1 - pref) + 0.16 * pref;

  const scored = MODELS.map((model) => {
    const kv = contextGb(model.contextK);
    const memoryUsedGb = Number((model.weightGb + kv).toFixed(1));
    const pool =
      hw.kind === "nvidia" || hw.kind === "cloud" ? hw.gpuVramGb + hw.ramGb * 0.35 : hw.ramGb * 0.88;
    const headroomGb = Number((pool - memoryUsedGb).toFixed(1));
    const fits = headroomGb >= 0.4;
    const tokPerSec = estimateToks(hw, model.weightGb, model.speculative);
    const scores = {
      speed: Math.round(speedScore(tokPerSec[1])),
      accuracy: Math.round(accuracyScore(model.baseAccuracy, model.quantKind, model.bits)),
      intelligence: Math.round(model.intelligence),
      memory: Math.round(memoryScore(hw, memoryUsedGb, model.weightGb)),
    };
    const composite = fits
      ? scores.speed * speedW +
        scores.accuracy * accW +
        scores.intelligence * intelW +
        scores.memory * memW
      : scores.intelligence * 0.15 - 40;

    return {
      ...model,
      scores,
      composite,
      tokPerSec,
      memoryUsedGb,
      headroomGb,
      fits,
      rank: 0,
      badge: null as RankedModel["badge"],
    };
  });

  scored.sort((a, b) => {
    if (a.fits !== b.fits) return a.fits ? -1 : 1;
    return b.composite - a.composite;
  });

  const fitting = scored.filter((m) => m.fits);
  const fastest = fitting.reduce((best, m) => (m.scores.speed > best.scores.speed ? m : best), fitting[0]);
  const smartest = fitting.reduce(
    (best, m) => (m.scores.intelligence > best.scores.intelligence ? m : best),
    fitting[0],
  );
  const lightest = fitting.reduce((best, m) => (m.weightGb < best.weightGb ? m : best), fitting[0]);
  const balanced = fitting[0];

  return scored.map((model, i) => {
    let badge: RankedModel["badge"] = null;
    if (model.fits && model.id === balanced?.id) badge = "balanced";
    else if (model.fits && model.id === smartest?.id) badge = "smartest";
    else if (model.fits && model.id === fastest?.id) badge = "fastest";
    else if (model.fits && model.id === lightest?.id) badge = "lightweight";
    return { ...model, rank: i + 1, badge };
  });
}

export function preferenceLabel(preference: number) {
  if (preference < 0.28) return "Fastest";
  if (preference < 0.45) return "Snappy";
  if (preference < 0.58) return "Balanced";
  if (preference < 0.75) return "Capable";
  return "Smartest";
}
