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
