// Programmatic SEO generator: builds one static page per country from countries.mjs.
// Pattern mirrors marine-sky's dynamic [slug] pages, but emits plain .html for this static site.
//   node scripts/generate-country-pages.mjs
// Output: /free-ai-image-generator/<slug>.html, a hub index, and refreshed sitemap entries.

import { countries } from './countries.mjs';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.aichance.org';
const SECTION = 'free-ai-image-generator';
const OUT_DIR = join(ROOT, SECTION);
const TODAY = '2026-10-11';

mkdirSync(OUT_DIR, { recursive: true });

const HEADER = `  <header class="site-header"><div class="container"><a href="../index.html" class="logo"><svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="url(#g1)"/><polygon points="13,10 13,22 23,16" fill="#fff"/><defs><linearGradient id="g1" x1="0" y1="0" x2="32" y2="32"><stop stop-color="#6366F1"/><stop offset="1" stop-color="#8B5CF6"/></linearGradient></defs></svg> <span class="logo-text">Ai<span class="logo-accent">chance</span></span></a><nav><ul class="nav-links" id="navLinks"><li><a href="../index.html">Home</a></li><li><a href="../index.html#features">Features</a></li><li><a href="../blog.html">Blog</a></li><li><a href="../index.html#download" class="btn btn-primary">Download App</a></li></ul></nav><button class="mobile-toggle" id="mobileToggle" aria-label="Toggle menu"><span></span><span></span><span></span></button></div></header>`;

const FOOTER = `  <footer class="site-footer"><div class="container"><div class="footer-grid"><div class="footer-col"><h4>Aichance</h4><p>The all-in-one AI creative studio for Android.</p></div><div class="footer-col"><h4>Features</h4><ul><li><a href="../index.html#features">Image Generation</a></li><li><a href="../index.html#features">Video Generation</a></li></ul></div><div class="footer-col"><h4>Resources</h4><ul><li><a href="../blog.html">Blog</a></li><li><a href="index.html">Free AI by Country</a></li></ul></div><div class="footer-col"><h4>Legal</h4><ul><li><a href="#">Privacy Policy</a></li><li><a href="#">Terms of Service</a></li></ul></div></div><div class="footer-bottom">&copy; 2026 Aichance. All rights reserved.</div></div></footer>
  <script>document.getElementById('mobileToggle').addEventListener('click',function(){document.getElementById('navLinks').classList.toggle('open')});</script>
</body>
</html>`;

// Capitalize a country name that may start with lowercase "the"
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function faqFor(c) {
  return [
    {
      q: `Is there a truly free AI image generator in ${c.name}?`,
      a: `Yes. Aichance is free to use in ${c.name} with no sign-up on the web generator and no credit card on the Android app. Because payments in ${c.name} run largely on ${c.payments} — which global AI subscriptions rarely accept — a no-card tool is the practical choice for most people here.`,
    },
    {
      q: `Do I need a credit card to generate AI images in ${c.name}?`,
      a: `No. Aichance never asks for a card. ${c.paymentPara}`,
    },
    {
      q: `Can I write prompts in ${c.language}?`,
      a: `${c.langPara}`,
    },
    {
      q: `What do people in ${c.name} use AI image generation for?`,
      a: `The dominant use case is ${c.primaryUseCase}. ${c.useCasePara}`,
    },
  ];
}

