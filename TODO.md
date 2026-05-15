# TODO — Sidebar stretch fix

- [x] Inspect `viewer.js` resize logic and identify best insertion point.
- [x] Add a dedicated resize sync function (renderer size + camera aspect + updateProjectionMatrix).
- [x] Keep existing `window.resize` handler but route it through the sync function.
- [x] Add a `ResizeObserver` watching `#wrap` to call the sync function when layout size changes due to sidebar collapse/expand.
- [x] (Optional) Debounce resize calls (via `requestAnimationFrame`) to avoid repeated updates during transitions.
- [ ] Verify: toggle sidebar closed/open; confirm model is not stretched.


