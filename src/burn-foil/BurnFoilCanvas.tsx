"use client";

import * as React from "react";

import {
  useToolcraftMediaPresentationUrls,
  useToolcraftProductSceneFrame,
  useToolcraftSelector,
} from "@/toolcraft/runtime/react";
import type {
  ToolcraftImageAsset,
  ToolcraftMediaAsset,
  ToolcraftState,
} from "@/toolcraft/runtime";

import {
  BURN_FOIL_SOURCE_TARGET,
  DEFAULT_SOURCE_IMAGE_DATA_URL,
  readAutoplay,
  readBurnFoilSettings,
  readTimeScale,
} from "./burn-foil-settings";
import { loadBurnFoilImage, renderBurnFoilWebgl } from "./burn-foil-webgl";
import { cacheSourceUrlAsDataUrl } from "./source-image-cache";
import styles from "./BurnFoilCanvas.module.css";

type BurnFoilStateSlice = {
  mediaAssets: ToolcraftMediaAsset[];
  values: ToolcraftState["values"];
};

function selectBurnFoilState(state: ToolcraftState): BurnFoilStateSlice {
  return {
    mediaAssets: state.mediaAssets.filter(
      (asset): asset is ToolcraftImageAsset =>
        asset.assetKind === "image" &&
        asset.lifecycle !== "unavailable" &&
        asset.sourceTarget === BURN_FOIL_SOURCE_TARGET,
    ),
    values: state.values,
  };
}

function getSourceAsset(
  mediaAssets: readonly ToolcraftMediaAsset[],
): ToolcraftImageAsset | null {
  return mediaAssets.find(
    (asset): asset is ToolcraftImageAsset =>
      asset.assetKind === "image" && asset.lifecycle !== "unavailable",
  ) ?? null;
}

export function BurnFoilCanvas(): React.JSX.Element {
  const frame = useToolcraftProductSceneFrame();
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const state = useToolcraftSelector(selectBurnFoilState);
  const sourceAsset = getSourceAsset(state.mediaAssets);
  const presentationUrls = useToolcraftMediaPresentationUrls(state.mediaAssets);
  const sourceUrl = sourceAsset
    ? presentationUrls.get(sourceAsset.id) ?? DEFAULT_SOURCE_IMAGE_DATA_URL
    : DEFAULT_SOURCE_IMAGE_DATA_URL;
  const settings = React.useMemo(
    () => readBurnFoilSettings(state.values),
    [state.values],
  );
  const autoPlay = readAutoplay(state.values);
  const timeScale = readTimeScale(state.values);

  React.useEffect(() => {
    if (!sourceAsset || !sourceUrl) {
      return;
    }
    void Promise.all([
      cacheSourceUrlAsDataUrl(sourceAsset.id, sourceUrl),
      cacheSourceUrlAsDataUrl(sourceAsset.resourceRef, sourceUrl),
    ]).catch(() => undefined);
  }, [sourceAsset, sourceUrl]);

  React.useEffect(() => {
    if (frame.kind !== "finite" && frame.kind !== "infinite") {
      return;
    }

    let alive = true;
    let raf = 0;
    let start = performance.now();
    const manualTimeSeconds = start / 1000;
    let image: HTMLImageElement | null = null;

    void loadBurnFoilImage(sourceUrl).then(
      (loadedImage) => {
        if (!alive) {
          return;
        }
        image = loadedImage;
        setError(null);
        const draw = () => {
          if (!alive || !image || !canvasRef.current || !frame.rect) {
            return;
          }
          const elapsed = ((performance.now() - start) / 1000) * timeScale;
          const timeSeconds = autoPlay ? elapsed : manualTimeSeconds;
          const progress = autoPlay
            ? (elapsed - Math.floor(elapsed)) * 100
            : settings.progress;
          const pixelRatio = getPreviewPixelRatio({
            cssHeight: frame.rect.height,
            cssWidth: frame.rect.width,
            maxPixelSize: settings.maxPixelSize,
          });
          renderBurnFoilWebgl({
            cssHeight: frame.rect.height,
            cssWidth: frame.rect.width,
            pixelRatio,
            settings: { ...settings, progress },
            sourceImage: image,
            targetCanvas: canvasRef.current,
            timeSeconds,
            transform: sourceAsset?.transform,
          });
          if (autoPlay) {
            raf = window.requestAnimationFrame(draw);
          }
        };
        draw();
      },
      (reason: unknown) => {
        if (alive) {
          setError(reason instanceof Error ? reason.message : "Unable to load image.");
        }
      },
    );

    return () => {
      alive = false;
      window.cancelAnimationFrame(raf);
      start = 0;
    };
  }, [
    autoPlay,
    frame,
    settings,
    sourceAsset?.transform,
    sourceUrl,
    timeScale,
  ]);

  if (frame.kind !== "finite" && frame.kind !== "infinite") {
    return <div className={styles.stage} data-toolcraft-product-output="" />;
  }

  return (
    <div className={styles.stage} data-toolcraft-product-output="">
      {error ? (
        <div className={styles.fallback}>{error}</div>
      ) : (
        <canvas
          aria-label="Burn foil shader preview"
          className={styles.canvas}
          data-burn-foil-canvas=""
          ref={canvasRef}
        />
      )}
    </div>
  );
}

function getPreviewPixelRatio({
  cssHeight,
  cssWidth,
  maxPixelSize,
}: {
  cssHeight: number;
  cssWidth: number;
  maxPixelSize: number;
}): number {
  const maxCssSize = Math.max(cssWidth, cssHeight, 1);
  const cappedRatio = clamp(maxPixelSize, 320, 2400) / maxCssSize;
  return Math.max(0.5, Math.min(window.devicePixelRatio, cappedRatio));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
