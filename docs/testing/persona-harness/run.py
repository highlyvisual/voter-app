import asyncio, json, re, sys, time, urllib.request, urllib.parse
from playwright.async_api import async_playwright
from personas import P

BASE = "https://whatsittome.org"
AXE = open("node_modules/axe-core/axe.min.js").read()
YN = ["disability", "carer", "visa", "benefits", "drives", "veteran"]

def pcio(pc):
    try:
        q = urllib.parse.quote(pc.replace(" ", ""))
        return json.load(urllib.request.urlopen(f"https://api.postcodes.io/postcodes/{q}"))["result"]
    except Exception:
        return None

CTX = {
  "desktop": dict(viewport={"width": 1280, "height": 900}),
  "mobile": dict(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True, device_scale_factor=3),
  "mobile_slow": dict(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True),
  "mobile_small": dict(viewport={"width": 320, "height": 640}, is_mobile=True, has_touch=True),
  "tablet": dict(viewport={"width": 820, "height": 1180}, is_mobile=True, has_touch=True),
  "zoom200": dict(viewport={"width": 640, "height": 450}, device_scale_factor=2),  # 1280x900 at 200%
  "screen_reader": dict(viewport={"width": 1280, "height": 900}),
  "keyboard": dict(viewport={"width": 1280, "height": 900}),
  "dark": dict(viewport={"width": 1280, "height": 900}, color_scheme="dark"),
  "dyslexia": dict(viewport={"width": 1280, "height": 900}),
  "low_confidence": dict(viewport={"width": 1280, "height": 900}),
  "colour_blind": dict(viewport={"width": 1280, "height": 900}),
}

async def axe(pg):
    try:
        await pg.evaluate(AXE)
        r = await pg.evaluate("""async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}});
          return r.violations.map(v=>({id:v.id,impact:v.impact,help:v.help,n:v.nodes.length,sample:v.nodes.slice(0,3).map(n=>n.target.join(' ')+' :: '+(n.failureSummary||'').slice(0,160))}))}""")
        return r
    except Exception as e:
        return [{"id": "axe-error", "help": str(e)[:200]}]

async def overflow(pg):
    return await pg.evaluate("()=>document.documentElement.scrollWidth-document.documentElement.clientWidth")

async def small_targets(pg):
    return await pg.evaluate("""()=>[...document.querySelectorAll('main button, main a, main input, main [role=button]')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&(r.width<24||r.height<24)&&getComputedStyle(e).display!=='inline'}).map(e=>(e.innerText||e.getAttribute('aria-label')||e.tagName).trim().slice(0,30)+` ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`).slice(0,15)""")

async def focus_desc(pg):
    return await pg.evaluate("()=>{const a=document.activeElement;return a?(a.tagName+' '+(a.innerText||a.getAttribute('aria-label')||a.id||'').trim().slice(0,50)):null}")

async def click_choice(pg, label, keyboard, log):
    """Pick an answer by visible label, or Skip. Keyboard mode uses Tab + Enter only."""
    target = label if label else "Skip"
    if not keyboard:
        loc = pg.locator("main button").filter(has_text=re.compile("^" + re.escape(target)))
        if await loc.count() == 0:
            log.append(f"NO BUTTON for '{target}'"); return False
        await loc.first.click(); return True
    for i in range(80):
        await pg.keyboard.press("Tab")
        t = await pg.evaluate("()=>(document.activeElement.innerText||'').trim()")
        if t.startswith(target):
            await pg.keyboard.press("Enter"); log.append(f"kbd '{target}' after {i+1} tabs"); return True
    log.append(f"KEYBOARD could not reach '{target}'"); return False