function pageHtml(c) {
  const url = `${SITE}/${SECTION}/${c.slug}.html`;
  const title = `Free AI Image Generator in ${c.name} (2026) — No Sign-Up, No Card | Aichance`;
  const desc = `Free AI image generator in ${c.name} (2026): no sign-up, no credit card. Works with ${c.devices} devices, no need for ${c.payments}. Create ${c.primaryUseCase} visuals free with Aichance.`;
  const keywords = `free ai image generator ${c.slug.replace(/-/g, ' ')}, ai image generator in ${c.name.replace(/^the /, '')}, no credit card ai generator ${c.name.replace(/^the /, '')}, free ai art ${c.name.replace(/^the /, '')}, ${c.adj.toLowerCase()} ai image generator`;
  const faq = faqFor(c);

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `Free AI Image Generator in ${c.name} (2026)`,
    description: desc,
    datePublished: TODAY,
    dateModified: TODAY,
    author: { '@type': 'Organization', name: 'Aichance' },
    publisher: { '@type': 'Organization', name: 'Aichance' },
    mainEntityOfPage: url,
  };
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4209585177080866" crossorigin="anonymous"></script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <meta name="keywords" content="${keywords}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="Free AI Image Generator in ${c.name} (2026)">
  <meta property="og:description" content="${desc}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${SITE}/assets/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">
${JSON.stringify(articleLd)}
  </script>
  <script type="application/ld+json">
${JSON.stringify(faqLd)}
  </script>
  <link rel="stylesheet" href="../style.css">
</head>
<body>
${HEADER}

  <main class="blog-detail"><div class="container"><div class="blog-detail-container">
    <nav class="breadcrumb"><a href="../index.html">Home</a> &rsaquo; <a href="index.html">Free AI by Country</a> &rsaquo; ${c.name}</nav>
    <h1>Free AI Image Generator in ${c.name} ${c.flag} (2026)</h1>
    <div class="blog-meta"><div class="author"><div class="author-avatar">Ai</div><span>Aichance Team</span></div><div class="date">Oct 11, 2026</div><div class="read-time">6 min read</div></div>
    <div class="blog-tags" style="margin-bottom:2rem"><span class="tag">Free AI Tools</span><span class="tag">${c.name}</span><span class="tag">No Credit Card</span></div>
    <div class="featured-image" style="background:linear-gradient(135deg,#10B981,#2563EB);display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.25rem;font-weight:600">Free AI Image Generator · ${c.name}</div>

    <div class="blog-content">
      <p>${c.introPara}</p>
      <div class="callout"><p><strong>The short answer for ${c.name}:</strong> Aichance is free with no credit card on Android and runs with no account at all through the <a href="../ai-image-generator.html">web generator</a> — which makes it the most accessible serious AI image generator in a market built around ${c.payments}.</p></div>

      <h2>Is it really free in ${c.name}?</h2>
      <p>${c.paymentPara}</p>

      <h2>What people in ${c.name} create with AI</h2>
      <p>${c.useCasePara}</p>

      <h2>Writing prompts in ${c.language}</h2>
      <p>${c.langPara}</p>

      <h2>Data and devices in ${c.name}</h2>
      <p>Devices here are ${c.devices}, and data is ${c.dataCost}. ${c.tip}</p>

      <h2>How to generate an AI image in ${c.name} (free)</h2>
      <ol>
        <li>Open the <a href="../ai-image-generator.html">Aichance web generator</a> — no account or card needed.</li>
        <li>Type a short, concrete prompt in English (subject, style, lighting).</li>
        <li>Pick an aspect ratio that matches where you will post it.</li>
        <li>Generate, then download — or install the <a href="../index.html#download">Android app</a> for image, video, and editing in one place.</li>
      </ol>

      <div class="callout"><p><strong>Start now:</strong> <a href="../ai-image-generator.html">Generate a free AI image →</a> &nbsp;·&nbsp; <a href="index.html">See every country →</a></p></div>

      <h2>FAQ — Free AI image generation in ${c.name}</h2>
      ${faq.map((f) => `<h3>${f.q}</h3>\n      <p>${f.a}</p>`).join('\n      ')}
    </div>

    <div class="author-bio"><div class="author-avatar-lg">Ai</div><h4>Aichance Team</h4><p>We build tools that make AI-powered creativity accessible to everyone.</p></div>
    <div class="related-posts"><h2>Related</h2><div class="blog-grid">
      <a href="../blog/best-free-ai-image-video-generator-by-country-2026.html" class="blog-card"><div class="blog-card-image" style="background:linear-gradient(135deg,#10B981,#2563EB);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600">By Country</div><div class="blog-card-content"><div class="blog-tags"><span class="tag">Guide</span></div><h3>Best Free AI Generator by Country (2026)</h3><span class="read-more">Read More &rarr;</span></div></a>
      <a href="../blog/best-free-ai-image-generator-2026.html" class="blog-card"><div class="blog-card-image" style="background:linear-gradient(135deg,#111827,#8B5CF6);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600">Best Free Tools</div><div class="blog-card-content"><div class="blog-tags"><span class="tag">Guide</span></div><h3>Best Free AI Image Generator (2026)</h3><span class="read-more">Read More &rarr;</span></div></a>
    </div></div>
  </div></div></main>

