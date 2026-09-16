import type {
  BurnFoilImageTransform,
  BurnFoilQualityPreset,
  BurnFoilSettings,
} from "./burn-foil-types";

const shaderPresetConfig = {
  full: {
    detail: "1",
    octaves: "5",
  },
  lite: {
    detail: "0",
    octaves: "3",
  },
} as const;

const vertexShaderSource = `#version 300 es
precision highp float;

const vec2 POSITIONS[3] = vec2[3](
  vec2(-1.0, -1.0),
  vec2(3.0, -1.0),
  vec2(-1.0, 3.0)
);

out vec2 vUv;

void main() {
  vec2 p = POSITIONS[gl_VertexID];
  gl_Position = vec4(p, 0.0, 1.0);
  vUv = p * 0.5 + vec2(0.5);
}
`;

const fragmentShaderTemplate = `#version 300 es
precision highp float;

#define BURN_FOIL_FBM_OCTAVES __BURN_FOIL_FBM_OCTAVES__
#define BURN_FOIL_HIGH_DETAIL __BURN_FOIL_HIGH_DETAIL__

uniform sampler2D uSource;
uniform float uTime;
uniform float uProgress;
uniform vec2 uCenter;
uniform float uBurnWidth;
uniform float uEmberWidth;
uniform float uNoiseScale;
uniform float uLightStrength;
uniform float uGlowRadius;
uniform float uEdgeGlow;
uniform float uOpacity;
uniform float uAspect;
uniform float uBloomStrength;
uniform float uBloomRadius;
uniform float uStartMode;
uniform float uRandomSeed;
uniform float uDistortionStrength;
uniform float uDistortionSize;
uniform float uFireSize;
uniform float uFireIntensity;
uniform float uTrailStrength;
uniform vec3 uEmberColor;
uniform vec3 uFireColor;
uniform vec3 uHotColor;
uniform vec3 uSourceTintColor;
uniform vec3 uTrailColor;
uniform float uSourceTintStrength;

in vec2 vUv;
out vec4 outColor;

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  float freq = 1.0;
  for (int i = 0; i < BURN_FOIL_FBM_OCTAVES; i++) {
    v += valueNoise(p * freq) * amp;
    freq *= 2.07;
    amp *= 0.52;
  }
  return v;
}

vec3 toneMap(vec3 c) {
  return c / (c + vec3(1.0));
}

vec3 fireRamp(float t, vec3 ember, vec3 fire, vec3 hot) {
  float x = clamp(t, 0.0, 1.0);
  vec3 gold = mix(fire, hot, 0.62);
  vec3 whiteHot = clamp(hot * 1.22 + vec3(0.10, 0.09, 0.05), vec3(0.0), vec3(1.0));
  vec3 a = mix(ember, fire, smoothstep(0.06, 0.34, x));
  vec3 b = mix(a, gold, smoothstep(0.30, 0.70, x));
  return mix(b, whiteHot, smoothstep(0.72, 1.0, x));
}

vec2 randomOrigin(float seed) {
  vec2 s = vec2(seed * 13.17 + 4.2, seed * 7.91 + 19.4);
  return vec2(
    0.18 + hash21(s) * 0.64,
    0.18 + hash21(s + vec2(31.7, 9.2)) * 0.64
  );
}

float burnDistance(vec2 uv, vec2 center, float aspect, float mode, float seed) {
  if (mode < 0.5) {
    return length(vec2((uv.x - center.x) * aspect, uv.y - center.y));
  }
  if (mode < 1.5) {
    vec2 origin = randomOrigin(seed);
    return length(vec2((uv.x - origin.x) * aspect, uv.y - origin.y));
  }
  if (mode < 2.5) {
    return uv.x;
  }
  if (mode < 3.5) {
    return 1.0 - uv.x;
  }
  if (mode < 4.5) {
    return uv.y;
  }
  if (mode < 5.5) {
    return 1.0 - uv.y;
  }

  float side = floor(hash21(vec2(seed * 5.37, seed * 11.13)) * 4.0);
  if (side < 1.0) {
    return uv.x;
  }
  if (side < 2.0) {
    return 1.0 - uv.x;
  }
  if (side < 3.0) {
    return uv.y;
  }
  return 1.0 - uv.y;
}

void main() {
  vec2 uv = clamp(vUv, vec2(0.0), vec2(1.0));
  vec2 p = uv * max(uNoiseScale, 0.001);
  vec2 warp = vec2(
    fbm(p * 0.28 + vec2(uTime * 0.055, -uTime * 0.034)),
    fbm(p * 0.27 + vec2(-uTime * 0.040, uTime * 0.070) + vec2(18.7, 7.3))
  ) - vec2(0.5);
  vec2 flow = p + warp * 5.6;
  float grain = fbm(flow + vec2(uTime * 0.14, -uTime * 0.068));
#if BURN_FOIL_HIGH_DETAIL
  float fine = fbm(flow * 3.6 + vec2(-uTime * 0.30, uTime * 0.18));
  float grit = valueNoise(flow * 10.0 + vec2(uTime * 0.95, -uTime * 0.55));
  float tear = fbm(flow * vec2(0.75, 2.10) + vec2(uTime * 0.10, uTime * 0.24));
#else
  float fine = grain;
  float grit = valueNoise(flow * 7.0 + vec2(uTime * 0.62, -uTime * 0.35));
  float tear = grain;
#endif
  float ragged = (grain - 0.5) * 0.22 + (fine - 0.5) * 0.085 + (grit - 0.5) * 0.030 + (tear - 0.5) * 0.055;

  float mode = floor(uStartMode + 0.5);
  float dist = burnDistance(uv, uCenter, uAspect, mode, uRandomSeed);
  float radialBurn = mode < 1.5 ? 1.0 : 0.0;
  float radius = mix(-uBurnWidth, mix(1.18, 0.92, radialBurn), clamp(uProgress, 0.0, 1.0));
  float front = dist - radius + ragged;
  float burnWidth = max(uBurnWidth, 0.001);
  float emberWidth = max(uEmberWidth, 0.001);
  float edgeIntensity = max(uEdgeGlow, 0.0);
  float lightStrength = max(uLightStrength, 0.0);
  float glowRadius = clamp(uGlowRadius, 0.2, 8.0);
  float bloomStrength = max(uBloomStrength, 0.0);
  float bloomRadius = clamp(uBloomRadius, 0.25, 10.0);
  float fireScale = clamp(uFireSize, 0.25, 3.0);
  float fireIntensity = clamp(uFireIntensity, 0.0, 3.0);
  float trailStrength = clamp(uTrailStrength, 0.0, 3.0);
  float effectiveLight = (lightStrength + edgeIntensity * 0.55 + bloomStrength * 0.45) * (0.65 + fireIntensity * 0.35);
  float effectiveRadius = glowRadius + edgeIntensity * 0.10 + bloomRadius * 0.18;
  float visible = smoothstep(-burnWidth * 0.02, burnWidth * 0.16, front);
  float edgeDist = abs(front);
  float boil = fbm(flow * 1.55 + vec2(uTime * 0.32, -uTime * 0.19));
#if BURN_FOIL_HIGH_DETAIL
  float pockets = fbm(flow * 4.80 + vec2(-uTime * 0.42, uTime * 0.36));
  float lace = smoothstep(0.50, 0.96, fbm(flow * 8.2 + vec2(uTime * 0.68, -uTime * 0.47)));
#else
  float pockets = valueNoise(flow * 3.35 + vec2(-uTime * 0.35, uTime * 0.28));
  float lace = smoothstep(0.50, 0.96, valueNoise(flow * 5.2 + vec2(uTime * 0.54, -uTime * 0.38)));
#endif
  float flameWidth = emberWidth * fireScale * (0.95 + boil * 2.25 + lace * 0.85);
  float innerFlame = smoothstep(-flameWidth * 0.95, -emberWidth * 0.02, front);
  float outerFlame = 1.0 - smoothstep(emberWidth * 0.08, flameWidth * 0.72, front);
  float flameShape = clamp(innerFlame * outerFlame, 0.0, 1.0);
  float brokenShape = flameShape * (0.42 + smoothstep(0.16, 0.86, pockets) * 0.78);
  float core = smoothstep(emberWidth * 0.34, 0.0, edgeDist + (pockets - 0.5) * emberWidth * 0.22);
  float body = smoothstep(flameWidth, 0.0, edgeDist + (boil - 0.5) * emberWidth * 0.70) * brokenShape;
  float edgeFence = smoothstep(flameWidth * (1.20 + effectiveRadius * 0.40), 0.0, edgeDist);
  float halo = edgeFence * (0.34 + boil * 0.46);
  float bloomHalo = smoothstep(flameWidth * (1.65 + bloomRadius * 0.62), 0.0, edgeDist) * (0.28 + boil * 0.42);
#if BURN_FOIL_HIGH_DETAIL
  float sparks = smoothstep(0.925, 0.992, valueNoise(flow * 22.0 + vec2(uTime * 3.5, -uTime * 2.7))) * edgeFence;
#else
  float sparks = 0.0;
#endif

  float distortionSize = clamp(uDistortionSize, 0.05, 5.0);
  float heatMask = smoothstep(flameWidth * (1.9 + distortionSize), 0.0, edgeDist) * visible;
#if BURN_FOIL_HIGH_DETAIL
  float heatNoiseY = fbm(flow * (2.1 + distortionSize) + vec2(uTime * 0.21, uTime * 0.44)) - 0.5;
#else
  float heatNoiseY = valueNoise(flow * (1.6 + distortionSize) + vec2(uTime * 0.17, uTime * 0.32)) - 0.5;
#endif
  vec2 heatWarp = vec2(
    fine - 0.5,
    heatNoiseY
  );
  vec2 sampleUv = clamp(uv + heatWarp * heatMask * max(uDistortionStrength, 0.0) * 0.035, vec2(0.0), vec2(1.0));
  vec4 source = texture(uSource, sampleUv);
  float contentMask = smoothstep(0.001, 0.02, source.a);
  float sourceLuma = dot(source.rgb, vec3(0.2126, 0.7152, 0.0722));
  vec3 sourceTinted = mix(source.rgb, uSourceTintColor * max(sourceLuma, 0.04), clamp(uSourceTintStrength, 0.0, 1.0));
  float trailMask = smoothstep(flameWidth * (2.7 + effectiveRadius * 0.32), 0.0, edgeDist) * (0.34 + boil * 0.54);
  trailMask *= smoothstep(-flameWidth * 1.15, flameWidth * 0.55, front) * visible * contentMask;
  float trailAmount = clamp(trailMask * trailStrength * (0.50 + edgeIntensity * 0.10), 0.0, 0.96);
  vec3 trailBase = mix(uTrailColor * max(sourceLuma, 0.16), uTrailColor, 0.22);
  vec3 sourceWithTrail = mix(sourceTinted, trailBase, trailAmount);
  float lightBleedMask = smoothstep(flameWidth * (1.65 + effectiveRadius * 0.42), 0.0, edgeDist);
  lightBleedMask *= visible * contentMask * (0.24 + boil * 0.44);
  vec3 lightBleed = fireRamp(0.46 + lightBleedMask * 0.36, uTrailColor, uFireColor, uHotColor);
  lightBleed *= lightBleedMask * effectiveLight * (0.030 + effectiveRadius * 0.012) * fireIntensity;

  float thermal = clamp(core * 1.35 + body * (0.42 + fine * 1.18) + sparks * 0.65, 0.0, 1.0);
  float flameAlpha = clamp((core * 0.95 + body * 0.72 + sparks * 0.85) * (0.36 + fireIntensity * 0.34 + edgeIntensity * 0.13), 0.0, 1.0);
  float lightAlpha = clamp(halo * effectiveLight * (0.055 + effectiveRadius * 0.026), 0.0, 0.82);
  float bloomAlpha = clamp(bloomHalo * bloomStrength * (0.045 + bloomRadius * 0.020) * (0.70 + fireIntensity * 0.30), 0.0, 0.65);
  float orangeBand = smoothstep(flameWidth * 0.86, 0.0, edgeDist + (boil - 0.5) * emberWidth * 0.38) * (0.34 + body * 0.72 + core * 0.45);
  vec3 flameColor = fireRamp(thermal, uEmberColor, uFireColor, uHotColor) * (core * (2.1 + edgeIntensity * 1.25) + body * (1.10 + edgeIntensity * 0.50 + lace * 0.70) + sparks * (1.2 + edgeIntensity * 0.35));
  flameColor += uFireColor * orangeBand * (0.90 + edgeIntensity * 0.28);
  flameColor *= fireIntensity;
  vec3 glow = fireRamp(0.34 + thermal * 0.42, uTrailColor, uFireColor, uHotColor) * halo * effectiveLight * (0.18 + effectiveRadius * 0.042);
  vec3 bloom = fireRamp(0.42 + thermal * 0.30, uTrailColor, uFireColor, uHotColor) * bloomHalo * bloomStrength * (0.20 + bloomRadius * 0.040) * (0.70 + fireIntensity * 0.35);
  vec3 hotLining = fireRamp(0.82, uEmberColor, uFireColor, uHotColor) * smoothstep(emberWidth * 0.44 * fireScale, 0.0, edgeDist) * (1.0 - visible) * (0.32 + edgeIntensity * 0.32) * fireIntensity;
  vec3 trailGlow = uTrailColor * halo * trailStrength * (0.12 + effectiveLight * 0.036);

  vec3 imageColor = clamp(sourceWithTrail * visible + lightBleed, vec3(0.0), vec3(1.0));
  vec3 fireColor = clamp(toneMap(flameColor + glow + bloom + hotLining + trailGlow) * (1.10 + fireIntensity * 0.28), vec3(0.0), vec3(1.0));
  float emissionAlpha = max(max(flameAlpha, lightAlpha), bloomAlpha);
  vec3 color = clamp(max(imageColor, fireColor * emissionAlpha * contentMask), vec3(0.0), vec3(1.0));
  float alpha = clamp(max(source.a * visible, emissionAlpha * contentMask) * uOpacity, 0.0, 1.0);

  outColor = vec4(color, alpha);
}
`;

