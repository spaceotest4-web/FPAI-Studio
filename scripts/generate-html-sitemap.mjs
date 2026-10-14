// Build a human + crawler HTML sitemap (site-index.html) from sitemap.xml so every
// page is reachable in one hop (helps indexing on a new domain).
//   node scripts/generate-html-sitemap.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.aichance.org';
const TODAY = '2026-10-14';

const xml = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8');
const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter((u) => !u.endsWith('/site-index.html'));

function label(u) {
  let p = u.replace(SITE, '').replace(/^\//, '') || 'Home';
  if (p === 'Home') return 'Home';
  p = p.replace(/\.html$/, '').replace(/\/$/, '');
  const leaf = p.split('/').pop();
  return leaf.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const groups = { 'Main pages': [], 'Free AI Image Generator by country': [], 'Blog': [], 'Legal': [] };
for (const u of locs) {
  const path = u.replace(SITE, '');
  if (path.includes('/free-ai-image-generator/')) groups['Free AI Image Generator by country'].push(u);
  else if (path.includes('/blog/')) groups['Blog'].push(u);
  else if (/\/(privacy|terms|contact)\.html$/.test(path)) groups['Legal'].push(u);
  else groups['Main pages'].push(u);
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
let sections = '';
for (const [title, urls] of Object.entries(groups)) {
  if (!urls.length) continue;
  const rel = urls.map((u) => `        <li><a href="${esc(u.replace(SITE, ''))}">${esc(label(u))}</a></li>`).join('\n');
  sections += `      <h2>${title} <span style="color:var(--text-muted,#888);font-weight:400;font-size:.9rem">(${urls.length})</span></h2>\n      <ul class="sitemap-list">\n${rel}\n      </ul>\n`;
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Site Index — All Pages | Aichance</title>
  <meta name="description" content="Complete index of every page on Aichance — the free AI image & video generator: tools, by-country guides, and ${groups['Blog'].length}+ blog guides.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${SITE}/site-index.html">
  <link rel="stylesheet" href="style.css">
  <style>.sitemap-list{columns:2;gap:2rem;list-style:none;padding:0;margin:0 0 1.5rem}.sitemap-list li{margin:.3rem 0;break-inside:avoid}.sitemap-list a{color:var(--primary,#6C63FF);text-decoration:none;font-size:.92rem}.sitemap-list a:hover{text-decoration:underline}@media(max-width:640px){.sitemap-list{columns:1}}</style>
</head>
<body>
  <header class="site-header"><div class="container"><a href="index.html" class="logo"><svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="url(#g1)"/><polygon points="13,10 13,22 23,16" fill="#fff"/><defs><linearGradient id="g1" x1="0" y1="0" x2="32" y2="32"><stop stop-color="#6366F1"/><stop offset="1" stop-color="#8B5CF6"/></linearGradient></defs></svg> <span class="logo-text">Ai<span class="logo-accent">chance</span></span></a><nav><ul class="nav-links" id="navLinks"><li><a href="index.html">Home</a></li><li><a href="index.html#features">Features</a></li><li><a href="blog.html">Blog</a></li><li><a href="index.html#download" class="btn btn-primary">Download App</a></li></ul></nav><button class="mobile-toggle" id="mobileToggle" aria-label="Toggle menu"><span></span><span></span><span></span></button></div></header>

  <main class="blog-detail"><div class="container"><div class="blog-detail-container">
    <nav class="breadcrumb"><a href="index.html">Home</a> &rsaquo; Site Index</nav>
    <h1>Site Index</h1>
    <p style="color:var(--text-light,#555);margin-bottom:2rem">Every page on Aichance — ${locs.length} in total. Last updated ${TODAY}.</p>
${sections}
  </div></div></main>

  <footer class="site-footer"><div class="container"><div class="footer-grid"><div class="footer-col"><h4>Aichance</h4><p>The all-in-one AI creative studio for Android.</p></div><div class="footer-col"><h4>Features</h4><ul><li><a href="index.html#features">Image Generation</a></li><li><a href="index.html#features">Video Generation</a></li></ul></div><div class="footer-col"><h4>Resources</h4><ul><li><a href="blog.html">Blog</a></li><li><a href="site-index.html">Site Index</a></li></ul></div><div class="footer-col"><h4>Legal</h4><ul><li><a href="privacy.html">Privacy Policy</a></li><li><a href="terms.html">Terms of Service</a></li><li><a href="contact.html">Contact</a></li></ul></div></div><div class="footer-bottom">&copy; 2026 Aichance. All rights reserved.</div></div></footer>
  <script>document.getElementById('mobileToggle').addEventListener('click',function(){document.getElementById('navLinks').classList.toggle('open')});</script>
</body>
</html>
`;

writeFileSync(join(ROOT, 'site-index.html'), html, 'utf8');
// add site-index.html to sitemap.xml if missing
let sm = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8');
if (!sm.includes('/site-index.html')) {
  sm = sm.replace('</urlset>', `  <url><loc>${SITE}/site-index.html</loc><lastmod>${TODAY}</lastmod><changefreq>weekly</changefreq><priority>0.5</priority></url>\n</urlset>`);
  writeFileSync(join(ROOT, 'sitemap.xml'), sm, 'utf8');
}
console.log(`site-index.html built with ${locs.length} links across ${Object.values(groups).filter((g) => g.length).length} groups.`);