async def run_persona(b, p):
    acc = p["access"]; kb = acc == "keyboard"
    ctx = await b.new_context(**CTX[acc])
    pg = await ctx.new_page()
    if acc in ("mobile_slow",):
        cdp = await ctx.new_cdp_session(pg)
        await cdp.send("Network.emulateNetworkConditions", {"offline": False, "latency": 400, "downloadThroughput": 400*1024/8, "uploadThroughput": 400*1024/8})
    if acc == "colour_blind":
        cdp = await ctx.new_cdp_session(pg)
        await cdp.send("Emulation.setEmulatedVisionDeficiency", {"type": "deuteranopia"})
    R = dict(id=p["id"], name=p["name"], access=acc, postcode=p["postcode"], log=[], issues=[]); global LAST; LAST=R
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)[:200]))
    t0 = time.time()
    for attempt in range(3):
        await pg.goto(BASE + "/start", wait_until="domcontentloaded", timeout=90000)
        try:
            await pg.wait_for_selector("input.big-input", timeout=30000); break
        except Exception:
            R["log"].append("start page: postcode box not visible after 30s, reloading")
    R["start_load_s"] = round(time.time() - t0, 1)
    await pg.wait_for_timeout(800)
    if acc in ("screen_reader",):
        R["sr_start"] = await pg.evaluate("""()=>{const i=document.querySelector('input.big-input');const lab=i.labels&&i.labels.length?i.labels[0].innerText:i.getAttribute('aria-label');
            return {input_name:lab, live_regions:[...document.querySelectorAll('[aria-live],[role=status],[role=alert]')].map(e=>e.getAttribute('aria-live')||e.getAttribute('role')), h1:[...document.querySelectorAll('h1')].map(h=>h.innerText.trim())}}""")
    # postcode, with optional typo first
    for pc in ([p["typo"]] if p.get("typo") else []) + [p["postcode"]]:
        if kb:
            await pg.keyboard.press("Tab")
            for i in range(40):
                if await pg.evaluate("()=>document.activeElement.classList.contains('big-input')"): break
                await pg.keyboard.press("Tab")
            await pg.keyboard.press("Control+A"); await pg.keyboard.type(pc)
        else:
            await pg.fill("input.big-input", ""); await pg.type("input.big-input", pc, delay=60)
        nxt = pg.locator('main button:has-text("Next")').first
        await pg.wait_for_timeout(300)
        dis = await nxt.is_disabled()
        if dis and len(pc.replace(" ","")) >= 5:
            await pg.wait_for_timeout(5000)
            if await nxt.is_disabled():
                R["issues"].append(f"Typed full postcode but 'Next' stayed greyed out with no message (page not ready yet); had to clear and retype")
                await pg.fill("input.big-input", ""); await pg.type("input.big-input", pc, delay=60); await pg.wait_for_timeout(300)
            dis = await nxt.is_disabled()
        R["log"].append(f"postcode '{pc}': Next {'DISABLED' if dis else 'enabled'}")
        if dis:
            hint = await pg.inner_text("main")
            R["log"].append("text near input: " + re.sub(r"\s+", " ", hint[hint.find('Which elections'):])[:200])
            break
        if kb:
            R["issues"].append("Pressing Enter in the postcode box skips all the household questions and jumps straight to results (checked separately; same on mobile 'Go' key)") if "Enter" not in " ".join(R["issues"]) else None
            for i in range(10):
                await pg.keyboard.press("Tab")
                if (await pg.evaluate("()=>(document.activeElement.innerText||'').trim()")) == "Next": break
            await pg.keyboard.press("Enter")
        else: await nxt.click()
        await pg.wait_for_timeout(2500)
        txt = await pg.inner_text("main")
        stepm = re.search(r"Step (\d) of 9", txt)
        R["log"].append(f"after '{pc}': on step {stepm.group(1) if stepm else '?'}")
        if pc == p.get("typo") and stepm and stepm.group(1) == "2":
            R["issues"].append(f"Mistyped postcode '{pc}' accepted at step 1 without any warning")
            back = pg.locator('main button:has-text("Back")')
            if await back.count(): await back.first.click(); await pg.wait_for_timeout(1000)
    if "Step 1 of 9" in await pg.inner_text("main"):
        R["outcome"] = "BLOCKED at postcode step"
        R["issues"].append("Could not get past the postcode step" + (" (outcode only, no explanation shown)" if len(p["postcode"]) <= 4 else ""))
        # still continue with the full postcode via postcodes.io to finish the journey? no — record and stop
        R["axe_start"] = await axe(pg)
        R["page_errors"] = errs; await ctx.close(); return R
    # steps 2-8
    for label, key in [(p["age"], "age"), (p["household"], "household"), (p["children"], "children"), (p["tenure"], "tenure"), (p["income"], "income"), (p["work"], "work"), (p["study"], "study")]:
        before = await focus_desc(pg)
        ok = await click_choice(pg, label, kb, R["log"])
        await pg.wait_for_timeout(700)
        if acc == "screen_reader":
            R.setdefault("sr_focus_after_answer", []).append(await focus_desc(pg))
        if not ok: R["issues"].append(f"Could not answer '{key}' with '{label}'")
    # step 9
    txt = await pg.inner_text("main")
    if "Anything else" not in txt:
        R["issues"].append("Did not reach step 9"); R["log"].append(txt[:300])
    yn_btns = pg.locator("main fieldset button, main button").filter(has_text=re.compile(r"^(Yes|No)$"))
    n = await yn_btns.count()
    R["log"].append(f"yes/no buttons: {n}")
    for i, k in enumerate(YN):
        v = p["yn"][k]
        if v is None: continue
        idx = 2 * i + (0 if v else 1)
        if kb:
            await yn_btns.nth(idx).focus(); await pg.keyboard.press("Enter")
        else:
            await yn_btns.nth(idx).click()
        await pg.wait_for_timeout(150)
    if acc == "screen_reader":
        R["sr_step9_pressed"] = await pg.evaluate("()=>[...document.querySelectorAll('main button')].filter(b=>/^(Yes|No)$/.test(b.innerText.trim())).map(b=>b.getAttribute('aria-pressed')??b.getAttribute('aria-checked')??'none')")
        R["sr_step9_groups"] = await pg.evaluate("()=>[...document.querySelectorAll('main fieldset legend, main [role=group], main [role=radiogroup]')].length")
    R["axe_wizard_step9"] = await axe(pg)
    R["overflow_wizard"] = await overflow(pg)
    R["small_targets_wizard"] = await small_targets(pg)
    await pg.wait_for_timeout(600)
    # submit
    see = pg.locator('main button:has-text("See my election")')
    t1 = time.time(); navigated = False
    for attempt in range(2):
        if kb: await see.focus(); await pg.keyboard.press("Enter")
        else: await see.click()
        for i in range(25):
            await pg.wait_for_timeout(1000)
            if "/start" not in pg.url: navigated = True; break
        if navigated: break
        R["issues"].append("'See my election' did nothing on first press (had to press again)")
    R["submit_s"] = round(time.time() - t1, 1)
    await pg.wait_for_timeout(2500)
    R["result_url"] = pg.url
    main_el = await pg.query_selector("main")
    rtxt = await main_el.inner_text() if main_el else await pg.inner_text("body")
    R["result_text"] = rtxt
    m = re.search(r"/ballot/([^/?#]+)", pg.url)
    R["ballot"] = m.group(1) if m else None
    if not navigated:
        R["outcome"] = "STUCK on /start after submit"
        R["result_head"] = re.sub(r"\s+", " ", rtxt)[:600]
    else:
        R["outcome"] = "ballot" if R["ballot"] else "other page"
    R["axe_result"] = await axe(pg)
    R["overflow_result"] = await overflow(pg)
    if R["ballot"]:
        qs = urllib.parse.urlparse(pg.url).query
        await pg.goto(f"{BASE}/ballot/{R['ballot']}?{qs}", wait_until="domcontentloaded", timeout=90000)
        await pg.wait_for_timeout(2500)
        bt = await pg.inner_text("main")
        R["ballot_text"] = bt
        R["axe_ballot"] = await axe(pg)
        R["overflow_ballot"] = await overflow(pg)
        R["small_targets_ballot"] = await small_targets(pg)
        await pg.screenshot(path=f"shots/p{p['id']:02d}_ballot.png", full_page=False)
        await pg.goto(f"{BASE}/ballot/{R['ballot']}/stakes?{qs}", wait_until="domcontentloaded", timeout=90000)
        await pg.wait_for_timeout(2000)
        R["stakes_text"] = await pg.inner_text("main") if await pg.query_selector("main") else ""
    await pg.screenshot(path=f"shots/p{p['id']:02d}_result.png", full_page=False)
    R["page_errors"] = errs
    await ctx.close()
    return R

async def main(ids):
    import os; os.makedirs("shots", exist_ok=True)
    out = {}
    async with async_playwright() as pw:
        b = await pw.chromium.launch()
        for p in P:
            if ids and p["id"] not in ids: continue
            try:
                r = await run_persona(b, p)
            except Exception as e:
                try: await b.contexts[-1].pages[-1].screenshot(path=f"shots/p{p['id']:02d}_ERROR.png")
                except Exception: pass
                r = dict(id=p["id"], name=p["name"], outcome="SCRIPT ERROR", error=str(e)[:400], partial=LAST)
            r["truth"] = pcio(p["postcode"] if len(p["postcode"]) > 4 else "")
            out[p["id"]] = r
            print(p["id"], p["name"], r.get("outcome"), r.get("ballot"), r.get("issues"), flush=True)
            json.dump(out, open(f"results{'_'+'_'.join(map(str,ids)) if ids else ''}.json", "w"), indent=1, default=str)
        await b.close()

asyncio.run(main([int(x) for x in sys.argv[1:]]))
