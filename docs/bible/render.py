import sys, re, asyncio, pdfplumber
from playwright.async_api import async_playwright
src, out = sys.argv[1], sys.argv[2]
async def render(html_path, pdf_path):
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
        pg = await b.new_page()
        await pg.goto("file://" + html_path, wait_until="networkidle")
        await pg.evaluate("document.fonts.ready")
        await pg.pdf(path=pdf_path, prefer_css_page_size=True, print_background=True)
        await b.close()
import os
html = os.path.abspath(src)
asyncio.run(render(html, out))
# second pass: find section pages and fill the contents
text = open(html).read()
ids = re.findall(r'<section class="section" id="([sf]\d+)">\s*<div class="section-head"[^>]*><div class="num">[^<]*</div><h2>([^<]+)</h2>', text)
pages = {}
with pdfplumber.open(out) as pdf:
    for i, page in enumerate(pdf.pages):
        t = (page.extract_text() or "").replace("’","'")
        for sid, title in ids:
            key = title.replace("&rsquo;","'").replace("&amp;","&")
            if sid not in pages and t.find(key) != -1 and i > 1:
                pages[sid] = i + 1
    n = len(pdf.pages)
print("pages", n, pages)
if pages:
    for sid, pno in pages.items():
        text = re.sub(rf'(<span class="p" data-for="{sid}">)[^<]*(</span>)', rf'\g<1>{pno}\g<2>', text)
    open(html, "w").write(text)
    asyncio.run(render(html, out))
