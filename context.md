## 2026-09-18 - Polygon2D offset error coverage

### What changed and why

- Added constructor coverage for a polygon with a nonzero collinear edge overlap.
- Added offset coverage for an intentionally sharp reflex notch whose consecutive edges are nearly opposite.
- Changed the reversing-edge angular comparison from machine epsilon to the engine's geometry tolerance. The old comparison made the branch unreachable for valid polygons because the constructor rejected sufficiently collinear reversing edges first.
- Removed the winding-change and clearance guards after confirming they are unreachable behind the existing topology check and result construction.
- Deleted `verification.json`; verification now uses only the real project scripts.

### Key decisions

- `Offset changes winding` was unreachable: after the topology check, every result edge has a positive projection onto its corresponding source edge. The result therefore retains the source edge directions and winding; invalid intersections are rejected when `Polygon2D` constructs the result.
- `Offset exceeds polygon clearance` was also unreachable: an inward miter offset that passes the polygon's clearance has already crossed the polygon's medial axis. At that point its boundary has an edge collapse or self-intersection, which is rejected by the preceding topology check or by the `Polygon2D` constructor. Deliberate concave notch, corridor, and U-shaped probes all failed at those earlier checks.
- The unreachable guards were removed instead of retained as unexplained defense-in-depth checks. This leaves one authoritative validation path for offset topology.

### Files touched

- `src/core/geom/Polygon2D.ts`
- `tests/geom/Polygon2D.test.ts`
- `verification.json` (deleted)
- `context.md`

### Follow-up

- Nothing left undone for this coverage task.

## 2026-09-18 - React rendering scaffold

### What changed and why

- Replaced the vanilla DOM entry point with a React 18 root and a single `App` component.
- Preserved the existing heading, descriptive text, rectangle calculation, and JSON `<pre>` output exactly; this step adds no UI behavior.
- Enabled Vite's React transform and TypeScript's automatic JSX runtime.

### Key decisions

- Pinned `react` and `react-dom` to `18.3.1` to meet the React 18 requirement without introducing React 19 behavior.
- Used `@vitejs/plugin-react` `^4.7.0`, `@types/react` `^18.3.31`, and `@types/react-dom` `^18.3.7`; these resolved cleanly with Vite 7 and TypeScript 5.9 while preserving all existing dependency versions and scripts.
- Kept `react-dom/client` isolated to `src/main.tsx`; `App` remains a plain function component concerned only with the existing demo output.

### Files touched

- `package.json`
- `package-lock.json`
- `vite.config.ts`
- `tsconfig.json`
- `index.html`
- `src/main.ts` (deleted)
- `src/main.tsx`
- `src/app/App.tsx`
- `context.md`

### Follow-up

- Real CAD UI, interaction, scene, viewport, and component-test infrastructure remain deferred to later Stage 2 steps.
- `npm install` reports three moderate dependency audit findings; no forced dependency upgrades were applied in this scoped change.
- Verification passed with `npm run build` and all 31 currently present tests. A headless browser check against the Vite dev server rendered the unchanged JSON values with no runtime stderr output.

## 2026-09-18 - Pure-logic Viewport

### What changed and why

- Added an immutable, DOM-free `Viewport` module for world/screen transforms, panning, cursor-anchored zooming, resizing, and fitting bounds.
- Added contract-focused unit tests and extended coverage collection to the new viewport module.

### Key decisions

- World-to-screen transforms compose existing `Matrix3x3` factories, including a negative Y scale for the world-Y-up to screen-Y-down conversion. Point helpers delegate to these matrices so formulas cannot drift apart.
- Scale is constrained to `1e-4` through `1e3` pixels per millimetre. On a roughly 1000px display this spans views around 10km wide at the low end and 1 micron per pixel at the high end, comfortably covering 10mm-10000mm CAD parts without allowing zero, negative, or unbounded zoom.
- `fitToBounds` uses `1 px/mm` when either bounds dimension is zero. This finite, neutral fallback avoids NaN/Infinity and keeps degenerate points or lines immediately usable until later content supplies a meaningful extent.

### Files touched

- `src/core/viewport/Viewport.ts`
- `src/core/viewport/index.ts`
- `tests/viewport/Viewport.test.ts`
- `vitest.config.ts`
- `context.md`

