# 9. What sits underneath Local Intelligence Hub and the UK Constituency Dashboards

**Date:** 24 September 2026
**Question:** Peter Keeling (Democracy Club) pointed Romily at localintelligencehub.com and dashboard.constituencies.org.uk. Rather than take either site at face value, which impartial sources do they draw on that we could use directly?

**Summary**
1. Neither site is a source. Both are aggregators that sit on top of published datasets, and both name their sources. The Constituency Dashboards (Open Innovations) draw almost entirely on official statistics; the Local Intelligence Hub (The Climate Coalition with mySociety and Green Alliance) mixes official statistics with polling commissioned by campaign groups and with data about the climate movement itself.
2. Between them they name roughly 60 official or non-partisan datasets we do not yet use, nearly all under the Open Government Licence or the Open Parliament Licence. The strongest gaps they expose in our own data are crime (we hold nothing by area), income and wages, GP access, school attainment and funding, and fuel poverty.
3. Everything is by parliamentary constituency. That fits our by-election and general-election pages; it does not fit council wards, where most of our ballots are.

All pages were opened on 24 September 2026 unless stated. Where a licence is quoted it was read on the publisher's own page, not taken from the aggregator.

---

## Part A: What the two sites are

### UK Constituency Dashboards (dashboard.constituencies.org.uk) and the Hex Maps behind it

