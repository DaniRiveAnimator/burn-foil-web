export type BurnFoilQualityPreset = "full" | "lite";

export type BurnFoilImageTransform = {
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  rotationDeg?: number;
};

export type BurnFoilSettings = {
  bloomRadius: number;
  bloomStrength: number;
  burnWidth: number;
  centerX: number;
  centerY: number;
  distortionSize: number;
  distortionStrength: number;
  edgeGlow: number;
  emberColor: string;
  emberWidth: number;
  fireColor: string;
  fireIntensity: number;
  fireSize: number;
  glowRadius: number;
  hotColor: string;
  lightStrength: number;
  maxPixelSize: number;
  noiseScale: number;
  opacity: number;
  progress: number;
  qualityPreset: BurnFoilQualityPreset;
  randomSeed: number;
  sourceTintColor: string;
  sourceTintStrength: number;
  startMode: number;
  trailColor: string;
  trailStrength: number;
};
