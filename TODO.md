# TODO — Fix images + notes + carousel + sidebar + human scale ref

- [x] Remove notes area from thesis-viewer.html (delete #part-notes block).
- [x] Remove notes CSS rules from style.css (.part-notes/.notes-title/.notes-body).
- [x] Replace showPartPanel image logic with working carousel.
- [x] Add img.onerror placeholder that prints the broken path so missing images are obvious.
- [x] Update PART_INFO image paths to match local filenames exactly (case-sensitive).
- [ ] Verify Git images folder contents:
  - [ ] Ensure images/* files are committed and pushed to GitHub.
  - [ ] Ensure filenames match code exactly.
- [ ] Human scale reference toggle:
  - [ ] Add button to thesis-viewer.html inside #toolbar after Fullscreen.
  - [ ] Add human silhouette toggle JS + one-line hook inside showModel().
- [ ] Run quick manual test:
  - [ ] Toggle “Scale Ref” on/off.
  - [ ] Load a new model; ensure the silhouette repositions correctly.
  - [ ] Confirm no JS console errors.
- [ ] Mobile sidebar auto-collapse:
  - [x] Implemented CSS + JS logic.
  - [ ] Verify on a small viewport.

