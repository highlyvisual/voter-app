# Official statistics and public-service data by local area

Research notes, 27 September 2026. One of five parallel investigations behind `../11-data-sources.md`; the brief and rules each followed are in `CONTEXT.md`. Endpoints were fetched live on the day unless marked UNVERIFIED or partly verified. Re-check anything before building on it: sites change, and some blocked the research environment but may work from GitHub Actions.

## Official statistics and public-service data by local area

I checked 62 sources and tested endpoints with curl on 27 Sept 2026. Where a fetch was blocked (bot checks or the proxy), I say so and haven't worked around it.

**The main finding:** ONS "Explore Local Statistics" has a working, undocumented data API. One call returns about 50 to 95 official indicators for a council in any UK nation. Close behind are the GOV.UK local links export (every council's service URLs, refreshed daily) and three devolved portals. Two of those portals were relaunched in 2025–26: the new StatsWales API, and data.gov.scot, a CKAN-based API that is replacing statistics.gov.scot. The third is the NISRA Data Portal for Northern Ireland.

---

### ONS Explore Local Statistics (ELS) data API
- URL(s): https://www.ons.gov.uk/explore-local-statistics/ · working: `https://www.ons.gov.uk/explore-local-statistics/api/v1/data.csv?geo=E08000035&time=latest` (also `.json`). Per indicator: `/api/v1/data/gross-disposable-household-income-per-head.csv?geo=ltla,K02000001&time=2024-01-01`. Bulk: `/explore-local-statistics/files/json-stat.json` (11 MB) and `/files/all-datasets.xlsx`
- What: a curated set of official indicators in one place. Covers population, age, jobs, pay, GDHI, child poverty, fuel poverty, house prices, affordability, schools (KS2, GCSE, absence), obesity, healthy life expectancy, wellbeing, emissions, energy use, broadband/4G/5G, EV chargers, traffic, and access to libraries and stations. It gives confidence intervals where available.
- Access: plain GET returning CSV, CSVW, XLSX or JSON-stat. No key. The API is **not formally documented**: I found it through the "get the data" links on indicator pages. The ELS API proof-of-concept repo was archived in Feb 2026 and merged into the main app, so paths could change.
- Licence and attribution: OGL v3 (in the page footer). Credit ONS plus the original producer.
- Coverage: UK. Lower-tier councils, counties and upper-tier councils, combined authorities, regions. **No wards or constituencies** (both returned empty). Indicators per area: Leeds 94, Glasgow 61, Cardiff 64, an NI council 52. Latest period seen: July 2026 (house prices, EV chargers). Many indicators are annual and lag 1 to 3 years.
- Verified: yes. Fetched all-indicator CSVs for Leeds, Glasgow, Cardiff, Armagh (NI), Hampshire and West Yorkshire; a per-indicator CSV; and the JSON-stat bulk file.
- Use for us: the backbone of area and council pages, "your area in numbers", with one nightly job per council. Every row carries its period, and the JSON has producer notes for source lines.
- Rule risk: none, as long as we show values and never rank councils against each other. ELS itself offers comparisons; don't copy them.
- Verdict: **USE NOW**. It's the cheapest way to get UK-wide official local stats. Also snapshot the bulk file in case the undocumented paths change.

### Nomis API (ONS)
- URL(s): https://www.nomisweb.co.uk/api/v01/help · examples: `.../dataset/NM_2072_1.data.csv?date=latest&geography=E05011410&measures=20100` (Census TS054 tenure, ward) · `NM_162_1` claimant count by ward · `NM_30_1` ASHE pay · `NM_142_1` UK Business Counts · `NM_57_1` jobs density · `NM_2002_1` population estimates
- What: Census 2021 tables down to output area and ward, labour market data, claimant count, earnings, business counts, jobs density and population estimates.
- Access: REST API returning CSV, JSON or SDMX. No key needed (an optional free uid allows bigger queries). There are cell limits per call.
- Licence and attribution: OGL. "Source: ONS via Nomis".
- Coverage: mostly UK or GB. Census 2021 is England and Wales only (Scotland 2022 and NI 2021 are separate). Output area, LSOA, ward, council, constituency. Latest seen: claimant count Aug 2026 (ward), UK Business Counts 2026, ASHE 2025, jobs density 2024.
- Verified: yes (all five datasets above returned data, including ward level).
- Use for us: **ward-level** facts for area pages (tenure, economic activity, household size), plus council pay and business counts.
- Rule risk: none.
- Verdict: **USE NOW**. It's the only one-stop source for ward-level stats. We already use claimant count; this adds census and ASHE through the same API.

### ONS API (api.beta.ons.gov.uk) and Census 2021 custom datasets
- URL(s): https://developer.ons.gov.uk/ · `https://api.beta.ons.gov.uk/v1/population-types/UR/census-observations?area-type=wd,E05011410&dimensions=economic_activity_status_4a`
- What: build-your-own Census 2021 cross-tabs by geography (39 population types), plus about 338 other datasets.
- Access: REST/JSON, no key. Labelled beta and may have breaking changes. There is a rate-limit guide.
- Licence and attribution: OGL.
- Coverage: England and Wales census from output area to council, including wards. Many non-census datasets are **stale**: mid-year population last updated 2024-09-10, the old private rents index 2024-02-14, GDP by council 2021.
- Verified: yes. The ward census query worked. The dataset list shows the stale dates.
- Use for us: custom census combinations for ward pages where Nomis's fixed tables don't fit.
- Rule risk: none.
- Verdict: **LATER**. Nomis covers most needs. Use this only for custom cross-tabs, and don't use its non-census datasets (use ELS or Nomis instead).

### ONS Open Geography Portal (ONSPD, NSPL, CHD, RGC, lookups)
- URL(s): https://geoportal.statistics.gov.uk · search: `https://hub.arcgis.com/api/search/v1/collections/dataset/items?q=ONSPD` · live lookup: `https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/WD26_LAD26_CTYUA26_RGN26_CTRY26_UK_LU/FeatureServer/0/query?where=LAD26NM%3D'Leeds'&outFields=*&f=json`
- What:
  - ONSPD Aug 2026 and NSPL Aug 2026: postcode to every geography (~254 MB zip).
  - **Code History Database and Register of Geographic Codes (June 2026)**: every council code's start and end dates and its successors.
  - Ward to council to county/unitary lookup, May 2026 (8,413 rows).
  - **Parish to ward to council lookup, May 2026.**
  - National Statistics UPRN Lookup, May 2026.
- Access: bulk CSV plus ArcGIS REST query. No key.
- Licence and attribution: OGL plus OS/Royal Mail attributions (see the ONS geography licences page). Some postcode products carry Royal Mail terms.
- Coverage: UK (the parish lookup is England and Wales). Latest: ONSPD/NSPL Aug 2026; the portal was updated 16–17 Sept 2026.
- Verified: yes (searched the catalogue and queried the WD26 lookup live).
- Use for us: **CHD/RGC is the authoritative feed for the council register** (reorganisations, abolished councils, code changes). The parish lookup powers the "parish to Parliament" chain. NSPL lets us do postcode to area offline in the pipeline, so full postcodes never go to a third party at runtime.
- Rule risk: none.
- Verdict: **USE NOW** for CHD/RGC and the parish lookup. We already use the boundaries; these are features we've missed.

### data.gov.scot (Scottish Government CKAN API, replacing statistics.gov.scot)
- URL(s): https://data.gov.scot/help/technical-support/how-to-access-data-using-the-api · `https://api.data.gov.scot/api/3/action/package_search?q=simd` · `https://api.data.gov.scot/api/3/action/datastore_search?resource_id=3af1ca6f-089a-49f1-867c-1b749ccd601b&limit=3`
- What: Scotland's official statistics catalogue (290 datasets). Includes SIMD, council tax bands by data zone, council tax collection, homelessness, housing lists, recorded crime, school attainment, fires, SEPA household waste and NRS household estimates.
- Access: CKAN API (catalogue, row filtering, full CSV download). **No key.** `datastore_search_sql` is blocked (403). The service is in public beta: the Government blog of June 2026 says it "will replace statistics.gov.scot".
- Licence and attribution: OGL v3.
- Coverage: Scotland. Data zone, intermediate zone, council, multi-member ward. **Freshness varies** by dataset: recorded crime to 2025/26; homelessness to 2024/25; council tax collection only to 2021/22; the data-zone house prices dataset to 2018; SIMD is still the 2020 edition.
- Verified: yes (package_search, package_show, datastore_search, CSV download). **statistics.gov.scot and its SPARQL endpoint returned "empty reply" through our proxy**, so I couldn't test them. Either way, don't build on the old site.
- Use for us: Scottish parity for council and area pages (council tax bands, homelessness, crime, schools, deprivation).
- Rule risk: none.
- Verdict: **USE NOW**. Build against the new API, not statistics.gov.scot, and check each dataset's latest date.

### StatsWales (new service and API)
- URL(s): https://stats.gov.wales · docs: https://api.stats.gov.wales/v1/docs/ (swagger.json) · `https://api.stats.gov.wales/v1/` (catalogue) · `https://api.stats.gov.wales/v1/9706edd9-73ad-4902-bb12-7ccd7038626e/download/csv` (WIMD 2025) · `/v1/topic/34` (council tax)
- What: all Welsh Government statistics (789 datasets). Includes **WIMD 2025**, council tax (band D breakdown, collection, exemptions), homelessness, schools, NHS waiting times and ED performance, GP workforce, dental, fires, non-domestic rates and Welsh language.
- Access: REST (dataset, view, filters) plus CSV download. No key. **The old OData API (api.statswales.gov.wales) is gone**: the proxy returned 502, and the Welsh Government's June 2024 blog announced the OData change.
- Licence and attribution: OGL.
- Coverage: Wales. LSOA, MSOA, council, health board. WIMD 2025 first published 2025-11-27. Council tax datasets updated 2026-03-24. ED performance updated 2026-09-17.
- Verified: yes (catalogue, topics, dataset metadata, full WIMD 2025 CSV).
- Use for us: Welsh council and area pages. WIMD 2025 is the equivalent of the English Indices of Deprivation we already use.
- Rule risk: none. WIMD ranks areas, not councils or candidates, and the site already shows IoD.
- Verdict: **USE NOW**.

### NISRA Data Portal (PxStat API)
- URL(s): https://data.nisra.gov.uk/ · `https://ws-data.nisra.gov.uk/public/api.restful/PxStat.Data.Cube_API.ReadCollection` · JSON-RPC `PxStat.Data.Cube_API.ReadDataset` (for example matrix MYE01T09)
- What: 1,248 NI tables. Includes claimant count monthly by council/assembly area/SOA (2026-09-15), police recorded crime by ward and DEA (2026-06-25), NI house price index by council (2026-08-25), housing stock by ward, rates paid, school census by council/DEA, benefit statistics by ward, and HSC waiting times.
- Access: REST/JSON-RPC returning JSON-stat. No key.
- Licence and attribution: OGL (NISRA).
- Coverage: NI at DEA, ward, SOA, data zone, council (2014 councils). **NIMDM is still the 2017 edition (stale).** NINIS, the old neighbourhood service, did not respond; it has been superseded by this portal.
- Verified: yes (full collection and a dataset read).
- Use for us: NI area and council pages. DEAs are the NI local election areas, so DEA-level tables match our election geography.
- Rule risk: none.
- Verdict: **USE NOW**.

### OpenDataNI (CKAN)
- URL(s): https://www.opendatani.gov.uk · API https://admin.opendatani.gov.uk/api/3/
- What: NI councils' and departments' open data.
- Access: CKAN. **Returned 403 to us.** Its harvest into data.gov.uk returned 0 results for organisation:opendatani.
- Licence and attribution: mostly OGL (UNVERIFIED).
- Coverage: NI. Could not check dates.
- Verified: no (blocked).
- Use for us: NI council-level odds and ends.
- Rule risk: none.
- Verdict: **LATER**. Retry from GitHub Actions; NISRA covers most needs.

### MHCLG housing live tables (England)
- URL(s): pages under https://www.gov.uk/government/statistical-data-sets/ (live-tables-on-net-supply-of-housing, …-homelessness, …-affordable-housing-supply, …-rents-lettings-and-tenancies, …-dwelling-stock-including-vacants). Content API: `https://www.gov.uk/api/content/government/statistical-data-sets/live-tables-on-homelessness`
- What: net additional dwellings by council (Table 122); affordable homes (Table 1000 and others); **H-CLIC homelessness detailed council tables** (latest Jan–Mar 2026); **council waiting lists (Table 600)**; LAHS 2024-25; dwellings by tenure (Table 100); Housing Delivery Test 2025 measurement (2026-08-17).
- Access: ODS/XLSX attachments. The GOV.UK Content API gives stable JSON listing each file URL and update date, so a job can find the newest file automatically. No key.
- Licence and attribution: OGL.
- Coverage: England, by council. Update dates: homelessness 2026-08-13, affordable 2026-09-03, waiting lists, LAHS and stock 2026-06-25, net supply 2025-11-20.
- Verified: yes (Content API for each page, with attachment URLs).
- Use for us: the council page "Housing" panel: homes built, affordable homes, households in temporary accommodation, waiting list size.
- Rule risk: the Housing Delivery Test is a pass/fail-style measure with consequences. Show the published figure neutrally and never label it good or bad. Otherwise none.
- Verdict: **USE NOW**. Parsing ODS files is the main cost.

### MHCLG local authority revenue outturn (council spending)
- URL(s): https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing
- What: what each English council spent by service (2025-26 individual-council outturn and a multi-year dataset).
- Access: bulk ODS/CSV. No key.
- Licence and attribution: OGL.
- Coverage: England, per council. Updated 2026-09-17.
- Verified: partly (collection and documents listed through the Content API; files not opened).
- Use for us: council pages, "where the money goes".
- Rule risk: none. Show amounts, not per-head rankings.
- Verdict: **USE NOW**.

### MHCLG planning application statistics
- URL(s): https://www.gov.uk/government/collections/planning-applications-statistics
- What: applications received and decided, and the share decided in time, by planning authority (quarterly).
- Access: ODS. No key.
- Licence and attribution: OGL.
- Coverage: England, by planning authority. Apr–Jun 2026 published 2026-09-24.
- Verified: partly (collection listed).
- Use for us: council page planning panel, alongside planning.data.gov.uk.
- Rule risk: speed-of-decision figures invite ranking. Show our council's own numbers over time only.
- Verdict: **LATER**.

### VOA Council Tax: stock of properties (CTSOP) 2026
- URL(s): https://www.gov.uk/government/statistics/council-tax-stock-of-properties-2026 · `CTSOP_1_1.zip` (band by council, LSOA and MSOA)
- What: number of homes in each council tax band (and by property type and build period) by council, LSOA, MSOA and constituency, at 31 March 2026. A supplementary table is at 8 Sept 2026.
- Access: ODS/ZIP. No key.
- Licence and attribution: OGL.
- Coverage: England and Wales. Published 2026-09-24. Annual.
- Verified: yes (Content API listing with file URLs).
- Use for us: combined with MHCLG band charges we already hold, we can show "most homes in this area are band B, which costs £X". Also useful as a PolicyEngine input default.
- Rule risk: none.
- Verdict: **USE NOW**. Scotland: NRS "Dwellings by Council Tax Band" on data.gov.scot. Wales: also StatsWales.

### ONS Price Index of Private Rents (PIPR)
- URL(s): https://www.ons.gov.uk/economy/inflationandpriceindices/datasets/priceindexofprivaterentsukmonthlypricestatistics · JSON: add `/data` to the URL
- What: monthly average rents and annual change by council.
- Access: XLSX per release. The ONS site `/data` JSON lists releases and files. No key.
- Licence and attribution: OGL.
- Coverage: UK, by council. Latest release 16 Sept 2026; next 21 Oct 2026.
- Verified: yes (release list and download filename via JSON).
- Use for us: "typical rent here" on area pages, next to HPI prices.
- Rule risk: none.
- Verdict: **USE NOW**. The API dataset "index-private-housing-rental-prices" is frozen at 2024; use this XLSX instead.

### HM Land Registry UK HPI (council level) and Price Paid
- URL(s): `https://landregistry.data.gov.uk/data/ukhpi/region/leeds/month/2026-06.json` · PPD monthly CSV on the Land Registry S3 bucket · SPARQL endpoint
- What: average price, index and annual change by council, monthly. Price Paid lists individual sales.
- Access: linked-data JSON, no key. SPARQL returned **429 rate limited**.
- Licence and attribution: OGL; Price Paid has address-data conditions.
- Coverage: England and Wales councils. Scotland via Registers of Scotland; NI via LPS on NISRA. 2026-07 exists.
- Verified: yes (council-level JSON for Leeds 2026-06 and 2026-07).
- Use for us: switch from region-level to **council-level** HPI. It's the same API with the council slug.
- Rule risk: none.
- Verdict: **USE NOW** (a better use of a source we already have).

### EPC data: "Get energy performance of buildings data" (MHCLG)
- URL(s): https://get-energy-performance-data.communities.gov.uk/ (the old epc.opendatacommunities.org now redirects here) · API docs: /api-technical-documentation · base https://api.get-energy-performance-data.communities.gov.uk
- What: every domestic and non-domestic EPC and DEC since 2012.
- Access: API and bulk. **Key needed**: a bearer token from a GOV.UK One Login account (free). Limit 6,000 requests per 5 minutes per IP.
- Licence and attribution: OGL for the service, with "licensing restrictions" and "data protection requirements" on address-level data (details UNVERIFIED).
- Coverage: England and Wales (Scotland has its own register).
- Verified: partly (docs read; the API returned 403 without a token).
- Use for us: aggregates only. The **"Live tables on Energy Performance of Buildings Certificates"** (council-level EPC bands, updated 2026-09-07, ODS, no key) are a better fit.
- Rule risk: privacy if address-level. Keep to aggregates.
- Verdict: **LATER** for the API; the live tables are good now.

### Local Housing Allowance rates 2026-27 (VOA/DWP)
- URL(s): https://www.gov.uk/government/publications/local-housing-allowance-lha-rates-applicable-from-april-2026-to-march-2027
- What: LHA caps by bedroom size.
- Access: XLSX. No key.
- Licence and attribution: OGL.
- Coverage: by BRMA (Broad Rental Market Area), which **does not match councils**. Published 2026-01-30.
- Verified: yes (attachment URL found).
- Use for us: PolicyEngine household effects (check whether PolicyEngine already includes it).
- Rule risk: none.
- Verdict: **LATER**.

### DfE Explore Education Statistics API
- URL(s): https://api.education.gov.uk/statistics/v1/publications?page=1&pageSize=40 · `/data-sets/019e7404-df19-71ce-90a8-f2e3db7dd7fa/meta` · `/csv` (free school meals eligibility)
- What: 25 API-enabled publications, including school pupils and characteristics (free school meals, class sizes), absence, attendance, KS2, KS4, SEND/EHC plans, children in need, looked-after children, NEET and elective home education.
- Access: REST (meta, query, gzipped CSV). No key.
- Licence and attribution: OGL.
- Coverage: England at council, **constituency**, region and school level. Free school meals to 2025/26; attendance updated 2026-09-24.
- Verified: yes (publication list, dataset list, metadata, CSV).
- Use for us: council page education panel (free school meals share, class sizes, attendance, SEND plans).
- Rule risk: none at council level. School-level attainment invites league tables, so avoid it.
- Verdict: **USE NOW**. SCAP school capacity (published 2026-03-19, 2024/25) is on EES but **not in the API**; download it separately.

### Ofsted inspection management information
- URL(s): https://www.gov.uk/government/statistical-data-sets/monthly-management-information-ofsteds-school-inspections-outcomes
- What: latest inspection outcomes per school (monthly).
- Access: CSV/XLSX. No key.
- Licence and attribution: OGL.
- Coverage: England. Updated 2026-09-10.
- Verified: partly (Content API page date).
- Use for us: at most, a neutral "inspected on [date], see report" link.
- Rule risk: **yes**. These are graded judgements of schools; the rule is aimed at candidates and councils, but showing grades invites comparison.
- Verdict: **NO** for grades. Link to reports only, if at all.

### School performance tables (compare-school-performance)
- URL(s): https://www.find-school-performance-data.service.gov.uk/download-data (redirects to compare-school-performance.service.gov.uk)
- What: school-level results.
- Access: bulk CSV. **Returned 403 "request is blocked"** to us.
- Licence and attribution: OGL.
- Coverage: England.
- Verified: no (blocked).
- Use for us: none.
- Rule risk: league-table risk.
- Verdict: **NO**. Council-level figures come from EES.

### NHS ODS: ORD API and bulk CSVs (GP practices etc.)
- URL(s): `https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations?PrimaryRoleId=RO177&PostCode=LS26&Limit=3` · bulk: `https://www.odsdatasearchandexport.nhs.uk/api/getReport?report=epraccur` (GP practices CSV, 3.3 MB)
- What: every NHS organisation (GP practices, pharmacies, trusts, ICBs) with address, status and dates.
- Access: ORD REST, no key. **ORD is scheduled for decommissioning around Sept 2027**, "dependent on user feedback". The FHIR STU3 API is retired ("has now been retired"). The newer Organisation Data Terminology FHIR API returned 401 (key needed).
- Licence and attribution: OGL.
- Coverage: England and Wales mainly (the ODS remit is UK-wide in part).
- Verified: yes (ORD query and epraccur CSV); the ODT FHIR API returned 401.
- Use for us: area page "GP practices near you", joined with patient list sizes.
- Rule risk: none.
- Verdict: **USE NOW** via the bulk CSV (no key, and it survives the ORD retirement).

### NHS England: Patients Registered at a GP Practice
- URL(s): https://digital.nhs.uk/data-and-information/publications/statistical/patients-registered-at-a-gp-practice
- What: monthly list sizes per practice, primary care network and ICB, by age and sex.
- Access: CSV per release. No key.
- Licence and attribution: OGL.
- Coverage: England. The Sept 2026 release came out 10 Sept 2026; next is 15 Oct 2026.
- Verified: partly (**curl got 403 from digital.nhs.uk's bot check**; WebFetch read the page).
- Use for us: "patients per GP practice" on area pages (a fact, not a rating).
- Rule risk: none.
- Verdict: **LATER**. Test fetching from GitHub Actions first, since the bot check may block it.

### NHS England waiting times: RTT and A&E
- URL(s): https://www.england.nhs.uk/statistics/statistical-work-areas/rtt-waiting-times/rtt-data-2026-27/ · …/ae-attendances-and-emergency-admissions-2026-27/
- What: waiting lists by trust and commissioner; A&E 4-hour performance by trust.
- Access: CSV/ZIP and XLS. No key.
- Licence and attribution: OGL.
- Coverage: England, by trust or ICB, not council.
- Verified: partly (**curl got a 202 bot challenge**; WebFetch saw the page but reported Apr 2026 as latest, which I couldn't confirm).
- Use for us: maybe "your local hospital trust's waiting list".
- Rule risk: performance comparisons. Also the geography doesn't map to councils.
- Verdict: **LATER**.

### NHS website Service Search API
- URL(s): https://api.nhs.uk/service-search/… and https://api.service.nhs.uk/service-search-api/
- What: GP, dentist and pharmacy listings, including dentists "accepting new patients".
- Access: **subscription key needed** (401 without one).
- Licence and attribution: NHS website content terms (UNVERIFIED).
- Coverage: England.
- Verified: partly (both hosts returned 401).
- Use for us: dentist availability.
- Rule risk: the listings include patient ratings, so we'd need to strip them.
- Verdict: **LATER**.

### OHID Fingertips API (public health profiles)
- URL(s): https://fingertips.phe.org.uk/api · `https://fingertips.phe.org.uk/api/latest_data/all_indicators_in_profile_group_for_child_areas?profile_id=19&group_id=1938132694&area_type_id=502&parent_area_code=E92000001`
- What: thousands of public health indicators (life expectancy, smoking, obesity, alcohol and more) across 38 profiles.
- Access: REST/JSON and CSV. No key.
- Licence and attribution: OGL (OHID).
- Coverage: England. Lower- and upper-tier councils, **electoral best-fit wards (2024)**, GP practice, ICB. Frequency varies.
- Verified: yes (profiles, area types, latest-data call).
- Use for us: council and area health panels, including some ward-level indicators.
- Rule risk: Fingertips colour-codes "better/worse than England", so drop the RAG colours and polarity. Values only.
- Verdict: **USE NOW** (without the comparator colours).

### Public Health Scotland open data (opendata.nhs.scot)
- URL(s): https://www.opendata.nhs.scot/api/3/action/package_list
- What: Scottish GP practices, list sizes, waiting times and A&E (CKAN).
- Access: CKAN, reportedly no key.
- Licence and attribution: OGL (UNVERIFIED).
- Coverage: Scotland.
- Verified: **no**. Curl got "empty reply"; WebFetch was blocked by robots.
- Use for us: Scottish parity for GP and health panels.
- Rule risk: none.
- Verdict: **LATER**. Retry from GitHub Actions.

### CQC API (care ratings)
- URL(s): https://api-portal.service.cqc.org.uk/ · https://api.service.cqc.org.uk/public/v1/
- What: registered care services, GP practices and their ratings.
- Access: **subscription key via developer portal sign-up**. The new host returned 502 to us; the old host returned 403.
- Licence and attribution: OGL-style (UNVERIFIED).
- Coverage: England.
- Verified: partly (endpoints respond; key needed).
- Use for us: none essential.
- Rule risk: **yes**. Ratings are third-party scores.
- Verdict: **NO**.

### Environment Agency flood-monitoring and hydrology APIs
- URL(s): `https://environment.data.gov.uk/flood-monitoring/id/floods?lat=53.8&long=-1.55&dist=20` · `/flood-monitoring/id/floodAreas?lat=..&long=..&dist=3` · `https://environment.data.gov.uk/hydrology/id/stations`
- What: live flood warnings and alerts, flood warning areas, river and rain gauges.
- Access: REST/JSON. No key.
- Licence and attribution: OGL ("Environment Agency").
- Coverage: England. Live, updated every 15 minutes.
- Verified: yes (floods, floodAreas, hydrology stations).
- Use for us: area pages, "flood warning areas covering this ward" (static, from floodAreas geometry) plus current warnings.
- Rule risk: none.
- Verdict: **USE NOW** (for the static flood areas; live warnings are optional).

### EA bathing water, water quality archive and EDM annual returns
- URL(s):
  - Bathing water API: https://environment.data.gov.uk/bwq/ (docs v0.6)
  - Water Quality Explorer: https://environment.data.gov.uk/water-quality/
  - EDM storm overflow annual returns: https://environment.data.gov.uk/dataset/21e15f12-0df8-4bfc-b763-45226c16a8ac
- What: bathing water classifications; river and sea sampling; **annual spill counts and hours for each storm overflow**.
- Access:
  - Bathing water returned **403 (Azure gateway) to us**.
  - Water quality: the old `/water-quality/id/…` API paths return 404, and the new explorer's API isn't documented anywhere I could find.
  - EDM: dataset page loads (modified Aug 2026; files not listed).
- Licence and attribution: OGL ("© Environment Agency").
- Coverage: England. EDM annual.
- Verified: partly.
- Use for us: EDM annual returns complement the water-company live feed we already use (official annual totals per overflow, which can be mapped to a council). Bathing water classifications could go on coastal area pages.
- Rule risk: classifications ("Poor"/"Excellent") are official regulatory grades of sites, not of candidates, so mild risk only.
- Verdict: **LATER** (EDM annual is worth adding; retry the others from Actions).

### DEFRA UK-AIR (air quality) and AQMAs
- URL(s): https://uk-air.defra.gov.uk/sos-ukair/api/v1/ · https://uk-air.defra.gov.uk/aqma/list
- What: monitoring station readings; Air Quality Management Areas declared by councils.
- Access: the SOS API **timed out, then returned 504**. The AQMA pages load (HTML).
- Licence and attribution: OGL.
- Coverage: UK stations; AQMAs across the UK.
- Verified: partly.
- Use for us: AQMAs for council environment panels. **Better route: planning.data.gov.uk `air-quality-management-area`** (498 entities, England, entry date 2025-01-31).
- Rule risk: none.
- Verdict: **LATER** for UK-AIR. Use the AQMA data via planning.data now.

### planning.data.gov.uk: designations (conservation areas, listed buildings, flood zones, TPOs, AQMAs, green belt)
- URL(s): https://www.planning.data.gov.uk/dataset.json · `https://www.planning.data.gov.uk/entity.json?dataset=conservation-area&longitude=-1.47&latitude=53.75&limit=2`
- What: 222 datasets. Counts include conservation areas 10,667; listed buildings 382,270; flood risk zones 780,636; tree preservation zones 104,788; Article 4 areas 7,512; brownfield land 37,736; plus green belt, SSSIs, scheduled monuments, heritage at risk, parishes, wards and planning applications (100,627).
- Access: REST/JSON and GeoJSON with point and geometry queries, plus bulk. No key.
- Licence and attribution: OGL (per dataset).
- Coverage: England. Council completeness varies.
- Verified: yes (catalogue and a point query returning Rothwell conservation area).
- Use for us: ward and council environment and heritage panels ("3 conservation areas, 412 listed buildings, in a flood zone"). We already use it for local plans; this adds the other datasets.
- Rule risk: none. Label patchy council coverage as "as supplied by council".
- Verdict: **USE NOW**.

### DESNZ local authority emissions, energy use and fuel poverty
- URL(s): https://www.gov.uk/government/collections/uk-local-authority-and-regional-greenhouse-gas-emissions-statistics · sub-national electricity and gas consumption · https://www.gov.uk/government/statistics/sub-regional-fuel-poverty-data-2026-2024-data
- What: territorial CO2 and greenhouse gases by council and sector; domestic gas and electricity use; fuel poverty by council and LSOA.
- Access: XLSX/ODS/CSV. No key.
- Licence and attribution: OGL.
- Coverage: UK for emissions (2005–2024, published 2026-06-30); GB for gas and electricity (2024 report, 2025-12-19); England for fuel poverty (2024 data, published 2026-05-14, LSOA).
- Verified: partly (collections and dates via GOV.UK; files not opened). ELS already carries emissions and fuel poverty at council level.
- Use for us: council environment panel. LSOA fuel poverty for ward pages.
- Rule risk: none.
- Verdict: **USE NOW** via ELS; the direct files come LATER for sector detail and LSOA data.

### EV charging: National Chargepoint Registry and DfT EVCI statistics
- URL(s): https://chargepoints.dft.gov.uk/api/retrieve/registry/… · https://www.gov.uk/government/statistical-data-sets/electric-vehicle-charging-infrastructure-statistics-data-tables-evci
- What: NCR was the device-level registry; EVCI gives public charger counts by council, quarterly.
- Access: **NCR has been decommissioned** (Cenex/Zapmap notices, Nov 2024; the endpoint timed out/504). EVCI is ODS, no key.
- Licence and attribution: OGL.
- Coverage: UK councils. EVCI data to 1 July 2026 (updated 2026-08-27). ELS also has this.
- Verified: partly (EVCI Content API; NCR dead).
- Use for us: council transport panel (via ELS).
- Rule risk: none.
- Verdict: **NO** for NCR; **USE NOW** for EVCI (via ELS).

### DEFRA local authority collected waste (recycling rates)
- URL(s): https://www.gov.uk/government/statistics/local-authority-collected-waste-management-annual-results · `LA_and_Regional_Spreadsheet_2024-25.ods`
- What: household waste per person, recycling rate and residual waste by council (from WasteDataFlow).
- Access: ODS. No key. WasteDataFlow itself is login-only.
- Licence and attribution: OGL.
- Coverage: England 2024/25 (published 2026-03-31). Scotland via SEPA "Household Waste" on data.gov.scot. Wales via StatsWales. NI via DAERA (2023/24 is the latest I saw in GOV.UK search).
- Verified: partly (Content API listing).
- Use for us: council environment panel, "X% of household waste recycled".
- Rule risk: don't rank councils.
- Verdict: **USE NOW**.

### OS OpenData (Downloads API) and OS Names API
- URL(s): `https://api.os.uk/downloads/v1/products` · https://api.os.uk/search/names/v1/find
- What: Open Greenspace (2026-04), Open UPRN (2026-09), Open USRN (2026-09), Boundary-Line (2026-05), Code-Point Open (2026-08), Open Names (2026-07), Open Roads (2026-04), Built-Up Areas.
- Access: the downloads API needs **no key**. The OS Names API needs a **key** (401 without one; free OpenData plan).
- Licence and attribution: OGL ("Contains OS data © Crown copyright and database right").
- Coverage: GB (not NI).
- Verified: yes (product list and versions); the Names API returned 401.
- Use for us: Open Greenspace for "parks and green space in your ward". Boundary-Line has electoral divisions for county councils.
- Rule risk: none.
- Verdict: **USE NOW** (bulk). The Names API is unnecessary, since Open Names is a bulk file.

### DfT road traffic statistics API
- URL(s): https://roadtraffic.dft.gov.uk/api-docs · `https://roadtraffic.dft.gov.uk/api/local-authorities` · `/api/average-annual-daily-flow?filter[local_authority_id]=63`
- What: traffic counts and flows by count point and council, 2000–2025.
- Access: REST/JSON (JSON:API filters). No key.
- Licence and attribution: OGL.
- Coverage: GB. ELS shows vehicle flow 2025.
- Verified: yes.
- Use for us: council transport panel (vehicle miles, busiest roads).
- Rule risk: none.
- Verdict: **LATER** (ELS covers the headline figure).

### STATS19 road casualties (DfT)
- URL(s): https://data.dft.gov.uk/road-accidents-safety-data/dft-road-casualty-statistics-collision-last-5-years.csv
- What: every injury collision with location, severity, council and highway authority.
- Access: bulk CSV (about 98 MB for 5 years). No key.
- Licence and attribution: OGL.
- Coverage: GB, point-level, annual.
- Verified: yes (header fetched).
- Use for us: counts of killed and seriously injured by ward and council, aggregated.
- Rule risk: none. Aggregate only; no maps of individual collisions tied to people.
- Verdict: **USE NOW**.

### Bus Open Data Service (BODS) API
- URL(s): https://data.bus-data.dft.gov.uk/api/v1/dataset/
- What: timetables, fares and live locations from every English bus operator.
- Access: **free API key needed** (401 without one).
- Licence and attribution: OGL.
- Coverage: England.
- Verified: partly (401).
- Use for us: "bus routes serving your ward". A heavy pipeline for a modest gain.
- Rule risk: none.
- Verdict: **LATER**.

### DfT bus statistics tables (BUS01/BUS02 and others)
- URL(s): https://www.gov.uk/government/statistical-data-sets/bus-statistics-data-tables
- What: passenger journeys and service miles by council, plus population near an hourly bus service.
- Access: ODS. No key.
- Licence and attribution: OGL.
- Coverage: England by council (some tables GB). Updated 2026-09-22.
- Verified: partly (listing).
- Use for us: council transport panel. Bus services are a council and combined authority responsibility, so this fits "who decides".
- Rule risk: none.
- Verdict: **USE NOW**.

### NaPTAN API
- URL(s): `https://naptan.api.dft.gov.uk/v1/access-nodes?dataFormat=csv&atcoAreaCodes=450`
- What: every bus stop, rail station and tram stop, with locality.
- Access: CSV/XML. No key.
- Licence and attribution: OGL.
- Coverage: GB. Live register.
- Verified: yes (West Yorkshire CSV, 4.6 MB).
- Use for us: stop counts per ward.
- Rule risk: none.
- Verdict: **LATER**.

### ORR estimates of station usage
- URL(s): https://dataportal.orr.gov.uk/statistics/usage/estimates-of-station-usage/
- What: entries and exits per station per year.
- Access: XLSX/ODS. No key.
- Licence and attribution: OGL.
- Coverage: GB. Apr 2024–Mar 2025 edition, published 4 Dec 2025; next Nov 2026.
- Verified: yes (page fetched).
- Use for us: "stations in your area and how many use them".
- Rule risk: none.
- Verdict: **LATER**.

### DfT road condition statistics (RDC) and local road maintenance ratings
- URL(s): https://www.gov.uk/government/statistical-data-sets/road-condition-statistics-data-tables-rdc · https://maps.dft.gov.uk/local-road-maintenance-ratings-map/
- What: share of roads in the "red" condition band by council (RDC). The ratings map gives each highway authority a DfT Red/Amber/Green rating, launched Jan 2026.
- Access: ODS (RDC). The ratings are on a map, with the underlying file not found.
- Licence and attribution: OGL.
- Coverage: England. RDC updated 2026-01-21.
- Verified: RDC partly (listing). Ratings: from search results only.
- Use for us: RDC percentage over time on council pages.
- Rule risk: **the DfT RAG ratings are government scores of councils**, so NO. RDC road-condition percentages are measured facts, which is fine.
- Verdict: **LATER** for RDC; **NO** for the ratings.

### Police.uk API: neighbourhood teams, priorities, meetings, stop and search
- URL(s): `https://data.police.uk/api/locate-neighbourhood?q=53.75,-1.47` · `/api/west-yorkshire/LDT_S` · `/LDT_S/priorities` · `/LDT_S/events` · `/LDT_S/people` · `/api/stops-street?lat=..&lng=..` · `/api/crimes-street-dates`
- What: the local policing team's contact details, published priorities, **upcoming public meetings** ("contact point" surgeries), officer names and ranks, and stop and search records.
- Access: REST/JSON. No key.
- Licence and attribution: OGL.
- Coverage: England, Wales and NI (Police Scotland isn't included for street crime). Crime data to 2026-07.
- Verified: yes (all endpoints above returned data).
- Use for us: the area page "who makes decisions" chain can add "your neighbourhood policing team, their priorities and next public meeting". This extends the existing crime feature cheaply.
- Rule risk: officer names are public-duty data, but we don't need them. Keep to team and contact details.
- Verdict: **USE NOW**.

### Home Office police and fire statistics
- URL(s): police workforce 31 March 2026 (published 2026-07-22); police recorded crime open data tables, by community safety partnership (2026-07-23); fire statistics data tables (2026-09-02)
- What: officers per force; recorded crime by community safety partnership (roughly council level); fires and incidents by fire authority.
- Access: ODS/CSV. No key.
- Licence and attribution: OGL.
- Coverage: England and Wales (fire: England). Annual or quarterly.
- Verified: partly (Content API listings).
- Use for us: council and PCC pages (police numbers, recorded crime trends at partnership level, fires).
- Rule risk: none.
- Verdict: **LATER**. Police.uk covers the local picture; add these for PCC election pages.

### Scottish and NI crime
- URL(s): data.gov.scot "Recorded Crimes and Offences" (to 2025/26) · NISRA PRC* tables (ward, DEA, council; 2026-06-25)
- What: recorded crime by council (Scotland) and down to ward (NI).
- Access: CKAN / PxStat. No key.
- Licence and attribution: OGL.
- Coverage: Scotland and NI.
- Verified: yes.
- Use for us: crime parity for Scotland (which Police.uk street-level data doesn't cover) and NI.
- Rule risk: none.
- Verdict: **USE NOW**.

### HMRC personal income by council (Survey of Personal Incomes, table 3.14)
- URL(s): https://www.gov.uk/government/collections/personal-incomes-statistics
- What: median and mean income and tax by council and constituency.
- Access: XLSX/ODS. No key.
- Licence and attribution: OGL.
- Coverage: UK. Updated 2026-04-29.
- Verified: partly (collection listing).
- Use for us: area income context next to PolicyEngine results.
- Rule risk: none.
- Verdict: **LATER** (ELS has GDHI and ASHE pay).

### DWP Stat-Xplore API
- URL(s): https://stat-xplore.dwp.gov.uk/webapi/online-help/Open-Data-API.html · https://stat-xplore.dwp.gov.uk/webapi/rest/v1
- What: Universal Credit, PIP, Pension Credit and housing benefit claimants by council, ward and LSOA.
- Access: REST (POST table queries). **Free API key via account** (401 without one). There is a rate-limit endpoint.
- Licence and attribution: OGL.
- Coverage: GB, down to ward and LSOA. Monthly or quarterly.
- Verified: partly (docs read; `/info` returned 401).
- Use for us: area pages, "X households on Universal Credit in this ward", which ties to PolicyEngine benefit effects.
- Rule risk: none.
- Verdict: **LATER** (free, but a one-off signup and more complex queries).

### Ofcom Connected Nations
- URL(s): https://www.ofcom.org.uk/…/connected-nations-2025/data-downloads-2025
- What: broadband and mobile coverage by council and postcode.
- Access: CSV downloads. **Cloudflare returned 403 "Just a moment"** to us.
- Licence and attribution: OGL (UNVERIFIED).
- Coverage: UK.
- Verified: no (blocked). ELS carries gigabit, 4G, 5G and sub-30Mbps figures for Jan 2026.
- Use for us: via ELS.
- Rule risk: none.
- Verdict: **NO** direct; use via ELS.

### Trussell food bank statistics
- URL(s): https://www.trussell.org.uk/news-and-research/latest-stats/end-of-year-stats
- What: emergency food parcels by area (Trussell network only).
- Access: web page and spreadsheets (not API-checked).
- Licence and attribution: Trussell's terms (UNVERIFIED).
- Coverage: UK (network only).
- Verified: partly (page loads).
- Use for us: none.
- Rule risk: **yes**. It's a campaigning charity and covers only its own network.
- Verdict: **NO**.

### GOV.UK Local Links Manager export and local-authority API
- URL(s): `https://local-links-manager.publishing.service.gov.uk/data/links_to_services_provided_by_local_authorities.csv` · `https://www.gov.uk/api/local-authority/dartford` (returns tier and parent council)
- What: for every council, the URL of each service page: household waste and bin collection, bulky waste, council tax, housing benefit, register to vote, libraries, road maintenance reporting, planning and more. That's 45,276 rows across 385 councils (GSS codes and LGSL service codes).
- Access: bulk CSV (7.6 MB, **regenerated daily**; Last-Modified 2026-09-27 03:00 GMT) plus JSON API. No key. There's also a `?postcode=` variant, which we should **not** use (it would send postcodes to GOV.UK).
- Licence and attribution: OGL (GOV.UK).
- Coverage: UK councils (including Scotland, Wales and NI). Maintained by GDS; each link records whether it's "Supported by GOV.UK".
- Verified: yes (CSV downloaded and parsed; API for a unitary and a district council).
- Use for us: **council pages "do it online" links** (check your bin day, pay council tax, report a pothole, register to vote). Tier and parent give the district/county split for "who decides". This answers the bins question without scraping.
- Rule risk: none.
- Verdict: **USE NOW**.

### LG Inform / LG Inform Plus API (LGA, via esd)
- URL(s): https://developertools.esd.org.uk/ · `https://webservices.esd.org.uk/data.json?...`
- What: hundreds of metrics per council, gathered from official sources.
- Access: **key/registration needed** (401 "Not authorized"). The Plus tier is a paid subscription (cost UNVERIFIED).
- Licence and attribution: mixed; it's an aggregator of official data.
- Coverage: England mainly.
- Verified: partly (401).
- Use for us: nothing we can't get from the primary sources above.
- Rule risk: it's an aggregator (the rules prefer primary sources), and it has benchmarking and comparison features.
- Verdict: **NO**.

### Sport England Active Places (leisure facilities)
- URL(s): https://www.activeplacespower.com/opendata · `https://services-eu1.arcgis.com/s9MgJChYyPlPX2Nk/arcgis/rest/services/GIS_Active_Places_Power_Sites/FeatureServer`
- What: every sports facility (pools, sports halls, pitches, gyms) with site ownership, including council-owned.
- Access: ArcGIS REST and bulk. No key.
- Licence and attribution: **CC BY 4.0** ("Sport England Active Places").
- Coverage: England. Modified 2026-07-27.
- Verified: yes (catalogue items and licence text).
- Use for us: council services panel, "council-run leisure centres and pools".
- Rule risk: none.
- Verdict: **LATER** (a good fit for council pages).

### Public libraries (ACE basic dataset / CIPFA)
- URL(s): https://www.artscouncil.org.uk/…/public-libraries/basic-dataset
- What: list of libraries by council.
- Access: **403** to us. CIPFA library statistics are paid.
- Licence and attribution: UNVERIFIED.
- Coverage: England.
- Verified: no.
- Use for us: ELS already has "residents within 30 min walk of a library" (2024) and "visited a library" (2025). Library links come from local-links-manager.
- Rule risk: none.
- Verdict: **NO** for now.

### Bin collection days (open APIs)
- URL(s): data.gov.uk CKAN search "bin collection days" (428 hits)
- What: scattered per-council datasets, often stale or from abolished councils: Barrow 2018, Allerdale (abolished 2023, but updated 2026-07), East Renfrewshire 2017.
- Access: patchy. No national API.
- Licence and attribution: varies.
- Coverage: patchy.
- Verified: yes (search).
- Use for us: none. Link to each council's own bin page via local-links-manager instead.
- Rule risk: none.
- Verdict: **NO**.

### OpenStreetMap: Overpass and Nominatim
- URL(s): https://overpass-api.de/api/interpreter · https://operations.osmfoundation.org/policies/nominatim/
- What: amenities (libraries, GP surgeries, parks) and geocoding.
- Access: Overpass **connection reset** from here. Nominatim policy: at most 1 request per second, no bulk or periodic use, attribution required, must be switchable on request.
- Licence and attribution: ODbL (share-alike).
- Coverage: global.
- Verified: partly (policy read; Overpass blocked).
- Use for us: not needed. The official sources above cover amenities; postcodes.io and NSPL cover geocoding.
- Rule risk: it's crowd-sourced, not official.
- Verdict: **NO**.

### ONS electoral statistics (registered electors)
- URL(s): https://www.ons.gov.uk/peoplepopulationandcommunity/elections/electoralregistration/datasets/electoralstatisticsforuk
- What: registered electors (parliamentary and local government) by council and constituency.
- Access: XLSX. No key.
- Licence and attribution: OGL.
- Coverage: UK. Released 2 April 2026.
- Verified: yes (ONS `/data` JSON).
- Use for us: election pages ("about N registered voters in this council") and area pages.
- Rule risk: none.
- Verdict: **USE NOW**.

### SEPA and NRW (devolved environment)
- URL(s): SEPA KiWIS `https://timeseries.sepa.org.uk/KiWIS/KiWIS?...` · NRW https://api-portal.naturalresources.wales/
- What: river levels and flood data for Scotland and Wales.
- Access: SEPA KiWIS returned **"Credit limit exceeded"** (anonymous quota). The NRW API portal needs a subscription key. SEPA flood warnings endpoint not found.
- Licence and attribution: OGL (UNVERIFIED).
- Coverage: Scotland and Wales.
- Verified: partly.
- Use for us: flood parity outside England.
- Rule risk: none.
- Verdict: **LATER**.

### National Records of Scotland and Scotland's Census 2022
- URL(s): https://www.nrscotland.gov.uk/publications/ · https://www.scotlandscensus.gov.uk/
- What: Scottish population estimates, household estimates and census.
- Access: NRS files; much is also on data.gov.scot. Census API UNVERIFIED.
- Licence and attribution: OGL.
- Coverage: Scotland. The mid-2024 estimates page is marked "(outdated)", so a newer edition is out.
- Verified: partly (pages load).
- Use for us: Scottish ward and council population (ELS covers council level).
- Rule risk: none.
- Verdict: **LATER**.

### Scottish council tax (band D levels) and Welsh council tax
- URL(s): https://www.gov.scot/publications/council-tax-datasets/ (updated 2026-03-31) · StatsWales topic 34 (band D composition, collection, exemptions; 2026-03-24)
- What: council tax by band and council for 2026-27.
- Access: XLSX (Scotland); API/CSV (Wales).
- Licence and attribution: OGL.
- Coverage: Scotland and Wales, 2026-27.
- Verified: yes (page date; StatsWales topic API).
- Use for us: council tax parity. We only have England at the moment.
- Rule risk: none.
- Verdict: **USE NOW**.

### Office for Local Government (Oflog) / Local Authority Data Explorer
- URL(s): https://oflog.data.gov.uk (redirects to GOV.UK)
- What: council performance metrics.
- Access: none. GOV.UK shows the organisation as "no_longer_exists" and links a closure letter.
- Verified: yes.
- Rule risk: it was a council performance comparison tool.
- Verdict: **NO** (closed).

### HMICFRS (PEEL police ratings)
- URL(s): https://hmicfrs.justiceinspectorates.gov.uk/peel-assessments/
- What: graded inspections of forces.
- Access: **403** to us.
- Verified: no.
- Rule risk: **yes** (graded ratings).
- Verdict: **NO**.

---

## Ranked top 10 for our site
1. **ONS Explore Local Statistics API.** One call gives about 50 to 95 official indicators for any UK council. It's the backbone of area and council pages (undocumented, so snapshot the bulk file too).
2. **GOV.UK Local Links Manager export.** Daily CSV of every council's service URLs (bins, council tax, register to vote, potholes), plus tier and parent for "who decides". No scraping.
3. **Nomis API.** Ward-level Census 2021, claimant count, ASHE pay and business counts through one free API.
4. **Devolved trio: StatsWales API, NISRA Data Portal, data.gov.scot CKAN.** All keyless. They give Wales, NI and Scotland the same treatment as England (WIMD 2025, NI DEA-level data, Scottish council tax bands and crime).
5. **planning.data.gov.uk designations.** Conservation areas, listed buildings, flood zones, AQMAs and TPOs by point or area; an easy extension of a source we already use.
6. **Police.uk neighbourhood endpoints.** Local team contacts, stated priorities and upcoming public meetings, which fits "who makes decisions where you live".
7. **ONS Open Geography: CHD/RGC and the Parish to Ward to council lookup (May 2026).** An authoritative council register with change history, and the parish link in the chain.
8. **MHCLG housing live tables (H-CLIC homelessness, waiting lists, net additions, affordable homes) plus revenue outturn.** The core "housing" and "where the money goes" council panels.
9. **VOA Council Tax stock of properties 2026, with council-level UK HPI and ONS PIPR rents.** "Your area's homes, bands, prices and rents" (the HPI part is a better use of a source we already have).
10. **DfE EES API**, joined by **Fingertips** (values only, no RAG colours). Council education and health panels, also available by constituency (EES) and by best-fit ward (Fingertips).

Worth adding soon after: EA flood areas, DEFRA recycling rates, DfT bus tables, STATS19, ONS electoral statistics, the NHS ODS GP practice CSV, Scottish and Welsh council tax.

## Checked and dismissed
- **statistics.gov.scot (SPARQL):** being replaced by data.gov.scot, and gave an empty reply through our proxy.
- **StatsWales old OData API:** retired (502); use api.stats.gov.wales.
- **NINIS (NI Neighbourhood Information Service):** unreachable; superseded by the NISRA Data Portal.
- **ONS "Subnational indicators explorer" (old):** superseded by ELS.
- **ONS API non-census datasets:** many frozen (2020–2024).
- **NIMDM:** still the 2017 edition. Use only with a clear date label.
- **National Chargepoint Registry:** decommissioned Nov 2024.
- **NHS ODS FHIR STU3:** retired. The ORD API is being retired around Sept 2027, so use the bulk CSVs.
- **NHS Service Search API:** key needed, and the listings carry ratings. Deferred.
- **CQC API:** key needed, and publishes ratings (rule risk).
- **Ofsted grades:** rule risk.
- **Compare school performance:** blocked (403), and invites league tables.
- **HMICFRS PEEL:** graded ratings (rule risk) and blocked.
- **DfT local road maintenance RAG ratings:** government scores of councils (rule risk).
- **Oflog / Local Authority Data Explorer:** closed.
- **LG Inform Plus:** keyed or paid aggregator with benchmarking.
- **Trussell food bank data:** campaigning charity, covers its own network only.
- **Ofcom Connected Nations direct:** Cloudflare-blocked; the same data is in ELS.
- **Public libraries basic dataset (ACE) and CIPFA:** blocked or paid.
- **Bin collection day datasets:** fragmented and stale.
- **OS Names API:** key needed; the Open Names bulk file does the job.
- **Overpass and Nominatim:** crowd-sourced, and Nominatim's usage policy forbids bulk or periodic use.
- **EPC API (address-level):** key needed plus address-data restrictions; use the aggregate live tables instead.
- **LHA rates:** by BRMA, not council; only useful as a PolicyEngine input.
- **UK-AIR SOS API:** timed out (504).
- **EA bathing water and water quality APIs:** 403 or undocumented here. Retry later.
- **opendata.nhs.scot:** blocked here. Retry from GitHub Actions.
- **OpenDataNI CKAN:** 403 here. Retry later.
- **My Local School (Wales):** no connection.
- **SEPA KiWIS:** anonymous quota exceeded. NRW API needs a key.

A few blocks rest on WebFetch or web-search results only, and are marked partly or UNVERIFIED above: the NHS RTT/A&E latest month and GP registration dates, the SIMD update plans, and the DfT road ratings. Recheck those before relying on them.
