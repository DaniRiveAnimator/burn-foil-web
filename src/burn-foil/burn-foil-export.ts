import type {
  ToolcraftImageAsset,
  ToolcraftProductExportRenderer,
  ToolcraftState,
} from "@/toolcraft/runtime";

import {
  BURN_FOIL_SOURCE_TARGET,
  DEFAULT_SOURCE_IMAGE_DATA_URL,
  readBurnFoilSettings,
} from "./burn-foil-settings";
import { loadBurnFoilImage, renderBurnFoilWebgl } from "./burn-foil-webgl";
import { readCachedBurnFoilSourceImage } from "./source-image-cache";

export const burnFoilExportRenderer: ToolcraftProductExportRenderer = {
  baseFileName: "burn-foil-reveal",
  async renderFrame({ context, frame, state, timeSeconds }) {
    const sourceAsset = getSourceAsset(state);
    const sourceUrl = sourceAsset
      ? readCachedBurnFoilSourceImage(sourceAsset.id) ??
        readCachedBurnFoilSourceImage(sourceAsset.resourceRef) ??
        DEFAULT_SOURCE_IMAGE_DATA_URL
      : DEFAULT_SOURCE_IMAGE_DATA_URL;
    const sourceImage = await loadBurnFoilImage(sourceUrl);
    const canvas = document.createElement("canvas");

    renderBurnFoilWebgl({
      cssHeight: frame.height,
      cssWidth: frame.width,
      pixelRatio: 1,
      settings: readBurnFoilSettings(state.values),
      sourceImage,
      targetCanvas: canvas,
      timeSeconds,
      transform: sourceAsset?.transform,
    });

    context.drawImage(canvas, frame.x, frame.y, frame.width, frame.height);
  },
};

function getSourceAsset(state: Readonly<ToolcraftState>): ToolcraftImageAsset | null {
  return state.mediaAssets.find(
    (asset): asset is ToolcraftImageAsset =>
      asset.assetKind === "image" &&
      asset.lifecycle !== "unavailable" &&
      asset.sourceTarget === BURN_FOIL_SOURCE_TARGET,
  ) ?? null;
}
