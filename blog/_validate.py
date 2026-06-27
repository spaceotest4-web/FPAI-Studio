import re, json, html as ihtml
src = open(r"D:\FPAI-Studio\blog\ai-sky-replacement-guide-2026.html", encoding="utf-8").read()

# Word count of blog-content
m = re.search(r'<div class="blog-content">(.*?)<div class="social-share"', src, re.S)
content = m.group(1)
text = re.sub(r'<[^>]+>', ' ', content)
print("blog-content words:", len(text.split()))

# Extract FAQPage JSON-LD
jsonlds = re.findall(r'<script type="application/ld\+json">(.*?)</script>', src, re.S)
faq = None
for j in jsonlds:
    d = json.loads(j)
    if d.get("@type") == "FAQPage":
        faq = d
print("JSON-LD FAQ entries:", len(faq["mainEntity"]))

# Extract visible FAQ Q/A pairs
faq_block = src[src.index('<h2 id="faq">'):src.index('</div>\n\n    <div class="social-share"')]
pairs = re.findall(r'<h3>(.*?)</h3>\s*<p>(.*?)</p>', faq_block, re.S)

ok = True
for i, qa in enumerate(faq["mainEntity"]):
    jq = qa["name"].strip()
    ja = qa["acceptedAnswer"]["text"].strip()
    vq = ihtml.unescape(pairs[i][0]).strip()
    va = ihtml.unescape(pairs[i][1]).strip()
    if jq != vq:
        ok = False; print(f"Q{i+1} MISMATCH question")
    if ja != va:
        ok = False
        print(f"A{i+1} MISMATCH")
        print("  JSON:", repr(ja))
        print("  HTML:", repr(va))
print("All 5 FAQ Q/A match word-for-word:" , ok)

# TOC ids vs section ids
toc_ids = re.findall(r'href="#([^"]+)"', re.search(r'<div class="toc">(.*?)</div>', src, re.S).group(1))
sec_ids = re.findall(r'<h2 id="([^"]+)"', src)
print("TOC ids:", toc_ids)
print("Section ids:", sec_ids)
print("TOC == sections:", toc_ids == sec_ids)
