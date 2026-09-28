import asyncio,re,sys
from playwright.async_api import async_playwright
BASE=sys.argv[1] if len(sys.argv)>1 else "http://localhost:3100"
AXE=open("node_modules/axe-core/axe.min.js").read()
res=[]
def ok(n,c,d=""): res.append(c); print(("PASS " if c else "FAIL ")+n,"|",str(d)[:230])
H="/ballot/parl.holborn-and-st-pancras.by.2026-10-08"
async def axe(pg):
    await pg.evaluate(AXE)
    return await pg.evaluate("async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}});return r.violations.map(v=>v.id+':'+v.nodes.length)}")
async def text(pg,url,w=2500):
    await pg.goto(BASE+url,wait_until='domcontentloaded',timeout=90000); await pg.wait_for_timeout(w); return re.sub(r'\s+',' ',await pg.inner_text('main'))
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        mob=await b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True); pg=await mob.new_page()
        await text(pg,H+"?age_band=65_plus&household=single&children=none&tenure=own_outright&income_band=15k_25k&employment=retired&student=no&disability=yes")
        v=await axe(pg); ok("money table reachable by keyboard on a phone (axe)", not any(x.startswith('scrollable-region') for x in v), v)
        await mob.close()
        ctx=await b.new_context(viewport={'width':1280,'height':900}); pg=await ctx.new_page()
        await text(pg,H+"?age_band=25_34&household=single&children=none&tenure=social_rent&income_band=15k_25k&employment=employed&student=no&disability=yes&benefits=yes")
        v=await axe(pg); ok("no target-size failures on the candidates page (axe)", not any(x.startswith('target-size') for x in v), v)
        t=await text(pg,H+"?age_band=65_plus&household=single&children=none&tenure=own_outright&income_band=15k_25k&employment=retired&student=no")
        m=re.search(r'Earnings or pension before tax \(the middle of your band\) £([\d,]+)',t); ok("earnings line shows the band midpoint (£20,000 for Margaret)", m and m.group(1)=="20,000", t[t.find('Earnings or'):t.find('Earnings or')+330])
        t=await text(pg,H+"?age_band=25_34&household=single&children=under_5&tenure=social_rent&income_band=under_15k&employment=not_working_other&student=no&benefits=yes")
        seg=t[t.find('Earnings or'):t.find('Net income after tax and benefits')+60]
        nums=[int(x.replace(',','')) for x in re.findall(r'£([\d,]+)',seg)]
        signs=re.findall(r'([−+]?)£',seg)
        vals=[(-n if s=='−' else n) for s,n in zip(signs,nums)]
        ok("not-working parent: earnings £0 and lines add up", nums and nums[0]==0 and sum(vals[:-1])==vals[-1], seg)
        t=await text(pg,H+"?age_band=16_17&household=other&children=none&tenure=other&income_band=under_15k&employment=student&student=school_college")
        ok("16-17 in England, UK Parliament: told they can't vote yet", "can’t vote in this one yet" in t and "UK Parliament elections is 18" in t, t[:0])
        ok("16-17 household: money figures withheld (Child Benefit quirk)", "no money figures" in t and "Child Benefit received" not in t)
        t=await text(pg,"/ballot/local.lambeth.myatts-fields.by.2026-10-08/area?age_band=16_17")
        ok("16-17 Lambeth council: can't vote (England, 18)", "council elections in England is 18" in t)
        t=await text(pg,"/ballot/local.stirling.forth-and-endrick.by.2026-10-01?age_band=16_17")
        ok("16-17 Stirling council: can vote (Scotland, 16)", "you can vote in this one" in t and "Scotland is 16" in t)
        t=await text(pg,"/ballot/local.carmarthenshire.saron.by.2026-10-22?age_band=16_17")
        ok("16-17 Saron council: can vote (Wales, 16)", "Wales is 16" in t)
        t=await text(pg,"/ballot/local.lambeth.myatts-fields.by.2026-10-08?age_band=25_34")
        ok("no age note for other ages", "vote in this one" not in t)
        t=await text(pg,"/ballot/local.lambeth.myatts-fields.by.2026-10-08?age_band=16_17&household=other&children=none&tenure=other&employment=student&student=school_college")
        ok("partial household still gets a summary", "This household:" in t and "Not answered: income" in t, t[t.find('This household'):t.find('This household')+200])
        t=await text(pg,"/place?pc=BT7&loc=54.585,-5.934",5000)
        seg=t[t.find('COUNCIL'):t.find('COUNCIL')+200] if 'COUNCIL' in t else t[t.find('Who makes decisions'):][:500]
        ok("Belfast: councillors listed for the DEA", "Botanic District Electoral Area" in t and "not listed" not in seg, seg)
        await ctx.close()
        ctx=await b.new_context(); pg=await ctx.new_page()
        await pg.goto(BASE+"/",wait_until='networkidle'); await pg.wait_for_timeout(800)
        await pg.locator('summary:has-text("postcode")').first.click(); await pg.wait_for_timeout(300)
        await pg.locator('input[name=postcode]:visible').fill('GY1 1AA'); await pg.locator('input[name=postcode]:visible').press('Enter'); await pg.wait_for_timeout(5000)
        ok("home page lookup: Guernsey told it's outside the UK", 'outside the UK' in pg.url.replace('%20',' ') or 'outside the UK' in await pg.inner_text('body'), pg.url[:120])
        await pg.goto(BASE+"/start",wait_until='networkidle'); await pg.wait_for_timeout(800)
        await pg.fill('input.big-input','NW1 1NN'); await pg.press('input.big-input','Enter'); await pg.wait_for_timeout(3000)
        for i in range(7): await pg.locator('main button:has-text("Skip")').first.click(); await pg.wait_for_timeout(300)
        async def slow(route):
            if route.request.method=="POST": await asyncio.sleep(2)
            try: await route.continue_()
            except Exception: pass
        await pg.route("**/start", slow)
        await pg.locator('main button:has-text("See my election")').click(); await pg.wait_for_timeout(600)
        btn=await pg.locator('main button[type=submit]').all_inner_texts()
        ok("final button shows 'Finding your election…' while it works", any('Finding your election' in x for x in btn), btn)
        await pg.unroute_all(behavior='ignoreErrors'); await b.close()
    print(f"\n{sum(res)}/{len(res)} passed")
asyncio.run(main())