- Built and maintained by Stuart Lowe at Open Innovations (Leeds). "The site was originally built as a mission-led project at Open Innovations in advance of the 2024 General Election." [hex.constituencies.org.uk/about](https://hex.constituencies.org.uk/about/)
- The dashboard is generated from the API behind their hex-map site: "We use data from the API behind our UK Constituency Data Hex Maps site. That makes it possible to automatically generate a dashboard for every current UK constituency across all themes and datasets." [dashboard.constituencies.org.uk](https://dashboard.constituencies.org.uk/)
- Licence: "Visualisations © CC BY 4.0 Stuart Lowe 2026 / Open Innovations 2022-26. The source data for each visualisation will have its own credit/licensing." [hex.constituencies.org.uk/about](https://hex.constituencies.org.uk/about/)
- The API index (`https://hex.constituencies.org.uk/themes/index.json`, read 24 Sep) lists 139 visualisations in six themes (economy, energy, environment, health, society, transport), each with a dated source attribution. Its own note: "This is an experimental API … The format is not finalised yet and is likely to change. Be very careful about relying on it for now." (API version 0.3.) So: use the list to find sources; do not build on the API.
- Geography: 2024 parliamentary constituencies (with a 2010–24 layout for older data). Postcode lookup on the dashboard is by Find that Postcode (Kane Data Limited).
- No political affiliation found. Open Innovations is a Leeds-based open-data organisation; the dashboard states no campaign purpose. Six of the 139 datasets come from Friends of the Earth and one from EveryDoctor (see Part C).

### Local Intelligence Hub (localintelligencehub.com)

- Described on its home page as "Your starting point for data about local MPs, constituencies, public opinion and the climate and nature movement." A collaboration of The Climate Coalition, mySociety and Green Alliance; The Climate Coalition (registered charity 1109973) is the operating entity. [localintelligencehub.com](https://www.localintelligencehub.com/)
- Its own code repository describes it as "a collaborative online tool designed for public affairs and community organizing teams". [github.com/mysociety/local-intelligence-hub](https://github.com/mysociety/local-intelligence-hub)
- Terms of use: users must "attribute data sources when using them", use the tool "in the spirit of collaboration and to further our collective mission, rather than for singular gain or competition", and "respect the privacy and intellectual property rights of others". No explicit statement about downloading or programmatic reuse. [localintelligencehub.com/terms](https://www.localintelligencehub.com/terms/)
- Its sources page lists 156 datasets in four groups: MP (36), public opinion (31), place (48), and movement (41). No dataset on that page states a licence. [localintelligencehub.com/sources](https://www.localintelligencehub.com/sources/)
- This is a campaigning tool, built by and for the climate and nature movement. That is not a criticism; it is what it says it is. It means three things for us: its selection of datasets reflects that purpose; its "MP stance" fields are TheyWorkForYou's editorial groupings (see paper 08); and its public-opinion layer is polling commissioned by campaign groups. The official datasets underneath are a different matter and are listed below.

---

## Part B: Impartial sources the two sites draw on, by our nine topics

"Already used" means whatsittome.org holds it today (see scripts/loaders/README.md and the changelog). Licences are as read on the publisher's page on 24 Sep 2026; "not checked" means the aggregator names the publisher but I did not open the licence page.

### Money and cost of living
| Dataset | Publisher | Licence | Geography | Used by | Notes |
|---|---|---|---|---|---|
| Income and tax by parliamentary constituency (Table 3.15a) | HMRC, accredited official statistics | "All content is available under the Open Government Licence v3.0, except where otherwise stated" | Constituency | Dashboard | Latest 2023–24 tax year, released 29 Apr 2026; median income and tax paid. [gov.uk](https://www.gov.uk/government/statistics/income-and-tax-by-parliamentary-constituency-confidence-intervals) |
| Annual Survey of Hours and Earnings (median wages) | ONS via Nomis | not checked | Constituency | Dashboard | We already use Nomis for the claimant count, so the access route exists. |
| Claimant count | ONS via Nomis | OGL (already loaded) | Constituency and ward | Both | **Already used.** |
| Sub-regional fuel poverty (2023 data, published 2025) | DESNZ | not checked | Constituency | Dashboard | Official series; the Hub instead uses an End Fuel Poverty Coalition estimate. |
| Children affected by the two-child limit | Joseph Rowntree Foundation | not checked | Constituency | Dashboard | JRF is a research charity, not a campaign; still label as third-party analysis. |
| Local child poverty statistics | End Child Poverty coalition (from DWP/HMRC) | not checked | Constituency | Both | Coalition estimate built on official data; label as third-party analysis. |

### Housing
| Dataset | Publisher | Licence | Geography | Used by | Notes |
|---|---|---|---|---|---|
| House price statistics for parliamentary constituencies | ONS | "All content is available under the Open Government Licence v3.0, except where otherwise stated" | Constituency (England and Wales) | Dashboard | Sales count and median price paid by type, quarterly rolling year; latest 17 Sep 2026. We use HM Land Registry HPI by local authority; this is finer for constituencies. [ONS](https://www.ons.gov.uk/peoplepopulationandcommunity/housing/datasets/parliamentaryconstituencyhousepricestatisticsforsmallareas) |
| Price Paid Data | HM Land Registry | not checked | Address level | Dashboard | |
| Housing tenure (Census 2021) | ONS / NISRA via House of Commons Library | Open Parliament Licence ("Re-use our content freely and flexibly with only a few conditions") | Constituency | Hub | [Commons Library](https://commonslibrary.parliament.uk/constituency-boundary-review-data-for-new-constituencies/) |
| Green belt by constituency | House of Commons Library | Open Parliament Licence | Constituency | Dashboard | We draw green belt as a map layer already (planning.data.gov.uk); this gives the share of the constituency. |
| Households off the gas grid | DESNZ | not checked | Constituency (GB) | Dashboard | |
| Index of Multiple Deprivation | MHCLG (England 2025) / composite UK index (mySociety) | OGL (England, already loaded); composite not checked | LSOA / constituency | Both | **Already used** for England. The mySociety composite is a derived UK-wide index: useful for Scotland, Wales and NI, but it is a construction, not an official statistic. |

### Health and social care
| Dataset | Publisher | Licence | Geography | Used by | Notes |
|---|---|---|---|---|---|
| GP appointment measures (nine indicators: within 2 days, within 14 days, online booking, satisfaction) | OHID Fingertips, DHSC | "All content is available under the Open Government Licence, except where otherwise stated" | Practice / area | Dashboard | Has an API. [Fingertips](https://fingertips.phe.org.uk/) |
| GP practices and branches; dental practices; optical sites | NHS England Organisation Data Service | no licence stated on the download page | Address level | Dashboard | Nightly-updated CSVs. Good for "what is near this postcode"; licence must be confirmed before use. [NHS ODS](https://digital.nhs.uk/services/organisation-data-service/data-search-and-export/csv-downloads/gp-and-gp-practice-related-data) |
| Life expectancy at birth by constituency, 2022 | ONS | not checked | Constituency | Dashboard | |
| Working-age population receiving health-related social security | (embedded Flourish chart; publisher not identified) | not checked | Constituency | Dashboard | Source unclear; do not use without tracing it. |
| General health, disability (Census 2021) | ONS / Commons Library | OGL / Open Parliament Licence | Constituency | Both | |

### Education
| Dataset | Publisher | Licence | Geography | Used by | Notes |
|---|---|---|---|---|---|
| Educational attainment (KS2, KS4 Attainment 8, GCSE English and maths) | House of Commons Library | Open Parliament Licence | Constituency | Dashboard | [Commons Library](https://commonslibrary.parliament.uk/constituency-data-educational-attainment/) |
| School funding allocations per pupil | House of Commons Library | Open Parliament Licence | Constituency | Dashboard | |
| Ofsted inspection outcomes by constituency (schools, early years, FE, children's social care) | Ofsted via gov.uk | not checked | Constituency | Dashboard | We link individual schools to Ofsted already; this gives the constituency picture. |
| Pupil to teacher ratios | DfE, explore-education-statistics | not checked | School / area | Dashboard | |
| Higher education entry rates for 18-year-olds | UCAS | not checked | Constituency | Dashboard | UCAS is a charity; its terms need reading. |

### Environment and energy
| Dataset | Publisher | Licence | Geography | Used by | Notes |
|---|---|---|---|---|---|
| Storm overflows: Event Duration Monitoring annual returns | Environment Agency | not checked (page would not load) | Outfall level, England | Dashboard | We show live discharges from water-company feeds; this is the audited annual count and duration. |
| Air pollution modelling data | Defra UK-AIR | not checked | Grid, England | Hub | We show Air Quality Management Areas; this is modelled concentrations. |
| Domestic solar PV deployment | DESNZ | not checked | Constituency | Dashboard | |
| EV charging devices | DfT | not checked | Constituency | Dashboard | |
| Access to green space | Natural England via gov.uk | not checked | Constituency, England | Dashboard | |
| Ancient woodland; CRoW Act open access land | planning.data.gov.uk; Natural England | OGL | Polygon | Dashboard | **Ancient woodland already used** as a map layer. |
| Council emissions profile | DESNZ (formerly BEIS) via mySociety | not checked | Local authority | Hub | |
| Climate projections by constituency | UCL | not checked | Constituency | Dashboard | Academic; check terms. |

### Immigration and borders
| Dataset | Publisher | Licence | Geography | Used by | Notes |
|---|---|---|---|---|---|
| Country of birth (Census 2021) | ONS / Commons Library | Open Parliament Licence | Constituency | Dashboard | The only area-level fact either site holds on this topic. |
| Main language; ethnicity (Census 2021) | ONS / Commons Library | OGL / Open Parliament Licence | Constituency | Both | |

### Crime, policing and justice
| Dataset | Publisher | Licence | Geography | Used by | Notes |
|---|---|---|---|---|---|
| Street-level crime and anti-social behaviour, 14 categories | data.police.uk (Single Online Home National Digital Team) | "Open Government Licence v3.0" | Point / neighbourhood; England, Wales and NI; Aug 2023 – Jul 2026 | Dashboard | JSON API, which suits our postcode-first design. **We hold nothing on this topic today.** [data.police.uk/about](https://data.police.uk/about/) |
| Gambling premises register | Gambling Commission | not checked | Address level, GB | Dashboard | |

### Defence, foreign affairs and the EU
| Dataset | Publisher | Licence | Geography | Used by | Notes |
|---|---|---|---|---|---|
| EU referendum vote by constituency (estimates) | Commons Library (2017 estimates); Hanretty estimates on 2024 boundaries (Google Sheets) | Open Parliament Licence / academic, not checked | Constituency | Both | Estimates, not counts: say so if used. |

### Equality and rights
| Dataset | Publisher | Licence | Geography | Used by | Notes |
|---|---|---|---|---|---|
| Sexual orientation (Census 2021, TS077); disability under the Equality Act; socio-economic status | ONS / Commons Library | OGL / Open Parliament Licence | Constituency | Both | Census, so England and Wales only for some tables. |

### Democracy and the MP (cuts across topics)
| Dataset | Publisher | Licence | Geography | Used by | Notes |
|---|---|---|---|---|---|
| Register of Members' Financial Interests | UK Parliament | Open Parliament Licence | MP | Both | **Already used** via the Interests API. |
| MP staffing and business costs | IPSA | not checked | MP | Dashboard | |
| Select committee and APPG memberships; written questions; positions held | UK Parliament Members API | Open Parliament Licence | MP | Hub | Facts, not judgements; suitable for the "Record in office" section. |
| Candidate spending, 2024 general election | Electoral Commission | public register | Constituency | Dashboard | We use the EC donations register already. |
| Electorate by constituency | Boundary Commission for England | not checked | Constituency | Dashboard | |
| Council control | Open Council Data | public domain (already loaded) | Council | Hub | **Already used.** |
| Petitions by constituency | UK Government and Parliament Petitions | not checked | Constituency | Hub | Counts of signatures by constituency for any petition: a measurable "what people here signed" fact. |

### Not in our nine topics but factual and by area
Broadband speeds (Ofcom Connected Nations); bus stops and stations (DfT NaPTAN); rail cancellations (ORR); road collisions (DfT); walking and cycling rates (DfT); post offices; supermarkets, pubs, playgrounds (OpenStreetMap, ODbL, not checked); heritage at risk (Historic England); memorial benches and plaques (OpenBenches, OpenPlaques). Transport came up in Romily's round-five topic list ("Transport · Democracy…") and is the most obvious tenth topic these sources would support.

---

## Part C: Sources on the two sites that are campaign-derived, opinion, or judgement

These are not wrong; they are a different kind of thing from a statistic, and our rules say they must be labelled as such or left out.

- **Polling commissioned by campaign groups (Hub, 28 of the 31 "public opinion" datasets; the other three are Parliament's election results and the Commons Library Brexit estimates):** Survation for RenewableUK and for 38Degrees; Public First for Onward; Focaldata for HOPE not hate and for Persuasion UK; More in Common's MRP predictions. Each is a poll paid for by an organisation with a position. A predicted vote share is also close to a ranking and sits badly with our no-prediction rule (we already refuse seat predictions in the seat-context sentence).
- **TheyWorkForYou "stances" (Hub, 10 datasets):** mySociety's editorial grouping of votes, as set out in paper 08. We show the votes themselves with Hansard justification instead.
- **Selected votes and Early Day Motions presented as "support for" a cause (Hub, 6 datasets):** the underlying division and EDM data is from Parliament and impartial; choosing which vote or EDM counts as "support for zero carbon homes" is the Hub's judgement.
- **Membership lists compiled by others (Hub):** Conservative Environment Network caucus; DeSmog's list of Net Zero Scrutiny Group supporters. DeSmog is a campaigning publication.
- **Friends of the Earth derived datasets (both sites, 5 on the Dashboard, 7 on the Hub):** "environmental threats", tree canopy, neighbourhoods with polluted air, bus service decline, green space per person, flood risk. Built from official data (Defra, Environment Agency, Natural England) but processed and framed by FoE. Where the official source is named, go to it directly.
- **Climate Emergency UK council scorecards; mySociety climate plan and net-zero target trackers (Hub):** assessments of councils. Useful context; they are scores, so they cannot appear as a fact about a candidate.
- **EveryDoctor "private-healthcare-related donations to MPs" (Dashboard):** a campaign group's reading of the Register of Interests. We hold the register itself.
- **"MPs: Left vs Right" (Dashboard):** an academic pairwise-comparison scale (Hanretty). A score by construction; rules out.
- **Movement datasets (Hub, 41):** members, supporters, groups and events of Friends of the Earth, WWF, RSPB, CAFOD, Christian Aid, National Trust, WI and others. Internal organising data; not relevant to us.

---

## What this means for the site

1. **Treat both sites as reading lists, not sources.** Cite the publisher of each dataset, never the aggregator. The Dashboard's API is explicitly experimental; the Hub's terms ask for attribution and collaborative use and say nothing about programmatic reuse.
2. **The Dashboard's list is the more useful one for us**: 139 datasets, all by 2024 constituency, around 100 of them from government departments, Parliament, the ONS or NHS bodies, with the publisher's page linked for each. Reading its `themes/index.json` once a quarter is a cheap way to notice new constituency-level releases.
3. **Five gaps stand out**, each fillable from an OGL or Open Parliament Licence source: crime (data.police.uk API; our crime topic has no area facts at all), income and wages (HMRC 3.15a, ASHE), GP access (Fingertips), school attainment and funding (Commons Library), fuel poverty (DESNZ). Each would sit in the area panel as a fact about the ground, next to deprivation and claimant count, and would let "What's at stake" cards say what the local figure is before showing what candidates have published.
4. **Constituency is the unit.** Every one of these datasets is by constituency, so they fit parliamentary ballots. For the 30 council wards we cover, only the LSOA-level sources (deprivation, and police.uk points) can be cut to a ward. Adding constituency figures to a ward page would be showing the wrong area.
5. **Devolved coverage is uneven.** Census tables are England and Wales (some UK); Fingertips, Ofsted, school funding and fuel poverty are England only; police.uk excludes Scotland. Paper 05's point stands: say which nation a figure covers.
6. **Judgements this paper leaves to Romily and Barny:** whether area statistics belong on the site at all beyond the current handful (a fact about the area is not a fact about a candidate, and the more of them we show the more the site resembles a dashboard); which of the five gaps to fill first; whether transport becomes a tenth topic; and whether any campaign-commissioned polling could ever be shown, labelled, or is out on principle.

---

## Could not verify
- **Licences marked "not checked"** above: the aggregator names the publisher, and the publisher is a government body or Parliament in most cases, but I did not open the licence wording. Do this before loading any of them.
- **Environment Agency EDM dataset page** (environment.data.gov.uk) returned no readable content; licence and format unconfirmed.
- **NHS ODS downloads:** no licence stated on the page; ODS data is widely reused under OGL but that needs confirming with NHS England's terms.
- **data.police.uk API endpoints:** the About page confirms a JSON API; I did not test the location-based endpoint against a postcode.
- **The Dashboard's "health-related social security" dataset:** sourced to an embedded chart with no publisher named.
- **Local Intelligence Hub repository licence:** LICENSE.txt exists in the repository; its terms were not read.
- **Dataset counts:** 156 for the Hub and 139 for the Dashboard are counts of the entries on each site's own list as read on 24 Sep 2026; the Dashboard's two "school allocations per pupil" entries appear to be duplicates.
- **Whether either site has any party link:** none was found on the pages read. The Hub's partners are campaigning charities and think tanks; the Dashboard's author states no affiliation. Absence of evidence only.

## Addendum (24 Sep, later): can the five priority sources be cut to wards as well as constituencies?

Checked against the publishers' own files, not the aggregators. A national dataset covers every constituency at once, so "constituency-level for all elections" is one load, not 650.

| Source | Constituency | Ward or finer | How |
|---|---|---|---|
| Crime (data.police.uk) | yes, by aggregation | **yes** | Point-level: `crimes-street/all-crime?lat=&lng=&date=` returned 2,707 crimes within a mile of a Holborn point for June 2026, in 14 categories. Any polygon (ward or constituency) can be cut from points; the API also takes a custom polygon. |
| Fuel poverty (DESNZ, 2023 data published 30 Apr 2025, OGL) | **yes**, Table 3 "Fuel Poverty by Parliamentary Constituency" | **yes**, Table 4 "Fuel Poverty by Lower layer Super Output Area (LSOA)" | One workbook (`Sub-regional_fuel_poverty_statistics_2023.xlsx`); LSOAs roll up to wards with the ONS lookup we already use for deprivation. England only. |
| GP access (OHID Fingertips, OGL) | by aggregation | **partly** | Area types include "General Practice" (id 7) and "Electoral Best Fit Wards (2024)" (id 8). The GP-appointment indicators are practice-level; showing "practices serving this ward" is the honest cut. Which indicators exist at ward level needs checking per indicator. |
| Income and wages (HMRC 3.15a; ASHE via Nomis) | **yes** | **no** | HMRC publishes by constituency (and by local authority); ASHE is a sample survey and is not published below local authority. For a ward page the local-authority figure is the finest honest number. |
| School results and funding (Commons Library, Open Parliament Licence) | **yes** | **yes, with work** | The Commons Library aggregates DfE per-school data. DfE publishes per school with postcodes (explore-education-statistics; Ofsted per school, already linked), so a ward can be built from the schools inside it. |

So: crime and fuel poverty come ready for both; schools can be built for both; GP access is practice-level and should be shown as such; income stops at constituency and local authority. For a ward page, show the finest level that is real and label it ("for Camden as a whole", "for Holborn and St Pancras constituency"), never a figure for an area the voter is not in.
