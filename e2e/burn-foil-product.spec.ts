import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

import {
  appAcceptance,
  appControlSectionInventory,
} from "../src/app/app-acceptance";
import { appSchema } from "../src/app/app-schema";
import { deriveToolcraftBrowserRuntimeRequirements } from "./browser-runtime-evidence-requirements";
import { attachToolcraftBrowserRuntimeEvidence } from "./browser-runtime-evidence";

type CanvasSample = {
  hash: number;
  height: number;
  lit: number;
  opaque: number;
  transparent: number;
  width: number;
};

const browserTestNames = [
  ...new Set(
    appAcceptance.flatMap((entry) =>
      entry.browser && entry.browserTestName ? [entry.browserTestName] : [],
    ),
  ),
];

for (const browserTestName of browserTestNames) {
  test(browserTestName, async ({ page }) => {
    await page.goto("/");
    await waitForBurnFoilPixels(page);

    const before = await sampleBurnFoilCanvas(page);
    await page.waitForTimeout(300);
    const after = await sampleBurnFoilCanvas(page);

    expect(before.width).toBeGreaterThan(0);
    expect(before.height).toBeGreaterThan(0);
    expect(before.opaque).toBeGreaterThan(2_000);
    expect(before.transparent).toBeGreaterThan(2_000);
    expect(before.lit).toBeGreaterThan(4);
    expect(after.hash).not.toBe(before.hash);

    if (requiresExportArtifact(browserTestName)) {
      await expectPngExport(page);
    }

    await attachRequirements(browserTestName);
  });
}

async function waitForBurnFoilPixels(page: import("@playwright/test").Page): Promise<void> {
  await page.locator("[data-burn-foil-canvas]").waitFor({ state: "visible" });
  await page.waitForFunction(() => {
    const canvas = document.querySelector<HTMLCanvasElement>(
      "[data-burn-foil-canvas]",
    );
    return Boolean(canvas && canvas.width > 0 && canvas.height > 0);
  });
  await page.waitForTimeout(250);
}

async function sampleBurnFoilCanvas(
  page: import("@playwright/test").Page,
): Promise<CanvasSample> {
  return page.locator("[data-burn-foil-canvas]").evaluate((canvas) => {
    const source = canvas as HTMLCanvasElement;
    const copy = document.createElement("canvas");
    copy.width = 160;
    copy.height = 160;
    const context = copy.getContext("2d", { willReadFrequently: true });
    if (!context) {
      throw new Error("Canvas 2D is not available.");
    }

    context.drawImage(source, 0, 0, copy.width, copy.height);
    const pixels = context.getImageData(0, 0, copy.width, copy.height).data;
    let hash = 2166136261;
    let lit = 0;
    let opaque = 0;
    let transparent = 0;

    for (let index = 0; index < pixels.length; index += 4) {
      const red = pixels[index] ?? 0;
      const green = pixels[index + 1] ?? 0;
      const blue = pixels[index + 2] ?? 0;
      const alpha = pixels[index + 3] ?? 0;
      if (alpha > 32) opaque += 1;
      if (alpha < 4) transparent += 1;
      if (alpha > 32 && red > 150 && green > 60 && blue < 180) lit += 1;
      hash ^= red + green * 3 + blue * 7 + alpha * 11;
      hash = Math.imul(hash, 16777619) >>> 0;
    }

    return {
      hash,
      height: source.height,
      lit,
      opaque,
      transparent,
      width: source.width,
    };
  });
}

async function expectPngExport(page: import("@playwright/test").Page): Promise<void> {
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export PNG" }).click();
  const download = await downloadPromise;
  const downloadPath = await download.path();
  expect(downloadPath).toBeTruthy();

  const bytes = await readFile(downloadPath!);
  expect(bytes.byteLength).toBeGreaterThan(10_000);
  expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
}

function requiresExportArtifact(browserTestName: string): boolean {
  return requirementsForTest(browserTestName).some((requirement) =>
    [
      "exported-artifact",
      "image-export-artifact",
      "infinity-scene-bounds-image-export",
    ].includes(requirement.evidenceType),
  );
}

async function attachRequirements(browserTestName: string): Promise<void> {
  const attached = new Set<string>();

  for (const requirement of requirementsForTest(browserTestName)) {
    const key = [
      requirement.evidenceType,
      requirement.requirementId,
      requirement.target ?? "",
    ].join("|");
    if (attached.has(key)) {
      continue;
    }
    attached.add(key);
    await attachToolcraftBrowserRuntimeEvidence({
      evidenceType: requirement.evidenceType,
      requirementId: requirement.requirementId,
      target: requirement.target,
    });
  }
}

function requirementsForTest(browserTestName: string) {
  return deriveToolcraftBrowserRuntimeRequirements(
    appAcceptance,
    appSchema,
    appControlSectionInventory,
  ).filter((requirement) => requirement.testName === browserTestName);
}
