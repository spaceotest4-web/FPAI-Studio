// Add a left ad rail (mirror of the right sidebar) to every blog article, so both
// gutters carry a vertical ad. Idempotent.  node scripts/add-left-sidebar.mjs

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const BLOG = join(dirname(fileURLToPath(import.meta.url)), '..', 'blog');
const CLIENT = 'ca-pub-4209585177080866';
const LEFT = `<aside class="blog-sidebar-left"><div class="ad-slot"><ins class="adsbygoogle" style="display:block" data-ad-client="${CLIENT}" data-ad-slot="7851501984" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script></div></aside>`;

const ANCHOR = '<div class="blog-layout"><div class="blog-detail-container">';
let changed = 0, skipped = 0;
for (const f of readdirSync(BLOG).filter((x) => x.endsWith('.html'))) {
  const p = join(BLOG, f);
  let h = readFileSync(p, 'utf8');
  if (h.includes('class="blog-sidebar-left"')) { skipped++; continue; }
  if (!h.includes(ANCHOR)) { skipped++; continue; }
  h = h.replace(ANCHOR, `<div class="blog-layout">${LEFT}<div class="blog-detail-container">`);
  writeFileSync(p, h, 'utf8');
  changed++;
}
console.log(`Left rail added to ${changed} blog posts; skipped ${skipped}.`);
