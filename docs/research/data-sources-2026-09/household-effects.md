# Household effects and baseline rates

Research notes, 27 September 2026. One of five parallel investigations behind `../11-data-sources.md`; the brief and rules each followed are in `CONTEXT.md`. Endpoints were fetched live on the day unless marked UNVERIFIED or partly verified. Re-check anything before building on it: sites change, and some blocked the research environment but may work from GitHub Actions.

## Household-effects and baseline-rates sources (checked 27 Sept 2026)

I checked over 50 sources, mostly by fetching live endpoints with curl. Anything I could not fetch is labelled.

**Five findings that change what we build:**

1. **The PolicyEngine API we use is not its documented public API.** The documented Household API needs OAuth credentials that you request by email. `api.policyengine.org` is the web app's own backend. It answers with no key, but it runs an older model (v2.90.2) than the current package (v2.102.2, released today). I installed the `policyengine-uk` package locally and ran a household calculation with no data download. It gave the same result as the API (£3,486 income tax on £30k). Running the package inside GitHub Actions is the safer route.
2. **PolicyEngine's built-in rates are sometimes wrong or out of date, so they can't be shown as today's figures.**
   - Price cap: its value is £1,641 from April 2026 and never changes after that. Ofgem's current figure is £1,723 a year for Oct–Dec 2026.
   - Fuel duty: it has 53.45p from Jan 2026. HMRC's page (updated 12 Aug 2026) still says 52.95p. Budget 2025 Table 4.1 says +1p from 1 Sep 2026. I could not settle that three-way conflict.
   - Its parameters also contain made-up future values out to 2039, which must never appear as fact.
   - Baseline rates should come from the official sources below.