${FOOTER}`;
}

function hubHtml() {
  const url = `${SITE}/${SECTION}/`;
  const items = countries
    .map(
      (c) =>
        `      <a href="${c.slug}.html" class="blog-card"><div class="blog-card-image" style="background:linear-gradient(135deg,#10B981,#2563EB);display:flex;align-items:center;justify-content:center;color:#fff;font-size:2rem">${c.flag}</div><div class="blog-card-content"><div class="blog-tags"><span class="tag">${c.primaryUseCase}</span></div><h3>Free AI Image Generator in ${c.name}</h3><span class="read-more">Read More &rarr;</span></div></a>`
    )
    .join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4209585177080866" crossorigin="anonymous"></script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Free AI Image Generator by Country (2026) — No Sign-Up, No Card | Aichance</title>
  <meta name="description" content="Free AI image generator guides for ${countries.length} countries — no sign-up, no credit card. Local payment, data, device, and language notes for each market.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="Free AI Image Generator by Country (2026)">
  <meta property="og:description" content="Country-by-country free AI image generation — no card, no sign-up.">
  <meta property="og:url" content="${url}">
  <link rel="stylesheet" href="../style.css">
</head>
<body>
${HEADER}

  <main class="blog-detail"><div class="container"><div class="blog-detail-container">
    <nav class="breadcrumb"><a href="../index.html">Home</a> &rsaquo; Free AI by Country</nav>
    <h1>Free AI Image Generator by Country (2026)</h1>
    <p style="font-size:1.1rem;color:var(--muted);margin-bottom:2rem">The tool is global; using it is local. Pick your country for the real picture — payments, data, devices, language, and what people actually create — plus a free way to start with no sign-up and no credit card.</p>
    <div class="blog-grid">
${items}
    </div>
  </div></div></main>

${FOOTER}`;
}

// --- write pages ---
let written = 0;
for (const c of countries) {
  writeFileSync(join(OUT_DIR, `${c.slug}.html`), pageHtml(c), 'utf8');
  written++;
}
writeFileSync(join(OUT_DIR, 'index.html'), hubHtml(), 'utf8');

// --- update sitemap.xml: drop any prior entries for this section, then append fresh ---
const sitemapPath = join(ROOT, 'sitemap.xml');
let sm = readFileSync(sitemapPath, 'utf8');
sm = sm.replace(new RegExp(`\\s*<url>(?:(?!</url>).)*${SECTION}/(?:(?!</url>).)*</url>`, 'gs'), '');
const newUrls = [
  `  <url><loc>${SITE}/${SECTION}/</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`,
  ...countries.map(
    (c) => `  <url><loc>${SITE}/${SECTION}/${c.slug}.html</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`
  ),
].join('\n');
sm = sm.replace('</urlset>', `${newUrls}\n</urlset>`);
writeFileSync(sitemapPath, sm, 'utf8');

console.log(`Generated ${written} country pages + hub index in /${SECTION}/`);
console.log(`Sitemap updated with ${written + 1} entries.`);