type BurnFoilRenderInput = {
  cssHeight: number;
  cssWidth: number;
  pixelRatio: number;
  settings: BurnFoilSettings;
  sourceImage: HTMLImageElement;
  targetCanvas: HTMLCanvasElement;
  timeSeconds: number;
  transform?: BurnFoilImageTransform;
};

type BurnFoilProgram = {
  program: WebGLProgram;
  sourceTexture: WebGLTexture;
  sourceTextureKey: string | null;
  uniforms: Record<string, WebGLUniformLocation>;
};

const programs = new WeakMap<
  WebGL2RenderingContext,
  Map<BurnFoilQualityPreset, BurnFoilProgram>
>();

export async function loadBurnFoilImage(sourceUrl: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.decoding = "async";
  image.src = sourceUrl;
  await image.decode();
  return image;
}

export function renderBurnFoilWebgl(input: BurnFoilRenderInput): void {
  const { cssHeight, cssWidth, pixelRatio, targetCanvas } = input;
  const width = Math.max(1, Math.round(cssWidth * pixelRatio));
  const height = Math.max(1, Math.round(cssHeight * pixelRatio));

  if (targetCanvas.width !== width) {
    targetCanvas.width = width;
  }
  if (targetCanvas.height !== height) {
    targetCanvas.height = height;
  }
  targetCanvas.style.width = `${cssWidth}px`;
  targetCanvas.style.height = `${cssHeight}px`;

  const gl = targetCanvas.getContext("webgl2", {
    alpha: true,
    antialias: false,
    depth: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: true,
    stencil: false,
  });
  if (!gl) {
    throw new Error("WebGL2 is not available.");
  }

  const renderer = getProgram(gl, input.settings.qualityPreset);
  gl.viewport(0, 0, width, height);
  gl.disable(gl.BLEND);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(renderer.program);
  updateSourceTexture(gl, renderer, input, width, height);
  writeUniforms(gl, renderer.uniforms, input, width, height);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function getProgram(
  gl: WebGL2RenderingContext,
  preset: BurnFoilQualityPreset,
): BurnFoilProgram {
  const cachedPrograms = programs.get(gl) ?? new Map();
  const cached = cachedPrograms.get(preset);
  if (cached) {
    return cached;
  }

  const program = linkProgram(
    gl,
    compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource),
    compileShader(gl, gl.FRAGMENT_SHADER, getFragmentShaderSource(preset)),
  );
  const sourceTexture = gl.createTexture();
  if (!sourceTexture) {
    throw new Error("Unable to create source texture.");
  }
  const uniformNames = [
    "uSource",
    "uTime",
    "uProgress",
    "uCenter",
    "uBurnWidth",
    "uEmberWidth",
    "uNoiseScale",
    "uLightStrength",
    "uGlowRadius",
    "uEdgeGlow",
    "uOpacity",
    "uAspect",
    "uBloomStrength",
    "uBloomRadius",
    "uStartMode",
    "uRandomSeed",
    "uDistortionStrength",
    "uDistortionSize",
    "uFireSize",
    "uFireIntensity",
    "uTrailStrength",
    "uEmberColor",
    "uFireColor",
    "uHotColor",
    "uSourceTintColor",
    "uTrailColor",
    "uSourceTintStrength",
  ] as const;
  const uniforms: Record<string, WebGLUniformLocation> = {};
  for (const name of uniformNames) {
    const location = gl.getUniformLocation(program, name);
    if (!location) {
      throw new Error(`Missing shader uniform ${name}.`);
    }
    uniforms[name] = location;
  }

  const next = { program, sourceTexture, sourceTextureKey: null, uniforms };
  cachedPrograms.set(preset, next);
  programs.set(gl, cachedPrograms);
  return next;
}