3. **GOV.UK pages give rates as HTML inside JSON, not as structured data.** They parse easily (the income tax page has 7 tables, DWP's benefit rates page has 162). But the `public_updated_at` date can't be trusted: the Scottish Income Tax page says 2015 while showing 2026-27 rates. We should detect changes by hashing the content.
4. **The OBR policy measures database is exactly the "every measure, costed" file we wanted.** It covers every tax measure since 1970 and every spending measure since 2010, up to the Spring Forecast 2026.
5. **Local Housing Allowance is frozen at April 2024 rates for 2026-27** (SI 2026/5, stated in the VOA spreadsheet). A good example of a verifiable household fact.

---

### PolicyEngine UK (hosted API and Python package) — already used, better route
- URL(s): documented API https://policyengine.org/uk/api (terms at /uk/api/terms). Undocumented backend: `POST https://api.policyengine.org/uk/calculate` and `GET /uk/metadata`. Package: https://pypi.org/project/policyengine-uk/
- What: works out tax and benefits for one household, now or under a reform. `/uk/metadata` also returns 1,671 policy parameters with their history.
- Access:
  - The backend works with no key. I checked a baseline calculation, a reform calculation (personal allowance £15,000 took tax from £3,486 to £3,000), and the metadata (1.2 MB).
  - The documented API needs OAuth credentials (email hello@policyengine.org), or you can self-host their Docker image.
  - The pip package runs household calculations with no microdata. I checked this.
- Licence and attribution: the code is AGPL. The API terms say you own the outputs, forbid sending personal data, and forbid presenting outputs as official guidance.
- Coverage: UK, including Scottish income tax and Scottish Child Payment. Hosted model v2.90.2; PyPI v2.102.2 (27 Sep 2026).
- Verified: yes.
- Use for us: the "what it could mean for you" calculation. Run the package in GitHub Actions to precompute a grid of household types × pledges, and store only the aggregate results.
- Rule risk: its parameter values are wrong or lagging in places (price cap, fuel duty) and include extrapolations to 2039. Use it for the calculation, never as the source of a displayed rate. Label results as estimates.
- Verdict: USE NOW, switching to the self-run package. The hosted backend is undocumented and runs an older version.

### GOV.UK Content API (HMRC, DWP and other rates pages)
- URL(s): https://content-api.publishing.service.gov.uk/ . Endpoint: https://www.gov.uk/api/content/government/publications/rates-and-allowances-income-tax/income-tax-rates-and-allowances-current-and-past . Search: https://www.gov.uk/api/search.json?q=…
- What: JSON copies of official pages. The HMRC rates and allowances collection has 29 documents, including income tax, National Insurance, capital gains tax, stamp duty, fuel duty, tax credits and child benefit, and employer thresholds. Other pages I fetched:
  - DWP benefit and pension rates 2026-27 (HTML version with 162 tables, plus a PDF)
  - National Minimum Wage (April 2026: £12.71 / £10.85 / £8 / £8)
  - Scottish Income Tax 2026-27 bands
  - Vehicle tax tables, student finance, child benefit, new State Pension, 30 hours childcare, VAT rates, benefits calculators
- Access: API with no key. Rate limit 10 requests per second.
- Licence and attribution: OGL v3.
- Coverage: UK-wide pages, plus Scottish income tax. Mostly current tax year. Updated 2026-04-06 (income tax) and 2026-02-16 (benefit rates).
- Verified: yes. The body is HTML with `<table>`s, not structured fields. `public_updated_at` is unreliable. Collection links under `links.documents` let a job find new years automatically.
- Use for us: a "today's rates" baseline panel next to each pledge, linked to the exact page. Store a content hash to detect changes.
- Rule risk: none. Rate pages can lag what was announced (fuel duty is the example).
- Verdict: USE NOW. The main official baseline, and parseable.

### OBR policy measures database
- URL(s): https://obr.uk/data/ . The download https://obr.uk/download/policy-measures-database-march-2025/ redirects to `Policy_measures_database_March_2026.xlsx`.
- What: every tax measure since 1970 and every spending measure since 2010, with fiscal event, description, tax or spending head and annual £m costings to 2030-31. Also summary and borrowing sheets.
- Access: xlsx download with no key (1.65 MB).
- Licence and attribution: OGL (OBR is Crown copyright).
- Coverage: UK fiscal events up to the Spring Forecast 2026. 2,607 tax rows and 1,992 spending rows.
- Verified: yes. Downloaded and parsed; the latest events are Autumn Budget 2025 and Spring Forecast 2026.
- Use for us: when a pledge echoes an existing or past measure ("scrap the two-child limit", "freeze fuel duty"), show the official costing with the event and date.
- Rule risk: none. These are official costings of government policy, not party claims.
- Verdict: USE NOW.

### OBR Economic and Fiscal Outlook detailed tables (March 2026)
- URL(s): https://obr.uk/efo/economic-and-fiscal-outlook-march-2026/ (economy, receipts, expenditure, policy and devolved tables, plus a zip). Public finances databank September 2026.
- What: official forecasts for CPI, earnings, receipts by tax, and so on.
- Access: xlsx. The `/download/` links need the `?tmstv=` token taken from the page, otherwise they redirect to `/no-access/`. With the token, the economy table downloaded. The databank link failed even with a token.
- Licence and attribution: OGL.
- Coverage: UK. March 2026 is the latest.
- Verified: partly (economy tables yes, databank no).
- Use for us: context such as "the OBR forecasts CPI at X%". Mostly background.
- Rule risk: none.
- Verdict: LATER.

### HM Treasury Budget documents: Table 4.1 policy decisions, policy costings, "Impact on households"
- URL(s): https://www.gov.uk/government/publications/supporting-documents-for-budget-2025 . File: `Table_4.1_-_Budget_2025_Policy_Decisions.xlsx`
- What: every Budget decision with a £m costing by year. For example:
  - "Fuel Duty: … extend the 5p cut to 31 August 2026, then increase by 1p from 1 September 2026…"
  - "Remove the two child limit from April 2026"
  - "Freeze NHS prescription charges in England for one year from 1 April 2026"

  The policy costings and household distributional analysis are PDFs only.
- Access: xlsx and PDF through the Content API.
- Licence and attribution: OGL.
- Coverage: UK. Budget 2025 (27 Nov 2025) is the latest. A GOV.UK press release (26 Sep 2026) refers to a forthcoming Budget.
- Verified: yes (xlsx parsed).
- Use for us: "what's already changing" timeline for households, and sources for current government policy.
- Rule risk: none.
- Verdict: USE NOW for Table 4.1. The PDFs are reference only.

### legislation.gov.uk (the statutory instruments that set rates)
- URL(s): Atom feeds, for example https://www.legislation.gov.uk/uksi/2026/data.feed?title=up-rating and https://www.legislation.gov.uk/nisr/2026/data.feed?title=regional%20rates . Also `data.xml` per item.
- What: the legal instruments behind rates, for example Social Security Benefits Up-rating Order 2026 (uksi/2026/218 etc.), Child Benefit Up-rating Order 2026, the NI Rates (Regional Rates) Order 2026 (nisr/2026/19), and the LHA freeze order (uksi/2026/5).
- Access: API and feeds with no key.
- Licence and attribution: OGL.
- Coverage: UK, Scotland, Wales, NI. Continuous.
- Verified: yes (feeds returned 2026 items).
- Use for us: the authoritative tie-breaker when GOV.UK pages, Budget tables and PolicyEngine disagree. Also a "rate changes now in force" feed.
- Rule risk: none.
- Verdict: USE NOW, as the source to check rates against.

### DWP benefit and pension rates (annual uprating)
- URL(s): https://www.gov.uk/government/publications/benefit-and-pension-rates-2026-to-2027 (HTML and PDF)
- What: every DWP benefit rate for the year, alongside the previous year's.
- Access: Content API. The HTML has 162 tables.
- Licence and attribution: OGL.
- Coverage: GB. 2026-27, published 16 Feb 2026.
- Verified: yes.
- Use for us: benefit baseline (UC standard allowance, State Pension, and so on).
- Rule risk: none.
- Verdict: USE NOW, as part of the Content API job.

### Scottish Government: council tax datasets (Band D and all bands)
- URL(s): https://www.gov.scot/publications/council-tax-datasets/ . File: `CTAS 2026 - Council Tax by Band - 2026-27.xlsx`
- What: Bands A–H per Scottish council, and the Scotland average Band D (£1,653.44 in 2026-27). Band D history goes back to 1996-97.
- Access: xlsx. Scrape the link from the page.
- Licence and attribution: OGL (gov.scot).
- Coverage: Scotland, by council. 2026-27. Updated 31 Mar 2026.
- Verified: yes (downloaded; Aberdeen City Band D is £1,747.54).
- Use for us: council tax for Scottish councils, matching the England set we already use.
- Rule risk: none.
- Verdict: USE NOW.

### StatsWales new API (Welsh council tax)
- URL(s): https://api.stats.gov.wales/v1/ (dataset list). Council tax levels by band: https://api.stats.gov.wales/v1/1988b6af-2a9c-43b6-8939-83e6cceb3903/download/csv . Also Band D composition, dwellings by band, and SSA settlement datasets.
- What: council tax by billing authority, band and year.
- Access: API and CSV download with no key. The old OData host `open.statswales.gov.wales` did not connect.
- Licence and attribution: OGL (Welsh Government). I did not check the licence page.
- Coverage: Wales, 22 councils, 1996-97 to 2026-27. Updated 2026-03-24.
- Verified: yes (Isle of Anglesey Band D 2026-27 is £2,260.73).
- Use for us: council tax for Welsh councils.
- Rule risk: none.
- Verdict: USE NOW.

### MHCLG Council Tax: stock of properties 2026 (CTSOP)
- URL(s): https://www.gov.uk/government/statistics/council-tax-stock-of-properties-2026 (CTSOP1.1 zip covers LSOA and MSOA)
- What: number of dwellings in each council tax band per LSOA, MSOA, local authority and constituency.
- Access: zip/CSV and ODS.
- Licence and attribution: OGL (source: VOA/MHCLG).
- Coverage: England and Wales. At 31 Mar 2026, published 24 Sep 2026.
- Verified: yes (attachment list).
- Use for us: "most homes near you are Band B". This picks a realistic default band for the household calculator without asking for an address.
- Rule risk: none.
- Verdict: USE NOW.

### Local Housing Allowance rates (VOA) and a BRMA lookup
- URL(s): https://www.gov.uk/government/publications/local-housing-allowance-lha-rates-applicable-from-april-2026-to-march-2027 (`2026-27_LHA_TABLES.xlsx`)
- What: weekly LHA by Broad Rental Market Area (BRMA) and category A–E. Table 1 is headed "LHA April 2024" because rates are frozen under SI 2026/5.
- Access: xlsx.
- Licence and attribution: OGL.
- Coverage: England (Scotland is Rent Service Scotland, Wales is Welsh Government; neither checked). 2026-27, published 30 Jan 2026.
- Verified: yes.
- BRMA lookups:
  - Cambridgeshire Insight: England, 2012 vintage ("0412"). Checked.
  - UBDC Glasgow postcode→BRMA v2.2, Jan 2026: the record says no files are downloadable.
  - findthatpostcode: Scotland only (18 areas).
- Use for us: housing-support baseline for renters; the rent input for PolicyEngine.
- Rule risk: none.
- Verdict: LATER. Needs a current open BRMA lookup first. Do the mapping by local authority, never by full postcode.

### Ofgem energy price cap
- URL(s): https://www.ofgem.gov.uk/your-energy-supply/your-energy-bill/energy-price-cap-unit-rates-and-standing-charges . Model files: https://www.ofgem.gov.uk/energy-regulation/domestic-and-non-domestic/energy-pricing-rules/energy-price-cap/energy-price-cap-default-tariff-levels (e.g. `Default-tariff-cap-level-v1.31.xlsx`, Aug 2026)
- What: the typical bill (£1,723 a year for 1 Oct–31 Dec 2026, "up 4%"). Unit rates and standing charges: electricity 26.32p/kWh + 54.83p/day, gas 7.97p/kWh + 29.68p/day. By region in HTML, with the full model in xlsx. The page states "There is no VAT on electricity from 1 October 2026 to 31 March 2027".
- Access: HTML scrape plus xlsx.
- Licence and attribution: OGL for Crown copyright material (Ofgem copyright page).
- Coverage: GB, 14 regions. Quarterly.
- Verified: yes.
- Use for us: energy baseline; context for energy-bill pledges. Replaces PolicyEngine's stale price-cap value.
- Rule risk: none.
- Verdict: USE NOW.

### Bank of England Interactive Database
- URL(s): `https://www.bankofengland.co.uk/boeapps/database/_iadb-fromshowcolumns.asp?csv.x=yes&Datefrom=01/Jan/2026&Dateto=now&SeriesCodes=IUDBEDR,IUMBV34,IUMBV42&CSVF=TN&UsingCodes=Y&VPD=Y&VFD=N`
- What: Bank Rate (3.75% on 24 Sep 2026) and quoted mortgage rates (IUMBV34 2-year fixed at 75% LTV: 4.92% in Aug 2026).
- Access: CSV with no key. Needs a browser-like User-Agent.
- Licence and attribution: OGL v3 (BoE legal page), except some exchange-rate data.
- Coverage: UK. Daily and monthly, latest 24 Sep 2026.
- Verified: yes.
- Use for us: mortgage-holder context ("a 1-point rate change on a £150k mortgage…", worked out with shown arithmetic).
- Rule risk: none.
- Verdict: USE NOW.

### ONS time series (CPI, CPIH, RPI)
- URL(s): https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/d7g7/mm23/data (JSON)
- What: any ONS series by CDID. CPI annual rate for Aug 2026 is 3.1%; next release 21 Oct 2026.
- Access: JSON with no key.
- Licence and attribution: OGL.
- Coverage: UK. Monthly.
- Verified: yes.
- Use for us: inflation baseline and "real terms" explanations.
- Rule risk: none.
- Verdict: USE NOW.

### ONS beta API (api.beta.ons.gov.uk)
- URL(s): https://api.beta.ons.gov.uk/v1/datasets (338 datasets)
- What: filterable datasets, including cpih01, ASHE tables (earnings by constituency and local authority), and "Effects of taxes and benefits on household income".
- Access: API with no key.
- Licence and attribution: OGL.
- Coverage and freshness:
  - `index-private-housing-rental-prices` is frozen at a 2024-02-14 release (discontinued).
  - cpih01's latest version link points to a 2026-02-18 release.
  - I would not rely on this API for prices; use the time series JSON above.
- Verified: yes.
- Use for us: ASHE earnings by constituency, as the "typical earnings here" default for the calculator.
- Rule risk: none.
- Verdict: LATER. ASHE only.

### ONS Price Index of Private Rents (PIPR), monthly
- URL(s): https://www.ons.gov.uk/economy/inflationandpriceindices/datasets/priceindexofprivaterentsukmonthlypricestatistics (JSON at `/data`; xlsx at `/file?uri=…/16september2026/…xlsx`)
- What: average rent and index by local authority, including rents by bedroom count.
- Access: xlsx (18.6 MB).
- Licence and attribution: OGL.
- Coverage: UK, 350 areas, Jan 2015 to Aug 2026. Monthly.
- Verified: yes (parsed; latest period 2026-08).
- Use for us: area pages ("average rent here £X, up Y%") and a renter default for the calculator.
- Rule risk: none.
- Verdict: USE NOW.

### ONS Household Costs Indices (HCI)
- URL(s): https://www.ons.gov.uk/economy/inflationandpriceindices/datasets/householdcostsindicesforukhouseholdgroupsreferencetables
- What: inflation as experienced by household type (renters, retired people, lower-income households, and so on).
- Access: xlsx. Quarterly.
- Licence and attribution: OGL.
- Coverage: UK. Apr–Jun 2026 released 28 Aug 2026; next 27 Nov 2026.
- Verified: yes (metadata).
- Use for us: "prices rose X% for households like yours".
- Rule risk: none.
- Verdict: LATER.

### ONS CPI item-level price quotes (behind the shopping prices tool)
- URL(s): https://www.ons.gov.uk/economy/inflationandpriceindices/datasets/consumerpriceindicescpiandretailpricesindexrpiitemindicesandpricequotes
- What: monthly item indices and price quotes (262 editions).
- Access: CSV and xlsx per month.
- Licence and attribution: OGL.
- Coverage: UK. Latest 15 Sep 2026.
- Verified: yes (metadata).
- Use for us: optional "price of a pint of milk" style explainers.
- Rule risk: none.
- Verdict: LATER.

### HMT Country and Regional Analysis (CRA) 2025
- URL(s): https://www.gov.uk/government/statistics/country-and-regional-analysis-2025 (`CRA_2025_Database_for_Publication.xlsx`)
- What: public spending by department, function (COFOG) and ITL region or country, 2020-21 to 2024-25. About 20,000 rows.
- Access: xlsx.
- Licence and attribution: OGL.
- Coverage: UK nations and English regions. Published 19 Nov 2025; the 2026 edition is due (guidance published 13 Aug 2026).
- Verified: yes (parsed headers).
- Use for us: putting "£X for the NHS" pledges in context with "spending per head on health in your region".
- Rule risk: none.
- Verdict: USE NOW.

### HMT PESA 2026
- URL(s): https://www.gov.uk/government/statistics/public-expenditure-statistical-analyses-2026 (chapter xlsx files)
- What: national spending by department and function, outturn and plans.
- Access: xlsx.
- Licence and attribution: OGL.
- Coverage: UK. Published 16 Jul 2026.
- Verified: yes (attachments).
- Use for us: national scale for pledges ("that is X% of health spending").
- Rule risk: none.
- Verdict: LATER.

### HMT Block Grant Transparency
- URL(s): https://www.gov.uk/government/publications/block-grant-transparency-october-2025 (xlsx)
- What: Barnett block grant adjustments for Scotland, Wales and NI.
- Access: xlsx.
- Licence and attribution: OGL.
- Coverage: devolved nations. Oct 2025 is the latest.
- Verified: yes (attachment).
- Use for us: Learn page ("how Scotland gets funded").
- Rule risk: none.
- Verdict: LATER.

### MHCLG Core Spending Power, and Revenue Account budget per council
- URL(s):
  - https://www.gov.uk/government/publications/core-spending-power-table-final-local-government-finance-settlement-2026-27-to-2028-29 (xlsx, 9 Feb 2026)
  - https://www.gov.uk/government/statistics/local-authority-revenue-expenditure-and-financing-england-2026-to-2027-budget-individual-local-authority-data (RA 2026-27 ODS parts 1–2, 11 Jun 2026)
- What: each council's spending power over three years, and its budgeted spending by service (adult social care, children's services, and so on).
- Access: xlsx and ODS.
- Licence and attribution: OGL.
- Coverage: England councils. 2026-27.
- Verified: yes (attachments).
- Use for us: council pages ("your council plans to spend £X on social care").
- Rule risk: none.
- Verdict: USE NOW.