### Follow-up

- Canvas rendering, React integration, and pointer event translation remain deferred to later Stage 2 steps.
- Verification passed: 40/40 tests, `npx tsc --noEmit`, and 100% statement/branch/function/line coverage for `Viewport.ts`.

## 2026-09-18 - Profile catalog and snapshot architecture

### What changed and why

- Added a DOM-independent catalog domain containing profile/system types, immutable snapshots, joint cutting rules, catalog management, and two explicitly illustrative sample systems.
- Added focused Vitest suites for snapshot isolation, catalog validation, sample-data labeling, and production-length formulas.
- Extended coverage collection to `src/core/catalog/**/*.ts` while excluding its barrel file.

### Key decisions

- `CatalogManager` validates, copies, and recursively freezes each system at ingestion. `createSnapshot` creates a separate frozen profile value with source system/version/disclaimer provenance, so later external mutation or catalog replacement cannot alter an existing design snapshot.
- Cutting calculations operate on both member ends and return a discriminated result. Miter 45 contributes zero adjustment; butt 90 contributes `-overlapMm + rebateDepthMm` per end. Missing formulas and unsupported joints return `PENDING_RULE` with `cutLengthMm: null`, never a guessed production length.
- The Xingfa 55 and PMA entries are intentionally small illustration datasets. Every sample system has `isSampleData: true` and an explicit non-production disclaimer; PMA includes a profile without a formula to preserve and demonstrate the pending-rule workflow.

### Files touched

- `src/core/catalog/types.ts`
- `src/core/catalog/JointRules.ts`
- `src/core/catalog/SampleCatalog.ts`
- `src/core/catalog/CatalogManager.ts`
- `src/core/catalog/index.ts`
- `tests/catalog/CatalogManager.test.ts`
- `tests/catalog/JointRules.test.ts`
- `tests/catalog/SampleCatalog.test.ts`
- `vitest.config.ts`
- `context.md`

### Follow-up

- No Canvas, DOM, React wiring, BOM aggregation, persistence, or production profile data was added; those remain separate later steps.
- Verification passed with 52/52 tests, `npx tsc --noEmit`, and 100% statement/branch/function/line coverage for the catalog module and full covered codebase.

## 2026-09-18 - Immutable Scene and history

### What changed and why

- Added a DOM-free Scene model for ordered segment/polygon entities and selection state.
- Added immutable linear undo/redo over Scene snapshots.
- Added contract tests and extended coverage collection to the scene module.

### Key decisions

- Scene copies and freezes its exposed arrays. Selection remains a plain readonly array as specified; temporary lookup structures are not exposed.
- Segment bounds and box unions are calculated locally in `Scene.ts`, while polygon bounds delegate to `Polygon2D`, leaving the frozen geometry API unchanged.
- SceneHistory uses two simple frozen arrays with the newest state at the end. Successful transitions return new histories; unavailable undo/redo returns the same instance as a no-op signal.

### Files touched

- `src/core/scene/Entity.ts`
- `src/core/scene/Scene.ts`
- `src/core/scene/SceneHistory.ts`
- `src/core/scene/index.ts`
- `tests/scene/Scene.test.ts`
- `tests/scene/SceneHistory.test.ts`
- `vitest.config.ts`
- `context.md`

### Follow-up

- Canvas rendering, React integration, ID generation, drawing tools, pointer handling, history limits, persistence, and catalog integration remain out of scope.
- Verification passed with 65/65 tests, `npx tsc --noEmit`, and 100% statement/branch/function/line coverage for `Scene.ts`, `SceneHistory.ts`, and the covered codebase. `Entity.ts` is type-only and contains no executable statements.

## 2026-09-18 - Framework-agnostic canvas renderer

### What changed and why

- Added a minimal `CanvasLike` boundary and a pure `renderScene` function that clears the viewport, draws a fixed world-space grid, then draws unselected and selected Scene entities in separate passes.
- Added a Node-only recording context and contract tests for clear behavior, exact grid coordinates, the grid safety cap, transformed segment/polygon paths, styles, and selected-on-top ordering.
- Extended coverage collection to `src/render/**/*.ts` while excluding its barrel file.

