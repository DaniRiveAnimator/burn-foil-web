import { describe, expect, it } from "vitest";

import {
  appAcceptance,
  validateProductAcceptanceCoverage,
} from "./app-acceptance";
import { appPerformance } from "./app-performance";
import { appSchema } from "./app-schema";

describe("appSchema", () => {
  it("publishes the Burn Foil Web product contract", () => {
    expect(appSchema.canvas.enabled).toBe(true);
    expect(appSchema.canvas.sizing).toEqual({ mode: "editable-output" });
    expect(appSchema.canvas.size).toEqual({ height: 900, unit: "px", width: 900 });
    expect(appSchema.panels.controls?.sections[0]?.title).toBe("Setup");
    expect(appSchema.panels.layers).toBeUndefined();
    expect(appSchema.panels.timeline).toBeUndefined();
    expect(appSchema.toolbar).toEqual({
      history: true,
      radar: true,
      theme: true,
      zoom: true,
    });
  });

  it("exposes image upload and human-scale burn shader controls", () => {
    const productSections =
      appSchema.panels.controls?.sections.filter((section) => section.title !== "Setup") ??
      [];
    const controls = Object.fromEntries(
      productSections.flatMap((section) => Object.values(section.controls).map((control) => [
        control.target,
        control,
      ])),
    );

    expect(controls["source.image"]).toMatchObject({
      assetKind: "image",
      type: "fileDrop",
    });
    expect(controls["burn.startMode"]).toMatchObject({
      defaultValue: "6",
      type: "select",
    });
    expect(controls["burn.width"]).toMatchObject({
      max: 35,
      min: 0.5,
      type: "slider",
      unit: "%",
    });
    expect(controls["fire.fireColor"]).toMatchObject({ type: "color" });
    expect(controls["light.bloomStrength"]).toMatchObject({
      max: 100,
      min: 0,
      type: "slider",
      unit: "%",
    });
  });

  it("declares WebGL renderer technique and acceptance coverage", () => {
    expect(appPerformance.usesCustomRenderer).toBe(true);
    expect(appPerformance.rendererStrategy).toBe("webgl");
    expect(appPerformance.rendererTechnique?.previewRenderer).toBe("webgl");
    expect(
      appAcceptance.find((entry) => entry.id === "source.image"),
    ).toMatchObject({
      componentType: "fileDrop",
      evidence: "media-lifecycle",
      target: "source.image",
    });
    expect(validateProductAcceptanceCoverage()).toEqual([]);
  });
});
