// Follow-up: add the end-of-page grid ad to blog posts that lack it (older posts with
// no social-share block). Inserts before the footer. Idempotent on the grid slot.
//   node scripts/add-grid-ad-fallback.mjs

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const BLOG = join(dirname(fileURLToPath(import.meta.url)), '..', 'blog');
const CLIENT = 'ca-pub-4209585177080866';
const grid = `  <div class="ad-slot" style="margin:2.5rem 0"><ins class="adsbygoogle" style="display:block" data-ad-format="autorelaxed" data-ad-client="${CLIENT}" data-ad-slot="5038559824"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script></div>\n\n`;

let changed = 0;
for (const f of readdirSync(BLOG).filter((x) => x.endsWith('.html'))) {
  const p = join(BLOG, f);
  let h = readFileSync(p, 'utf8');
  if (h.includes('data-ad-slot="5038559824"')) continue; // already has grid ad
  if (h.includes('<footer class="site-footer">')) {
    h = h.replace('  <footer class="site-footer">', `${grid}  <footer class="site-footer">`);
    writeFileSync(p, h, 'utf8');
    changed++;
  }
}
console.log(`Grid ad added to ${changed} additional posts.`);