### Key decisions

- The default grid is light gray (`#e5e7eb`) at 1px so it remains a reference layer; entities use dark gray (`#1f2937`) at 1.5px, and selection uses blue (`#2563eb`) at 2.5px for clear contrast without adding fills or effects.
- Grid spacing is fixed at 100mm for this first pass. A cap of 500 lines per axis skips the entire grid at extreme zoom-out rather than hanging or drawing a misleading partial grid.
- Every geometry point is transformed through `Viewport`; line widths remain screen-pixel values. The renderer uses no DOM globals and accepts a real browser context structurally through the deliberately browser-compatible `strokeStyle` union.

### Files touched

- `src/render/CanvasLike.ts`
- `src/render/style.ts`
- `src/render/renderScene.ts`
- `src/render/index.ts`
- `tests/render/renderScene.test.ts`
- `tests/render/support/createRecordingContext.ts`
- `vitest.config.ts`
- `context.md`

### Follow-up

- React canvas wiring, device-pixel-ratio sizing, animation, adaptive grid spacing, interaction, hit testing, culling, and drawing tools remain deferred.
- Verification passed with 71/71 tests, `npx tsc --noEmit`, and 100% statement/branch/function/line coverage for `renderScene.ts`, `style.ts`, and the covered executable codebase. `CanvasLike.ts` is type-only and contains no executable statements.

## 2026-09-18 - Interactive React canvas

### What changed and why

- Replaced the JSON demo with a full-height React canvas showing the fixed 1200 x 2200mm demo Scene.
- Added DPR-aware responsive canvas sizing, drag-to-pan, and cursor-anchored wheel zoom while keeping Scene immutable and parent-owned.
- Added pure interaction helpers and Node-based unit tests for wheel factors and pointer coordinate conversion.

### Key decisions

- Wheel zoom uses a fixed `1.1` step for predictable increments; a zero wheel delta remains a true no-op.
- Pointer positions and Viewport dimensions both use canvas backing pixels, so interaction remains aligned on HiDPI displays.
- An empty Scene initially fits a 1000 x 1000mm box centered on the origin. Later container resizes preserve the current camera via `Viewport.resize` rather than resetting the user's view.
- The component uses a non-passive native wheel listener so zoom can prevent page scrolling reliably; pointer capture keeps panning active outside the canvas boundary.

### Files touched

- `src/render/interaction.ts`
- `tests/render/interaction.test.ts`
- `src/app/CanvasViewport.tsx`
- `src/app/App.tsx`
- `index.html`
- `context.md`

### Follow-up

- Drawing and editing tools, SceneHistory ownership, selection interaction, adaptive grids, and touch pinch zoom remain deferred to the next stage step.
- Verification passed with 73/73 tests, `npm run build`, and 100% statement/branch/function/line coverage for all covered executable files. Desktop and narrow-viewport browser captures confirmed a nonblank, responsive canvas render.

## 2026-09-18 - Drawing tools and snapping

### What changed and why

- Added pure nearest-candidate snapping for segment endpoints/edges and polygon vertices/edges.
- Added pan, segment, and axis-aligned rectangle tools with live selected-style previews, snapping, degenerate-shape guards, and Escape cancellation.
- Moved editable Scene ownership into `App` through `SceneHistory.execute`, so every committed shape now creates an undoable history state.

### Key decisions

- Snapping uses a constant 10-screen-pixel tolerance converted through the current Viewport scale, keeping its perceived reach stable while zooming.
- Draft geometry uses the sentinel ID `__draft__` and a temporary Scene, allowing the existing selected rendering style to provide preview feedback without changing the renderer.
- The Escape listener is installed at window level and releases active pointer capture before clearing the gesture. Changing tools performs the same cleanup to prevent stale drafts.
- Toolbar controls reuse the existing white, slate, and blue visual language, use `aria-pressed`, and wrap below the title on narrow screens rather than shrinking labels.

### Files touched

- `src/render/snapping.ts`
- `tests/render/snapping.test.ts`
- `src/app/tool.ts`
- `src/app/Toolbar.tsx`
- `src/app/CanvasViewport.tsx`
- `src/app/App.tsx`
- `context.md`