### DfE National Funding Formula tables 2026-27 (per school)
- URL(s): https://www.gov.uk/government/publications/national-funding-formula-tables-for-schools-and-high-needs-2026-to-2027 (`Impact-of-the-schools-NFF-2026-27.ods`)
- What: notional NFF allocation for every school (sheet `NFF_all_schools`, about 20,000 rows) and per local authority.
- Access: ODS.
- Licence and attribution: OGL.
- Coverage: England. 2026-27, 17 Dec 2025.
- Verified: yes (parsed sheet names and shapes).
- Use for us: area and education pages ("schools near you: funding per pupil"). Join to GIAS, which we already use.
- Rule risk: none, as long as it is shown without ranking.
- Verdict: LATER.

### Explore Education Statistics API
- URL(s): https://api.education.gov.uk/statistics/v1/publications
- What: only a few publications are on the API so far. It includes "Funded early education and childcare" (registrations and take-up by local authority, 2018–2026).
- Access: API with no key.
- Licence and attribution: OGL.
- Coverage: England, local authority. Updated Jul 2026.
- Verified: yes.
- Use for us: childcare take-up by local authority, as context for childcare pledges.
- Rule risk: none.
- Verdict: LATER.

### Home Office police funding for England and Wales, 2015 to 2027
- URL(s): https://www.gov.uk/government/statistics/police-funding-for-england-and-wales-2015-to-2027
- What: funding per police force, including the council tax precept.
- Access: likely xlsx. I only confirmed the collection page, not the attachments.
- Licence and attribution: OGL.
- Coverage: England and Wales forces. Published 19 Aug 2026.
- Verified: partly.
- Use for us: police and crime commissioner elections and council tax precept context.
- Rule risk: none.
- Verdict: LATER.

