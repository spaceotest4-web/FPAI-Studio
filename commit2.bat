@echo off
cd /d D:\FPAI-Studio
git add blog/text-to-video-ai-guide.html blog.html sitemap.xml
git commit -m "feat: add blog post - Text to Video AI Guide 2026 (10 models ranked)"
git checkout main
git merge blog/text-to-video-ai-guide
git push origin main