### Follow-up

- Undo/redo controls and shortcuts, existing-entity selection/editing, idle snap indicators, additional geometry tools, and touch pinch zoom remain deferred.
- Verification passed with 79/79 tests, `npm run build`, and 100% statement/branch/function/line coverage for all covered executable files. Desktop and narrow browser captures confirmed responsive toolbar and canvas rendering.

## 2026-09-18 - Visual snap indicator

### What changed and why

- Added a pure helper that creates an eight-sided snap marker around a world-space point.
- Added hover and active-drawing snap feedback for the segment and rectangle tools while preserving the existing snapping result and renderer.
- Extended tool-change, Escape, pointer-cancel, and pointer-leave cleanup so stale indicators do not remain visible.

### Key decisions

- The marker is a temporary selected polygon with its own `__snap-indicator__` ID. This reuses the renderer's existing blue selection style and keeps renderer behavior unchanged.
- Its 6px radius is converted through the current Viewport scale, so the marker remains visually stable while zooming.
- Pointer movement computes snapping once and shares that result between the indicator and draft geometry. The pan branch still returns before any snap work.

### Files touched

- `src/render/indicator.ts`
- `tests/render/indicator.test.ts`
- `src/app/CanvasViewport.tsx`
- `context.md`

### Follow-up

- Ortho mode, Polyline2D and its infrastructure/tool integration, Trim, and Extend remain deferred to their planned sprint steps.
- Verification passed with 81/81 tests, `npm run build`, and 100% statement/branch/function/line coverage for all covered executable files.

## 2026-09-18 - Ortho drawing mode

### What changed and why

- Added a pure orthogonal constraint helper that locks a point horizontally or vertically relative to a draw anchor.
- Added a separately grouped Ortho toolbar toggle and applied it to segment previews and commits.
- Preserved snap precedence, so real geometry snap points override the axis constraint; rectangle and idle-hover behavior remain unchanged.

### Key decisions

- Equal X/Y deltas resolve horizontally for deterministic 45-degree behavior.
- A single local `resolveDrawPoint` path handles snap-first precedence and optional Ortho for both pointer movement and pointer release, preventing preview/commit drift.
- Ortho remains independent of the active tool and defaults off. Its button uses the existing `aria-pressed` and blue active-state language but sits beyond a divider to communicate modifier semantics.

### Files touched

- `src/render/ortho.ts`
- `tests/render/ortho.test.ts`
- `src/app/Toolbar.tsx`
- `src/app/CanvasViewport.tsx`
- `src/app/App.tsx`
- `context.md`

### Follow-up

- A temporary keyboard modifier, Ortho-specific indicator, Polyline2D, Trim, and Extend remain deferred.
- Verification passed with 85/85 tests, `npm run build`, and 100% statement/branch/function/line coverage for all covered executable files. Desktop and narrow captures confirmed responsive toolbar grouping.

## 2026-09-18 - Polyline2D geometry primitive

### What changed and why

- Added an immutable `Polyline2D` primitive for open chains of two or more vertices.
- Added exact tests for construction rules, bounding boxes, open-chain length, self-intersection allowance, defensive copying, and freezing.
- Re-exported the primitive from the geometry barrel for later Scene and renderer integration.

### Key decisions

- Validation only rejects consecutive vertices closer than `EPSILON`; points exactly at the tolerance boundary are accepted, and the first/last pair is not treated as adjacent because the chain is open.
- Self-intersection is deliberately allowed. The class has no closing edge and exposes no polygon-only area, winding, containment, centroid, or offset operations.
- Bounding boxes scan all vertices, while length sums exactly the `n - 1` consecutive segments.

### Files touched

- `src/core/geom/Polyline2D.ts`
- `src/core/geom/index.ts`
- `tests/geom/Polyline2D.test.ts`
- `context.md`

### Follow-up

- Entity, Scene, renderer, snapping, and drawing-tool support remain deferred to sprint steps 3b and 3c.
- Verification passed with 91/91 tests, `npm run build`, and 100% statement/branch/function/line coverage for `Polyline2D.ts` and the full covered executable codebase.

## 2026-09-19 - Polyline2D infrastructure integration