### NHS England ICB allocations 2026/27 to 2028/29
- URL(s): https://www.england.nhs.uk/allocations/
- What: funding per integrated care board.
- Access: the pages return a 202 bot challenge to curl and the page fetch showed no file links. Direct file URLs (PDFs) download fine.
- Licence and attribution: OGL (UNVERIFIED).
- Coverage: England ICBs. Published Dec 2025.
- Verified: partly.
- Use for us: "health funding for your area".
- Rule risk: none. Automating it is fragile.
- Verdict: LATER.

### DWP Stat-Xplore API (HBAI, Children in low income families, benefit claimants)
- URL(s): https://stat-xplore.dwp.gov.uk/webapi/rest/v1/ (`/info` returned 401 without a key)
- What: DWP statistics tables, including children in low-income families down to ward level.
- Access: free account and API key sent in a header. Limit of 2,000 requests per period.
- Licence and attribution: OGL (UNVERIFIED on the API page).
- Coverage: GB. Children in low-income families 2022–2025, published 26 Mar 2026.
- Verified: partly (401 without key; docs read).
- Use for us: area pages (child poverty by ward) and distribution context.
- Rule risk: none.
- Verdict: LATER. Needs a free key.

### DWP benefit expenditure and caseload tables 2026
- URL(s): https://www.gov.uk/government/publications/benefit-expenditure-and-caseload-tables-2026 (xlsx, Spring Forecast 2026)
- What: spending and claimant numbers per benefit, actuals and forecast.
- Access: xlsx.
- Licence and attribution: OGL.
- Coverage: GB. 14 Apr 2026.
- Verified: yes (attachment).
- Use for us: scale of benefit pledges.
- Rule risk: none.
- Verdict: LATER.

