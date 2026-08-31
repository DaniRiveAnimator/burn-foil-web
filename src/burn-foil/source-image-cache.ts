const sourceImageCache = new Map<string, string>();

export function cacheBurnFoilSourceImage(key: string, dataUrl: string): void {
  sourceImageCache.set(key, dataUrl);
}

export function readCachedBurnFoilSourceImage(key: string): string | undefined {
  return sourceImageCache.get(key);
}

export async function cacheSourceUrlAsDataUrl(
  key: string,
  sourceUrl: string,
): Promise<void> {
  const response = await fetch(sourceUrl);
  const blob = await response.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Image read failed."));
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Image read did not produce a data URL."));
      }
    };
    reader.readAsDataURL(blob);
  });

  cacheBurnFoilSourceImage(key, dataUrl);
}
