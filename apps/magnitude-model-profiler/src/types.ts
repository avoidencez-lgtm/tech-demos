export type HardwareKind = "apple" | "nvidia" | "cloud" | "cpu";

export type HardwarePreset = {
  id: string;
  name: string;
  subtitle: string;
  chip: string;
  cores: number;
  ramGb: number;
  gpuLabel: string;
  gpuVramGb: number;
  bandwidthGBs: number;
  kind: HardwareKind;
};

export type HardwareProfile = {
  presetId: string;
  ramGb: number;
  gpuVramGb: number;
  bandwidthGBs: number;
  chip: string;
  cores: number;
  gpuLabel: string;
  kind: HardwareKind;
  name: string;
};

export type QuantKind = "qat" | "ptq";

export type ModelConfig = {
  id: string;
  name: string;
  family: string;
  params: string;
  quant: string;
  quantKind: QuantKind;
  bits: number;
  contextK: number;
  weightGb: number;
  intelligence: number;
  baseAccuracy: number;
  speculative: boolean;
  vision: boolean;
  moe: boolean;
};

export type AxisScores = {
  speed: number;
  accuracy: number;
  intelligence: number;
  memory: number;
};

export type RankedModel = ModelConfig & {
  scores: AxisScores;
  composite: number;
  tokPerSec: [number, number];
  memoryUsedGb: number;
  headroomGb: number;
  fits: boolean;
  rank: number;
  badge: "balanced" | "fastest" | "smartest" | "lightweight" | null;
};

export type Harness = {
  id: string;
  name: string;
  hint: string;
  configHint: string;
};

export type AxisKey = keyof AxisScores;