### HMRC "Direct effects of illustrative tax changes" (ready reckoner)
- URL(s): https://www.gov.uk/government/statistics/direct-effects-of-illustrative-tax-changes (`June_2025_TRR_ODS__1_.ods`)
- What: what 1p on a tax rate, or £100 on an allowance, costs or raises.
- Access: ODS.
- Licence and attribution: OGL.
- Coverage: UK. June 2025 is the latest I saw.
- Verified: yes (attachment).
- Use for us: sanity-check scale on tax pledges ("1p on basic rate ≈ £Xbn").
- Rule risk: none.
- Verdict: LATER.

### Scottish Government uprating of devolved benefits, and the Scottish Fiscal Commission
- URL(s):
  - https://www.gov.scot/publications/social-security-assistance-scotland-up-rating-inflation-2026-27/pages/7/ (HTML tables, e.g. Scottish Child Payment £28.20)
  - SFC: https://fiscalcommission.scot/19-march-2026-social-security-uprating/ (xlsx, e.g. `Jan-2026-SEFF-…Social-security-Supplementary-figures.xlsx`)
- What: devolved benefit rates for 2026-27, and forecasts.
- Access: HTML scrape and xlsx. The `socialsecurity.gov.scot` rates URLs I tried returned 404.
- Licence and attribution: OGL (gov.scot). SFC licence UNVERIFIED.
- Coverage: Scotland.
- Verified: partly.
- Use for us: Scottish benefits baseline.
- Rule risk: none.
- Verdict: LATER. Needed before the Scottish Parliament election pages.

