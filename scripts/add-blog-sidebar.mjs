// Wrap each blog article in a flex layout with a sticky right sidebar holding the
// vertical ad unit, using the formerly-empty gutter. Idempotent; handles both the
// single-line and multi-line closing-div formats.  node scripts/add-blog-sidebar.mjs

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const BLOG = join(dirname(fileURLToPath(import.meta.url)), '..', 'blog');
const CLIENT = 'ca-pub-4209585177080866';
const ASIDE = `<aside class="blog-sidebar"><div class="ad-slot"><ins class="adsbygoogle" style="display:block" data-ad-client="${CLIENT}" data-ad-slot="7851501984" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script></div></aside>`;

let changed = 0, skipped = 0;
for (const f of readdirSync(BLOG).filter((x) => x.endsWith('.html'))) {
  const p = join(BLOG, f);
  let h = readFileSync(p, 'utf8');
  if (h.includes('class="blog-sidebar"')) { skipped++; continue; }
  if (!h.includes('<div class="blog-detail-container">')) { skipped++; continue; }
  const before = h;
  // open the flex wrapper
  h = h.replace('<div class="blog-detail-container">', '<div class="blog-layout"><div class="blog-detail-container">');
  // close: insert aside + extra closing div before the container-close/main-close
  h = h.replace(/(<\/div>)(\s*<\/div>\s*<\/main>)/, `$1${ASIDE}</div>$2`);
  if (h !== before && h.includes('class="blog-sidebar"')) { writeFileSync(p, h, 'utf8'); changed++; }
  else skipped++;
}
console.log(`Sidebar added to ${changed} blog posts; skipped ${skipped}.`);
