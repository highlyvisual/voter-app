# Promises against records: a method that adds no verdict

**Date:** 24 September 2026
**Question:** Can we set a mechanical rule for pairing a manifesto pledge with a Commons vote, without saying whether the pledge was "kept"? How often does it work, and how do others do it?

**Summary**
1. A strict rule works: a pledge is paired with a vote only where Parliament's own wording for that vote names the same measure as the pledge, and that measure is the whole point of the vote. No verdict is needed.
2. We tested it on 50 pledges from the 2024 manifestos (10 per party, chosen the same mechanical way). Result: 5 clean pairs, 7 ambiguous, 38 never put to a vote that names the measure. Each clean pair came from a vote the pledging party set up: its own bill, amendment or motion, or (in one case) a Lords amendment it called "our amendment".
3. Full Fact, PolitiFact and the Polimeter all give verdicts (e.g. "Achieved", "Promise Broken"). TheyWorkForYou gives summaries of how MPs voted. All of them say that judgement comes into it. Complaints of bias (Full Fact, PolitiFact) or misrepresentation (TheyWorkForYou) have been made. None of the complaints we found were about a mechanical rule like this one.

---

## Part (a): The rule

### Step 1: Pick the pledges (the same method for every party)
- Start at page 1 of the manifesto (leader's foreword and summary pages count). Read in page order. On two-column pages, read down the left column, then the right.
- Take each sentence where the party commits to doing (or not doing) something. It must also name at least one of these:
  - **L**: a law, a bill, or a specific change to the law (a new right, duty, ban or requirement).
  - **T**: a tax, benefit, allowance or levy, and which way it will move.
  - **N**: a number, amount, percentage, date or time limit.
  - **B**: a new body, scheme, programme, review or post, named with its own title, that will be set up or abolished.
- Take one pledge per sentence: the first part that qualifies. A "paid for by…" clause in the same sentence is not taken. It counts as a separate measure.
- Skip estimates, claims about the party's record, pull-quotes and repeats. Stop at ten.

### Step 2: Pair a pledge with a vote only if all four tests pass
1. **Same measure.** The question MPs voted on names the same measure as the pledge. "The question" means Parliament's own words: the bill title, the clause or amendment text with its explanatory statement, or the motion text. That means the same tax going the same way, the same named body, the same legal change or the same number. We must be able to match words without adding meaning of our own.
   - *1a.* If the vote is more specific than the pledge (for example, it sets an income threshold the pledge did not), it passes only if **the pledging party tabled it itself**. The party has then defined its own pledge.
2. **Whole question.** The measure is the whole of the question, or clearly its main point. For example: second or third reading of a bill whose title is that measure; an amendment, new clause or Lords amendment whose only effect is that measure; a ten-minute-rule motion to bring in a bill on that measure; an opposition motion whose only demand is that measure.
3. **A real decision on the measure.** It must be a recorded Commons division. Procedural votes are left out: programme, money, allocation-of-time, closure and "sit in private" motions. Reasoned amendments are shown only as context and never as a pair, because they give reasons for refusing a bill, not a measure.
4. **Label, don't grade.** Show the date, Parliament's title for the vote, the question in Parliament's words, and a plain-English stage label (e.g. "vote on whether a bill could be introduced"; "vote to remove a change made by the Lords"). Then show how MPs voted. Never write "kept/broken" or "voted against their pledge".

**Result for each pledge:** *clean pair* / *ambiguous (type)* / *no vote*.

### Where human judgement is still needed (it does not go away)
- **Choosing pledges.** We still decide whether a sentence is "concrete". In this test we left out, for example: Labour's "tough spending rules" (the rules are named only later, on p.19); the Liberal Democrats' "reform business rates" and "reverse … cuts to the Army"; the Greens' "guaranteed access to an NHS dentist"; and Reform's "migrants in small boats will be picked up and taken back to France". Two people should code pledges separately, then compare.
- **Matching words.** Is an "emergency home insulation programme" the same as an "emergency Home Energy Upgrade programme"? This is a judgement about synonyms.
- **Defensive pledges.** A pledge like "resist any attempts to weaken [the Human Rights Act]" names no measure. To pair it we must decide which votes count as "weakening". That is a judgement.
- **"Main purpose" of a bundle.** Is a new clause with three duties "about" the one that matches?
- **Scope disputes.** Does "will not increase National Insurance" cover employers? (See below.)
- **Double negatives.** On a "motion to disagree with Lords amendment X", **Aye means remove X**. This is a labelling risk, not a judgement, but it is easy to get wrong.

---

## Part (b): The 50-pledge test

**Sources for pledges (all party documents):** [Labour, *Change*, June 2024](https://labour.org.uk/wp-content/uploads/2024/06/Labour-Party-manifesto-2024.pdf) · [Conservative, *Manifesto 2024*, June 2024](https://public.conservatives.com/static/documents/GE2024/Conservative-Manifesto-GE2024.pdf) · [Liberal Democrats, *For a Fair Deal*, June 2024](https://www.libdems.org.uk/fileadmin/groups/2_Federal_Party/Documents/PolicyPapers/Manifesto_2024/For_a_Fair_Deal_-_Liberal_Democrat_Manifesto_2024.pdf) · [Green Party, *Real Hope. Real Change.* (long version), June 2024](https://greenparty.org.uk/app/uploads/2024/06/Green-Party-2024-General-Election-Manifesto-Long-version-with-cover.pdf) · [Reform UK, *Our Contract with You*, June 2024](https://assets.nationbuilder.com/reformuk/pages/253/attachments/original/1718625371/Reform_UK_Our_Contract_with_You.pdf). The page numbers are the ones printed in each document. Labour's "first steps" headings are images in the PDF, so we read them from the page image.

**Sources for votes.** We downloaded all 590 Commons divisions from 4 July 2024 to 11 September 2026 from the [Commons Votes API](https://commonsvotes-api.parliament.uk/data/divisions.json/search?queryParameters.startDate=2024-07-04&queryParameters.take=25) (retrieved 24 Sep 2026). Division titles do not say what an amendment does. So we read the amendment text and sponsors from the [Parliament Bills API](https://bills-api.parliament.uk/api/v1/Bills/3929/Stages), and motion texts from the [Hansard API](https://hansard-api.parliament.uk/search/contributions/Spoken.json?queryParameters.searchTerm=%22beg%20to%20move%22&queryParameters.startDate=2025-05-21&queryParameters.endDate=2025-05-21&queryParameters.house=Commons). Division links below go to votes.parliament.uk.

### Headline counts

| Party | Clean pair | Ambiguous | No vote |
|---|---|---|---|
| Labour | 1 | 2 | 7 |
| Conservative | 1 | 1 | 8 |
| Liberal Democrat | 2 | 3 | 5 |
| Green | 0 | 0 | 10 |
| Reform UK | 1 | 1 | 8 |
| **Total (50)** | **5** | **7** | **38** |

### Labour

| # | Pledge (verbatim, party document) | Source | Division(s) found | Result |
|---|---|---|---|---|
| L1 | "Cut NHS waiting times with 40,000 more appointments each week, during evenings and weekends, paid for by cracking down on tax avoidance and non-dom loopholes." | Labour manifesto p.10 | None names the 40,000 target. | No vote (output target) |
| L2 | "Launch a new Border Security Command with hundreds of new specialist investigators and use counter-terror powers to smash the criminal boat gangs." | p.10 | Border Security, Asylum and Immigration Bill: Second Reading, 10 Feb 2025, 333–109 ([1924](https://votes.parliament.uk/votes/commons/division/1924)); Third Reading, 12 May 2025, 316–95 ([2021](https://votes.parliament.uk/votes/commons/division/2021)). The Act's Part 1 creates the Border Security Commander. The same Act also repeals the Safety of Rwanda Act and parts of the Illegal Migration Act ([legislation.gov.uk, 2025 c.31](https://www.legislation.gov.uk/ukpga/2025/31/contents)). | Ambiguous (bundled bill) |
| L3 | "Set up Great British Energy a publicly-owned clean power company, to cut bills for good and boost energy security, paid for by a windfall tax on oil and gas giants." | p.10 | Great British Energy Bill: Second Reading, 5 Sep 2024, 348–95 ([1839](https://votes.parliament.uk/votes/commons/division/1839)); Third Reading, 29 Oct 2024, 361–111 ([1853](https://votes.parliament.uk/votes/commons/division/1853)). | **Clean pair** |
| L4 | "Recruit 6,500 new teachers in key subjects … paid for by ending tax breaks for private schools." | p.10 | None on the 6,500. The funding clause has its own votes: Budget Resolution 34, VAT on private school fees, 6 Nov 2024, 383–184 ([1860](https://votes.parliament.uk/votes/commons/division/1860)); Finance Bill Clause 47 stand part, 11 Dec 2024, 338–170 ([1890](https://votes.parliament.uk/votes/commons/division/1890)). Clause 47 removes the VAT exemption ([Bills API, Amendment 67 explanatory statement](https://bills-api.parliament.uk/api/v1/Bills/3873/Stages)). Amendment 67 (Conservative), to leave out Clause 47, was also voted on at report stage, 3 Mar 2025, 167–347 ([1937](https://votes.parliament.uk/votes/commons/division/1937)). | No vote (the teacher target itself) |
| L5 | "Kickstart economic growth to secure the highest sustained growth in the G7 …" | p.13 | None. | No vote (outcome target) |
| L6 | "… cheaper, zero-carbon electricity by 2030, accelerating to net zero." | p.13 | None names it. (Related vote: Draft Carbon Budget Order 2026, 24 Jun 2026, 332–94, [2392](https://votes.parliament.uk/votes/commons/division/2392).) | No vote (outcome target) |
| L7 | "Take back our streets by halving serious violent crime …" | p.13 | None. | No vote (outcome target) |
| L8 | "Labour will conduct a Strategic Defence Review within our first year in government …" | p.15 | None (done by the executive). | No vote (executive action) |
| L9 | "Labour will bring in 'Martyn's Law' to strengthen the security of public events and venues." | p.15 | The Commons Votes data shows no division on second or third reading. Hansard (via the Hansard API) records both as "Question put and agreed to" (14 Oct 2024 and 9 Dec 2024). The only Commons division was a Conservative new clause asking for a review of the regulator, 9 Dec 2024, 89–340 ([1884](https://votes.parliament.uk/votes/commons/division/1884); [Bills API](https://bills-api.parliament.uk/api/v1/Bills/3765/Stages)). | No vote (bill passed without a recorded division on it) |
| L10 | "This will be funded by ending the wasteful Migration and Economic Development partnership with Rwanda." | p.17 | No vote names the partnership. The Starmer government said on 6 Jul 2024 it would not go ahead with the scheme. The UK gave Rwanda written notice on 16 Dec 2025, and the treaty's termination took effect on 16 Mar 2026 ([Full Fact Government Tracker, updated 18 Jun 2026](https://fullfact.org/government-tracker/ending-rwanda-agreement/)). The linked Safety of Rwanda Act was repealed by s.40 of the bundled Act above (votes 1924/2021). | Ambiguous (related instrument, in a bundled bill; mainly executive action) |

### Conservative (121 MPs elected; [Commons Library, CBP-10009](https://commonslibrary.parliament.uk/research-briefings/cbp-10009/))

| # | Pledge (verbatim, party document) | Source | Division(s) found | Result |
|---|---|---|---|---|
| C1 | "Cut tax for workers by taking another 2p off employee National Insurance so that we will have halved it from 12% … to 6% by April 2027 …" | Conservative manifesto p.4 | None. | No vote |
| C2 | "… abolishing the main rate of self-employed National Insurance entirely by the end of the Parliament." | p.4 | None. | No vote |
| C3 | "Cut tax for pensioners with the new Triple Lock Plus …" | p.4 | None names it. (Related: Opposition Day on tax, 15 Jul 2025, 165–342, [2095](https://votes.parliament.uk/votes/commons/division/2095). It "regrets that the Government plans to bring those whose only income is the State Pension into paying Income Tax" ([Hansard](https://hansard.parliament.uk/Commons/2025-07-15/debates/885057BF-B786-4925-8929-0C6CF30825FA/)).) | No vote |
| C4 | "Give working parents 30 hours of free childcare a week from when their child is nine months old …" | p.4 | None. | No vote (executive action) |
| C5 | "… moving to a household system, so families don't start losing Child Benefit until their combined income reaches £120,000 …" | p.4 | None. | No vote |
| C6 | "… guaranteeing no new green levies or charges …" | p.4 | None names it. (Related: an Opposition Day motion on energy calling to remove the carbon price from electricity generation and end Renewables Obligation subsidies. That is about existing levies, not new ones. 12 Nov 2025, 97–336, [2174](https://votes.parliament.uk/votes/commons/division/2174); Parliament's title for this vote is "original words stand part", i.e. a vote on keeping the motion's wording rather than replacing it.) | No vote |
| C7 | "… unblocking 100,000 homes …" | p.4 | None. | No vote (output target) |
| C8 | "… introducing mandatory National Service for all school leavers at 18 …" | p.4 | None. | No vote |
| C9 | "Fund 100,000 high-quality apprenticeships for young people, paid for by curbing the number of poor-quality university degrees …" | p.4 | Opposition Day: Student loans, 18 Mar 2026, 88–266 ([2285](https://votes.parliament.uk/votes/commons/division/2285)). The motion calls, among other things, to "create more apprenticeships for 18-21 year olds, funded by controlling the number of places on university courses where the benefits are significantly outweighed by the cost" ([Hansard](https://hansard.parliament.uk/Commons/2026-03-18/debates/CF6F6D31-157D-47B3-93EC-1FB9AE953AB0/)). | Ambiguous (bundled motion; partial match, with no 100,000) |
| C10 | "Protect children by requiring schools to ban the use of mobile phones during the school day …" | p.4 | CWSB motion to disagree with Lords Amendment 106, 9 Mar 2026, 304–177 ([2275](https://votes.parliament.uk/votes/commons/division/2275)). LA106 "mandates schools to prohibit the use and possession of a smartphone during the school day" (Aphra Brandreth, 15 Apr 2026). Laura Trott (Con) called it "our amendment, in Lords amendment 106" on 9 Mar 2026 ([Hansard](https://hansard.parliament.uk/Commons/2026-03-09/debates/655E6B7C-4642-44D5-ABFE-236ADC69819A/ChildrenSWellbeingAndSchoolsBill)). In the Lords, the report-stage amendment "Prohibition of smartphones during the school day" (amendment 215, agreed) was led by Baroness Barran (Con) with three crossbench co-sponsors ([Bills API](https://bills-api.parliament.uk/api/v1/Bills/3909/Stages)). Also: NC36, 17 Mar 2025, 159–317 ([1950](https://votes.parliament.uk/votes/commons/division/1950)); it bundles the phone ban with two other duties. Later: Government amendments (a) to (c) in lieu of Lords Amendment 106, 15 Apr 2026, 248–139 ([2323](https://votes.parliament.uk/votes/commons/division/2323)); these replaced the ban with a different measure (described in debate as a duty to "have regard" to guidance), so they are context, not a pair. | **Clean pair** (on 2275; Aye = remove the ban) |

### Liberal Democrat (72 MPs elected; [Commons Library](https://commonslibrary.parliament.uk/research-briefings/cbp-10009/))

| # | Pledge (verbatim, party document) | Source | Division(s) found | Result |
|---|---|---|---|---|
| D1 | "We will put people first, investing in more apprenticeships and new Lifelong Skills Grants." | LD manifesto p.7 | None. | No vote (scheme) |
| D2 | "Liberal Democrats will give everyone a new right to see a GP within seven days, or 24 hours if it's urgent …" | p.8 | LD Opposition Day: Access to primary healthcare, 16 Oct 2024, 80–337 ([1847](https://votes.parliament.uk/votes/commons/division/1847)). It calls "to give everyone the right to see a GP within seven days or within 24 hours if they urgently need to", alongside dentist and pharmacy asks ([Hansard](https://hansard.parliament.uk/Commons/2024-10-16/debates/8AC5EF35-A57E-40A0-AE66-CB374E6AE3E9/)). | Ambiguous (bundled motion) |
| D3 | "… free school meals for all children in poverty …" | p.8 | CWSB Report NC7 (LD: Munira Wilson and others), 18 Mar 2025, 77–313 ([1953](https://votes.parliament.uk/votes/commons/division/1953)). It would give free school meals to "all children whose household income is less than £20,000 per year" ([Bills API](https://bills-api.parliament.uk/api/v1/Bills/3909/Stages)). | **Clean pair** (rule 1a: the party's own amendment) |
| D4 | "… reversing the Conservatives' tax cuts for big banks." | p.8 | None. The LD Finance Bill new clauses that went to a vote asked for reviews, not this change. | No vote |
| D5 | "… a duty to protect the environment, including banning water companies from dumping raw sewage …" | p.8 | None names it. (Related: LD Opposition Day on sewage, calling on the Government "to take urgent action to end the sewage scandal, including the introduction of a new Blue Flag status for rivers and chalk streams", 23 Apr 2025, 77–302, [1998](https://votes.parliament.uk/votes/commons/division/1998). The Water (Special Measures) Bill report-stage divisions, 28 Jan 2025 (1919–1921), were on a Water Restoration Fund (NC16), cutting customer bills by the amount of fines (NC19) and a wording change to Clause 12 (Amendment 9), not a ban.) | No vote |
| D6 | "We will cut emissions and bills with an emergency Home Energy Upgrade programme." | p.9 | GBE Bill Report Amendment 4 (LD), 29 Oct 2024, 96–353 ([1850](https://votes.parliament.uk/votes/commons/division/1850)). It would make "an emergency home insulation programme with targeted support for people on low incomes" one of GBE's objects ([Bills API](https://bills-api.parliament.uk/api/v1/Bills/3738/Stages)). | Ambiguous (partial match: an object of another body, and a different name) |
| D7 | "Liberal Democrats will introduce proportional representation for electing MPs, and local councillors in England …" | p.9 | Ten-minute-rule motion (Sarah Olney, LD) for leave to bring in a bill "to introduce a system of proportional representation for parliamentary elections and for local government elections in England", 3 Dec 2024, 138–136 ([1878](https://votes.parliament.uk/votes/commons/division/1878); [Hansard](https://hansard.parliament.uk/Commons/2024-12-03/debates/115D13D5-D363-4ACC-A7D1-40638A6AC54E/)). | **Clean pair** (label: vote on whether the bill could be introduced) |
| D8 | "… enshrining the Ministerial Code in law." | p.10 | None. | No vote |
| D9 | "We will champion the UK's Human Rights Act and resist any attempts to weaken or repeal it." | p.10 | BSAI Bill NC14 (Con), 12 May 2025, 98–402 ([2018](https://votes.parliament.uk/votes/commons/division/2018)). Its explanatory statement says it "would disapply the Human Rights Act" for borders, asylum and immigration law ([Bills API](https://bills-api.parliament.uk/api/v1/Bills/3929/Stages)). | Ambiguous (defensive pledge: we would have to judge that this is "weakening") |
| D10 | "… tackling rising food prices through a National Food Strategy …" | p.11 | None. | No vote (strategy) |

### Green (4 MPs elected; [Commons Library](https://commonslibrary.parliament.uk/research-briefings/cbp-10009/))

| # | Pledge (verbatim, party document) | Source | Division(s) found | Result |
|---|---|---|---|---|
| G1 | "We would guarantee rapid access to a GP and same day access in case of urgent need." | Green manifesto p.2 | None names it. (The LD motion 1847 says "within 24 hours", not same day.) | No vote |
| G2 | "We would invest £20bn in NHS budgets over the life of the parliament for hospital building and repair." | p.2 | None. | No vote (spending) |
| G3 | "Green MPs will back the NHS Reinstatement Bill …" | pp.2–3 | None. | No vote |
| G4 | "… additional annual spending reaching £1.5bn by 2030 …" (primary care) | p.3 | None. | No vote (spending) |
| G5 | "A £2bn capital investment in primary care over the next five years." | p.3 | None. | No vote (spending) |
| G6 | "Restoring public health budgets to 2015/16 levels with an immediate increase of £1.5bn." | p.3 | None. | No vote (spending) |
| G7 | "A National Commission to agree an evidenced based approach to reform of the UK's counterproductive drug laws." | p.3 | None. | No vote (body) |
| G8 | "Additional investment in NHS dentistry, reaching £3bn a year by 2030 …" | p.3 | None. | No vote (spending) |
| G9 | "We will commit to a National Cancer Control Plan …" | p.4 | None. | No vote (strategy) |
| G10 | "Meet the existing NHS target of 75% of cases diagnosed at stage 1 or stage 2 by 2028 …" | p.4 | None. | No vote (outcome target) |

*Note:* reading in page order took all ten Green pledges from the health chapter, because that chapter comes first. A Green pledge further on did get votes: "Elected Greens will back changing the law on assisted dying" (p.4, sentence 11+). The Terminally Ill Adults (End of Life) Bill had its second reading on 29 Nov 2024, 330–275 ([1877](https://votes.parliament.uk/votes/commons/division/1877)). A later bill with the same name was defeated at second reading on 11 Sep 2026, 270–286 ([2428](https://votes.parliament.uk/votes/commons/division/2428)). Green NC34 (free lunches for all primary pupils) also went to a vote, 77–315 ([1954](https://votes.parliament.uk/votes/commons/division/1954)). Neither was in the sample.

### Reform UK (5 MPs elected; [Commons Library](https://commonslibrary.parliament.uk/research-briefings/cbp-10009/))

| # | Pledge (verbatim, party document) | Source | Division(s) found | Result |
|---|---|---|---|---|
| R1 | "We will freeze immigration and stop the boats." | Contract, foreword (unnumbered) | None names a freeze. (Related: Conservative NC18 for a binding cap, 12 May 2025, 94–315, [2019](https://votes.parliament.uk/votes/commons/division/2019); Conservative Opposition Day on immigration, 21 May 2025, 83–267, [2031](https://votes.parliament.uk/votes/commons/division/2031). A cap is not a freeze.) | No vote |
| R2 | "… deliver our fully funded plan for zero NHS waiting lists." | foreword | None. | No vote (outcome target) |
| R3 | "Illegal migrants who come to the UK will be detained and deported." | p.2 | None in the Commons Votes data. (Conservative detention amendments were voted on in Public Bill Committee, which is not in that data.) | No vote |
| R4 | "Tax breaks for doctors and nurses to tackle the staffing crisis." | p.2 | None. | No vote |
| R5 | "Lift the income tax starting threshold to £20k …" | p.2 | None names £20k. (Related: Finance (No. 2) Bill Amendment 5 (Conservative), which "removes the freeze in income tax thresholds", 11 Mar 2026, 172–283, [2279](https://votes.parliament.uk/votes/commons/division/2279).) | No vote |
| R6 | "Scrap energy levies and Net Zero to slash energy bills and save each household £500 per year." | p.2 | Conservative Opposition Day: Energy (remove carbon price from generation; end Renewables Obligation subsidies; also other demands, including scrapping the Energy Profits Levy), 12 Nov 2025, 97–336, on whether the motion's original words should stand ([2174](https://votes.parliament.uk/votes/commons/division/2174); [Hansard](https://hansard.parliament.uk/Commons/2025-11-12/debates/405C1215-88FD-4C29-B774-77155B86F954/)). No Reform MP is recorded in either lobby. | Ambiguous (partial match: covers some levies, not Net Zero) |
| R7 | "Leave the European Convention on Human Rights." | p.3 | Ten-minute-rule motion (Nigel Farage, Reform) for leave to bring in a bill "to make provision for the United Kingdom to withdraw from the European Convention on Human Rights", 29 Oct 2025, 96–154 ([2159](https://votes.parliament.uk/votes/commons/division/2159); [Hansard](https://hansard.parliament.uk/Commons/2025-10-29/debates/6960AC63-ADF5-4918-AC74-9D37DF5F6D16/)). | **Clean pair** (label: vote on whether the bill could be introduced) |
| R8 | "Zero illegal immigrants to be resettled in the UK." | p.3 | None. | No vote |
| R9 | "New Department of Immigration." | p.3 | None. | No vote (body) |
| R10 | "Those entering from a safe country will also be barred from claiming asylum or citizenship." | p.3 | None names it. (Related: a Conservative reasoned amendment against the Immigration and Asylum Bill, partly because it "does not end asylum for illegal immigrants", 13 Jul 2026, 97–358 ([2405](https://votes.parliament.uk/votes/commons/division/2405); [Hansard](https://hansard.parliament.uk/Commons/2026-07-13/debates/B6090DEC-6655-4D3F-A6CE-6D762597C5F3/)).) | No vote |

### Kinds of ambiguity found (in the sample)
- **Bundled bill** (2: L2, L10). One vote covers many measures. Opposing the bill may be about a different part. The Conservatives' reasoned amendment on this bill welcomed "measures to create new immigration criminal offences" but objected that "the Bill abolishes laws passed under the previous Government to ensure removals" ([Hansard, 10 Feb 2025](https://hansard.parliament.uk/Commons/2025-02-10/debates/EC0D77F7-9C12-49E0-ACE8-923FCBA4BF30/)).
- **Bundled motion** (2: D2, C9). An opposition motion makes several demands at once.
- **Partial match** (3: C9, D6, R6). The vote covers part of the pledge, or uses different words for it.
- **Defensive pledge** (1: D9). A promise to "resist" something only pairs if we decide which votes count.
- **Related but different instrument** (1: L10). A different legal instrument, and the pledge was mostly carried out by executive action.

**Kinds seen outside the sample (for the site's help page):**
- **Voting against a bill as "too weak".** The Conservative reasoned amendment on the Immigration and Asylum Bill objected that it "does not ensure all foreign criminals and illegal immigrants will be deported" (link above). At second reading, 1 Conservative voted No and the rest of the party is not recorded in either lobby. 3 Reform MPs voted No ([2406](https://votes.parliament.uk/votes/commons/division/2406)). Caroline Lucas's fracking votes are a similar case in [Worthy & Morgan, UCL Constitution Unit, 20 Dec 2021](https://blogs.ucl.ac.uk/constitution-unit/2021/12/20/should-we-be-allowed-to-see-mps-voting-records/).
- **Scope dispute.** Labour pledged it "will not increase National Insurance, the basic, higher, or additional rates of Income Tax, or VAT" (p.21). The Conservative reasoned amendment on the employer NICs bill said the bill "breaks the manifesto commitment" (3 Dec 2024, [1879](https://votes.parliament.uk/votes/commons/division/1879)). The Treasury minister James Murray said the Government had kept its pledge by not increasing "the national insurance that working people pay" (Hansard via [Hansard API](https://hansard-api.parliament.uk/search/contributions/Spoken.json?queryParameters.searchTerm=manifesto&queryParameters.startDate=2024-12-03&queryParameters.endDate=2024-12-03&queryParameters.house=Commons&queryParameters.take=40)). A pairing here would take a side in that dispute.
- **Amendment vs whole bill.** In 2017 a viral story said MPs had voted that animals cannot feel pain. The vote was on one amendment, and the Government said sentience was already recognised in law ([BuzzFeed News, Jim Waterson, 25 Nov 2017](https://www.buzzfeed.com/jimwaterson/independent-animal-sentience)).
- **Party splits and free votes.** On the PR motion, Labour MPs voted 59 Aye and 50 No, and Reform MPs 3 Aye and 1 No ([1878](https://votes.parliament.uk/votes/commons/division/1878)). The whipping status is unverified.
- **Procedural votes.** Examples: allocation of time ([2378](https://votes.parliament.uk/votes/commons/division/2378)), closure ([2427](https://votes.parliament.uk/votes/commons/division/2427)). The rule leaves these out.
- **Tax-bill limits.** Amendments to a Finance Bill are limited by the Budget (Ways and Means) resolutions ([Hansard Society, updated 14 Mar 2023](https://www.hansardsociety.org.uk/publications/guides/what-is-the-finance-bill)). The opposition Finance Bill new clauses that went to a vote in our data were mostly calls for "reviews" or "assessments" (Bills API, bills [3873](https://bills.parliament.uk/bills/3873) and [4042](https://bills.parliament.uk/bills/4042)).

### Why the no-vote group is so large (38 pledges)
- **Outcome, spending or recruitment targets** (13): L1, L4, L5, L6, L7, C7, G2, G4, G5, G6, G8, G10, R2. There is no single measure to vote on.
- **Executive action** (7: strategy, review, scheme, body): L8, C4, D1, D10, G7, G9, R9.
- **Would need a law or tax change, but no division named it** (17): C1, C2, C3, C5, C6, C8, D4, D5, D8, G1, G3, R1, R3, R4, R5, R8, R10. Related votes are cited for 7 of these (C3, C6, D5, G1, R1, R5, R10).
- **Named bill passed with no recorded division on it** (1): L9. No vote here does not mean no support.

### What shaped these results (description, not judgement)
- **Who can get a vote held.** Under Standing Order No. 14 there are 20 opposition days a session: 17 for the leader of the Official Opposition and 3 for the leader of the second-largest opposition party, "who shares the time with smaller parties" ([Commons Library, SN06315, 13 Jul 2026](https://commonslibrary.parliament.uk/research-briefings/sn06315/)). Smaller parties such as the Greens (4 MPs elected in 2024) and Reform (5 MPs elected in 2024) have no days of their own. Their main routes are ten-minute-rule motions and amendments.
- **All 5 clean pairs were votes the pledging party set up itself.** These were a government bill (L3), the party's own new clause (D3), its own ten-minute-rule motions (D7, R7), and a Lords amendment that the Conservatives called "our amendment" (C10).
- **Page order clusters topics.** For the Greens, all ten pledges came from the health chapter.

---

## Part (c): How others handle this, and bias accusations

| Who | What they do | Verdicts? | Bias accusations / response |
|---|---|---|---|
| **Full Fact Government Tracker** | Fact checkers "went through [Labour's manifesto] line-by-line to identify everything that appeared to be a measurable pledge". They gave priority to the missions and first steps ([Full Fact FAQ](https://fullfact.org/government-tracker/frequently-asked-questions/)). It has seven ratings, from "Achieved" to "Not kept" plus "Unclear or disputed" and "Wait and see". It says the work "sometimes involves us making a judgement call" (same page). It does not use Commons votes. It covers about 80 of "about 300" pledges, and says "Pledge tracking is an art, not a science" ([Full Fact, Alex Brocklehurst, 26 Sep 2025](https://fullfact.org/politics/tracker-blog-september-2025/)). | Yes | [The Critic, David Scullion, 15 Feb 2021](https://thecritic.co.uk/how-neutral-is-full-fact/) questioned its funding from Facebook and Google, and staff backgrounds. Full Fact points to "a cross party board of Trustees", staff who "abstain from expressing political opinions in public", and a public list of donations over £5,000 ([Full Fact FAQ](https://fullfact.org/about/frequently-asked-questions/)). It also points to election safeguards ([Full Fact, Tom Phillips, 15 Nov 2019](https://fullfact.org/blog/2019/nov/staying-balanced-protecting-our-impartiality-election/)). We found no complaint aimed at the tracker's ratings. |
| **Institute for Government** | Its trackers page mentions "a manifesto tracker which measures which election promises have been translated into action" ([IfG Trackers](https://www.instituteforgovernment.org.uk/our-work/trackers)). An earlier analysis found "Of 39 key commitments from the Conservatives' 2017 manifesto … only a third had been implemented, or were on track" ([IfG, Emma Norris, 19 Nov 2019](https://www.instituteforgovernment.org.uk/blog/do-manifestos-matter-anymore)). We could not find a current 2024 pledge tracker page. | Status categories | None found about its pledge tracking (see "Could not verify"). |
| **TheyWorkForYou (mySociety)** | Groups divisions into policy lines. It picks votes for "Cohesion (we include votes that are mostly, if not completely, about the specific policy)", uniqueness and noteworthiness. Scores run 0–100, e.g. "consistently voted for". It does "not count absences". It says "Votes are not opinions, but they matter" ([TheyWorkForYou, voting information](https://www.theyworkforyou.com/voting-information/)). Procedural votes are left out, but the handling of ten-minute-rule bills is still undecided ([mySociety, Alex Parsons, 13 Mar 2025](https://www.mysociety.org/2025/03/13/updating-theyworkforyous-voting-summaries/)). | Summaries of MPs' voting, not verdicts on pledges | Robert Largan MP and about 50 colleagues asked mySociety to "correct a misrepresentation" of their climate votes. mySociety published its response and treated it like any other MP query ([mySociety, Mark Cridge, 21 Jan 2021](https://www.mysociety.org/2021/01/21/a-response-to-robert-largan-mp/)). Academics note it "contains no data on whipping instructions" and that it oversimplifies ([Worthy & Morgan, 20 Dec 2021](https://blogs.ucl.ac.uk/constitution-unit/2021/12/20/should-we-be-allowed-to-see-mps-voting-records/)). |
| **Comparative Party Pledges Project** (Thomson, Royed, Naurin et al.) | Studied "over 20,000 pledges made by parties in 12 countries during 57 election campaigns". A clear majority of governing parties' pledges were at least partly fulfilled, "and in some cases well above 80 percent". The highest rates were in countries where single-party governments are common, a group that includes the UK. No UK-only figure is given on that page ([AJPS, 7 Jun 2017](https://ajps.org/2017/06/07/the-fulfillment-of-parties-election-pledges-a-comparative-study-on-the-impact-of-power-sharing/)). | Yes (coded fulfilment) | None found. |
| **Polimeter (Université Laval)** | A promise "must commit the party to perform an action or reach a specific goal, and the pledge should be worded so as to enable the researcher to objectively assess whether this action or this goal was achieved". Ratings: kept / kept in part or in the works / broken / not yet rated. It uses the comparative pledges group framework ([POLTEXT methodology](https://www.poltext.org/en/donnees-et-analyses/les-polimetres/methodology-polimeters)). | Yes | None found. |
| **PolitiFact (Obameter, Trump-O-Meter, MAGA-Meter)** | The MAGA-Meter tracks 75 promises. Ratings: "Stalled, In the Works, Promise Kept, Promise Broken and Compromise", "based on measurable outcomes, not intentions or efforts" ([PolitiFact, Louis Jacobson, 19 Jan 2025](https://politifact.com/article/2025/jan/19/politifact-donald-trump-2024-promises-maga-meter/)). | Yes | [Smart Politics, Eric Ostermeier, 10 Feb 2011](https://smartpolitics.lib.umn.edu/2011/02/10/selection-bias-politifact-rate/) found Republicans rated False or Pants on Fire 39% of the time, against 12% for Democrats. He raised selection bias but did not prove it. This was about PolitiFact's fact checks, not its promise meters. Editor Bill Adair replied: "we choose which facts to check based on news judgment" ([MinnPost, 15 Feb 2011](http://www.minnpost.com/braublog/2011/02/politifact-responds-u-researchers-anti-gop-bias-claim/)). |

**Common thread.** The complaints we found are about *which* items were chosen, and about summaries that hide the reasons for a vote. Our rule answers the first by choosing mechanically, the same way for every party. It answers the second by showing Parliament's own wording and never writing a verdict. The work of deciding what counts as a pledge is shared with the Polimeter and the comparative pledges definition.

---

## What this means for the site
- **The rule is workable, but most pledges will have no paired vote.** In this test it was 38 of 50. The site needs a neutral line, shown the same way for every party, such as "No Commons vote on this exact measure, July 2024 – Sept 2026". It must not read as a criticism.
- **Ambiguous pairs: Romily decides.**
  - (A) Show clean pairs only. This is the strictest option.
  - (B) Also show ambiguous pairs, with a typed label (e.g. "This vote also covered…").
  - (C) Show related votes as well. This moves towards TheyWorkForYou-style editorial choice.
  - Each step from A to C adds judgement.
- **How many votes a party can trigger depends on its seats and on Commons rules**, and that affects how many pairs each party gets. A short explainer should say so, the same way for all parties.
- **Plain-English stage labels are essential.** Double negatives ("motion to disagree") and leave motions are easy to misread.
- **Data cautions.**
  - Public Bill Committee votes are not in the Commons Votes API.
  - The Bills API "decision" field said "NoDecision" for amendments that did go to a division (e.g. CWSB NC7 = division 1953).
  - Name lists often differ slightly from the official counts. For example, division 2406 lists 265 Aye names against an AyeCount of 264, and division 2174 lists 333 No names against a NoCount of 336. Similar gaps of 1–3 appear in 1847, 1878, 1953, 2018 and 2275. The cause is unverified.
  - Always show Parliament's own figures, and check name lists against counts.
- **Two-person coding.** Pledge selection and pairing should each be done by two people working separately, then compared. That is where the remaining judgement sits.
- **Selection method.** Page order is mechanical but clusters topics. If the site's nine topics must each be covered, the alternative mechanical method is "first qualifying pledge per topic". Either way, state the method on the site.

## Could not verify
- hansard.parliament.uk pages returned HTTP 403 to our fetch tool. All motion and speech quotes were checked through the public Hansard API instead. The Hansard page links are given for readers.
- Whether any of the listed divisions were free (unwhipped) votes. Party splits are shown from the API, but whip status is unverified.
- Why official counts and name lists differ in several divisions (e.g. 2406: 264 vs 265 Aye names; 2174: 336 vs 333 No names).
- Whether the Commons Votes API list (590 divisions, 4 Jul 2024 – 11 Sep 2026) is complete.
- Public Bill Committee divisions were not checked systematically.
- Any published bias accusation aimed at the Institute for Government's pledge tracking (none found), and the location of a current IfG tracker for the 2024 manifesto.
- A Telegraph/Yahoo article on claims of left-wing bias against fact-checkers (the page returned HTTP 429). Not used.
- The full text of mySociety's 2021 formal response (held in Google Drive documents, not read).
- That Lords amendment 215 at Lords report stage is the same text that became Lords Amendment 106 in the Commons (the titles and subject match; the renumbering was not traced).
- The party labels in the Commons Votes API: we did not confirm whether they show an MP's party at the time of the vote or now. This matters for MPs who changed party.
- Whether the 2026 Immigration and Asylum Bill contains a safe-country asylum bar (relevant to R10). Not checked.
- The exact publication date of each manifesto (given as June 2024).
- Page numbers for Reform's foreword (unnumbered). Other page numbers are the printed ones, checked against the PDFs.