### Stamp duty in each nation: SDLT (HMRC), LBTT (Revenue Scotland), LTT (Welsh Government)
- URL(s):
  - SDLT: HMRC rates collection (`rates-and-allowances-stamp-duty-land-tax`)
  - LBTT: https://revenue.scot/taxes/land-buildings-transaction-tax/residential-property (6 HTML tables; bands 0/2/5/10/12%)
  - LTT: https://www.gov.wales/land-transaction-tax-rates-and-bands (14 tables)
- Access: HTML.
- Licence and attribution: OGL.
- Verified: yes (fetched).
- Use for us: baseline for housing and stamp duty pledges.
- Rule risk: none.
- Verdict: LATER. Changes rarely; parse with a change check.

### Student finance, tuition fees, VED, VAT, childcare, prescription charges, TV licence
- GOV.UK Content API pages (student finance, vehicle tax tables, VAT rates, 30 hours childcare, Tax-Free Childcare) all fetched as JSON.
- SAAS and Student Finance Wales returned HTTP 200 (content not parsed).
- NHSBSA prescription-charge URL returned 404. TV Licensing returned 403 to curl.
- For England's prescription charge, the Budget Table 4.1 freeze plus legislation.gov.uk are the machine-checkable sources.
- Verdict: LATER. Mostly static rates; use the Content API and legislation.gov.uk.

