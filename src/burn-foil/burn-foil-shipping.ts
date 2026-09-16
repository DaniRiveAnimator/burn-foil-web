export {
  loadBurnFoilImage,
  renderBurnFoilWebgl,
} from "./burn-foil-webgl";
export type {
  BurnFoilImageTransform,
  BurnFoilQualityPreset,
  BurnFoilSettings,
} from "./burn-foil-types";

import type { BurnFoilSettings } from "./burn-foil-types";

export const burnFoilLitePreset: BurnFoilSettings = {
  bloomRadius: 22,
  bloomStrength: 28,
  burnWidth: 9,
  centerX: 50,
  centerY: 52,
  distortionSize: 35,
  distortionStrength: 36,
  edgeGlow: 55,
  emberColor: "#B91208",
  emberWidth: 2.5,
  fireColor: "#FF580C",
  fireIntensity: 125,
  fireSize: 130,
  glowRadius: 22,
  hotColor: "#FFF69A",
  lightStrength: 45,
  maxPixelSize: 1280,
  noiseScale: 18,
  opacity: 100,
  progress: 35,
  qualityPreset: "lite",
  randomSeed: 12,
  sourceTintColor: "#FFFFFF",
  sourceTintStrength: 0,
  startMode: 6,
  trailColor: "#A33212",
  trailStrength: 115,
};
