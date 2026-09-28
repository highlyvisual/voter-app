import asyncio,re,sys
from playwright.async_api import async_playwright
BASE=sys.argv[1] if len(sys.argv)>1 else "http://localhost:3100"
res=[]
def ok(name,cond,detail=""): res.append((name,bool(cond),detail)); print(("PASS " if cond else "FAIL ")+name,"|",detail)
async def fresh(b,slow=False,mobile=False):
    ctx=await b.new_context(**({'viewport':{'width':390,'height':844},'is_mobile':True,'has_touch':True} if mobile else {}))
    pg=await ctx.new_page()
    if slow:
        c=await ctx.new_cdp_session(pg); await c.send("Network.emulateNetworkConditions",{"offline":False,"latency":400,"downloadThroughput":51200,"uploadThroughput":51200})
    return ctx,pg
async def step_text(pg): t=await pg.inner_text('main'); m=re.search(r'Step (\d+) of',t); return m.group(1) if m else None
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        # 1 Enter key on desktop + mobile
        for mob in (False,True):
            ctx,pg=await fresh(b,mobile=mob); await pg.goto(BASE+"/start",wait_until='networkidle'); await pg.wait_for_timeout(800)
            await pg.fill('input.big-input','NW1 1NN'); await pg.press('input.big-input','Enter'); await pg.wait_for_timeout(3000)
            ok(f"1 Enter goes to question 2 ({'mobile' if mob else 'desktop'})", '/start' in pg.url and await step_text(pg)=='2', pg.url[:60]+' step '+str(await step_text(pg)))
            await ctx.close()
        # 2 typing before hydration on slow network
        for delay in (0,300,1500):
            ctx,pg=await fresh(b,slow=True); await pg.goto(BASE+"/start",wait_until='domcontentloaded',timeout=90000); await pg.wait_for_selector('input.big-input',timeout=60000)
            await pg.wait_for_timeout(delay); await pg.type('input.big-input','WC1H 9JE',delay=60)
            await pg.wait_for_timeout(9000)
            btn=pg.locator('main button:has-text("Next")').first
            dis=await btn.is_disabled(); await btn.click(); await pg.wait_for_timeout(6000)
            ok(f"2 early typing (+{delay}ms, slow network) still moves on", not dis and await step_text(pg)=='2', f"disabled={dis} step={await step_text(pg)}")
            await ctx.close()
        # 4 invalid postcodes caught on step 1
        for pc,expect in [("XX1 1XX","can't find"),("PA3l 8NB","can't find"),("NG31","first half"),("GY1 1AA","outside the UK"),("hello","doesn't look like")]:
            ctx,pg=await fresh(b); await pg.goto(BASE+"/start",wait_until='networkidle'); await pg.wait_for_timeout(800)
            await pg.fill('input.big-input',pc); await pg.locator('main button:has-text("Next")').first.click(); await pg.wait_for_timeout(4000)
            alert=await pg.locator('[role=alert]').all_inner_texts()
            ok(f"4 '{pc}' stopped at step 1 with a message", await step_text(pg)=='1' and any(expect in a for a in alert), ' / '.join(alert)[:110])
            await ctx.close()
        # 3 focus moves to heading + full journey + 5 visa money box
        ctx,pg=await fresh(b); await pg.goto(BASE+"/start",wait_until='networkidle'); await pg.wait_for_timeout(800)
        await pg.fill('input.big-input','NW5 2HS'); await pg.locator('main button:has-text("Next")').first.click(); await pg.wait_for_timeout(3000)
        f1=await pg.evaluate("()=>document.activeElement.tagName+':'+document.activeElement.innerText")
        focs=[f1]
        for c in ["18 to 24","Housemates, or student halls","None","Rent privately","Under £15,000","Not working, looking for work","Not a student"]:
            await pg.locator('main button').filter(has_text=re.compile('^'+re.escape(c))).first.click(); await pg.wait_for_timeout(700)
            focs.append(await pg.evaluate("()=>document.activeElement.tagName+':'+document.activeElement.innerText"))
        ok("3 focus moves to each new question's heading", all(f.startswith('H2:') for f in focs), ' | '.join(focs)[:200])
        yn=pg.locator('main button').filter(has_text=re.compile(r'^(Yes|No)$'))
        await yn.nth(4).click()  # visa yes
        await pg.locator('main button:has-text("See my election")').click()
        for _ in range(20):
            await pg.wait_for_timeout(1000)
            if '/start' not in pg.url: break
        ok("full journey reaches Holborn with visa=yes", 'holborn' in pg.url and 'visa=yes' in pg.url, pg.url[:120])
        q=pg.url.split('?',1)[1]
        await pg.goto(BASE+"/ballot/parl.holborn-and-st-pancras.by.2026-10-08?"+q,wait_until='domcontentloaded',timeout=90000); await pg.wait_for_timeout(3000)
        t=await pg.inner_text('main')
        ok("5 visa household: no money figures, reason shown", 'no money figures' in t and 'Universal Credit received' not in t, re.sub(r'\s+',' ',t[t.find('no money figures')-40:t.find('no money figures')+160]))
        await ctx.close()
        # 5 student vs ordinary household
        ctx,pg=await fresh(b)
        base="/ballot/parl.holborn-and-st-pancras.by.2026-10-08?"
        await pg.goto(BASE+base+"age_band=18_24&household=shared&children=none&tenure=private_rent&income_band=under_15k&employment=student_working&student=university",wait_until='domcontentloaded',timeout=90000); await pg.wait_for_timeout(2500)
        t=await pg.inner_text('main'); ok("5 single full-time student: no money figures", 'no money figures' in t and 'Universal Credit received' not in t)
        await pg.goto(BASE+base+"age_band=25_34&household=couple&children=under_5&tenure=social_rent&income_band=15k_25k&employment=employed&student=no",wait_until='domcontentloaded',timeout=90000); await pg.wait_for_timeout(2500)
        t=await pg.inner_text('main'); ok("5 ordinary household still gets figures", 'Universal Credit received' in t and 'no money figures' not in t)
        await pg.goto(BASE+base+"age_band=25_34&household=couple&children=under_5&tenure=private_rent&income_band=15k_25k&employment=student_working&student=university",wait_until='domcontentloaded',timeout=90000); await pg.wait_for_timeout(2500)
        t=await pg.inner_text('main'); ok("5 student parent in a couple still gets figures", 'Universal Credit received' in t)
        # 6 unconfirmed ballots
        for bid,exp in [("local.bournemouth-christchurch-and-poole.penn-hill.by.2026-11-05","haven't been confirmed yet"),("local.halton.beechwood-heath.by.2026-10-29","isn't confirmed yet"),("local.argyll-and-bute.mid-argyll.by.2026-10-29","haven't been confirmed yet")]:
            await pg.goto(BASE+"/ballot/"+bid,wait_until='domcontentloaded',timeout=90000); await pg.wait_for_timeout(2500)
            t=await pg.inner_text('main'); lede=re.sub(r'\s+',' ',t[t.find('Meet the candidates'):][:420])
            ok(f"6 {bid.split('.')[2]} says not confirmed", exp in t and 'candidates are standing' not in t and '1 candidates' not in t and 'See the 0' not in t, lede[20:260])
        await pg.goto(BASE+"/ballot/local.lambeth.myatts-fields.by.2026-10-08",wait_until='domcontentloaded',timeout=90000); await pg.wait_for_timeout(2500)
        t=await pg.inner_text('main'); ok("6 confirmed ballot unchanged (7 candidates are standing)", '7 candidates are standing' in t)
        await ctx.close(); await b.close()
    print(f"\n{sum(r[1] for r in res)}/{len(res)} passed")
asyncio.run(main())
