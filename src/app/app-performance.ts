import {
  defineToolcraftPerformance,
  registerToolcraftRendererPipeline,
  type ToolcraftEnvelopePerformanceConfig,
  type ToolcraftRendererPipelinePassContract,
} from "@/toolcraft/runtime";

const shaderControlTargets = [
  "source.autoCycle",
  "source.progress",
  "source.timeScale",
  "source.opacity",
  "burn.startMode",
  "burn.randomSeed",
  "burn.centerX",
  "burn.centerY",
  "burn.width",
  "fire.emberWidth",
  "fire.noiseScale",
  "fire.edgeGlow",
  "fire.emberColor",
  "fire.fireColor",
  "fire.hotColor",
  "light.strength",
  "light.glowRadius",
  "light.bloomStrength",
  "light.bloomRadius",
  "heat.distortionStrength",
  "heat.distortionSize",
] as const;

export const burnFoilRendererPipeline = {
  interactionInvalidation: [
    {
      interaction: "initial-render",
      invalidates: ["source-texture", "burn-shader"],
      targets: ["source.image"],
    },
    {
      interaction: "media-import",
      invalidates: ["source-texture", "burn-shader"],
      targets: ["source.image"],
    },
    {
      interaction: "control-change",
      invalidates: ["burn-shader"],
      mustNotInvalidate: ["source-texture"],
      targets: shaderControlTargets,
    },
    {
      interaction: "animation-frame",
      invalidates: ["burn-shader"],
      mustNotInvalidate: ["source-texture"],
      targets: ["source.autoCycle", "source.timeScale"],
    },
    {
      interaction: "export",
      invalidates: ["burn-export"],
      targets: ["export.image.format", "export.image.resolution"],
    },
    {
      interaction: "viewport-drag",
      invalidates: [],
      mustNotInvalidate: ["source-texture", "burn-shader", "burn-export"],
      targets: ["canvas.viewport"],
    },
    {
      interaction: "viewport-zoom",
      invalidates: [],
      mustNotInvalidate: ["source-texture", "burn-shader", "burn-export"],
      targets: ["canvas.zoom"],
    },
  ],
  passes: [
    {
      cacheKey: ["source.image", "canvas.size", "canvas.renderScale"],
      cost: { dimensions: [], frequency: "discrete", relationship: "constant" },
      id: "source-texture",
      inputs: ["source.image", "canvas.size", "canvas.renderScale"],
      invalidatedBy: ["source.image", "canvas.size", "canvas.renderScale"],
      kind: "rasterize",
      lifecycle: { cache: "memoized", resourceScope: "renderer" },
      output: "source",
      quality: "retina",
      runsOn: "main",
    },
    {
      cost: { dimensions: [], frequency: "frame", relationship: "constant" },
      id: "burn-shader",
      inputs: ["source-texture", ...shaderControlTargets],
      invalidatedBy: ["source-texture", ...shaderControlTargets],
      kind: "pixel-transform",
      lifecycle: { cache: "none", resourceScope: "call" },
      output: "preview",
      quality: "retina",
      runsOn: "gpu",
    },
    {
      cost: { dimensions: [], frequency: "batch", relationship: "constant" },
      id: "burn-export",
      inputs: ["source-texture", "burn-shader", "export.image.format", "export.image.resolution"],
      invalidatedBy: ["export.image.format", "export.image.resolution"],
      kind: "export",
      lifecycle: { cache: "none", resourceScope: "call" },
      output: "export",
      quality: "export",
      runsOn: "gpu",
    },
  ],
  runtimeId: "burn-foil-webgl-v1",
} as const;

type BurnFoilRendererPipelinePasses = {
  "burn-export": ToolcraftRendererPipelinePassContract<void>;
  "burn-shader": ToolcraftRendererPipelinePassContract<void>;
  "source-texture": ToolcraftRendererPipelinePassContract<void>;
};

export const burnFoilRendererPipelineRegistration =
  registerToolcraftRendererPipeline<BurnFoilRendererPipelinePasses>()(
    burnFoilRendererPipeline,
  );

export const appPerformance: ToolcraftEnvelopePerformanceConfig =
  defineToolcraftPerformance({
    rendererPipeline: burnFoilRendererPipelineRegistration,
    rendererStrategy: "webgl",
    rendererTechnique: {
      exportRenderer: "webgl",
      fidelityRisks: [
        "WebGL GLSL noise and alpha blending can differ slightly from the original Rive WGSL renderer.",
      ],
      intentionalRasterizationReason:
        "The burn reveal is a texture-sampling shader with animated procedural noise and alpha.",
      layers: [
        {
          content: ["bitmap-media", "shader", "noise"],
          exportMode: "included",
          id: "burn-foil-output",
          intentionalRasterizationReason:
            "The burn effect depends on per-pixel texture sampling and procedural flame masks.",
          kind: "product-foreground",
          primitiveCount: "high",
          renderer: "webgl",
          uiSelector: "[data-burn-foil-canvas]",
        },
      ],
      performanceRisks: [
        "Autoplay redraws the WebGL pass every frame while active.",
        "Large canvas sizes and 2x render scale increase fragment workload.",
      ],
      previewRenderer: "webgl",
      productRepresentation: "pixel",
      rendererStrategy: "webgl",
      sourceRepresentation: "image-media",
      whyNotAlternativeStrategies: [
        "DOM and SVG cannot reproduce the per-pixel transparent burn mask.",
        "Canvas 2D would require a slower CPU rewrite of the shader math.",
        "WebGPU would be closer to the Rive WGSL source but has narrower browser availability.",
      ],
    },
    scenarios: [],
    usesCustomRenderer: true,
    workloadEnvelope: { dimensions: [] },
  });