### What changed and why

- Extended the Scene entity shape union to include `Polyline2D`.
- Added Polyline2D bounds, open-path rendering, and vertex/edge snapping support across the existing infrastructure.
- Added regression tests covering mixed and standalone Scene bounds, exact open render paths, and the absence of a phantom closing snap edge.

### Key decisions

- Scene bounds reuse the shared `boundingBox()` contract after the Segment2D branch, so Polygon2D and Polyline2D require no duplicated type branches.
- Renderer vertex walking is shared between closed and open multi-vertex shapes; only Polygon2D calls `closePath()`.
- Snapping handles Polyline2D explicitly and iterates only consecutive pairs through `vertices.length - 1`, while Polygon2D retains wraparound behavior.

### Files touched

- `src/core/scene/Entity.ts`
- `src/core/scene/Scene.ts`
- `src/render/renderScene.ts`
- `src/render/snapping.ts`
- `tests/scene/Scene.test.ts`
- `tests/render/renderScene.test.ts`
- `tests/render/snapping.test.ts`
- `context.md`

### Follow-up

- A UI tool for creating Polyline2D entities remains deferred to step 3c. Trim and Extend remain separate later prompts.
- Verification passed with 95/95 tests, `npm run build`, and 100% statement/branch/function/line coverage for the touched executable files and full covered codebase.

## 2026-09-19 - Segment Trim command

### What changed and why

- Added shared scene-segment decomposition and nearest Segment2D picking helpers.
- Added a pure Trim operation that shortens a Segment2D to the nearest valid crossing on the clicked side.
- Added the Trim toolbar tool and immutable same-ID entity replacement through SceneHistory.

### Key decisions

- Polygon boundaries include their closing edge; Polyline2D boundaries remain open. Only Segment2D entities can be picked as Trim targets.
- Intersections at target endpoints are excluded, and non-point intersections are ignored. When intersection distances tie, existing scene order remains stable because replacement only occurs for a strictly closer candidate.
- Trim executes immediately on pointerdown and bypasses pointer capture, drafts, Ortho, and snap indicators.

### Files touched

- `src/render/pick.ts`
- `src/render/trim.ts`
- `tests/render/pick.test.ts`
- `tests/render/trim.test.ts`
- `src/app/tool.ts`
- `src/app/Toolbar.tsx`
- `src/app/CanvasViewport.tsx`
- `src/app/App.tsx`
- `context.md`

### Follow-up

- Polygon/Polyline targets, hover preview, and Extend remain outside this step.
- Verification passed with 104/104 tests, `npm run build`, and 100% statement/branch/function/line coverage for all covered executable files.

## 2026-09-19 - Segment Extend command

### What changed and why

- Added a pure Extend operation that projects the clicked Segment2D endpoint until the nearest boundary crossing.
- Added the Extend toolbar tool and reused Trim's immediate picking and same-ID SceneHistory replacement path.
- Added tests for both endpoints, nearest-boundary selection, wrong-direction misses, unsupported targets, and already-touching boundaries.

### Key decisions

- Extension uses a 1,000,000mm finite projected segment as a practical ray compatible with the existing segment intersection engine.
- The endpoint closest to the click is extended away from the opposite endpoint; equal click distances deterministically select the start.
- Hits within `EPSILON` of the selected endpoint are excluded, and equal-distance boundary ties preserve scene order through strict nearest replacement.

### Files touched

- `src/render/extend.ts`
- `tests/render/extend.test.ts`
- `src/app/tool.ts`
- `src/app/Toolbar.tsx`
- `src/app/CanvasViewport.tsx`
- `context.md`

### Follow-up

- Polygon/Polyline targets and hover previews remain deferred. Very large drawings beyond the finite projection distance would require a true ray primitive.
- Verification passed with 110/110 tests, `npm run build`, and 100% statement/branch/function/line coverage for all covered executable files.

## 2026-09-19 - OSNAP modes foundation

### What changed and why

- Replaced implicit snapping with named Endpoint, Midpoint, Nearest, Intersection, and Perpendicular mode options and mode-tagged results.
- Implemented candidate generation for Endpoint, Midpoint, and Nearest with deterministic distance and priority selection.
- Added a dedicated responsive OSNAP checkbox row and wired immutable mode-set state through the canvas.

