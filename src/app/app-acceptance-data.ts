import type {
  ToolcraftComponentAcceptance,
  ToolcraftControlSectionInventoryEntry,
  ToolcraftProductReadiness,
  ToolcraftTransferMode,
} from "./acceptance/types";
import { appSchema } from "./app-schema";

const persistenceSlices =
  appSchema.persistence.storage === "localStorage"
    ? appSchema.persistence.include
    : [];

export function getBurnFoilBrowserTestName(id: string): string {
  return `browser: burn foil ${id} acceptance`;
}

type ControlAcceptanceInput = {
  componentType: string;
  expectedObservable: string;
  id: string;
  target: string;
};

function controlAcceptance({
  componentType,
  expectedObservable,
  id,
  target,
}: ControlAcceptanceInput): ToolcraftComponentAcceptance {
  return {
    automated: true,
    automatedTestName: "validates burn foil product schema and renderer mapping",
    browser: true,
    browserTestName: getBurnFoilBrowserTestName(id),
    componentType,
    evidence: "product-output",
    expectedObservable,
    fixture: "default burn source image",
    id,
    kind: "control",
    target,
    userAction: `Change ${target} in the controls panel.`,
  };
}

export const appTransferMode: ToolcraftTransferMode = {
  animationIntent: { mode: "none" },
  mode: "new-toolcraft-app",
  referenceInputs: [],
};

export const appProductReadiness: ToolcraftProductReadiness = {
  exportIntent: {
    image: { mode: "toolcraft-default" },
    svg: { mode: "not-requested" },
    video: { mode: "not-requested" },
  },
  interactionOwnership: [],
  mode: "product",
  productName: "Burn Foil Web",
  productSummary:
    "A WebGL burn-transition shader tool with source image upload and Toolcraft controls.",
  requestedBehavior:
    "Convert the existing Rive burn shader and Lua control behavior into a web Toolcraft app.",
  viewInteraction: {
    mode: "non-spatial",
    reason:
      "The output is a flat texture shader preview, not an editable 3D object.",
  },
};

