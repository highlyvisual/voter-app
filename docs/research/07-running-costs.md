# 7. Netlify and other running costs

**Date:** 24 September 2026
**Question:** What does it cost to run whatsittome.org each month? This covers Netlify now, what Vercel or Cloudflare would cost instead, and Supabase and GitHub Actions.

> **Summary**
> 1. The site is on the Netlify team "Highly Visual Websites" (Personal plan, $9/month, 1,000 credits). **27 other sites share that pot of credits.** It has run out every month since June. On 9 July every site on the team went offline, and production deploys were paused on 5 Aug, 3 Sep and 19 Sep until a top-up was bought. **On 24 Sep at 10:08 UTC the team was suspended again, and whatsittome.org was returning an error (HTTP 503, "Usage exceeded") when checked at 10:12 UTC.** By 10:22 UTC it was serving normally again (HTTP 200); what restored it (for example a top-up) was not checked.
> 2. On Netlify, each production deploy costs 15 credits, so 1,000 credits pays for about 66 deploys and nothing else. Frequent deploys are likely to be the biggest cost, more than visitors.
> 3. Rough monthly cost for this site on its own (assumptions below). Quiet month: Netlify $9, Vercel $0–$20, Cloudflare $5. May 2027 local elections month: Netlify about $33–$49, Vercel Pro $20 (the free Hobby plan would go over its limits), Cloudflare $5 plus images. Supabase adds $0, or from $25 if more than 5 GB of data leaves the database that month (likely about $35 while padelmatch stays active in the same Supabase organisation).

All prices are in US dollars and exclude VAT. "Accessed" means the live page was opened on 24 Sep 2026.

---

## 1. What we have now on Netlify (read from the account, read-only)