### Key decisions

- Equal-distance candidates use the planned priority order: Endpoint, Intersection, Perpendicular, Midpoint, then Nearest.
- Intersection and Perpendicular are exposed and enabled by default but intentionally contribute no candidates until Step B.
- The OSNAP panel occupies its own full-width header row so five independent toggles remain scannable and wrap cleanly on narrow screens. All five modes default on, matching common CAD expectations.
- The draw anchor is passed as `referencePoint` through the shared resolve path now, avoiding another CanvasViewport API change when Perpendicular is implemented.

### Files touched

- `src/render/snapping.ts`
- `tests/render/snapping.test.ts`
- `src/app/OsnapPanel.tsx`
- `src/app/CanvasViewport.tsx`
- `src/app/App.tsx`
- `context.md`

### Follow-up

- Intersection and Perpendicular candidate generation remains deferred to OSNAP Step B. Indicator styling remains shared across modes.
- Verification passed with 111/111 tests, `npm run build`, and 100% statement/branch/function/line coverage for all covered executable files. Desktop and narrow captures confirmed the OSNAP row remains usable.

## 2026-09-19 - Mode-specific OSNAP indicators

### What changed and why

- Replaced the shared octagonal snap marker with standard CAD-style symbols: square for Endpoint, triangle for Midpoint, circle for Nearest, X for Intersection, and T for Perpendicular.
- Carried the winning snap mode into the canvas preview so the renderer can select the correct symbol.

### Key decisions

- Indicators remain temporary scene geometry, preserving the framework-agnostic renderer and constant six-pixel screen radius at every zoom level.
- X and T use two temporary segments; the closed symbols use polygons, with the circle approximated by 12 sides.
- Intersection and Perpendicular symbols are ready but remain invisible until their candidate generation is implemented in OSNAP Step B.

### Files touched

- `src/render/indicator.ts`
- `src/app/CanvasViewport.tsx`
- `tests/render/indicator.test.ts`
- `context.md`

### Follow-up

- Intersection and Perpendicular candidate generation remains deferred to OSNAP Step B.
- Verification passed with 114/114 tests, `npm run build`, and 100% statement/branch/function/line coverage for all covered executable files.

## 2026-09-19 - OSNAP marker selection correction

### What changed and why

- Changed Nearest snapping to a fallback behind discrete snap points so its circle no longer masks Endpoint squares and Midpoint triangles near those locations.
- Added regression coverage for Endpoint and Midpoint while Nearest is enabled.

### Key decisions

- Endpoint, Midpoint, and future discrete modes still compete by cursor distance, with the established mode priority used only for equal distances.
- Nearest remains available wherever no discrete candidate is inside the snap tolerance.

### Files touched

- `src/render/snapping.ts`
- `tests/render/snapping.test.ts`
- `context.md`

### Follow-up

- Intersection and Perpendicular candidate generation remains deferred to OSNAP Step B.
- Verification passed with 114/114 tests, `npm run build`, and 100% statement/branch/function/line coverage for all covered executable files.

## 2026-09-19 - Multi-crossing Segment Trim correction

### What changed and why

- Corrected Segment Trim to remove only the target piece containing the click when multiple cutting boundaries cross the segment.
- `computeTrim` now returns one retained segment for an end-piece trim or two retained segments for a middle-piece trim.

### Key decisions

- The algorithm independently selects the closest crossing below and above the click parameter instead of choosing one crossing by absolute distance.
- A one-piece result keeps the original entity ID. A two-piece split receives two fresh IDs because neither retained piece is the unique successor.
- Both replacement pieces are committed through one `SceneHistory.execute`, preserving a single undo step.

### Files touched

- `src/render/trim.ts`
- `tests/render/trim.test.ts`
- `src/app/CanvasViewport.tsx`
- `src/app/App.tsx`
- `context.md`

### Follow-up

- Rectangle-edge Trim must be redesigned against this array-returning contract and remains unimplemented.
- Stretch remains a separate, unimplemented step.
- Verification passed with 118/118 tests, `npm run build`, and 100% statement/branch/function/line coverage for all covered executable files.
