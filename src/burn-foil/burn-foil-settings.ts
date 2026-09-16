import type { ToolcraftState } from "@/toolcraft/runtime";

import type { BurnFoilQualityPreset, BurnFoilSettings } from "./burn-foil-types";

export type { BurnFoilQualityPreset, BurnFoilSettings } from "./burn-foil-types";

export const BURN_FOIL_SOURCE_TARGET = "source.image";

export const DEFAULT_SOURCE_IMAGE_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA5MDAgOTAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiNmZmZmZmYiLz48c3RvcCBvZmZzZXQ9IjAuNDUiIHN0b3AtY29sb3I9IiNlZWY0ZmYiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNkOWU2ZmYiLz48L2xpbmVhckdyYWRpZW50PjxsaW5lYXJHcmFkaWVudCBpZD0icyIgeDE9IjAiIHkxPSIwIiB4Mj0iMSIgeTI9IjEiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iI2ZmZmZmZiIgc3RvcC1vcGFjaXR5PSIwLjkiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM4ZmI3ZmYiIHN0b3Atb3BhY2l0eT0iMC4yNSIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHg9IjkwIiB5PSI5MCIgd2lkdGg9IjcyMCIgaGVpZ2h0PSI3MjAiIHJ4PSI1NiIgZmlsbD0idXJsKCNnKSIvPjxwYXRoIGQ9Ik0xNzAgNjUwIDY1MCAxNzAiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSI2NCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBvcGFjaXR5PSIwLjYyIi8+PHBhdGggZD0iTTIyMCA3NDUgNzQ1IDIyMCIgc3Ryb2tlPSJ1cmwoI3MpIiBzdHJva2Utd2lkdGg9IjI2IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48dGV4dCB4PSI0NTAiIHk9IjQzMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBIZWx2ZXRpY2EsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iNjQiIGZvbnQtd2VpZ2h0PSI3MDAiIGZpbGw9IiMxZDI0MzMiIG9wYWNpdHk9IjAuNzgiPkJVUk48L3RleHQ+PHRleHQgeD0iNDUwIiB5PSI1MDYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgSGVsdmV0aWNhLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjQ0IiBmb250LXdlaWdodD0iNjAwIiBmaWxsPSIjNDI1MjZiIiBvcGFjaXR5PSIwLjU1Ij5TT1VSQ0U8L3RleHQ+PC9zdmc+";

export function readBurnFoilSettings(
  values: Readonly<ToolcraftState["values"]>,
): BurnFoilSettings {
  return {
    bloomRadius: readNumber(values, "light.bloomRadius", 22),
    bloomStrength: readNumber(values, "light.bloomStrength", 28),
    burnWidth: readNumber(values, "burn.width", 9),
    centerX: readNumber(values, "burn.centerX", 50),
    centerY: readNumber(values, "burn.centerY", 52),
    distortionSize: readNumber(values, "heat.distortionSize", 35),
    distortionStrength: readNumber(values, "heat.distortionStrength", 36),
    edgeGlow: readNumber(values, "fire.edgeGlow", 55),
    emberColor: readColor(values, "fire.emberColor", "#B91208"),
    emberWidth: readNumber(values, "fire.emberWidth", 2.5),
    fireColor: readColor(values, "fire.fireColor", "#FF580C"),
    fireIntensity: readNumber(values, "fire.intensity", 125),
    fireSize: readNumber(values, "fire.flameSize", 130),
    glowRadius: readNumber(values, "light.glowRadius", 22),
    hotColor: readColor(values, "fire.hotColor", "#FFF69A"),
    lightStrength: readNumber(values, "light.strength", 45),
    maxPixelSize: readNumber(values, "performance.maxPixelSize", 1280),
    noiseScale: readNumber(values, "fire.noiseScale", 18),
    opacity: readNumber(values, "source.opacity", 100),
    progress: readNumber(values, "source.progress", 35),
    qualityPreset: readQualityPreset(values["shader.qualityPreset"]),
    randomSeed: readNumber(values, "burn.randomSeed", 12),
    sourceTintColor: readColor(values, "source.tintColor", "#FFFFFF"),
    sourceTintStrength: readNumber(values, "source.tintStrength", 0),
    startMode: readStartMode(values["burn.startMode"]),
    trailColor: readColor(values, "fire.trailColor", "#A33212"),
    trailStrength: readNumber(values, "fire.trailStrength", 115),
  };
}

export function readAutoplay(values: Readonly<ToolcraftState["values"]>): boolean {
  return values["source.autoCycle"] === true;
}

export function readTimeScale(values: Readonly<ToolcraftState["values"]>): number {
  return readNumber(values, "source.timeScale", 0.18);
}

function readNumber(
  values: Readonly<ToolcraftState["values"]>,
  target: string,
  fallback: number,
): number {
  const value = values[target];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readColor(
  values: Readonly<ToolcraftState["values"]>,
  target: string,
  fallback: string,
): string {
  const value = values[target];
  return typeof value === "string" ? value : fallback;
}

function readStartMode(value: unknown): number {
  if (typeof value !== "string") {
    return 6;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 6;
}

function readQualityPreset(value: unknown): BurnFoilQualityPreset {
  return value === "full" ? "full" : "lite";
}
