// One-off: inserts AdSense units into every blog post that doesn't already have them.
// Loader <script> is already in each page's <head>, so we insert only the <ins> units.
//   node scripts/add-ads-to-blog.mjs
// Placements: a horizontal unit before the first <h2> (after the intro), and a grid
// (autorelaxed/multiplex) unit at the end, before the social-share block. Idempotent.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const BLOG = join(dirname(fileURLToPath(import.meta.url)), '..', 'blog');
const CLIENT = 'ca-pub-4209585177080866';

const horizontal = `\n      <div class="ad-slot" style="margin:2rem 0;text-align:center"><ins class="adsbygoogle" style="display:block" data-ad-client="${CLIENT}" data-ad-slot="1477665327" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script></div>\n`;
const grid = `    <div class="ad-slot" style="margin:2.5rem 0"><ins class="adsbygoogle" style="display:block" data-ad-format="autorelaxed" data-ad-client="${CLIENT}" data-ad-slot="5038559824"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script></div>\n\n`;

let changed = 0, skipped = 0;
for (const f of readdirSync(BLOG).filter((x) => x.endsWith('.html'))) {
  const p = join(BLOG, f);
  let h = readFileSync(p, 'utf8');
  if (h.includes('class="ad-slot"')) { skipped++; continue; } // already has ads
  const before = h;
  // top in-article ad: before the first content <h2>
  h = h.replace(/(\n\s*<h2\b)/, `${horizontal}$1`);
  // end-of-article grid ad: before the social-share block
  if (h.includes('<div class="social-share">')) {
    h = h.replace('    <div class="social-share">', `${grid}    <div class="social-share">`);
  }
  if (h !== before) { writeFileSync(p, h, 'utf8'); changed++; } else { skipped++; }
}
console.log(`Ads added to ${changed} blog posts; skipped ${skipped}.`);