**Plan and allowance**
- The team is **"Highly Visual Websites"** (slug `highlyvisual`), and its plan type is **Personal** ([Netlify account, read via Netlify connector, 24 Sep 2026](https://app.netlify.com/teams/highlyvisual)).
- The plan costs **$9/month for 1,000 credits**. Invoice YUZOIR-00016 says "$9.00 … Memo: 1000 credits per month" ([Netlify invoice email, 15 Sep 2026](https://mail.google.com/mail/?authuser=barnytrevelyan@gmail.com#all/thread-f:1876356814809840822)).
- The billing cycle runs **14 September to 13 October** ([Netlify email, 23 Sep 2026](https://mail.google.com/mail/?authuser=barnytrevelyan@gmail.com#all/thread-f:1877160418191526831)).

**The 23 September email, quoted:**
> "Your credit usage on team Highly Visual Websites has reached 75% of your 1000 credit allowance in the current billing cycle from September 14 to October 13. You're getting close to your credit limit. Consider upgrading to a Pro plan for 3000 credits per month."
([Netlify email, 23 Sep 2026](https://mail.google.com/mail/?authuser=barnytrevelyan@gmail.com#all/thread-f:1877160418191526831))

**The 23 Sep email is not the whole story. This cycle has already run out once:**
- 19 Sep, 06:00 UTC: 50% used. 19 Sep, 11:34: 75% used. 19 Sep, 19:10: **100% used**. Half the monthly credits went in about 13 hours ([Netlify emails, 19 Sep 2026](https://mail.google.com/mail/?authuser=barnytrevelyan@gmail.com#all/thread-f:1876788562547744550)).
- The 19 Sep email said: *"Your team can't ship to production right now … We've added 100 operational credits to keep your published sites online. These credits can't be used for production deploys … If your team also exhausts its operational credits, your published sites will be suspended until credits are restored or your billing cycle resets on October 13."* ([Netlify email, 19 Sep 2026](https://mail.google.com/mail/?authuser=barnytrevelyan@gmail.com#all/thread-f:1876788562547744550))
- 20 Sep: **$10 top-up paid** (invoice YUZOIR-00017, "Credit purchase") ([Netlify invoice email, 20 Sep 2026](https://mail.google.com/mail/?authuser=barnytrevelyan@gmail.com#all/thread-f:1876834860884265374)).
- 21 Sep and 23 Sep: the 50% and then 75% emails came again. They still say "of your 1000 credit allowance", so it is unclear how much of the top-up was left (unverified).
- **24 Sep, 10:08 UTC: all projects suspended.** The email says: *"Your projects have been suspended Your credit usage on team Highly Visual Websites has exceeded your 1000 credit allowance in the current billing cycle from September 14 to October 13. Your projects are currently offline and will remain suspended until you upgrade or your billing cycle resets."* It offers three ways back: upgrade to Pro, wait for the reset on 13 October, or buy a top-up ([Netlify email, 24 Sep 2026](https://mail.google.com/mail/?authuser=barnytrevelyan@gmail.com#all/thread-f:1877207419897483375)). A request to https://whatsittome.org/ at 10:12 UTC returned HTTP 503 with `{"error":"usage_exceeded","message":"Usage exceeded"}` (checked with curl). So the site was offline at the time of this fact-check.

**Earlier months: the same pattern, found in the email history**

| Billing cycle | What happened | Spend |
|---|---|---|
| 14 Jun – 13 Jul | 9 Jul: *"Your projects have been suspended … Your projects are currently offline"*. **All sites were offline** until a top-up ([Netlify email, 9 Jul 2026](https://mail.google.com/mail/?authuser=barnytrevelyan@gmail.com#all/thread-f:1870228804836654707)) | $9 + $5 top-up |
| 14 Jul – 13 Aug | 100% on 5 Aug, production deploys paused; the first top-up payment failed and a second went through on 7 Aug | $9 + $5 |
| 14 Aug – 13 Sep | 100% on 3 Sep, production deploys paused, topped up the same day | $9 + $5 |
| 14 Sep – 13 Oct | 100% on 19 Sep, topped up on 20 Sep; 75% email on 23 Sep; **all projects suspended on 24 Sep, 10:08 UTC** | $9 + $10 so far |

Sources: the Netlify invoice and usage emails in Barny's Gmail dated 9 Jul, 16 Jul, 5 Aug, 7 Aug, 15 Aug, 3 Sep, 15 Sep, 19 Sep, 20 Sep and 24 Sep 2026. Before this, the team was on Pro ($20, 3,000 credits: invoices of 1 Apr and 2 May 2026), then Free (300 credits, from 1 Jun 2026; all used by 14 Jun), then Personal (from 14 Jun 2026). The 9 July top-up also had one failed payment attempt before a $5 payment went through.

On 22 Jul, Netlify also emailed: *"Your account has hit the 1,000 credit limit on Personal more than once recently. Pro's new tiers … One flat monthly price … Unused credits roll over for an extra billing cycle"* ([Netlify email, 22 Jul 2026](https://mail.google.com/mail/?authuser=barnytrevelyan@gmail.com#all/thread-f:1871445911055226195)).

**What is using the credits**
- The Netlify tools cannot show a usage breakdown or count deploys for the period, so the split between sites is **unverified**. The billing page shows it: https://app.netlify.com/teams/highlyvisual/billing/general
- **28 projects share the team's credits.** They include voter-app-uk (whatsittome.org), romily-app-questions, and client or other sites such as safariworldafrica.com, nigelarchersafaris.com, uhai.app and nigelmurphyflavours.com ([Netlify project list, read via connector, 24 Sep 2026](https://app.netlify.com/teams/highlyvisual)). **If the pot runs out, whatsittome.org stops alongside all of them. If the site gets busy, the other sites are affected too.**
- **How whatsittome.org deploys (verified).** The current deploy (6ab4f55d…) is titled "Deploy triggered by upload", with `deploy_source: "api"`, `context: "production"` and no Git commit. It was published at 10:03 UTC on 24 Sep, five minutes before the suspension email ([Netlify deploy record 6ab4f55d9e3452463920df77, read via connector, 24 Sep 2026](https://app.netlify.com/projects/voter-app-uk)). So yes, it is deployed by upload, and every upload to production costs 15 credits.
- Earlier today there were also production deploys of romily-app-questions (09:07), novainsight-watch (09:11) and voter-app-uk (09:17), according to the first draft of this note. These times were decoded from deploy IDs, which contain a timestamp. That is an inference, not a figure from Netlify, and was not re-checked.
- Most likely cause: frequent production deploys at 15 credits each. 500 credits in 13 hours on 19 Sep is about 33 deploys' worth (500 ÷ 15). This is **an inference, unverified**; the billing page will confirm or refute it.

**Two other things found in the deploy record**
- The site's server code runs in **us-east-2 (Ohio)**, but the database is in **London** (Supabase eu-west-2). Every database call crosses the Atlantic. A ballot page took **1.2–1.8 seconds** to start arriving when timed three times from our test machine on 24 Sep 2026. On Netlify, changing the function region *"is available on all Pro and Enterprise plans"*, and London (`lhr`) is one of the options ([Netlify Docs, Functions optional configuration, updated 17 Sep 2026](https://docs.netlify.com/build/functions/optional-configuration/)).
- The homepage and ballot pages are sent with `cache-control: private,no-cache,no-store`. So **every visit runs the server code** and nothing is cached (measured with curl on 24 Sep 2026). This matters for cost on every host.

## 2. Netlify's credit prices today

From the live pages:

| Item | Credits | Source |
|---|---|---|
| Production deploy | **15 credits each**; "build minutes no longer calculated" | [Netlify Docs, How credits work, updated 12 Aug 2026](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/) |
| Deploy previews and branch deploys | 0 (free) | same |
| Failed deploys and rollbacks | 0 (free) | same |
| Compute (functions, i.e. our Next.js server) | 10 credits per GB-hour | same |
| Bandwidth | 20 credits per GB | same |
| Web requests | 2 credits per 10,000 requests | same |
| Form submissions | "Free for all credit plans" | same |
| AI inference | 180 credits per US$ of model use | same |

These rates changed on 14 Apr 2026. Bandwidth went from 10 to 20 credits per GB, compute from 5 to 10 per GB-hour, requests from 3 to 2 per 10,000, and form submissions became free ([Netlify changelog, 14 Apr 2026](https://www.netlify.com/changelog/2026-04-14-pricing-updates-april-2026/)).

**Plans** ([Netlify pricing page, accessed 24 Sep 2026](https://www.netlify.com/pricing/); [Netlify Docs, Credit-based pricing plans, updated 1 Sep 2026](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/)):

| Plan | Price/month | Credits/month | Extra credits | Roll over? |
|---|---|---|---|---|
| Free | $0 | 300 (hard limit) | none | no |
| **Personal (current)** | **$9** | **1,000** | "500 credits for $5" | no |
| Pro 3,000 (next step up) | $20 | 3,000 | "1,500 credits for $10" | no |
| Pro 5,000 | $33 | 5,000 | as above | yes, one extra month |
| Pro 10,000 | $63 | 10,000 | as above | yes |
| Pro 15,000 / 20,000 | $95 / $126 | 15,000 / 20,000 | as above | yes |

Pro tier prices are also given in [Netlify changelog, 14 Jul 2026](https://www.netlify.com/changelog/2026-07-14-pro-plan-credit-tiers/). Besides more credits, Pro gives password protection, unlimited members and the choice of function region.

**Cost per credit, worked out:**
- Personal top-up: $5 ÷ 500 = 1 cent per credit, so one production deploy costs about 15 cents.
- Pro top-up: $10 ÷ 1,500 = 0.67 cents per credit, so one deploy costs about 10 cents.

**A price conflict to check.** The docs say Personal top-ups are "500 credits for $5", and the June welcome email said the same. But the 3 Sep and 19 Sep emails say *"Top-up packs start at $10 for 500.00 credits"*. On 3 Sep a top-up cost $5; on 20 Sep one cost $10. It is **unverified** whether the $10 bought 500 or 1,000 credits.

**What happens at 100%.** Netlify's docs and emails give different answers:
- Docs: *"Once your credit balance is completely used up, all of your web projects (sites/apps) are paused and visitors … will find a `Site not available` page"* ([Netlify Docs, How credits work, 12 Aug 2026](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/)).
- Recent emails (3 Sep and 19 Sep) describe two stages. First, production deploys pause, the sites keep running on 100 "operational credits", and previews still work. Second, if those 100 credits also run out, the sites are suspended. In July, and again on 24 Sep, the sites were suspended outright.
- There is **no automatic overage billing** unless **auto-recharge** is switched on. Auto-recharge *"automatically reloads your credit balance when it runs out"*, at 500 credits for $5 on Personal or 1,500 for $10 on Pro (same docs page). Whether auto-recharge is on for this team is **unverified**; the manual top-ups suggest it is off.

**Netlify Open Source plan.** Netlify offers "10,000 credits monthly", "free production deploys", and "sites remain active if credits depleted". Conditions: an OSI-approved licence (or a CC attribution/public-domain licence), a Code of Conduct, a "This site is powered by Netlify" link or badge, and the project "must not be a commercial project" ([Netlify Open Source policy, accessed 24 Sep 2026](https://www.netlify.com/legal/open-source-policy/)). whatsittome.org might qualify if its code were published openly. That is **unverified**, and it would need its own team.

## 3. Vercel

- **Hobby: $0.** It is *"restricted to non-commercial personal use only."* Commercial use means a deployment used for *"financial gain of anyone involved in any part of the production … including a paid employee or consultant writing the code"*. Examples given are taking payments, advertising, being paid to build or host the site, and affiliate links. *"Asking for Donations does not fall under commercial usage."* ([Vercel Docs, Fair Use Guidelines, updated 14 Sep 2026](https://vercel.com/docs/limits/fair-use-guidelines))
  - **Does a not-for-profit civic site count?** The rules test for financial gain, not for being a charity. A site with no ads, no payments and nobody paid to build it looks like non-commercial use under that wording. If Nova Insight or anyone is paid for the work, it would not be. Vercel says to contact support if unsure. **Unverified until Vercel confirms.**
  - Hobby limits per month: 100 GB data transfer, **1,000,000 edge requests** (every file request, including images and JavaScript), 1,000,000 function invocations, **4 hours of active CPU**, 360 GB-hours of memory, and 5,000 image transformations. Over a limit, *"you will have to wait until 30 days have passed before you can use the feature again."* Deployments are capped at 100 a day ([Vercel Docs, Hobby plan, updated 14 Sep 2026](https://vercel.com/docs/plans/hobby)). Vercel's docs describe paying for extra usage only for Pro teams ("For Teams on the Pro plan, you can pay for additional usage as you go"), so Hobby has no paid way past the limits ([Vercel Docs, Fair Use Guidelines](https://vercel.com/docs/limits/fair-use-guidelines)).
  - Only one Hobby team is allowed per account ([Vercel Docs, Pro plan, 15 Sep 2026](https://vercel.com/docs/plans/pro-plan)). Whether Barny's "NovaInsight" Vercel team is Hobby or Pro is **unverified**: no Vercel tools are connected, and there are no Vercel invoice emails.
- **Pro: a $20/month platform fee** that includes one deploying seat and **$20 of usage credit**. Extra deploying seats cost $20/month each, and viewer seats are free ([Vercel Docs, Pro plan, updated 15 Sep 2026](https://vercel.com/docs/plans/pro-plan)). Also included:
  - The "Flat Rate CDN" base tier: **1M CDN requests and 1 TB of transfer a month**. *"A one-day spike doesn't trigger an upgrade"*. If a whole month goes over, Vercel moves you to the $20/month tier (10M requests) *"at the start of the next cycle"* ([Vercel Docs, Flat Rate CDN, updated 14 Sep 2026](https://vercel.com/docs/pricing/flat-rate-cdn)).
  - Function prices in London (lhr1): Active CPU **$0.177/hour** (billed only while code is running, not while waiting for the database), memory **$0.0146 per GB-hour** (billed while waiting), invocations **$0.60 per million** ([Vercel Docs, Fluid compute pricing, updated 16 Jun 2026](https://vercel.com/docs/functions/usage-and-pricing)).
  - Deploys cost nothing per deploy (limit: 6,000 a day). Spend alerts start at $200 by default, and you can set a hard limit that pauses projects ([Vercel pricing page, accessed 24 Sep 2026](https://vercel.com/pricing)).
  - Your DNS is already at Vercel.

## 4. Cloudflare (Workers, or Pages)

- **Workers Free: $0.** Limits are *"100,000 [requests] per day"* and *"10 milliseconds of CPU time per invocation"*. Static files (JavaScript, CSS, images you host) are *"free and unlimited"*. Over the limit, requests fail with an error ([Cloudflare Docs, Workers pricing, updated 28 Aug 2026](https://developers.cloudflare.com/workers/platform/pricing/)). Pages Functions count against the same Workers limits ([Cloudflare Docs, Pages Functions pricing, updated 8 Sep 2026](https://developers.cloudflare.com/pages/functions/pricing/)).
- **Workers Paid: $5/month minimum.** Includes *"10 million [requests] included per month"* (then $0.30 per million) and *"30 million CPU milliseconds"* (then $0.02 per million). Up to 5 minutes of CPU per request (same source).
- **Running Next.js there.** Cloudflare now says: *"Cloudflare recommends vinext as the default way to run Next.js applications on Cloudflare Workers"*, and adds that *"vinext is in beta."* OpenNext is offered for apps that can't move to vinext yet ([Cloudflare Docs, Next.js guide, updated 25 Aug 2026](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)).
  - OpenNext supports "all minor and patch versions of Next.js 16 and the latest minors of Next.js 14 and 15" (it says Next.js 14 support ends in Q1 2026), but *"Node Middleware introduced in 15.2 are not yet supported"*. The compressed Worker must be under *"3 MiB on the Workers Free plan, and 10 MiB on the Workers Paid plan"* ([OpenNext Cloudflare docs, accessed 24 Sep 2026](https://opennext.js.org/cloudflare)).
  - Our current Netlify server bundle is about 25 MB uncompressed (from the deploy record). Whether it would fit in 10 MiB compressed is **unverified**.
- **Images.** The first 5,000 unique image transformations a month are free, then $0.50 per 1,000 ([Cloudflare Docs, Images pricing, 8 Jul 2026](https://developers.cloudflare.com/images/pricing/)).
- **Custom domain.** A Workers custom domain needs *"an active Cloudflare zone"* ([Cloudflare Docs, Custom Domains, updated 14 Aug 2026](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)). whatsittome.org's DNS would have to move from Vercel to Cloudflare.

## 5. Supabase (read-only check of the live project)

- **Current state.** Project `voter-app` is in London (eu-west-2) and active. Its organisation, "Padel_Match", is on the **free plan** ([Supabase account, read via Supabase connector, 24 Sep 2026](https://supabase.com/dashboard)).
  - **The database is 83 MB of the 500 MB free limit.** The largest table is `receipt_grid` at 53 MB (SQL `pg_database_size`, 24 Sep 2026).
  - The org's two active projects are `padelmatch` and `voter-app`. Free allows *"Limit of 2 active projects"*, so both free slots are in use ([Supabase pricing, accessed 24 Sep 2026](https://supabase.com/pricing)).
- **Free limits that matter** ([Supabase pricing, accessed 24 Sep 2026](https://supabase.com/pricing)): 500 MB database, **5 GB egress** (data sent out to the website) plus 5 GB cached egress, 1 GB file storage, 500,000 edge function calls.
- **Egress** is *"data transmitted out of the system to a connected client"*, which includes database query results. Going over the free amount brings a grace period and then "service restrictions". There are no overage charges on Free ([Supabase Docs, Egress, 23 Sep 2026](https://supabase.com/docs/guides/platform/manage-your-usage/egress)).
- **Pausing.** *"A Free plan project is considered inactive if it does not receive sufficient user database activity over the past week"*. *"A few user requests to the database each day"* is typically enough to keep it awake ([Supabase Docs, Free project pausing, accessed 24 Sep 2026](https://supabase.com/docs/guides/platform/free-project-pausing)). Barny's "hazina" project was paused this way on 18 Jul 2026 ([Supabase email, 18 Jul 2026](https://mail.google.com/mail/?authuser=barnytrevelyan@gmail.com#all/thread-f:1871024486587741022)). The nightly ingest plus visitors should keep voter-app awake, but whether that counts as "sufficient" is unverified.
- **Pro: from $25/month.** It includes 8 GB disk per project, 250 GB egress, and $10/month of compute credits, with a spend cap on by default. Overage is $0.09/GB egress and $0.125/GB disk ([Supabase pricing, accessed 24 Sep 2026](https://supabase.com/pricing)).
- **When Pro would be needed:** when monthly egress passes 5 GB, when the database nears 500 MB, or when you want no pausing at all. By our assumptions below, May 2027 could pass 5 GB unless pages are cached. Pro is billed per organisation, and this org also holds padelmatch. Supabase's pricing page says: "First project included. Additional projects from $10/mo", and the $10 compute credit covers "one Micro instance" ([Supabase pricing, accessed 24 Sep 2026](https://supabase.com/pricing)). So a Pro org with both projects active would likely cost about $35/month, not $25. The exact bill is **unverified**.

## 6. GitHub Actions (nightly data job)

- Private repos get **2,000 minutes a month and 500 MB storage free** on GitHub Free. Public repos using standard runners are free. Linux runners cost $0.006/minute beyond the free minutes. With no payment method on file, *"usage is blocked once you use up your quota"* ([GitHub Docs, GitHub Actions billing, accessed 24 Sep 2026](https://docs.github.com/en/billing/concepts/product-billing/github-actions)).
- The job's run time and the repo's visibility are **unverified** (no repo access here). *Assumption:* 10 minutes a night × 30 nights = 300 minutes, which is well inside 2,000. **Cost: $0.**

---

## 7. Monthly cost for three scenarios (this site only)

**Assumptions (all of these are guesses; change them and the numbers change):**
- **A1 Visits:** quiet month 3,000; by-election month 15,000; May 2027 local elections month 150,000 (biggest day about 30,000).
- **A2 Per visit:** 3 server-built pages, 40 file requests, and 0.5 MB downloaded. This is based on our measurements on 24 Sep 2026: the homepage is 40 KB, the JS/CSS is 192 KB on a first visit, a ballot page is 18 KB, and candidate photos are about 4.3 KB each and load lazily.
- **A3 Server time:** each page keeps a 1 GB function busy for 1.2 seconds (1 GB is the configured memory in the deploy record; 1.2 s is the fastest time we measured). About 50 ms of that is real CPU work; the rest is waiting for the database.
- **A4 Database:** each server-built page pulls 20 KB from Supabase.
- **A5 Deploys:** 30 production deploys of this site a month, about one a day.
- **A6 Nightly job:** 300 GitHub Actions minutes a month.

**Netlify credits (this site alone), from A1–A5**
- Per 1,000 visits:
  - Bandwidth: 0.5 MB × 1,000 = **0.5 GB**, × 20 = **10 credits**
  - Requests: 40 × 1,000 = 40,000; 40,000 ÷ 10,000 × 2 = **8 credits**
  - Compute: 3 × 1.2 s × 1 GB × 1,000 = 3,600 GB-seconds = 1 GB-hour, × 10 = **10 credits**
  - **Total: 28 credits per 1,000 visits**
- Deploys: 30 × 15 = **450 credits a month**, whatever the traffic.
- Quiet: 3 × 28 = 84 + 450 = **534 credits**
- By-election: 15 × 28 = 420 + 450 = **870 credits**
- May 2027: 150 × 28 = 4,200 + 450 = **4,650 credits**

**Vercel Pro, May 2027 usage (London prices), from A1–A3**
- Invocations: 450,000 × $0.60 per million = $0.27
- CPU: 450,000 × 0.05 s = 22,500 s = 6.25 h × $0.177 = $1.11
- Memory: 450,000 × 1.2 s × 1 GB = 540,000 GB-s = 150 GB-h × $0.0146 = $2.19
- **Total: about $3.57, which is covered by the $20 credit**
- CDN requests: 150,000 × 40 = 6M. That is over the 1M included, so Vercel would move to the $20 CDN tier *for the following month*.

**Vercel Hobby, May 2027.** 6M edge requests (limit 1M) and 6.25 CPU-hours (limit 4) → **over the limits, so features pause for up to 30 days.** The quiet month (120,000 requests, about 0.1 CPU-hours) and the by-election month (600,000 requests, 0.6 CPU-hours) fit.

**Cloudflare, May 2027.** Only the 450,000 server-built pages count as Worker requests (static files are free). That is under the 10M included. CPU is 22.5M ms, under the 30M included. So **$5**.
- The Free plan's 10 ms of CPU per request is below our assumed 50 ms per page, so we treat Free as **not realistic** (unverified).
- The biggest-day renders (30,000 × 3 = 90,000) would also be close to the 100,000/day limit.

**Supabase egress, from A4**
- Quiet: 9,000 pages × 20 KB = 0.18 GB
- By-election: 45,000 × 20 KB = 0.9 GB
- May 2027: 450,000 × 20 KB = **9 GB**, which is over the 5 GB free, **unless pages are cached**

**Monthly cost table (USD, excluding VAT, this site only)**

| Option | Quiet month | By-election month | May 2027 elections month |
|---|---|---|---|
| Netlify Personal, own team (1,000 credits) | $9 (534 credits) | $9 (870 credits, tight) | $9 + 8 packs × $5 = **$49** (or $89 if packs are $10) |
| Netlify Pro 3,000 | $20 | $20 | $20 + 2 × $10 (1,500 packs) = **$40** |
| Netlify Pro 5,000 | $33 | $33 | **$33** (4,650 < 5,000) |
| Netlify as now (shared team, Personal) | Already $14–$19 a month for all 28 sites, and still running out. Adding May 2027 traffic would need about 4,650 more credits | – | – |
| Vercel Hobby | $0 | $0 | Over the Hobby limits on these assumptions → features paused for up to 30 days |
| Vercel Pro (1 seat) | $20 | $20 | $20 (+$20 CDN tier the next month) |
| Cloudflare Workers Paid | $5 | $5 | $5 (+ image transforms over 5,000 at $0.50/1,000) |
| Supabase | $0 | $0 | $0 if caching keeps egress under 5 GB; otherwise **$25** (about $35 if padelmatch stays active in the same org) |
| GitHub Actions | $0 | $0 | $0 |

**Totals, hosting + Supabase:**

| | Quiet | By-election | May 2027 |
|---|---|---|---|
| Netlify | $9–$33 | $9–$33 | $33–$74 |
| Vercel | $0–$20 | $0–$20 | $20–$45 |
| Cloudflare | $5 | $5 | $5–$30 |

The domain renewal is not included. The upper figures assume Supabase Pro at $25; add about $10 if padelmatch stays active in the same Supabase org.

---

## What this means for the site

- **The shared pot has already taken the site offline twice.** whatsittome.org shares 1,000 credits with 27 other sites, and that pot has run out every month since June. It took every site offline in July, and again on 24 Sep 2026 (the site was returning "Usage exceeded" at the time of this check). If that happened in the week before a polling day, the site would be down, or Claude could not push a fix. Options, each with a cost (listed, not ranked):
  - Move the site into its own Netlify team: about $9–$33/month, and it can no longer be hit by other sites. Whether a second paid team is allowed on one account is unverified.
  - Move the whole team to Pro: $20–$33, with roll-over from 5,000 credits up.
  - Turn on auto-recharge so the pot tops itself up and never runs dry: pay per 500 or 1,500 credits.
- **Deploys cost money on Netlify and nothing on Vercel or Cloudflare.** At 15 credits each, one production deploy a day is 450 credits a month, almost half the Personal allowance. Deploy previews are free. If Claude tested on previews and published to production once a batch of changes is ready, the bill would drop without changing host. Whether a CLI "draft" deploy counts as a free preview is unverified.
- **Caching helps on every host.** All pages are currently marked "no-store", so every visit runs server code and queries London from Ohio. Caching ballot pages would cut Netlify compute credits, Vercel memory time and Supabase egress. It is probably what keeps Supabase free in May 2027.
- **Trade-offs between the three:**
  - **Netlify.** Claude can deploy directly already (confirmed: uploads via the API). No code changes are needed. Costs grow with every deploy and every visitor. The London function region needs Pro.
  - **Vercel.** It runs Next.js natively, and your DNS is already there. Hobby is free but "non-commercial" is Vercel's call. On our assumptions it would go over its limits in May 2027 and pause for up to 30 days, with no paid way to stay up during that month. On the same assumptions, Pro at $20 would cover May 2027 usage, with the $20 CDN tier the month after. **No Vercel tools are connected in this session.** Claude would need a Vercel token and CLI, or a Vercel connector, in the build session to deploy (unverified whether the build environment allows that).
  - **Cloudflare.** The lowest figure of the three on our assumptions ($5/month), and traffic spikes barely change the bill. But it needs a new adapter: vinext is in beta, and OpenNext does not support Node middleware. Worker size limits apply. The DNS for whatsittome.org would have to move to Cloudflare. No Cloudflare tools are connected, so Claude would need a Wrangler API token in the build session (unverified).
- **Supabase** is fine on Free for now: 83 MB of 500 MB, and the nightly job keeps it awake. Plan for $25/month in heavy election months unless caching keeps egress under 5 GB. Both free project slots are in use, with padelmatch in the same org.

## Could not verify

1. The Netlify credit breakdown for this cycle: which of the 28 sites used what, and how much was deploys vs bandwidth vs compute. The Netlify tools do not expose usage or a deploy list; see the billing page.
2. The number of production deploys of voter-app-uk this billing period.
3. How many credits the $10 top-up on 20 Sep bought (500 or 1,000), and why the emails say "$10 for 500" while the docs say "$5 for 500".
4. Why the team was suspended on 24 Sep only four days after the 20 Sep top-up, and whether the 100 "operational credits" were used up first. The 21 and 23 Sep emails still refer to "1000".
5. Whether auto-recharge is on for the Netlify team. (The 24 Sep suspension suggests it is off.)
6. The exact rules for the 100% stage. The emails of 3 and 19 Sep describe "production deploys paused, sites kept up by 100 operational credits"; the 9 Jul and 24 Sep emails describe all projects suspended. The docs say all projects are paused. Which step triggers which is not documented in what we read.
7. Whether Netlify Image CDN use costs extra credits.
8. Whether Netlify compute is billed as memory × wall-clock time (assumed above).
9. Whether a second Netlify Personal team is allowed on the same account.
10. Whether whatsittome.org would qualify for Netlify's Open Source plan.
11. Whether Vercel would treat whatsittome.org as non-commercial (ask Vercel support), and whether Barny's "NovaInsight" Vercel team is Hobby or Pro.
12. Whether the Next.js app would work on Cloudflare (vinext beta or OpenNext) and fit the 10 MiB Worker limit.
13. Whether Claude's build environment could deploy to Vercel or Cloudflare (tokens, network access).
14. The run time of the GitHub Actions nightly job and whether the repo is private.
15. Whether Supabase counts the nightly ingest as "sufficient activity", and whether Supabase Pro would add compute charges for the second active project (padelmatch) in the same org.
16. All traffic, page-weight, timing and database-egress figures in section 7. These are assumptions built on a few measurements, not observed monthly data.
17. The 1.2–1.8 second ballot-page timings. These could not be re-measured during the fact-check because the site was suspended at the time (it returned a 503 error page). The `cache-control: private,no-cache,no-store,max-age=0,must-revalidate` header was re-confirmed on the home page at 10:22 UTC, once the site was back.
18. The 09:07/09:11/09:17 deploy times for 24 Sep, decoded from deploy IDs in the first draft. Not re-checked.