function getFragmentShaderSource(preset: BurnFoilQualityPreset): string {
  const config = shaderPresetConfig[preset];
  return fragmentShaderTemplate
    .replace("__BURN_FOIL_FBM_OCTAVES__", config.octaves)
    .replace("__BURN_FOIL_HIGH_DETAIL__", config.detail);
}

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error("Unable to create shader.");
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? "Unknown shader compile error.";
    gl.deleteShader(shader);
    throw new Error(log);
  }
  return shader;
}

function linkProgram(
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader,
): WebGLProgram {
  const program = gl.createProgram();
  if (!program) {
    throw new Error("Unable to create shader program.");
  }
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) ?? "Unknown shader link error.";
    gl.deleteProgram(program);
    throw new Error(log);
  }
  return program;
}

function updateSourceTexture(
  gl: WebGL2RenderingContext,
  renderer: BurnFoilProgram,
  input: BurnFoilRenderInput,
  width: number,
  height: number,
): void {
  const textureKey = getSourceTextureKey(input, width, height);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, renderer.sourceTexture);
  if (renderer.sourceTextureKey === textureKey) {
    return;
  }

  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = width;
  sourceCanvas.height = height;
  const context = sourceCanvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D is not available.");
  }
  drawContainedSourceImage(context, sourceCanvas.width, sourceCanvas.height, input);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    sourceCanvas,
  );
  renderer.sourceTextureKey = textureKey;
}

