# Implementation Worklog

## Status

Mode: product

Burn Foil Web is a generated Toolcraft product app that ports the accepted Rive burn shader into a WebGL shader preview with Toolcraft schema controls.

## Decision Trail

### Iteration 1 - Rive burn shader to WebGL Toolcraft app

- Request: "what we need is basically convert that shaders and lua code to web code"
- Task type: Generated app porting, schema controls, media upload, custom WebGL renderer, image export, and browser verification.
- User-visible result: The app shows a centered shader preview on the Toolcraft canvas, starts with a default source card, lets the user replace the source through an Image fileDrop, exposes burn/fire/light/heat controls with normal percent ranges and color pickers, and exports PNG through Toolcraft's sticky Export PNG action.
- Source/reference checked: Local Rive `BurnFoilShader.wgsl` and `BurnFoilReveal.luau` from `/Users/dani/Documents/codes/rive test`, plus Toolcraft local workflow, runtime-boundary, control-selection, layout, media-upload, setup-export, schema-reference, component-rules, renderer-technique, and performance docs.
- Reference inputs: No reproducible video reference study was registered for this generated web app. The source of truth for the port is the current local Rive shader and Luau control mapping.
- Contract rules applied: `runtime-shell-required`, `canvas-no-app-ui`, `canvas-surface-preserved`, `controls-product-coverage`, `controls-section-inventory-required`, `output-export-required`, `renderer-technique-inventory`, `renderer-view-interaction`, `persistence-policy-explicit`, and `performance-coverage-levels`.
- View interaction intent: `non-spatial`; the output is a flat texture shader preview, not a rotatable 3D model.
- Interaction ownership: The controls panel owns shader uniform edits and source image selection. Canvas owns only viewport pan and zoom through the Toolcraft shell; no duplicate canvas controls are authored.
- Decision: Use WebGL2 and GLSL to reproduce the WGSL burn mask, ragged flame front, transparent burned center, color ramp, light halo, bloom-style emission, random/side start modes, and heat distortion. Use Toolcraft `fileDrop` for source images and consume runtime media presentation URLs in the preview.
- Alternatives rejected: Native form controls outside Toolcraft, a custom upload button, SVG/DOM burn simulation, keeping the raw uploaded image visible under the shader, and adding Toolcraft video export without an explicit video request.
- State/output mapping: `source.*`, `burn.*`, `fire.*`, `light.*`, and `heat.*` schema values are normalized to the same uniform ranges used by the Luau script. Runtime media for `source.image` is drawn contain-fit into a transparent texture, preserving source aspect ratio. The fragment shader burns that texture to alpha-empty pixels and adds only edge fire/light where source alpha exists.
- Renderer technique: WebGL2 preview and WebGL-assisted image export; source representation is image media, product representation is pixel output, and runtime background/export composition stays Toolcraft-owned.
- Timeline: No Toolcraft timeline. The Cycle switch is a shader preview convenience and does not authorize video export or deterministic timeline transport.
- Layers: No layers. The product has one shader output and one source image target.
- Controls: Built-in Toolcraft controls only: fileDrop, switch, slider, select, color, and panelActions. No custom control renderers are used.
- Export: Image export only with Toolcraft default PNG/JPG settings and a sticky Export PNG action. SVG and video are not requested.
- Performance intent: ordinary-product-work. No measured performance path, targeted performance iteration, or full audit was authorized or executed.
- Verification: Tier 4 first product delivery. Planned checks are schema tests, build/typecheck, one product browser pixel/control check, and bare `npm run verify:delivery` before starting `npm run dev`.
- Risks: Export of a freshly uploaded source depends on the live preview having cached the uploaded image URL in the browser session before the export renderer runs. The shader math is ported from WGSL to GLSL, so exact pixels can differ slightly from Rive while preserving behavior and controls.

## Decisions

### Renderer

- Decision: WebGL2 custom renderer.
- Reason: The burn transition is per-pixel texture sampling with procedural noise, alpha masking, glow, and heat distortion.
- Evidence: `src/burn-foil/burn-foil-webgl.ts` contains the GLSL port and shared preview/export draw path.

### Timeline

- Decision: No Toolcraft timeline.
- Reason: The user requested a shader tuning tool and did not request video export or timeline-keyframed output.
- Evidence: `panels.timeline` is omitted. Cycling is controlled by `source.autoCycle` and `source.timeScale`.

### Layers

- Decision: No layers.
- Reason: There is a single source image and a single shader output.
- Evidence: `panels.layers` is omitted.

### Controls

- Decision: Use schema-backed Toolcraft built-ins.
- Reason: The product needs image upload, colors, finite modes, booleans, and numeric shader uniforms, all covered by built-ins.
- Evidence: `src/app/app-schema.ts` declares fileDrop, switch, slider, select, color, and panelActions controls.

### View Interaction

- Decision: Non-spatial view.
- Reason: The rendered product is a flat shader preview, not an editable 3D object.
- Evidence: `appProductReadiness.viewInteraction.mode` is `non-spatial`.

### Interaction Ownership

- Decision: Panel owns shader/source edits; canvas owns only Toolcraft viewport navigation.
- Reason: Numeric/color controls require precision, while source import belongs to the built-in fileDrop.
- Evidence: `appProductReadiness.interactionOwnership` is declared empty because all product editing is handled by built-in panel controls and no custom canvas interaction is added.

### Export

- Decision: Toolcraft image export only.
- Reason: Product apps start with image export; SVG/video were not explicitly requested.
- Evidence: `appProductReadiness.exportIntent` enables image and marks SVG/video as not requested.

### Performance

- Decision: Functional renderer coverage without measured performance.
- Reason: The request is product implementation, not a localized performance complaint or complete audit.
- Evidence: `appPerformance` declares WebGL renderer technique and a pass model, with no measured scenarios.
