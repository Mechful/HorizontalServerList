# Fix: Discord class rehash broke HorizontalServerList

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the theme apply again on current Discord (`app-1.0.9267`, Vencord) by remapping all selectors to the current compiled classes and keeping the rotate-the-rail technique.

**Architecture:** CSS-only theme compiled by `bd-css` (Bun + LightningCSS). Every selector is Discord's internal hashed class (`.guilds__5e434`). Discord renamed the hash scheme and rewrote `.base` into a subgrid layout; the theme silently no-ops. Fix = swap tokens in `src/main.css` (+ addon), keep the existing transform/rotate approach, and add a static dead-selector check so this never ships silently again.

**Tech Stack:** Bun, bd-css (^0.0.6), LightningCSS, prettier. No test framework — a bun script is the test.

**Spec:** Diagnosis session 2026-11-09 (evidence: live CDN `795186.7742ba70261a58a6.css` etc.; user's installed wrapper at `C:\Users\Mechful\AppData\Roaming\Vencord\themes\HorizontalServerList.theme.css` imports the deploy URL). Key verified facts:

| src/main.css uses (dead) | Current class | Evidence chunk |
|---|---|---|
| `.base__5e434` | `.base_pog62O` | 795186 |
| `.sidebar__5e434` | `.sidebar_pog62O` | 795186 |
| `.guilds__5e434` | `.guilds_pog62O` | 795186 |
| `.content__5e434` | `.content_pog62O` | 795186 |
| `.tree_ef3116` | `.tree_5dqHTG` | 703298 |
| `.wrapper__6e9f8` (icon) | `.wrapper_5dqHTG` | 703298 |
| `.lowerBadge_cc5dd2`/`.upperBadge_cc5dd2` | `..._hqZPsU` | 239502 |
| `.folderPreview__48112`/`.folderIconWrapper__48112` | `.folderPreview_.../folderIconWrapper_RTMSuZ` (+ `folderButton_RTMSuZ`, `folderIcon_RTMSuZ`, `folderGroupBackground_RTMSuZ`, `folderPreviewWrapper_RTMSuZ`) | 504129 |
| `.itemsContainer_ef3116`, `.stack_dbd263`, `.childWrapper__6e9f8`, `.notice__6e2b9`, `.container__5e434` | UNKNOWN — derive in Task 1 | — |

Layout note (from 795186): `.base_pog62O` is now `grid-template-areas:"titleBar titleBar titleBar""guildsList notice notice""guildsList channelsList page"`; `.guilds_pog62O{position:relative; width:var(--custom-guild-list-width)}`; `.content_pog62O{display:grid; grid-row:titleBarEnd/end; grid-template-columns:subgrid}`. The old `.base__5e434[data-fullscreen='false'] .content__5e434{margin-top}` hack now applies to a grid item — behavior must be verified visually (Task 3 fallback in Task 4).

## Global Constraints

- Default branch `master`; PRs against `master` (CI `.github/workflows/compile.yml` publishes `dist/` → `deploy` branch).
- Formatting: prettier, tabs, singleQuote, printWidth 120 (`bunx prettier -w src`).
- Bump `version` in `bd-css.config.js` (3.0.0 → 3.0.1) in the same change set.
- Keep `src/root.css` user-facing options (`--HSL-server-direction`, `--HSL-server-alignment`, `--HSL-top-padding` consumers) and its commented-`@import` doc comments intact.
- CSS nesting in `src/` is fine (LightningCSS flattens).
- No new dependencies.

## Review Focus

1. **Per-user flag variants** — Discord A/B flags (`refresh-fast-follow-*` seen in CSS) can rename classes between accounts; user verifies with devtools in Task 1 and Task 3's visual protocol. Expect: rail at top, icons upright.
2. **Grid margin side effect** — `margin-top` on `.content_pog62O` (grid item, `1fr` row) may clip/shrink content instead of shifting it. Expect: bottom content fully visible, no gap. Test: visual check bottom edge with channel list open/collapsed (Task 3 step).
3. **Grid-area width** — `guildsList` area is `min-content`; the rotated absolute-positioned rail may overflow or collapse to 0. Expect: rail spans full window width at top without pushing meta/sidebar. Test: visual check (Task 3 step); fallback Task 4 rewrites `.base` grid template.
4. **fullscreen** — `[data-fullscreen=true]` path must stay untouched (stream/theater). Test: visual check in fullscreen titlebar state.
5. **addon + BetterFolders dead code shipping** — `bottomhsl.css` and the Vencord-BetterFolders block rehash blind. Expect: same visuals for bottom variant and folded-folder overlap. Test: visual check only when enabling the variant (Task 5/6 user steps).

---

### Task 1: Ground truth — finish the old→new mapping

**Files:**
- Modify: `docs/superpowers/plans/2026-11-09-fix-discord-rehash.md` (append verified rows under the mapping table)

**Interfaces:**
- Produces: final mapping table consumed by Tasks 3, 5, 6. Counts as "verified" only if seen in the user's own client DOM.

- [ ] **Step 1: User pastes this into Discord's devtools console (Ctrl+Shift+I) and returns output**

```js
const dump = s => { const e = [...document.querySelectorAll(s)].at(0); return e ? [...e.classList].join(',') : 'ABSENT'; };
document.querySelector('[class*="base_"]') && console.log(JSON.stringify({
 base: dump('[class*="base_"][data-fullscreen]'),
 sidebar: dump('[class*="sidebar_"][class*="width"]'),
 guilds: dump('[class*="guilds_"] .guilds_ [class*="tree_"], [class*="guilds_"]'),
 content: dump('[class*="content_"][class*="stretch"], [class^="content_"]'),
 notice: dump('#app-mount [class*="notice"]'),
 addServer: dump('[aria-label="Add a Server"], [class*="childWrapper"]'),
 pill: dump('[class*="guilds_"] [class*="pill"], [class*="pill"]'),
}));
```

Paste output verbatim into the plan file under `## Verified mapping (Task 1)`.

- [ ] **Step 2: Resolve unknown tokens**

For each of `.itemsContainer_ef3116`, `.stack_dbd263`, `.childWrapper__6e9f8`, `.notice__6e2b9`, `.container__5e434` decide replacement from the dump (or the surrounding DOM `[class^=...]` strings). Record each: old token → new token, or old token → REMOVED (delete rule).

### Task 2: Dead-selector check (the test)

**Files:**
- Create: `scripts/check-selectors.mjs`
- Modify: `package.json` (add `"test": "bun scripts/check-selectors.mjs"`)

**Interfaces:**
- Consumes: `dist/HorizontalServerList.css` (built output).
- Produces: exit 0 = no dead tokens; exit 1 + printed list of dead matches.

- [ ] **Step 1: Install deps and build current HEAD**

Run: `bun install && bun run build`
Expected: `dist/` contains the main theme file (`HorizontalServerList.css` most likely; verify the actual name and, if different, use it as the path in `check-selectors.mjs` and `@import` name everywhere else in this plan) containing the DEAD hash set (`base__5e434` etc.).

- [ ] **Step 2: Write the failing check**

`scripts/check-selectors.mjs`: reads `dist/HorizontalServerList.css`, fails if it contains any of the current-file dead tokens from the HEAD table (check for literal substrings `__5e434`, `__6e9f8`, `ef3116`, `dbd263`, `_48112`, `cc5dd2`, `__6e2b9`, `container__5e434`; the list must be updated to include the NEW hashes as "dead" every time Discord rehashes). Print `selector uses dead class <name>` + exit 1 on match.

- [ ] **Step 3: Run to verify it fails**

Run: `bun run test`
Expected: FAIL — `dist/HorizontalServerList.css` built from HEAD still contains dead tokens.

- [ ] **Step 4: Commit**

```bash
git add scripts/check-selectors.mjs package.json
git commit -m "test: fail build when theme targets dead Discord classes"
```

### Task 3: Remap `src/main.css` (top variant) to current classes

**Files:**
- Modify: `src/main.css` (whole file — every selector body stays, tokens change)
- Test: `bun run test` + user visual protocol

**Interfaces:**
- Consumes: mapping table (plan header + Task 1).
- Produces: `dist/HorizontalServerList.css` free of dead tokens, top-variant layout working.

- [ ] **Step 1: Apply mapping**

Replace every dead token from the table, including inside the nested rules (`.itemsContainer_ef3116, .stack_dbd263` etc.) and `data-fullscreen='false'`/`:fullscreen` sibling rules (keep those attributes as-is — verified still present on `.base_pog62O`). Keep all logic (rotate -90deg, 100vw, margins, Vencord-BetterFolders block) untouched — only tokens change.

- [ ] **Step 2: Format + build + check**

Run: `bunx prettier -w src && bun run build && bun run test`
Expected: check PASS (exit 0).

- [ ] **Step 3: Install to Vencord for visual test**

Copy `dist/HorizontalServerList.css` → `C:\Users\Mechful\AppData\Roaming\Vencord\themes\HorizontalServerList-top-test.css`, set `--HSL-server-direction` etc. (import file as a theme). User restarts Discord.

- [ ] **Step 4: Visual protocol (user reports pass/fail per line)**

1. Rail horizontal at top, icons upright. 2. Channel chat content starts below rail (no overlap; bottom edge visible). 3. Folders + unread badges upright. 4. Notice bar (member/voice notices) doesn't overlap rail. 5. Stream fullscreen unbroken. 6. `--HSL-server-alignment: center` override still aligns.

- [ ] **Step 5: Commit (only after user confirms or issues logged for Task 4)**

```bash
git add src/main.css docs/superpowers/plans/2026-11-09-fix-discord-rehash.md
git commit -m "fix: remap selectors to current Discord class names"
```

### Task 4 (conditional): grid fallback if Task 3 visual protocol fails

**Files:** Modify: `src/main.css`

**Interfaces:** Consumes: Task 1 mapping + Task 3 failure description (which line failed and how).

- [ ] **Step 1: Replace the margin-top hack with a grid override**

Rewrite `.base_pog62O[data-fullscreen='false']`: add one row — `grid-template-rows:[top] var(--custom-hsl-rail,0px) var(--custom-app-top-bar-height) ...` and place `guildsList` in row 1 (rotated inside it), dropping `margin-top` on `.content_pog62O` for a clean two-variant base; keep `.content_pog62O` `margin-top:0`. Drive the rail height with `--custom-hsl-rail`. One variable, no JS.

- [ ] **Step 2: Format + build + test + visual protocol** — same commands and checklists as Task 3.

- [ ] **Step 3: Commit** — `git commit -m "fix: replace content margin hack with grid rail row"`.

### Task 5 (optional, only if user enables bottom variant): `src/addons/bottomhsl.css`

**Files:** Modify: `src/addons/bottomhsl.css`

- [ ] **Step 1:** Same token swap as Task 3 (classes only, no logic changes). `#app-mount` and nested structure verified in Task 1 dump.
- [ ] **Step 2:** `bunx prettier -w src && bun run build && bun run test` → `dist/bottomhsl.css` regenerated.
- [ ] **Step 3:** Commit — `git commit -m "fix: remap bottom addon selectors"`.

### Task 6: BetterFolders compat — verify or quarantine

Do not blind-rename the Vencord block. `.container__5e434` is REMOVED-class; the block can only be verified with the user's Vencord BetterFolders actually enabled.

- [ ] **Step 1:** User runs devtools dump with BetterFolders enabled; capture applied classes around the hidden sidebar container.
- [ ] **Step 2:** If classes found: remap block. If not used/cannot verify: replace the block with a one-line `/* shortcut: discord rehash invalidated Vencord BetterFolders rules; restore after re-deriving current plugin DOM */` comment. Deleting blind dead rules loses signal; comment records it.

- [ ] **Step 3:** Commit if changed.

### Task 7: Ship

**Files:**
- Modify: `bd-css.config.js` (`version: '3.0.1'`)
- Modify: `C:\Users\Mechful\AppData\Roaming\Vencord\themes\HorizontalServerList.theme.css` (point at fork deploy URL, interim = local file)

- [ ] **Step 1:** Bump version, run `bunx prettier -w && bun run build && bun run test` → PASS.
- [ ] **Step 2:** Commit `git commit -m "chore: bump to 3.0.1"`; push fork; open PR upstream (`DiscordStyles/HorizontalServerList` ← `master`).
- [ ] **Step 3:** Interim user setup: wrapper theme in Vencord themes folder imports local `dist/HorizontalServerList.css` (or fork deploy URL to `https://raw.githubusercontent.com/Mechful/HorizontalServerList/deploy/HorizontalServerList.css` once the user has enabled Actions on the own fork so CI publishes it).
- [ ] **Step 4:** Confirm user's live Discord (Vencord restart + theme toggle) loads it — spot check: rail at top and check `bun run test` is green on `master`.
