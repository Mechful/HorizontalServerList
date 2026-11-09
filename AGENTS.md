# AGENTS.md

## Project

"Horizontal Server List" — a BetterDiscord/Vencord CSS theme that moves Discord's server list to the top. CSS only, no JS. Compiled with [bd-css](https://github.com/Gibbu/bd-css) (Bun + LightningCSS). This is the `Mechful` fork; upstream is `DiscordStyles/HorizontalServerList` (remote `upstream`).

## Commands

- Requires [Bun](https://bun.com/docs/installation). Scripts pass `--bun`, so plain `node`/`npm run` will not work.
- `bun install` — set up deps
- `bun run dev` — watch `src/`, build straight into the local BetterDiscord themes folder
- `bun run build` — emit distributable theme files to `dist/` (gitignored)
- `bunx prettier .` — format (tabs, single quotes, printWidth 120)
- No lint/test/typecheck scripts exist. Verification = `bun run build` succeeds.

## Structure

- `bd-css.config.js` — theme meta (name/author/version → baked into built theme header). Bump `version` in releases.
- `src/root.css` — user-facing CSS variables / theme options; keep the inline option docs and commented-`@import` instructions intact.
- `src/main.css` — theme layout logic.
- `src/addons/bottomhsl.css` — bottom variant; compiled as its own file via the `addons` array in `bd-css.config.js`.

## Gotchas

- Default branch is `master`, not `main`. `CONTRIBUTING.md` says "main" — stale, ignore it. PRs against `master`.
- CI (`.github/workflows/compile.yml`) on push to `master` runs `bun run build` and publishes `dist/` to the `deploy` branch. Vencord users load the theme from the `deploy` raw URL in README; the bottom addon is loaded from `https://discordstyles.github.io/HorizontalServerList/bottomhsl.css`. Keep those URLs in sync with any file/output renames.
- Discord selectors use compiled hash suffixes (`.base__5e434`, `.guilds__5e434`, `--custom-guild-list-width`...). They change when Discord updates its frontend — when a selector breaks, re-derive it from the current client DOM instead of guessing.
- CSS nesting in `src/` is fine; LightningCSS flattens it at build time.
- `--HSL-server-direction` and `--HSL-server-alignment` are documented user options (see `src/root.css`); keep defaults compatible with the documented values.