### UKMOD (CeMPA, University of Essex)
- URL(s): https://www.microsimulation.ac.uk/ukmod/access/ , https://github.com/centreformicrosimulation/UKMOD-PUBLIC/
- What: tax-benefit microsimulation model. B2026.03 released 22 Jun 2026.
- Access: needs EUROMOD software (Windows only). FRS input data via a request form plus UK Data Service access. "UKMOD Explore" is web-only.
- Licence and attribution: CC BY-NC-ND 4.0. No redistributing modified versions; attribution required.
- Verified: yes (docs).
- Use for us: none that PolicyEngine doesn't already cover.
- Rule risk: none.
- Verdict: NO. Windows-only, data-gated, and no household API.

### Manifesto Project (MARPOR) API
- URL(s): https://manifesto-project.wzb.eu/information/documents/api (`/api/v1/list_core_versions` works without a key; `metadata` redirects to `not_authorized`)
- What: coded manifestos and texts (MPDS2026a).
- Access: free account and API key; daily quota.
- Licence and attribution: custom terms. "Redistribution of the provided data is forbidden except when … authorized in writing."
- Verified: partly.
- Rule risk: coded left–right scores are third-party scoring, and redistribution is barred.
- Verdict: NO.

---

## Ranked top 10 for our site
1. **PolicyEngine UK, self-run package in GitHub Actions.** Fixes the version lag and the dependence on an undocumented API. Never display its parameter values as rates.
2. **GOV.UK Content API (HMRC rates collection, DWP benefit rates, minimum wage, Scottish income tax).** The official "today's rates" baseline. Detect changes by hash.
3. **OBR policy measures database.** Official costing for any pledge that echoes a past or current measure.
4. **legislation.gov.uk feeds.** The legal source that settles conflicts between rate sources (fuel duty is the live example).
5. **HMT Budget Table 4.1 xlsx.** What's already changing for households, costed.
6. **Council tax for Scotland (gov.scot xlsx) and Wales (StatsWales API CSV), plus CTSOP band mix by LSOA.** Completes council tax across Great Britain and gives the calculator a sensible default band.
7. **ONS: CPI time series JSON and PIPR rents by local authority.** Price baseline and area rents.
8. **Ofgem price cap page and model xlsx.** Energy baseline; replaces PolicyEngine's stale figure.
9. **Bank of England database CSV (Bank Rate, quoted mortgage rates).**
10. **HMT CRA database, and MHCLG Core Spending Power and RA budget per council.** Puts "£X for the NHS" and council-spending pledges in context.