const appAcceptanceSource: readonly ToolcraftComponentAcceptance[] = [
  {
    automated: true,
    automatedTestName:
      "validates burn foil product schema and renderer mapping",
    backgroundOutputCoverage: [
      "preview-hidden-when-excluded",
      "image-transparent-when-excluded",
      "infinity-viewport-color-and-dependency",
    ],
    browser: true,
    browserTestName: getBurnFoilBrowserTestName("background.include"),
    componentType: "switch",
    evidence: "rendered-pixels",
    expectedObservable:
      "Turning Background off leaves burned-out pixels transparent in preview and PNG output.",
    fixture: "default burn source image",
    id: "background.include",
    kind: "control",
    target: "export.includeBackground",
    userAction: "Toggle Background in Setup.",
  },
  controlAcceptance({
    componentType: "color",
    expectedObservable:
      "Changing Background color changes the visible canvas backdrop around transparent burned areas.",
    id: "background.color",
    target: "appearance.background",
  }),
  {
    automated: true,
    automatedTestName:
      "validates burn foil product schema and renderer mapping",
    browser: true,
    browserTestName: getBurnFoilBrowserTestName("source.image"),
    componentType: "fileDrop",
    evidence: "media-lifecycle",
    expectedObservable:
      "Uploading, rotating, flipping, removing, and resetting the source image changes the shader texture without aspect stretching.",
    fixture: "uploaded image plus default burn source image",
    id: "source.image",
    kind: "control",
    mediaLifecycleCoverage: [
      "upload",
      "remove",
      "reset",
      "default-remove",
      "default-reset",
      "rotate",
      "flip",
      "transform-output",
    ],
    target: "source.image",
    userAction:
      "Import an image through Image, use transform actions, remove it, and reset the section.",
  },
  controlAcceptance({
    componentType: "switch",
    expectedObservable:
      "Cycle toggles between autonomous burn progress and manual Progress control.",
    id: "source.autoCycle",
    target: "source.autoCycle",
  }),
  controlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Progress manually moves the transparent burn front when Cycle is off.",
    id: "source.progress",
    target: "source.progress",
  }),
  controlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Speed changes how quickly the autonomous burn front travels.",
    id: "source.timeScale",
    target: "source.timeScale",
  }),
  controlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Opacity changes the alpha of image and fire pixels together.",
    id: "source.opacity",
    target: "source.opacity",
  }),
  {
    ...controlAcceptance({
      componentType: "select",
      expectedObservable:
        "Start changes whether the burn begins from the center, a random point, a specific side, or a random side.",
      id: "burn.startMode",
      target: "burn.startMode",
    }),
    optionCoverage: "each-visible-item",
  },
  controlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Seed changes the random burn origin or random side while keeping the same source image.",
    id: "burn.randomSeed",
    target: "burn.randomSeed",
  }),
  controlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Center X moves the circular burn origin horizontally for center mode.",
    id: "burn.centerX",
    target: "burn.centerX",
  }),
  controlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Center Y moves the circular burn origin vertically for center mode.",
    id: "burn.centerY",
    target: "burn.centerY",
  }),
  controlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Burn width changes the thickness of the alpha reveal threshold.",
    id: "burn.width",
    target: "burn.width",
  }),
  controlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Ember width changes the flame band width around the burn front.",
    id: "fire.emberWidth",
    target: "fire.emberWidth",
  }),
  controlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Noise scale changes the ragged fire-front detail.",
    id: "fire.noiseScale",
    target: "fire.noiseScale",
  }),
  controlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Edge glow changes the visible brightness of the active burn edge.",
    id: "fire.edgeGlow",
    target: "fire.edgeGlow",
  }),
  controlAcceptance({
    componentType: "color",
    expectedObservable:
      "Ember color changes the darker outer fire color.",
    id: "fire.emberColor",
    target: "fire.emberColor",
  }),
  controlAcceptance({
    componentType: "color",
    expectedObservable:
      "Fire color changes the main orange flame color.",
    id: "fire.fireColor",
    target: "fire.fireColor",
  }),
  controlAcceptance({
    componentType: "color",
    expectedObservable:
      "Hot color changes the bright inner burn core.",
    id: "fire.hotColor",
    target: "fire.hotColor",
  }),
  controlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Light changes the broad glow around the active burn edge.",
    id: "light.strength",
    target: "light.strength",
  }),
  controlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Glow radius changes how far edge light spreads from the flame band.",
    id: "light.glowRadius",
    target: "light.glowRadius",
  }),
  controlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Bloom changes the soft emission strength around the burn.",
    id: "light.bloomStrength",
    target: "light.bloomStrength",
  }),
  controlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Bloom radius changes the width of the soft emission region.",
    id: "light.bloomRadius",
    target: "light.bloomRadius",
  }),
  controlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Distortion bends the source image near the heat edge.",
    id: "heat.distortionStrength",
    target: "heat.distortionStrength",
  }),
  controlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Distortion size changes the heat-warp radius around the burn front.",
    id: "heat.distortionSize",
    target: "heat.distortionSize",
  }),
  {
    automated: true,
    automatedTestName:
      "validates burn foil product schema and renderer mapping",
    browser: true,
    browserTestName: getBurnFoilBrowserTestName("canvas.sizing"),
    componentType: "canvas",
    evidence: "viewport-side-effect",
    expectedObservable:
      "Aspect ratio, Canvas width, and Canvas height remain editable and resize the shader output.",
    fixture: "900 by 900 shader canvas",
    id: "canvas.sizing",
    kind: "runtime",
    target: "canvas.size.width",
    userAction: "Change Canvas width and Canvas height in Setup.",
  },
  {
    automated: true,
    automatedTestName:
      "validates burn foil product schema and renderer mapping",
    browser: true,
    browserTestName: getBurnFoilBrowserTestName("canvas.infinity.mode"),
    componentType: "canvas",
    evidence: "viewport-side-effect",
    expectedObservable:
      "Infinity canvas hides finite sizing controls and restores the 900 by 900 finite canvas after disabling.",
    fixture: "900 by 900 shader canvas",
    id: "canvas.infinity.mode",
    infinityCanvasCoverage: "mode-and-restoration",
    kind: "runtime",
    target: "canvas.infinity",
    userAction: "Toggle Infinity canvas on and off.",
  },
  {
    automated: true,
    automatedTestName:
      "validates burn foil product schema and renderer mapping",
    browser: true,
    browserTestName: getBurnFoilBrowserTestName("canvas.infinity.export"),
    componentType: "canvas",
    evidence: "exported-bytes",
    expectedObservable:
      "Infinity PNG export crops to the shader scene bounds from sceneBoundsProvider.",
    fixture: "900 by 900 shader canvas",
    id: "canvas.infinity.export",
    infinityCanvasCoverage: "scene-bounds-image-export",
    kind: "runtime",
    target: "canvas.infinity",
    userAction: "Enable Infinity canvas and export PNG.",
  },
  {
    automated: true,
    automatedTestName:
      "validates burn foil product schema and renderer mapping",
    browser: true,
    browserTestName: getBurnFoilBrowserTestName("persistence.reload"),
    componentType: "persistence",
    evidence: "persistence-state",
    expectedObservable:
      "Burn settings, media state, canvas, and panel placement are restored after reload.",
    fixture: "edited shader controls and uploaded source image",
    id: "persistence.reload",
    kind: "runtime",
    persistenceCoverage: "reload",
    persistenceSlices,
    target: "source.progress",
    userAction: "Edit shader controls, wait for persistence, and reload the page.",
  },
  {
    automated: true,
    automatedTestName:
      "validates burn foil product schema and renderer mapping",
    browser: true,
    browserTestName: getBurnFoilBrowserTestName("export.image.format"),
    componentType: "select",
    evidence: "product-output",
    expectedObservable:
      "Changing export format updates the selected runtime image export format.",
    fixture: "default burn source image",
    id: "export.image.format",
    kind: "control",
    optionCoverage: ["png", "jpg"],
    target: "export.image.format",
    userAction: "Choose PNG and JPG in Image Export.",
  },
  {
    automated: true,
    automatedTestName:
      "validates burn foil product schema and renderer mapping",
    browser: true,
    browserTestName: getBurnFoilBrowserTestName("export.image.resolution"),
    componentType: "select",
    evidence: "product-output",
    expectedObservable:
      "Changing export resolution updates the selected runtime image export size.",
    fixture: "default burn source image",
    id: "export.image.resolution",
    kind: "control",
    optionCoverage: ["2k", "4k", "8k"],
    target: "export.image.resolution",
    userAction: "Choose 2K, 4K, and 8K in Image Export.",
  },
  {
    automated: true,
    automatedTestName:
      "validates burn foil product schema and renderer mapping",
    browser: true,
    browserTestName: getBurnFoilBrowserTestName("actions.export"),
    componentType: "panelActions",
    evidence: "exported-bytes",
    expectedObservable:
      "Export PNG downloads the shader-rendered burn transition with transparent burned pixels.",
    exportArtifactCoverage: "all-required-image-export-behavior",
    actionCoverage: ["export.image"],
    fixture: "default burn source image",
    id: "actions.export",
    kind: "control",
    target: "actions.export",
    userAction: "Click Export PNG.",
  },
];

