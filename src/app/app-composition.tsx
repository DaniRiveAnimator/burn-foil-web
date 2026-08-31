import type { ToolcraftAppComposition } from "@/toolcraft/runtime/react";

import { BurnFoilCanvas } from "@/burn-foil/BurnFoilCanvas";
import { burnFoilExportRenderer } from "@/burn-foil/burn-foil-export";

import { appSchema } from "./app-schema";
import { burnFoilRendererPipelineRegistration } from "./app-performance";

export const appComposition: ToolcraftAppComposition = {
  canvasContent: <BurnFoilCanvas />,
  exportRenderer: burnFoilExportRenderer,
  modelPresentation: { mode: "runtime" },
  renderDefaultCanvasMedia: false,
  rendererPipelineRegistration: burnFoilRendererPipelineRegistration,
  sceneBoundsProvider: ({ state }) => [
    {
      height: state.canvas.size.height,
      width: state.canvas.size.width,
      x: 0,
      y: 0,
    },
  ],
  schema: appSchema,
};
