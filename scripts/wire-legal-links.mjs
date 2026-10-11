// Point footer "Privacy Policy / Terms / Contact" links at the real pages, across the
// whole site. Root pages use bare paths; blog/ and free-ai-image-generator/ use ../.
// Adds a Contact link where a page only had Privacy + Terms.  node scripts/wire-legal-links.mjs

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function wire(dir, prefix) {
  let n = 0;
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.html'))) {
    const p = join(dir, f);
    let h = readFileSync(p, 'utf8');
    const before = h;
    h = h.split('<a href="#">Privacy Policy</a>').join(`<a href="${prefix}privacy.html">Privacy Policy</a>`);
    h = h.split('<a href="#">Terms of Service</a>').join(`<a href="${prefix}terms.html">Terms of Service</a>`);
    h = h.split('<a href="#">Contact</a>').join(`<a href="${prefix}contact.html">Contact</a>`);
    // add a Contact item on pages that only had Privacy + Terms
    const termsLi = `<a href="${prefix}terms.html">Terms of Service</a></li>`;
    if (!h.includes(`${prefix}contact.html`) && h.includes(termsLi)) {
      h = h.replace(termsLi, `${termsLi}<li><a href="${prefix}contact.html">Contact</a></li>`);
    }
    if (h !== before) { writeFileSync(p, h, 'utf8'); n++; }
  }
  return n;
}

const rootN = wire(ROOT, '');
const blogN = wire(join(ROOT, 'blog'), '../');
const countryN = wire(join(ROOT, 'free-ai-image-generator'), '../');
console.log(`Wired legal links — root: ${rootN}, blog: ${blogN}, country: ${countryN}`);