export const appAcceptance: readonly ToolcraftComponentAcceptance[] =
  appAcceptanceSource;

export const appControlSectionInventory: readonly ToolcraftControlSectionInventoryEntry[] = [
  {
    entity: "Output background",
    entityId: "output-background",
    groupingReason:
      "The switch and color jointly define the preview and exported canvas background.",
    id: "background",
    targets: ["export.includeBackground", "appearance.background"],
    title: "Background",
  },
  {
    entity: "Source image",
    entityId: "source-image",
    groupingReason:
      "The file drop chooses the image texture consumed by the burn shader.",
    id: "source.part-source-image-164gk7v",
    targets: ["source.image"],
    title: "Image",
  },
  {
    entity: "Source timing",
    entityId: "source-timing",
    groupingReason:
      "These controls tune the burn cycle over the currently selected source image.",
    id: "source.part-source-autocycle-v2ihyv",
    targets: [
      "source.autoCycle",
      "source.progress",
      "source.timeScale",
      "source.opacity",
    ],
    title: "Source",
  },
  {
    entity: "Burn transition",
    entityId: "burn-transition",
    groupingReason:
      "These controls define where the transition starts and how wide the burned mask edge is.",
    id: "burn-shape",
    targets: [
      "burn.startMode",
      "burn.randomSeed",
      "burn.centerX",
      "burn.centerY",
      "burn.width",
    ],
    title: "Burn Shape",
  },
  {
    entity: "Fire treatment",
    entityId: "fire-treatment",
    groupingReason:
      "These controls tune the flame band noise, glow, and color ramp together.",
    id: "fire-detail",
    targets: [
      "fire.emberWidth",
      "fire.noiseScale",
      "fire.edgeGlow",
      "fire.emberColor",
      "fire.fireColor",
      "fire.hotColor",
    ],
    title: "Fire Detail",
  },
  {
    entity: "Heat and light",
    entityId: "heat-light",
    groupingReason:
      "These controls shape the broad glow, bloom, and heat distortion around the active burn edge.",
    id: "heat-light",
    targets: [
      "light.strength",
      "light.glowRadius",
      "light.bloomStrength",
      "light.bloomRadius",
      "heat.distortionStrength",
      "heat.distortionSize",
    ],
    title: "Heat And Light",
  },
  {
    entity: "Image export",
    entityId: "image-export",
    groupingReason:
      "These controls select the runtime PNG/JPG export format and output resolution.",
    id: "image-export",
    targets: ["export.image.format", "export.image.resolution"],
    title: "Image Export",
  },
];