function getSourceTextureKey(
  input: BurnFoilRenderInput,
  width: number,
  height: number,
): string {
  const transform = input.transform;
  return [
    input.sourceImage.currentSrc || input.sourceImage.src,
    input.sourceImage.naturalWidth,
    input.sourceImage.naturalHeight,
    width,
    height,
    transform?.rotationDeg ?? 0,
    transform?.flipHorizontal ? 1 : 0,
    transform?.flipVertical ? 1 : 0,
  ].join("|");
}

function drawContainedSourceImage(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  input: BurnFoilRenderInput,
): void {
  context.clearRect(0, 0, width, height);
  const image = input.sourceImage;
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const x = (width - drawWidth) / 2;
  const y = (height - drawHeight) / 2;
  const transform = input.transform;
  const flipX = transform?.flipHorizontal ? -1 : 1;
  const flipY = transform?.flipVertical ? -1 : 1;
  const rotation = ((transform?.rotationDeg ?? 0) * Math.PI) / 180;

  context.save();
  context.translate(x + drawWidth / 2, y + drawHeight / 2);
  context.rotate(rotation);
  context.scale(flipX, flipY);
  context.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  context.restore();
}

function writeUniforms(
  gl: WebGL2RenderingContext,
  uniforms: Record<string, WebGLUniformLocation>,
  input: BurnFoilRenderInput,
  width: number,
  height: number,
): void {
  const settings = input.settings;
  gl.uniform1i(uniforms.uSource, 0);
  gl.uniform1f(uniforms.uTime, input.timeSeconds);
  gl.uniform1f(uniforms.uProgress, clamp(settings.progress, 0, 100) / 100);
  gl.uniform2f(
    uniforms.uCenter,
    clamp(settings.centerX, 0, 100) / 100,
    clamp(settings.centerY, 0, 100) / 100,
  );
  gl.uniform1f(uniforms.uBurnWidth, clamp(settings.burnWidth, 0.5, 35) / 100);
  gl.uniform1f(uniforms.uEmberWidth, clamp(settings.emberWidth, 0.2, 18) / 100);
  gl.uniform1f(uniforms.uNoiseScale, clamp(settings.noiseScale, 1, 80));
  gl.uniform1f(uniforms.uLightStrength, (clamp(settings.lightStrength, 0, 200) / 100) * 8);
  gl.uniform1f(uniforms.uGlowRadius, (clamp(settings.glowRadius, 5, 100) / 100) * 6);
  gl.uniform1f(uniforms.uEdgeGlow, (clamp(settings.edgeGlow, 0, 100) / 100) * 5);
  gl.uniform1f(uniforms.uOpacity, clamp(settings.opacity, 0, 100) / 100);
  gl.uniform1f(uniforms.uAspect, width / height);
  gl.uniform1f(uniforms.uBloomStrength, (clamp(settings.bloomStrength, 0, 100) / 100) * 6);
  gl.uniform1f(uniforms.uBloomRadius, (clamp(settings.bloomRadius, 5, 100) / 100) * 5);
  gl.uniform1f(uniforms.uStartMode, clamp(settings.startMode, 0, 6));
  gl.uniform1f(uniforms.uRandomSeed, clamp(settings.randomSeed, 0, 9999));
  gl.uniform1f(uniforms.uDistortionStrength, (clamp(settings.distortionStrength, 0, 100) / 100) * 4);
  gl.uniform1f(uniforms.uDistortionSize, (clamp(settings.distortionSize, 5, 100) / 100) * 3);
  gl.uniform1f(uniforms.uFireSize, clamp(settings.fireSize, 25, 300) / 100);
  gl.uniform1f(uniforms.uFireIntensity, clamp(settings.fireIntensity, 0, 250) / 100);
  gl.uniform1f(uniforms.uTrailStrength, clamp(settings.trailStrength, 0, 250) / 100);
  gl.uniform1f(uniforms.uSourceTintStrength, clamp(settings.sourceTintStrength, 0, 100) / 100);
  writeColor(gl, uniforms.uEmberColor, settings.emberColor);
  writeColor(gl, uniforms.uFireColor, settings.fireColor);
  writeColor(gl, uniforms.uHotColor, settings.hotColor);
  writeColor(gl, uniforms.uSourceTintColor, settings.sourceTintColor);
  writeColor(gl, uniforms.uTrailColor, settings.trailColor);
}

function writeColor(
  gl: WebGL2RenderingContext,
  location: WebGLUniformLocation,
  hex: string,
): void {
  const color = hexToRgb(hex);
  gl.uniform3f(location, color.r, color.g, color.b);
}

function hexToRgb(hex: string): { b: number; g: number; r: number } {
  const normalized = /^#[\da-f]{6}$/iu.test(hex) ? hex.slice(1) : "FFFFFF";
  const int = Number.parseInt(normalized, 16);
  return {
    b: (int & 255) / 255,
    g: ((int >> 8) & 255) / 255,
    r: ((int >> 16) & 255) / 255,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
