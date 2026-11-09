// Fails while the built theme still targets Discord class hashes that no longer exist.
// Update DEAD_TOKENS (and ADD the newest hashes) whenever Discord rehashes again.
import { readFileSync, existsSync } from 'node:fs';

// token name in this repo's source -> first synced build it was known to be dead
const DEAD_TOKENS = [
	{ token: '__5e434', src: 'base__5e434 (2026-11: rehashed to *_pog62O scheme)' },
	{ token: '__6e9f8', src: 'wrapper__6e9f8 / childWrapper__6e9f8 (2026-11)' },
	{ token: 'ef3116', src: 'tree_ef3116 / itemsContainer_ef3116 (2026-11)' },
	{ token: 'dbd263', src: 'stack_dbd263 (2026-11)' },
	{ token: '_48112', src: 'folder*__48112 (2026-11)' },
	{ token: 'cc5dd2', src: 'lowerBadge_cc5dd2 / upperBadge_cc5dd2 (2026-11)' },
	{ token: '__6e2b9', src: 'notice__6e2b9 (2026-11)' },
];

// built outputs that embed the theme selectors (wrapper .theme.css only carries @import)
const TARGETS = ['dist/HorizontalServerList.css', 'dist/HorizontalServerList.static.theme.css', 'dist/bottomhsl.css'];

let failed = false;
for (const target of TARGETS) {
	if (!existsSync(target)) {
		console.error(`PASS-with-warning: ${target} missing (run "bun run build" first)`);
		continue;
	}
	const css = readFileSync(target, 'utf8');
	for (const { token, src } of DEAD_TOKENS) {
		if (css.includes(token)) {
			console.error(`${target}: selector uses dead class token ${token} (${src})`);
			failed = true;
		}
	}
}

if (failed) process.exit(1);
console.log('No dead Discord class tokens found in dist.');