## Checked and dismissed (one line each)
- **IFS TAXBEN / Fiscal Facts / "Where do you fit in":** not open. ifs.org.uk returned 403 to curl and 404 through the page fetch, so I couldn't verify it. IFS analysis is third-party anyway.
- **Resolution Foundation:** PDF reports and charts only, no API, and third-party analysis (rule risk). `/our-data/` returned 404.
- **Landman Economics:** site unreachable (proxy 502). Consultancy, no open data.
- **Family Resources Survey microdata:** UK Data Service licence. Not needed; PolicyEngine handles it.
- **HMT "Impact on households" distributional analysis:** PDF only. Reference link at most.
- **Entitledto:** 403. **Turn2us:** 200. **Policy in Practice Better Off Calculator:** 200. All interactive calculators with no open API; Policy in Practice is commercial.
- **HMRC "Estimate your Income Tax":** interactive calculator only, no API.
- **Coram Childcare Survey 2026:** PDF report, no stated reuse licence, campaigning charity (rule risk).
- **ORR rail fares index:** annual PDF; fares unchanged in 2026 versus RPI 4.1%. Low value. Data tables not found on the page.
- **Comparative Agendas Project UK:** academic coding, 1910–2022, stale; coding is a form of scoring.
- **PoliticsResources.net manifesto archive:** the old `/area/uk/man.htm` URL now redirects to the homepage. Archive not found.
- **Full Fact / BBC Verify:** no API (fullfact.org/api returns 404). Third-party fact-checks.
- **Electoral Commission party registrations (search API):** my queries returned empty results. Registration statements hold no policy content anyway.
- **statistics.gov.scot SPARQL:** empty reply from the server, not reachable from here.
- **ONS beta `index-private-housing-rental-prices`:** discontinued, frozen at Feb 2024. Use PIPR instead.
- **UBDC postcode→BRMA lookup v2.2:** the record says there are no downloadable files, and it is postcode-level.
- **Cambridgeshire Insight BRMA file:** 2012 vintage, England only.
- **Sub-regional fuel poverty 2026 (2024 data, xlsx):** valid (OGL, verified attachment). Belongs to area stats rather than household effects. LATER.
