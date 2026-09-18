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
