# What the evidence says about voter-information tools

Research brief for What's It To Me? — written 25 September 2026. All URLs were accessed on 25 September 2026 unless stated.

## How to read this

Every finding is marked **OBSERVED** (taken from a source I read today, with the source number in square brackets) or **JUDGED** (my reading of what it means for the site). Confidence is given as high, medium or low. "Unverified" means I could not read the primary source today and the number should be checked before it is repeated anywhere.

Two limits on this brief. First, the session's web-search allowance ran out part way through, so the second half relies on fetching known URLs and on the Crossref bibliographic API. Second, several pages refused to load (PNAS and Taylor & Francis article pages returned 403; Springer's "Alphabet Soup" page and the PubMed record for Kamoen et al. were rate-limited by the proxy; Ballotpedia's statistics pages, Abgeordnetenwatch's annual reports, and the Electoral Commission's 2024 general election report all failed). Where that happened I used a preprint, a working-paper PDF, a university news page or the Crossref abstract instead, and I say so. The site's own "paper 03" on empty records was not in this workspace, so section 6 is written from the literature directly rather than as an extension of it.

Nothing here proposes ranking, scoring, matching or recommending candidates. Where the literature is about tools that do those things, the lesson is drawn for a tool that does not.

---

## 1. Effects of voting advice applications and voter guides

Voting advice applications (VAAs) — StemWijzer, Wahl-O-Mat, smartvote and the like — ask users questions and tell them which party or candidate is closest. They are the best-studied kind of election-information tool, so most of the effect-size evidence comes from them even though What's It To Me? is not one.

### 1.1 The headline: big effects in surveys, small or nil effects in experiments

**OBSERVED, high confidence.** Munzert and Ramirez-Ruiz's meta-analysis pooled 55 effects from 22 studies, 73,673 participants, nine countries and 25 elections. Across all studies, VAA use was associated with higher self-reported turnout (odds ratio 1.87, 95% CI 1.50–2.33) and with changing one's vote (OR 1.44, 95% CI 1.16–1.78); the effect on issue knowledge was a partial correlation of 0.09 (95% CI −0.01 to 0.18). But when only experimental studies are counted, the estimates fall to about OR 1.0 for turnout and about OR 1.2 for vote choice, with confidence intervals crossing 1 — that is, not distinguishable from zero. The authors attribute the gap to self-selection: people who use VAAs were already more likely to vote. (Figures read from the authors' working-paper PDF; the published article page was not readable today.) [1][2]

**OBSERVED, high confidence.** The individual experiments say the same thing:

| Study | Setting and design | Sample | Turnout | Vote choice | Knowledge |
|---|---|---|---|---|---|
| Munzert, Barberá, Guess & Yang 2020, *Public Opinion Quarterly* [3] | Wahl-O-Mat, German federal election 2017; randomised encouragement in an online panel with web-tracking | 979 retained | No causal effect (a 5-point observational gap vanished under the causal estimate) | No effect on switching | +3 percentage points in correctly perceived party positions among compliers |
| Frese, Hix & Lachat 2025, *British Journal of Political Science* [4] | EuroMPmatch, 2024 European Parliament elections in Germany, Italy, France; three encouragement experiments plus a regression-discontinuity design | 6,501 (experiments); 10,535 (RDD) | No significant effect | No increase in how often people switched; but users were 2–6 points more likely to vote for the party the tool ranked first | No effect |
| Enyedi 2015, *Political Studies* [5] | Two Hungarian VAAs, 2010 election; panel experiment | not stated in abstract | No mobilising or demobilising effect | 7% *said* they changed their intention, but the panel data show the tools could not direct users to particular parties; confirming advice raised party loyalty, disconfirming advice lowered it | — |
| Pianzola, Trechsel, Vassil, Schwerdt & Alvarez 2019, *Journal of Politics* [6] | smartvote, Swiss federal election 2011; randomised access | 2,000 students | — | Strengthened intention for the already-preferred party; increased the number of parties considered | — |
| Velez, Green & Sevi 2025, *PNAS* [7] | "VAA Bot": a chatbot grounded in party platforms, aimed at young politically unaffiliated US adults; three experiments | about 2,900 in total, largest 2,000 (per University of Toronto news page; article page not readable) | — | Weak or no effect on party preference | +13 points on party positions on the issues the user cares most about; +4 points on other issues |

**OBSERVED, high confidence.** Observational studies that adjust for who uses the tools still find something, but smaller than the raw gaps: Gemenis and Rosema (2014, *Electoral Studies*) used entropy balancing on the 2006 Dutch election study (N = 2,623; 38% had used a VAA) and attributed about 4.4 percentage points of turnout to VAA use, concentrated among younger, less educated, less knowledgeable and weakly partisan voters, with no effect on the old, the knowledgeable or strong partisans. [8] A 2024 Swedish register-validated study found a 1-point gap in a 2018 national election (turnout 99% among both groups) but a 13-point gap at the low-salience 2019 European election. [9]

**JUDGED.** For What's It To Me? the honest expectation is: measurable gains in knowledge of where candidates stand (a few points), a small or nil effect on whether people vote, and no reliable effect on whom they vote for. The one consistent causal finding is that tools raise knowledge; that is the outcome the site should measure and claim, not turnout.

### 1.2 Field experiments with non-VAA information

**OBSERVED, high confidence.** Kendall, Nannicini and Trebbi (2015, *American Economic Review*) ran a randomised campaign in Arezzo, Italy (77,386 eligible voters) for an incumbent mayor. Mailed messages alone had effects "not different from zero". Phone-delivered messages about the incumbent's competence ("valence") raised his precinct-level vote share by about 4.1 points; messages about ideology had negligible effect on votes, though both changed beliefs. Turnout did not move. Voters who learned about the incumbent also updated their beliefs about the challenger ("cross-learning"). [10]

**OBSERVED, high confidence.** The Metaketa I programme (Dunning et al. 2019, *Science Advances*) pre-registered six coordinated field experiments in Benin, Brazil, Burkina Faso, Mexico and Uganda (24,007 people, 1,330 randomisation blocks) giving voters factual performance information about incumbents. The pooled effect on voting for the incumbent was 0.62 points for "good news" (95% CI −1.95 to 3.19) and 0.36 points for "bad news" (95% CI −2.80 to 3.51); turnout effects were null overall. The result held across 18,886 model specifications. The authors' reading is that the information "simply did not induce voters to update their beliefs". [11][12]

**OBSERVED, medium confidence.** A pre-registered 2024 US experiment (Mernyk, Kamphorst, Sivakumar, Bonica et al., PsyArXiv, 2026) gave 2,474 California and Texas voters a chatbot grounded only in Ballotpedia. Users rated it trustworthy, accurate and unbiased across party lines; text analysis confirmed the answers tracked the source. Users reported higher intention to vote, warmer feelings towards the other side's voters, and "modest shifts in vote intentions", including more support for Democratic candidates and, in some races, more support for the candidate matching the user's stated positions. [13]

**JUDGED.** Three lessons. Delivery channel matters more than content volume (mail did nothing in Arezzo; phone did). Information about competence and record moves people more than information about ideology, which is a reason to give equal weight to what candidates have *done* (council votes, attendance, past offices) and not only what they *say*. And even a rigorously source-grounded neutral tool can shift votes in one direction if the underlying source has more to say about some candidates than others — which is exactly the asymmetry problem in section 6.

---

## 2. Bias and design

### 2.1 Statement selection

**OBSERVED, high confidence.** Walgrave, Nuytemans and Pepermans (2009, *West European Politics*) had 1,000 Belgians answer 50 candidate statements, then simulated 500,000 random 36-statement subsets. Which party the tool advised swung enormously with the subset: CD&V–N-VA's share of advice ranged from 5% to 32%, VLD–Vivant from 0.3% to 23%, Vlaams Belang from 4% to 26%. Letting users weight statements made dispersion worse (average standard deviation rose from 4.3 to 5.5). [14]

**JUDGED.** The site does not compute matches, so this bias cannot enter through an algorithm. It can enter through *topic* selection: which ten topics get a page, and which questions the household grid answers. The Walgrave result is the strongest reason to publish the topic list, the rule for choosing it, and the date it was fixed, and to keep it identical for every candidate.

### 2.2 Matching method

**OBSERVED, high confidence.** Louwerse and Rosema (2014, *Acta Politica*) re-ran real StemWijzer user data under alternative spatial models and found that "a majority of the users of StemWijzer would have received another advice, if another spatial model had been used". [15] Rosema and colleagues' response-scale work (2016, *Policy & Internet*) makes the same point for answer scales. [16]

**JUDGED.** This is the literature that justifies the site's founding rule. Any matching or proximity score is a design choice dressed as a measurement; there is no neutral algorithm to pick. Not ranking is not a limitation to apologise for — it is the only design that the method literature cannot fault.

### 2.3 Party self-placement versus expert coding

**OBSERVED, high confidence.** Gemenis (2013, *Acta Politica*) reviews how VAAs position parties. Self-placement is gamed once a tool becomes popular: the Lithuanian *Mano Balsas* "was strategically manipulated" by parties, and in the EU Profiler project parties that expected to gain cooperated while others "threatened with legal action". Expert coding has its own problem: in a reliability test with 80 coders, Krippendorff's alpha was "unacceptably low" for ambiguous statements such as "the European Parliament should be given more powers", though specific statements coded reliably. [17]

**JUDGED.** The site's approach — quote the candidate's own published words, name the source, do not paraphrase into a position — sidesteps both problems, at the cost of gaps when a candidate has said nothing specific. That trade (accuracy over coverage) is the right one on this evidence, but it makes the treatment of gaps (section 6) the central design question.

### 2.4 Wording, headers and order

**OBSERVED, high confidence.** Two large randomised field experiments inside a live Utrecht municipal VAA:

- Holleman, Kamoen, Krouwel, van de Pol and de Vreese (2016, *PLOS ONE*; N = 31,112): negatively worded statements ("forbid" rather than "allow") produced more agreement than positive ones (Cohen's d = 0.13 for implicit negatives, 0.05 for explicit "not"). Among the least politically sophisticated users the effect was d = 0.39; among the most sophisticated, 0.06. [18]
- Kamoen, van de Pol, Krouwel, de Vreese and Holleman (2019, *PLOS ONE*; N = 27,404): putting a topic header above a statement ("nature and environment" versus "finance") shifted answers among low-sophistication users (d = 0.27–0.48) and not among high-sophistication users. The authors advise either no headers or balanced ones. [19]

**OBSERVED, high confidence.** Order effects are real and largest where information is thin. Freeder, de Benedictis-Kessner and Bernhard (Political Behavior, 2026; preprint read) analysed 29,076 randomised-order Californian local contests, 1995–2021: being listed first adds about 1.3–1.5 points of vote share and 4.7–5.8 points to the probability of winning, with larger gains for non-white candidates and in low-information, on-cycle contests. [20] For the UK, Rallings, Thrasher and Borisyuk (2009) found that in multi-member English wards candidates at the top of their party's slate were more than twice as likely to finish top of it. [21][22] A laboratory study (Johnson and Miles 2011, *British Politics*) found position bias with fictitious parties but not with real ones, and judged UK single-member elections "largely immune" while flagging multi-member and preference ballots as susceptible. [23] The Electoral Commission's 2019 Scottish study (102 interviews, 16 eye-tracking sessions) found order did not affect voters' ability to find their candidate, though a random order took longer to search (3.2 s for A–Z, 1.3 s for order by lot — the figures as reported on the Commission's page). [24]

**JUDGED.** The site shows candidates in ballot-paper order. That is defensible (it is the order the voter will see, and the Commission's disability advice favours predictability), but it reproduces the ballot's own primacy effect, and the Freeder result says that effect is biggest exactly where the site's data are thinnest — local wards with several candidates from one party. Two mitigations are compatible with the no-ranking rule: keep every candidate card the same size and weight regardless of position, and say on the page that the order is the ballot paper's, not the site's.

### 2.5 Standards: the Lausanne Declaration, ECPR and "trustworthy AI"

**OBSERVED, medium confidence (secondary source).** The Lausanne Declaration on Voting Advice Applications (Garzia and Marschall, 2014, drafted within the ECPR research network on VAAs) asks that a VAA be "open, transparent, impartial and methodologically sound": accessible to all voters; transparent about funding and intentions, about how parties and candidates are positioned, and about the matching algorithm; impartial in including all parties and not systematically favouring any; and methodologically rigorous. I read this via an Aalto University thesis that summarises the Declaration; the original text was not fetched. [25]

**OBSERVED, medium confidence.** Stockinger, Maas, Talvitie and Dignum (2024, *Ethics and Information Technology*) scored European VAAs against the European Commission's Ethics Guidelines for Trustworthy AI and found scores "comparable across VAAs and low in most requirements". Their four recommended improvements: be transparent that recommendations are subjective; involve diverse stakeholders; document the algorithm for users; disclose underlying values and assumptions. [26]

**OBSERVED, high confidence.** On 20 May 2019 the Cologne Administrative Court ruled that the Wahl-O-Mat, in the form that let users compare at most eight parties at once, breached the parties' constitutional right to equal opportunity (*Chancengleichheit*); the tool was taken offline the same day and returned on 23 May after a settlement, with full-party comparison from the September 2019 state elections. The Wahl-O-Mat's 38 statements are written by an editorial team of young voters (25 people aged 18–26 in 2013) and parties answer them themselves; the 2025 federal election version was accessed about 26 million times. [27]

**JUDGED.** The site already meets the Declaration's four tests more completely than most VAAs (no algorithm to hide; every claim sourced; all candidates on identical pages). The Wahl-O-Mat ruling is the precedent to remember: equal treatment of small parties and independents is a legal as well as an ethical expectation for a tool that becomes popular, and "identical page for every candidate" is the site's strongest defence.

### 2.6 Is a no-ranking tool actually read as neutral?

**OBSERVED, high confidence.** The hostile media phenomenon (Vallone, Ross and Lepper 1985, *Journal of Personality and Social Psychology*) — partisans on both sides judge the same balanced coverage as biased against them — is one of the most replicated findings in political psychology. [28]

**OBSERVED, medium confidence.** Against that, the Mernyk et al. chatbot, which only repeated Ballotpedia, was rated trustworthy and unbiased by Democrats and Republicans alike [13]; Curry and Stroud (2021, *Journalism*) found that transparency elements ("why and how a story was written", author details) raised credibility "regardless of participants' political ideology" across three topics [29]; and Reuters Institute work on trust finds that the untrusting are mostly *indifferent* to editorial practice rather than hostile (Toff et al. 2021: about 2,000 respondents in each of Brazil, India, UK, US). [30]

**JUDGED.** Neutrality of method will not by itself be perceived. What the evidence supports is neutrality made *visible*: the same page template, sources next to every quote, an explicit statement that the site does not rank, and a public correction ledger. Expect some partisans to call the site biased whatever it does; the ledger and the identical templates are the answer.

---

## 3. Personalisation: does "what's in it for me" change how people reason?

### 3.1 Pocketbook versus sociotropic voting

**OBSERVED, high confidence.** The classic finding (Kinder and Kiewiet 1981, *British Journal of Political Science*) is that voters respond to the national economy ("sociotropic") far more than to their own finances ("pocketbook"); Sears and Funk (1990) concluded that "self-interest ordinarily does not have much effect upon the ordinary citizen's sociopolitical attitudes". [31][32]

**OBSERVED, high confidence.** That picture has been revised by better data. Healy, Persson and Snowberg (2017, *American Political Science Review*) matched Swedish income-registry records to an election survey. In the survey data alone, sociotropic evaluations looked about 3.5 times as influential as pocketbook ones (0.18 versus 0.047); with registry income as an instrument, the pocketbook coefficient rose to roughly the same size (about 0.18–0.20). Self-reported personal finances were simply too noisy to show the effect. [33] Tilley, Neundorf and Hobolt (2018, *Journal of Politics*), using the British Household Panel Survey over about 20 years, find pocketbook voting in Britain, and that "people respond much more strongly to changes in their own finances that are linked to government spending, such as welfare transfers, than to similar changes that are less clearly the responsibility of elected officials, such as lower personal earnings". [34] Elinder, Jordahl and Poutvaara (2015, *European Economic Review*) show *prospective* pocketbook voting: Swedish parents of young children shifted their votes in response to promised child-benefit changes in 1994 and 1998, not to the policies once delivered. [35]

**JUDGED.** The site's household grid is squarely in the zone where the evidence says personal stakes do move people: government-attributable, prospective, money-denominated changes. Two cautions follow. The effect is *on top of* partisanship, not instead of it; and the noisiness of self-reported finances means the site's banded household inputs will produce estimates with wide real-world error bars that should be shown, not hidden.

### 3.2 Does asking the "self-interest question" change reasoning?

**OBSERVED, medium confidence (small study).** Young, Thomsen, Borgida, Sullivan and Aldrich (1991, *Journal of Experimental Social Psychology*; N = 66) found that priming self-interest produced more self-interested reasoning about policy "regardless of the individual's level of experience". [36]

**OBSERVED, high confidence.** Miller and Ratner (1998) showed that people *overestimate* how much self-interest drives other people's views; two pre-registered replications (Collabra 2021; N = 799 on MTurk and N = 799 on Prolific UK) found effects of d = 0.57–0.84. [37]

**OBSERVED, high confidence.** Information-provision experiments reliably change beliefs and much less reliably change preferences. Haaland, Roth and Wohlfart's methodological review reports, for example, Kuziemko et al. (2015) moving beliefs about inequality by 12 points with policy preferences "largely unaffected", and Alesina et al. (2018) moving mobility beliefs by 9.7 points with "essentially no average impact on policy preferences"; they recommend at least 700 respondents per arm to detect the typical attitude effects. [38] Stantcheva (2021, *Quarterly Journal of Economics*) finds that support for income and estate taxes tracks perceived fairness and social preferences far more than efficiency or self-interest. [39]

**OBSERVED, high confidence.** Chong and Druckman (2007, *Annual Review of Political Science*) review framing: how an issue is framed shifts opinion, especially for the less engaged. [40]

**JUDGED.** What is known: a personalised "what changes for a household like yours" number will be understood and will update beliefs, and it maps onto a real mechanism of vote choice. What is contested: whether foregrounding it makes people reason more selfishly (one small 1991 study says priming does; the wider literature says self-interest is a smaller driver than people assume and that fairness framings dominate). Design implications that do not require settling the argument: phrase it as "a household like yours" rather than "you"; put the area-wide and national figures beside the household one so the sociotropic view is one glance away; never present the household figure as a reason to vote one way; and expect the number to inform rather than to convert.

---

## 4. Trust

### 4.1 Baselines in the UK

**OBSERVED, high confidence.** Reuters Institute Digital News Report 2026: UK "trust in news overall" 30%, down 5 points on 2025; global average 37%, the lowest since the series began in 2015. Globally, 10% use an AI chatbot for news weekly (16% of under-35s); trust in chatbot answers is 20%; 52% of 18–24s say social and video networks are their main source of news. The BBC, ITV News, Channel 4 and the Financial Times remain the most trusted UK brands. Fieldwork: about 2,000 respondents in each of 48 markets. [41][42]

**OBSERVED, high confidence.** Electoral Commission, *Public attitudes to elections and democracy: 2026 findings* (fieldwork 14 October–1 December 2025; 5,945 UK adults aged 16+; press release 25 June 2026): 79% confident elections are well run; 84% satisfied with voting; 75% see mis- and disinformation as a problem; 72% see media bias as a problem (62% in 2019); 55% see foreign interference as a problem; 14% think political finance is transparent and 18% find funding information easy to find; 52% disagree that political information online is trustworthy (46% in 2025); 80% reported seeing misinformation on social media in the 2025 survey. (The report page as summarised gave the misinformation figure as 72%; the press release gives 75% — check the data tables before quoting either.) [43][44][45]

**OBSERVED, high confidence.** After the May 2025 English local elections (YouGov for the Commission, 2–16 May 2025, N = 2,781 in electing areas): 49% agreed they had enough information about candidates to make an informed choice; 47% felt local media coverage was adequate; turnout was 34%. [46]

**JUDGED.** Half of local-election voters saying they lacked candidate information is the site's demand signal. The trust baseline is low and falling, so the site should not expect to inherit trust from being "an information site"; it has to earn it feature by feature.

### 4.2 What earns trust

**OBSERVED, high confidence.** Curry and Stroud (2021): transparency boxes explaining why and how a story was done, with author details, raised credibility and engagement across topics and ideology. [29] Toff et al. (2021, Reuters Institute): among people who generally trust news, 70%+ in most countries rate "knowing how journalists find sources" as very or extremely important; funding transparency matters most in India (29-point gap between trusting and untrusting); the generally untrusting are indifferent across every practice measured. [30] The Trust Project's 2023 eye-tracking study (N = 79, correlational) found that the "best practices" elements — funding, standards, reporting process — were looked at for about four seconds on average yet were the elements most associated with higher credibility ratings (β = 0.29, p = 0.047); author biographies were looked at longest but did not predict credibility. [47]

**OBSERVED, medium confidence.** Not all studies agree: Karlsson, Clerwall and Nord (2014, *Journalism Studies*, "You ain't seen nothing yet: transparency's (lack of) effect on source and message credibility") found little or no credibility gain from transparency features in Swedish experiments. I confirmed the citation through Crossref but could not re-read the abstract today. [48]

**OBSERVED, high confidence.** Election-specific: the Commission's own trackers show that the *one* dimension of the democratic system the public rates as opaque is money — 14% think party finance is transparent, unchanged for years [45][49] — and the Mernyk chatbot's cross-party trust came from its being demonstrably tied to a named nonpartisan source. [13]

**JUDGED.** Ranked by evidence strength, the trust signals the site should keep prominent are: (1) the source link and date beside every quote (strongest and most consistent finding); (2) a plain "how we choose and check" page; (3) who funds the site and who runs it, stated in one sentence near the top of every page — this is the element that people glance at for four seconds and then trust, and it is the dimension the UK public says is most opaque in politics; (4) the correction ledger, which the literature supports for accountability even though its direct effect on credibility is mixed. Founders' names matter less than the funding line, on this evidence.

---

## 5. Candidate participation

### 5.1 Published rates

**OBSERVED, medium confidence (secondary source).** Vote Smart's Political Courage Test response rate fell from 72% of candidates in 1996 to 48% in 2008 and 20% in 2016 (Wikipedia, citing the *Wall Street Journal*, 25 October 2006, and *Washington Monthly*, 4 November 2016). Politicians of both parties feared "challengers will use their responses out of context in attack ads"; a Florida Democratic House leader is quoted: "We tell our candidates not to do it. It sets them up for a hit piece." Vote Smart responded by trying to shame non-responders and by allowing up to 30% of answers to be left blank; the decline continued. [50] Vote Smart's own site says that for candidates who decline it draws on public statements, voting records and interest-group ratings, and "when a candidate's public record lacks clarity on that issue, Vote Smart will not infer an answer". [51]

**OBSERVED, high confidence.** smartvote (Switzerland): "85% of candidates have a smartvote profile (2023 National Council and Council of States elections)"; about 20% of voters use it; more than 350 elections covered. [52]

**OBSERVED, high confidence.** Democracy Club, 2024 general election: 4,515 candidates (a record; 4,150 in 2010); photographs for 95% of them; 14.5 million postcode searches between 22 May and 4 July 2024 and 5.5 million in election week; 20 million searches across the April–July local and general elections; 86% user satisfaction in election week; 59% of councils promoted the tools. No figure for the share of candidates with a statement to voters was published in the pages I read. [53][54][55]

**OBSERVED, high confidence.** Democracy Club's January 2024 reflection, "Collecting candidate statements is hard, let's collect emails instead", explains why: electoral administrators would have to check statements "for compliance on the size of the statement, its truthfulness and particularly that it didn't breach any law"; nominations arrive "quite close to the wire"; and Democracy Club's editing system "can't actually verify that an edit is from a candidate (or their agent)". They proposed collecting verified candidate email addresses instead, with one-time links and post-moderation. [56] In the May 2024 locals, only two of 107 councils had local manifestos from all four main parties, and "many local parties don't update their website for the elections". [57]

**Unverified.** Ballotpedia's Candidate Connection totals by year, YLE's vaalikone candidate response rate, Abgeordnetenwatch's answer rates and Vote411's coverage: the pages that hold these numbers would not load or did not contain them today. Do not cite figures for these until checked.

### 5.2 Why candidates decline, and what raises participation

**OBSERVED, high confidence.** Gemenis (2013): parties "refuse participation or manipulate responses when VAAs gain popularity"; the incentive to cooperate is strongest for those who expect to gain. [17] The Vote Smart quotes above show the mechanism at the candidate level: risk of out-of-context quotation in attack material. [50] Tomz and Van Houweling (2009, *APSR*) show that ambiguity "does not repel and may, in fact, attract voters", especially voters who are unsure of their own preferences — so a candidate who stays vague is not obviously punished at the ballot box. [58]

**JUDGED (the participation literature I could reach is thin on this).** The contrast between smartvote's 85% and Vote Smart's 20% is the useful natural experiment. smartvote sits inside a system where the main media use its data, where a profile is expected of a serious candidate, and where the tool is not associated with any campaign. Vote Smart asks candidates to commit to yes/no answers that can be weaponised. What's It To Me? is closer to the smartvote end because it asks for nothing new: it quotes what the candidate has already published. That makes the realistic lever not "get candidates to fill in a form" but "get candidates to publish *anything* citable, and to send it to us with a verified email" — which is exactly the pivot Democracy Club made. Levers that the evidence and practice suggest, in order: (1) a media partner that displays the site's data, so an empty record is visible to the local paper's readers; (2) verified-email intake with a dated deadline and a phone or email follow-up (Democracy Club's model); (3) a neutral, dated "no published position found — checked on [date]" line rather than "refused"; (4) after the election, publish the take-up rate by party so the parties' agents see it.

---

## 6. Empty records and asymmetry

### 6.1 How people read missing information

**OBSERVED, high confidence.** *Omission neglect*: people are largely insensitive to what is missing from a description and form extreme, confident judgements from whatever is present (Sanbonmatsu, Kardes, Posavac and Houghton 1997, *Organizational Behavior and Human Decision Processes*; later work shows expertise and prompting increase sensitivity to omissions). [59] *When* people do notice that information is missing, they discount the option (Johnson and Levin 1985, *Journal of Consumer Research*, "More than meets the eye"). [60]

**OBSERVED, high confidence.** *Evaluability*: attributes that are hard to judge on their own become influential when options are seen side by side (Hsee 1996; Hsee and Zhang 2010, "General evaluability theory"). [61][62] A compare page therefore makes "how much material there is" an evaluable attribute, whether or not the site intends it.

**OBSERVED, high confidence.** *Cross-learning*: in Arezzo, information about one candidate changed beliefs about the other. [10] *Shortcuts*: Lupia (1994, *APSR*) showed that voters with a simple cue (who backs what) behaved like well-informed voters on complex ballot measures. [63] *Ambiguity is not punished*: Tomz and Van Houweling 2009. [58] *Order effects grow as information shrinks*: Freeder et al. [20]

### 6.2 What this means for a site with unequal records

**JUDGED.** Put together, these findings predict four things about a 15-candidate ballot where three candidates have rich records and twelve have almost none.

1. Readers will not spontaneously notice that a candidate's page is thin; they will judge that candidate confidently on the little there is (omission neglect). A page with one quote is *not* read as "we know little"; it is read as "this is what they are about".
2. On the compare and topic pages, volume becomes a proxy for seriousness (evaluability). The incumbent wins the comparison by having a Hansard record, not by being better.
3. If the site tells readers plainly that a record is empty, readers discount that candidate (Johnson and Levin) — which is a real effect of the site on the vote, and it is not neutral between a well-resourced party candidate and an independent with no website.
4. Where records are empty, ballot order and party label do the work (Freeder; Lupia).

Design responses that stay within the no-ranking rule, and the evidence each rests on:

- State absence explicitly and identically: "No published position found on [topic]. Last checked [date]. Sources searched: [list]." The prompt counters omission neglect; the identical wording and the list of sources searched prevent "absence" from reading as "refusal" or "hiding".
- Give the party's national position on the same page as an *explicitly labelled* fallback ("Their party says…"), because that is the cue voters actually use (Lupia) and because the site's own party pages already hold it.
- Never show counts of quotes, sources or positions per candidate, and do not let the compare page's layout grow with content (equal cells, "no published position" filling the empty ones).
- Give equal space to *what a candidate has done* (council record, attendance, previous offices) as to what they have said; the Arezzo result says record information is what moves voters, and incumbents' records are the main source of asymmetry, so labelling them as records rather than as positions keeps the comparison honest.
- Offer every candidate the same verified route to fill the gap and say so on the page: "This candidate can add a published statement via /candidates/submit."

---

## 7. Misinformation, manipulation and the law

### 7.1 Manipulation risks

**OBSERVED, high confidence.** Open political data gets edited by interested parties. WikiScanner (2007) traced Wikipedia edits to UK Parliament IP addresses; in 2012 Grant Shapps was found to have altered information about his academic record and donors; in 2012 MPs or their staff removed criticism from their own articles; in February 2024 Scottish Parliament computers were used to edit MSPs' articles "to delete compromising details or emphasize positive aspects". [64] VAAs have been gamed by parties once they mattered (Lithuania). [17] Democracy Club cannot verify that an edit to a candidate record comes from the candidate. [56]

**OBSERVED, high confidence.** Small design choices shift answers among the least sophisticated users (headers d = 0.27–0.48; negative wording d = 0.39) [18][19], and biased orderings can shift undecided voters' preferences by 20% or more (Epstein and Robertson 2015, *PNAS*, five experiments in two countries). [65]

**JUDGED.** The site's exposures, in order of likelihood: (1) upstream data poisoning — a vandalised Democracy Club photo or statement, or an edited Wikipedia biography, flowing through the daily refresh; (2) quote manipulation — a real quote clipped to reverse its meaning, or a fabricated screenshot of a "quote" from the site circulating on social media; (3) a candidate submission that defames a rival; (4) selective refresh failures that leave one candidate stale. Mitigations that follow from the evidence: quote at sentence level with the surrounding paragraph one click away; hash and timestamp every claim in the ledger so a fake screenshot can be disproved; hold upstream changes to existing records in a review queue during the regulated period rather than auto-publishing them; never accept a submission that mentions another candidate; and show "last verified" on every quote.

### 7.2 Digital imprints — do the rules apply to the site?

**OBSERVED, high confidence (statute read directly).** Elections Act 2022, Part 6 (sections 39–48), in force from 1 November 2023 (SI 2023/1145). Section 41 requires "the name and address of the promoter" and of anyone on whose behalf material is published to be included in electronic material that meets *either* the section 42 conditions *or* the section 44 conditions. [66]

- **Paid-for material (s.42–43)** applies to anyone, at any time, if (a) the material's "sole or primary purpose" can reasonably be regarded as influencing the public to support or withhold support from parties, candidates, office-holders or referendum outcomes, and (b) the promoter "has paid for the material to be published as an advertisement". Paying to set up or run one's own website or app does not count as paying for an advertisement (s.42(5)).
- **Other (unpaid) material (s.44–45)** applies only if the promoter is a registered party, a recognised third party, a candidate or future candidate, an elected office-holder, a referendum campaigner or a recall petition campaigner, *and* the material can reasonably be regarded as intended to promote or procure electoral success.
- **Exception (s.47(3))**: section 41 does not apply to material on a website "whose primary purpose, or one of whose primary purposes, is the publication of journalism created for publication on the website", unless it is an advertisement.
- **Offence (s.48)**: promoter and beneficiary are liable; defences include due diligence and acting in accordance with Electoral Commission guidance under s.54.

The Commission's guidance confirms the reading: "ordinary members of the public and unregistered organisations are not required to include imprints on unpaid material"; paid adverts that meet the purpose test need an imprint "at all times, not just in the run-up to elections". [67]

**OBSERVED, high confidence.** The Representation of the People Bill (HL Bill 47, brought from the Commons 3 September 2026; Commons third reading 2 September 2026; Lords second reading 14 September 2026; Lords committee stage next) contains a clause (clause 72 in the Lords print) that would add "any person who is a third party campaigner, but is not a recognised third party or an individual" to the list of those who must imprint their unpaid digital campaign material, where that material is for a section 45 purpose. Explanatory notes, paragraphs 66–67 and 95. No commencement date is given. [68][69][70]

**JUDGED.** Today: the site's pages are not section 42 material (nothing is paid to be published as an advertisement and the primary purpose is not to influence support for anyone) and not section 44 material (the site is none of the listed persons). No imprint is legally required. If the site ever pays to promote a page — a boosted post, a search advert — the question becomes whether that advert's "sole or primary purpose" is influencing support; an advert saying "see every candidate's published positions" is not, but the Commission decides on a reasonable-person view, so keep advert copy strictly about the service. After the Bill: an organisation whose organic material meets the purpose test would need an imprint; the site's protection remains that it does not promote or procure anyone's success. Recommended regardless: put a voluntary imprint-style line ("Published by What's It To Me?, [address]") in the footer. It costs nothing, pre-empts the Bill, and is the funding-and-responsibility signal that section 4 says people trust.

### 7.3 Non-party campaigner spending rules

**OBSERVED, high confidence.** The Commission's Code of Practice for non-party campaigners: spending is regulated only if it "can reasonably be regarded as intended to promote or procure the electoral success" of parties or candidates (the purpose test), judged on call to action, tone, context and timing and the reasonable person; and only if made available to the public (the public test). "It is unlikely that a public campaign without an explicit or implicit call to action to voters will meet the purpose test." Thresholds: spending over £700 on regulated activity brings a campaigner within the rules and is only permitted for those eligible to notify; over £10,000 requires notification to the Commission; registered campaigners must record and report spending over £20,000 in England or £10,000 in Scotland, Wales or Northern Ireland. The regulated period before a UK parliamentary general election is 365 days. [71][72]

**JUDGED.** The site does not meet the purpose test while it carries no call to action and treats every candidate identically. The ledger and the identical templates are the evidence that it does not. Two things would change that: any page or post that says or implies "vote for/against", and any partnership where a campaign group re-uses the site's material with its own call to action (joint-campaigning rules). Keep a one-page written "purpose test self-assessment" dated before each regulated period.

### 7.4 Defamation and false statements about candidates

**OBSERVED, high confidence (statutes read directly).** Defamation Act 2013: a statement is not defamatory unless it "has caused or is likely to cause serious harm" (s.1); defences of truth (s.2), honest opinion (s.3) and publication on a matter of public interest (s.4, which expressly covers "an accurate and impartial account of a dispute to which the claimant was a party" and allows for editorial judgement); a website operator has a defence where it did not post the statement, lost if it fails to act on a notice of complaint under the regulations (s.5). Section 7 widens qualified privilege for fair and accurate reports of, among other things, notices issued by legislatures and governmental bodies. [73] Representation of the People Act 1983, s.106: anyone who, "before or during an election, for the purpose of affecting the return of any candidate", makes or publishes a false statement of fact about a candidate's "personal character or conduct" commits an illegal practice unless they had reasonable grounds to believe it true; the High Court can grant an injunction on prima facie proof of falsity. [74]

**JUDGED.** The exposure is not the site's own words; it is *repetition*. Under the common-law repetition rule, quoting candidate A's false claim about candidate B is the site's publication of that claim, and it is also potentially a section 106 publication (though the site would lack the "purpose of affecting the return" element). Rules that follow: quote candidates on policy and on themselves; do not quote candidates on other candidates' character or conduct; if a quote about a rival is unavoidable for a policy point, quote both sides with equal prominence and the source for each (the s.4(3) "impartial account of a dispute" route); keep a notice-and-takedown address and a documented response time (s.5 and the Online Safety Act both want one). Note that s.1's serious-harm threshold and the public-interest defence make the site's position strong *provided* the quote is accurate and attributed — the ledger's hashes and timestamps are the evidence.

### 7.5 Copyright in what the site quotes

**OBSERVED, high confidence.** Copyright, Designs and Patents Act 1988, s.30(1ZA): copyright is not infringed by a quotation from a work made available to the public, provided the use is fair dealing, "the extent of the quotation is no more than is required by the specific purpose", and it carries sufficient acknowledgement. [75]

**JUDGED.** Word-for-word quotation of manifestos, leaflets and statements, sentence-length, with the source named, sits inside s.30(1ZA). Reproducing whole leaflets (images) is ElectionLeaflets' licence question, not the site's, provided the site links rather than copies.

### 7.6 Online Safety Act 2023

**OBSERVED, high confidence (statute read directly).** A "user-to-user service" is one where content "generated directly on the service by a user of the service, or uploaded to or shared on the service by a user… may be encountered by another user" (s.3(1)); it does not matter what proportion of content is user-generated (s.3(2)). Schedule 1, paragraph 4 exempts "limited functionality" services where users can only post comments or reviews on provider content, share them, or react to them; paragraph 4(3) says user-generated content "is not to be regarded as provider content". [76][77] Ofcom's guide says even small, low-risk in-scope services must complete an illegal-content risk assessment, have terms of service and a reporting and complaints route. [78]

**JUDGED.** The /feedback form (private, to the team) is not user-to-user. The /candidates/submit route is the question: if a candidate's submitted statement is published as-is to other users, that is arguably user-generated content encountered by other users, and paragraph 4 would not obviously cover it because the statement is not a comment *on* provider content. If instead the team reads, checks, dates and publishes it as the site's own claim (as the ledger implies), it is more naturally provider content. The safest reading: treat submissions as editorial intake, never auto-publish, add no comment or reaction features, and keep the risk assessment and complaints route anyway because they are cheap. This is an open legal question (section 11), not a settled one.

### 7.7 UK GDPR, PECR and browser-only household data

**OBSERVED, high confidence.** The ICO: "online identifiers" including IP addresses and cookie identifiers "may be personal data"; a combination of identifiers may identify someone; the test is what "an interested and sufficiently determined person" could do with the means reasonably available. [79] PECR regulation 6 applies to anyone who "stores information on a user's device or gains access to information on a user's device, in either case by any method" — localStorage as much as cookies. [80] The Data (Use and Access) Act 2025, s.112 and Schedule 12, in force 5 February 2026 (SI 2026/82), replaced regulation 6 and inserted Schedule A1 to PECR. Storage is permitted without consent where it is "strictly necessary" for a service the user asked for, which expressly includes "maintaining a record of selections made on a website, or information put into a website, by the subscriber or user" (Sch A1 para 4(2)(e)(ii)); first-party statistics are permitted without consent if the sole purpose is improving the service, the data are not shared except with someone helping improve it, the user is told clearly and given "a simple means of objecting, free of charge" (para 5); the same applies to appearance and functionality preferences (para 6). [81][82]

**JUDGED.** Storing the postcode and household bands in the browser at the user's request is squarely within paragraph 4(2)(e)(ii): no consent banner is needed for it, only a clear explanation. The postcode does leave the browser to look up the ballot; on the server it should not be logged beside an IP address or any identifier (that combination is personal data), and the privacy notice should say the lookup is not retained. Household bands must never leave the browser, and the site should not record which candidate pages a user viewed against any identifier — that would be data revealing political opinions (UK GDPR Art. 9). Privacy-preserving first-party analytics can run under paragraph 5 with a visible opt-out and no third-party sharing. No cookie banner is required on this design; a short "what this site stores" line is.

### 7.8 Accessibility law

**OBSERVED, high confidence.** Equality Act 2010, s.29: a "service-provider" providing a service "to the public or a section of the public (for payment or not)" must not discriminate, and "a duty to make reasonable adjustments applies to a service-provider" (s.29(7)). [83] The Public Sector Bodies (Websites and Mobile Applications) (No. 2) Accessibility Regulations 2018 apply to "public sector bodies" — the State, regional or local authorities, bodies governed by public law and their associations (regulation 3); they do not bind a private non-profit website. [84]

**JUDGED.** WCAG 2.2 AA is not a legal requirement for the site, but the Equality Act duty to make reasonable adjustments is, it is anticipatory, and WCAG 2.2 AA is what a court or the EHRC would treat as the reasonable standard. Publish an accessibility statement anyway: it is the same trust signal as the funding line, and the Commission's Scottish research shows disabled voters value predictability of layout — which the identical-template rule already delivers.

---

## 8. Youth and first-time voters

### 8.1 Where the law stands (as of 25 September 2026)

**OBSERVED, high confidence.** The Representation of the People Bill is a Government Bill that "originated in the House of Commons": first reading 12 February 2026; second reading 2 March 2026; committee from 18 March 2026; carried over into the 2026–27 session and reprinted as Bill 004 on 14 May 2026; report and third reading 2 September 2026; Lords first reading 3 September and second reading 14 September 2026; Lords committee stage to be announced. Clause 1 lowers the voting age to 16 for UK parliamentary elections, local elections in England and Northern Ireland, Northern Ireland Assembly elections and police and crime commissioner elections in England and Wales (Scotland and Wales already have 16 for their devolved and local elections); clause 3 lets 14-year-olds pre-register as "attainers"; clauses 7–14 keep under-16s off the open register and bar them from donating. It is not yet law and has no announced commencement date. [68][69][70]

**JUDGED.** The 8 October 2026 by-election and the May 2027 locals will be fought on the current franchise (18 for Westminster and English locals). The site should plan for 16- and 17-year-olds as a user group from 2027–28, and for the "attainer" who can register at 14 and will look up a ballot they cannot yet vote in.

### 8.2 What the evidence says 16–24s need

**OBSERVED, medium confidence (press summary of a study in progress).** "Young People's Futures and Democratic Life" (University of Nottingham and London Metropolitan University, with Electoral Commission support; about 120 schools across the four nations, 2025–26; pupils aged 14–15): 61% intend to vote once enfranchised; 26% have "no real idea" what the parties stand for; 39% see voting as a privilege or duty; schools and teachers are the most trusted source of political information, but many teachers feel unable to discuss party politics; many pupils do not know about photo ID at polling stations. [85]

**OBSERVED, high confidence.** Reuters DNR 2026: 52% of 18–24s say social and video networks are their main news source, 32 points ahead of any other; 16% of under-35s use an AI chatbot for news weekly. [42] Electoral Commission 2026: 18–24s who get news from social media are the least likely to find abusive posts about politicians unacceptable (48%, versus 54% of those who use television news). [43] Gemenis and Rosema: the mobilising effect of information tools is concentrated among the young, the less educated, the less knowledgeable and weak partisans — the groups the site is most likely to help. [8] Velez, Green and Sevi: young unaffiliated adults gain most (+13 points) on the issues they personally care about. [7]

**OBSERVED, medium confidence.** Enfranchisement research: 16- and 17-year-olds in Austria turned out less than adults but chose parties no less consistently with their views (Wagner, Johann and Kritzinger 2012, *Electoral Studies*); Scottish 16–17s after 2014 showed "potentially significant positive effects", strongest for behaviour and moderated by parents and by civic education at school (Eichhorn 2018, *Parliamentary Affairs*). [86][87]

**JUDGED.** Three things follow for the site. Enter through the channel young people are on: an embeddable, shareable single-candidate card and a vertical-video-sized "one screen per candidate" view. Start from the issue the user cares about (the topic pages) rather than from the candidate list — that is where the measurable knowledge gain is. And build for the classroom: a teacher-mode with no postcode needed, the national parties page, and the identical-template rule as the guarantee that the material is safe to use under the Department for Education's political-impartiality guidance (the barrier teachers name).

---

## 9. Fifteen evidence-based lessons for What's It To Me?

1. **Claim knowledge, not turnout.** Experiments find tools raise knowledge of positions by a few points and do not reliably change turnout or vote choice (Munzert meta-analysis; Munzert 2020; Frese 2025). Measure and report knowledge gain; do not promise to raise turnout.
2. **Expect the biggest effect among the least engaged.** Mobilisation and knowledge effects concentrate among the young, the less knowledgeable and weak partisans (Gemenis and Rosema; Velez, Green and Sevi). Design and test for them first.
3. **Records move people more than positions.** Competence information shifted votes in Arezzo; ideology information did not. Give what candidates have done equal weight to what they say, labelled as record.
4. **Not ranking is the method the literature cannot fault.** A majority of StemWijzer users would have had different advice under another model; statement subsets swing advice by tens of points. Say this on the /about page, in one sentence, with the citations.
5. **Topic selection is the site's version of statement selection.** Publish the topic list, the rule for choosing it, its date, and keep it identical across candidates.
6. **Small wording choices bias the least sophisticated.** No headers that frame a topic; identical neutral labels; no positive/negative phrasing of positions (the quote carries the phrasing, not the site).
7. **Equal treatment is a legal expectation once a tool is popular** (Wahl-O-Mat, Cologne 2019). Identical pages for independents and small parties are the site's defence; never add a feature that only well-documented candidates can fill.
8. **Ballot order has a real primacy effect, largest where information is thin.** Keep ballot order but say whose order it is, keep cards identical in size, and consider a "shuffle" control for the compare view.
9. **Missing information is not read as missing.** Readers judge confidently on whatever is shown (omission neglect) and volume becomes a proxy in side-by-side views (evaluability). State absence explicitly and identically, with the date checked and the sources searched; never show counts.
10. **The fallback cue voters actually use is party.** Show the party's position, explicitly labelled as the party's, on every empty candidate topic.
11. **Personal stakes are a real driver — when government-attributable and prospective.** The household grid is on the right ground (Healy et al.; Tilley et al.; Elinder et al.). Frame it as "a household like yours", show error bands, and put the area and national figures beside it.
12. **Information changes beliefs far more than preferences** (Haaland, Roth, Wohlfart). Do not expect or engineer conversion; a user who leaves better informed and unchanged is the success case.
13. **The trust signals with evidence behind them are sources beside every claim, a "how we check" page, and a one-line funding and responsibility statement** — the last is looked at for four seconds and then trusted, and money is the dimension the UK public finds most opaque (14%).
14. **Candidate participation rises with expectation, not with forms.** smartvote's 85% versus Vote Smart's 20%: ask for nothing new, verify by email, set a dated deadline, show a neutral "no published position — checked [date]", and publish take-up by party after the election.
15. **Treat upstream data as hostile during the regulated period.** Politicians' offices edit Wikipedia; parties game VAAs; Democracy Club cannot verify editors. Queue changes to existing records for review, hash and timestamp every claim, and quote only on policy and self, never on rivals' character.

---

## 10. Legal and compliance checklist

| # | Item | Rule and source | Status for the site (JUDGED) |
|---|---|---|---|
| 1 | Imprint on unpaid pages | Elections Act 2022 s.44 — only listed persons (parties, recognised third parties, candidates, office-holders, referendum/recall campaigners) [66]; EC guidance [67] | Not required today. Add a voluntary "Published by … [address]" footer. Re-check when RoP Bill clause 72 commences [70]. |
| 2 | Imprint on paid promotion | Elections Act 2022 s.42–43: anyone, at any time, if the advert's sole or primary purpose is influencing support and it is paid for as an advertisement [66] | Only if the site buys adverts; keep advert copy about the service, not about candidates; add an imprint to any paid post to be safe. |
| 3 | Non-party campaigner registration | PPERA as amended; EC Code of Practice: purpose test ("promote or procure electoral success"), £700 / £10,000 / £20,000 tiers, 365-day regulated period [71][72] | Not met while there is no call to action and all candidates are treated identically. Keep a dated purpose-test self-assessment; avoid joint work with campaigning bodies. |
| 4 | Journalism exception | Elections Act 2022 s.47(3) [66] | Arguably available (original published research and reporting); do not rely on it alone. |
| 5 | Defamation | Defamation Act 2013 ss.1–5, 7 [73]; common-law repetition rule | Quote only on policy and self; both sides with equal prominence if a dispute is unavoidable; notice-and-takedown contact and response time published. |
| 6 | False statements about candidates | RPA 1983 s.106 [74] | Never publish claims about a candidate's personal character or conduct; injunction risk on prima facie falsity. |
| 7 | Copyright in quotations | CDPA 1988 s.30(1ZA) — quotation, fair dealing, no more than needed, acknowledgement [75] | Sentence-level quotes with named source are within the exception; link to leaflets rather than copying images. |
| 8 | Online Safety Act scope | OSA 2023 s.3, Sch 1 para 4 [76][77]; Ofcom guide [78] | Feedback form: out of scope. Candidate submissions: treat as editorial intake, never auto-publish, no comments; do a written illegal-content risk assessment and publish a complaints route regardless. |
| 9 | Browser storage of postcode and household bands | PECR reg 6 and Sch A1 para 4(2)(e)(ii) as inserted by DUAA 2025 s.112/Sch 12, in force 5 Feb 2026 [81][82]; ICO: reg 6 covers any storage method [80] | No consent needed; clear explanation needed. |
| 10 | Analytics | PECR Sch A1 para 5 [82] | First-party, statistics-only, not shared, clear notice, one-click objection — no banner. |
| 11 | Server-side personal data | UK GDPR Arts 5, 6, 9, 13; ICO on online identifiers [79] | Do not log postcode with IP; do not record candidate-page views against any identifier (political opinions); privacy notice states lookups are not retained. |
| 12 | Accessibility | Equality Act 2010 s.29 and s.29(7) anticipatory reasonable adjustments [83]; PSBAR 2018 applies to public sector bodies only [84] | WCAG 2.2 AA not mandatory but the reasonable-adjustments benchmark; publish an accessibility statement. |
| 13 | Equal treatment of candidates | Wahl-O-Mat ruling, VG Köln 20 May 2019 (German law, persuasive not binding) [27]; Lausanne Declaration [25] | Identical templates; no feature only some candidates can fill. |
| 14 | Data licences | Democracy Club, ElectionLeaflets, Parliament, Electoral Commission, ONS terms (not re-read today) | Check attribution and non-commercial clauses before the by-election; unverified here. |

---

## 11. Open questions the evidence cannot answer

1. **Does a no-ranking, quote-only tool change knowledge as much as a VAA does?** Every knowledge-gain estimate comes from tools that summarise and score. There is no experiment on verbatim-quotation guides. The site could run one (a pre-registered encouragement design needs roughly 700 people per arm to see typical attitude effects; knowledge effects are larger and need fewer).
2. **Does explicitly labelling an empty record help or harm the candidate concerned?** Omission neglect says unlabelled gaps go unnoticed; Johnson and Levin say labelled gaps are discounted. Which dominates for a candidate page is untested. An A/B test of wording ("no published position found" versus "did not publish a position" versus no line) with a follow-up recall question would settle it.
3. **Does a personalised household figure make people reason more selfishly, and does that matter?** One small 1991 study says priming self-interest changes reasoning; the wider literature says fairness dominates. No study has tested a "household like yours" framing against a national framing on the same policy.
4. **Do candidates respond to a neutral "no published position" line, a media partner, or a phone call?** The participation literature reachable today has no controlled comparison. The Holborn and St Pancras by-election (15 candidates) and May 2027 (hundreds) are the chance to log outreach method against outcome.
5. **Is a moderated candidate-submission page a user-to-user service under the Online Safety Act?** The statute's "provider content" definition and Schedule 1 paragraph 4(3) point in different directions for pre-moderated submissions. Ask Ofcom or a lawyer before the feature is opened to all candidates.
6. **Will the Representation of the People Bill's clause 72 be read to cover neutral information organisations?** It should not, because it keeps the section 45 purpose test, but the Commission's guidance under it does not yet exist.
7. **What do 16- and 17-year-olds specifically want from candidate information?** The only UK study found was of 14–15-year-olds and is still in progress; Scottish and Welsh 16–17 cohorts have voted since 2016 and 2021 but I found no published research on their use of candidate-information tools.
8. **Does cross-learning cut both ways on a compare page?** Arezzo shows information about one candidate updates beliefs about another; whether a rich incumbent record makes readers infer *worse* things about silent challengers, or simply nothing, is unknown and directly relevant to the asymmetry problem.

---

## Sources

1. Munzert, S. and Ramirez-Ruiz, S. (2021). "Meta-Analysis of the Effects of Voting Advice Applications." *Political Communication* 38(6). doi:10.1080/10584609.2020.1843572. Working-paper PDF read: https://simonmunzert.com/meof/material/vaa-meta-analysis-polcomm-full.pdf
2. Hertie School news, "Do voting advice apps affect voter participation?" https://www.hertie-school.org/en/news/detail/content/in-a-german-super-election-year-could-voting-advice-apps-affect-voter-participation-or-choices
3. Munzert, S., Barberá, P., Guess, A. and Yang, J. (2020). "Do Online Voter Guides Empower Citizens? Evidence from a Field Experiment with Digital Trace Data." *Public Opinion Quarterly* 84(3). PDF read: https://simonmunzert.com/meof/material/vaa-experiment.pdf
4. Frese, J., Hix, S. and Lachat, R. (2025). "Quality not quantity: how a VAA affected voting behavior in three large-scale field experiments." *British Journal of Political Science*. doi:10.1017/S000712342510118X (PDF read at cambridge.org); preprint doi:10.31219/osf.io/y549s
5. Enyedi, Z. (2015). "The Influence of Voting Advice Applications on Preferences, Loyalties and Turnout: An Experimental Study." *Political Studies*. doi:10.1111/1467-9248.12213 (Crossref abstract)
6. Pianzola, J., Trechsel, A., Vassil, K., Schwerdt, G. and Alvarez, R. M. (2019). "The Impact of Personalized Information on Vote Intention: Evidence from a Randomized Field Experiment." *Journal of Politics* 81(3). doi:10.1086/702946. https://www.journals.uchicago.edu/doi/abs/10.1086/702946 ; preprint via https://core.ac.uk/works/78764854
7. Velez, Y., Green, D. and Sevi, S. (2025). "Chatbot Voting Advice Applications inform but seldom sway young unaligned voters." *PNAS*. doi:10.1073/pnas.2515516122 (Crossref abstract; figures from https://srinstitute.utoronto.ca/news/can-chatbots-help-close-the-youth-voting-knowledge-gap)
8. Gemenis, K. and Rosema, M. (2014). "Voting Advice Applications and electoral turnout." *Electoral Studies*. https://ris.utwente.nl/ws/portalfiles/portal/6658854/voting.pdf
9. Evertsson, K. (2024). *How Voting Advice Applications Affect Turnout in European Parliamentary elections and national parliamentary elections.* University of Gothenburg report 2024:6. https://www.gu.se/sites/default/files/2024-12/R2024_6.pdf
10. Kendall, C., Nannicini, T. and Trebbi, F. (2015). "How Do Voters Respond to Information? Evidence from a Randomized Campaign." *American Economic Review* 105(1). https://www.aeaweb.org/articles?id=10.1257/aer.20131063 ; NBER WP 18986 PDF read: https://www.nber.org/system/files/working_papers/w18986/w18986.pdf
11. Dunning, T. et al. (2019). "Voter information campaigns and political accountability: Cumulative findings from a preregistered meta-analysis of coordinated trials." *Science Advances* 5(7). PDF read: https://people.bu.edu/tboas/metaketa.pdf
12. EGAP Brief 59, "Metaketa I: Information and Accountability." https://egap.org/resource/brief-59-information-and-accountability/
13. Mernyk, J., Kamphorst, J., Sivakumar, K., Bonica, A. et al. (2026). "A nonpartisan source-grounded AI voter guide is perceived as trustworthy and affects voting intentions." PsyArXiv preprint, doi:10.31234/osf.io/whsm8_v1. Summaries read: https://medialab.sciencespo.fr/actu/a-nonpartisan-source-grounded-ai-voter-guide-is-perceived-as-trustworthy-and-affects-voting-intentions/ and https://sciety.org/articles/activity/10.31234/osf.io/whsm8_v1
14. Walgrave, S., Nuytemans, M. and Pepermans, K. (2009). "Voting Aid Applications and the Effect of Statement Selection." *West European Politics* 32(6). https://medialibrary.uantwerpen.be/oldcontent/container2608/files/Walgrave%20et%20al%202009%20-%20voting%20aid%20applications.pdf
15. Louwerse, T. and Rosema, M. (2014). "The design effects of voting advice applications: Comparing methods of calculating matches." *Acta Politica* 49(3): 286–312. https://www.tomlouwerse.nl/publication/2014-louwerse-rosema-actapolitica/
16. Rosema, M. et al. (2016). "Response Scales in Voting Advice Applications: Do Different Designs Produce Different Outcomes?" *Policy & Internet*. doi:10.1002/poi3.139 (title only; not read)
17. Gemenis, K. (2013). "Estimating parties' policy positions through voting advice applications: Some methodological considerations." *Acta Politica*. https://link.springer.com/article/10.1057/ap.2012.36
18. Holleman, B., Kamoen, N., Krouwel, A., van de Pol, J. and de Vreese, C. (2016). "Positive vs. Negative: The Impact of Question Polarity in Voting Advice Applications." *PLOS ONE*. https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0164184
19. Kamoen, N., van de Pol, J., Krouwel, A., de Vreese, C. and Holleman, B. (2019). "Issue framing in online voting advice applications: The effect of left-wing and right-wing headers on reported attitudes." *PLOS ONE*. https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0212555
20. Freeder, S., de Benedictis-Kessner, J. and Bernhard, R. (2026). "Alphabet Soup: Randomized Ballot Order and the Representation of Marginalized Candidates." *Political Behavior*. doi:10.1007/s11109-026-10129-8 (Springer page rate-limited); preprint read: https://jdbk.scholars.harvard.edu/sites/g/files/omnuum4201/files/2025-10/Alphabet_Soup_251017.pdf
21. Rallings, C., Thrasher, M. and Borisyuk, G. (2009). *Journal of Elections, Public Opinion and Parties* 19(1). (Crossref lists "Unused Votes in English Local Government Elections", doi:10.1080/17457280802568253 — the ballot-position findings are as summarised by Mark Pack, source 22; primary not read.)
22. Pack, M. "What do the academics say? Ballot paper ordering." https://www.markpack.org.uk/4434/what-do-the-academics-say-ballot-paper-ordering/
23. Johnson, A. J. and Miles, C. (2011). "Order effects of ballot position without information-induced confirmatory bias." *British Politics*. https://link.springer.com/article/10.1057/bp.2011.26
24. Electoral Commission (2019). "Ballot paper ordering at Scottish council elections." https://www.electoralcommission.org.uk/research-reports-and-data/public-attitudes/ballot-paper-ordering-scottish-council-elections
25. Garzia, D. and Marschall, S. (2014). Lausanne Declaration on Voting Advice Applications — as summarised in an Aalto University thesis, "Designing Voting Advice Applications": https://aaltodoc.aalto.fi/server/api/core/bitstreams/fd01f1d3-5c5f-4189-a4f9-45a18a2b2dd5/content (original text not read)
26. Stockinger, E., Maas, J., Talvitie, C. and Dignum, V. (2024). "Trustworthiness of voting advice applications in Europe." *Ethics and Information Technology*. https://research.tudelft.nl/en/publications/trustworthiness-of-voting-advice-applications-in-europe/
27. Wahl-O-Mat, German Wikipedia (statement selection; 2025 usage; VG Köln ruling of 20 May 2019 and settlement of 23 May 2019). https://de.wikipedia.org/wiki/Wahl-O-Mat
28. Vallone, R., Ross, L. and Lepper, M. (1985). "The hostile media phenomenon." *Journal of Personality and Social Psychology* 49(3). doi:10.1037/0022-3514.49.3.577 (Crossref)
29. Curry, A. L. and Stroud, N. J. (2021). "The effects of journalistic transparency on credibility assessments and engagement intentions." *Journalism*. https://journals.sagepub.com/doi/10.1177/1464884919850387
30. Toff, B. et al. (2021). "Overcoming indifference: what attitudes towards news tell us about building trust." Reuters Institute. https://reutersinstitute.politics.ox.ac.uk/overcoming-indifference-what-attitudes-towards-news-tell-us-about-building-trust
31. Kinder, D. and Kiewiet, D. R. (1981). "Sociotropic Politics: The American Case." *British Journal of Political Science*. doi:10.1017/S0007123400002544 (Crossref abstract)
32. Sears, D. O. and Funk, C. L. (1990). "The limited effect of economic self-interest on the political attitudes of the mass public." *Journal of Behavioral Economics*. https://www.sciencedirect.com/science/article/abs/pii/009057209090030B
33. Healy, A., Persson, M. and Snowberg, E. (2017). "Digging into the Pocketbook: Evidence on Economic Voting from Income Registry Data Matched to a Voter Survey." *American Political Science Review* 111(4). CESifo version read: https://eriksnowberg.com/papers/Healy%20Persson%20Snowberg%20Pocketbook%20CESifo.pdf
34. Tilley, J., Neundorf, A. and Hobolt, S. (2018). "When the Pound in People's Pocket Matters." *Journal of Politics*. https://www.journals.uchicago.edu/doi/10.1086/694549
35. Elinder, M., Jordahl, H. and Poutvaara, P. (2015). "Promises, policies and pocketbook voting." *European Economic Review*. doi:10.1016/j.euroecorev.2015.01.010. Summary read: https://www.ifn.se/en/publications/scientific-articles-in-english/2010-2019/2015/2015-16/
36. Young, J., Thomsen, C., Borgida, E., Sullivan, J. and Aldrich, J. (1991). "When self-interest makes a difference: The role of construct accessibility in political reasoning." *Journal of Experimental Social Psychology* 27(3). https://www.sciencedirect.com/science/article/abs/pii/002210319190016Y
37. "Self-interest Is Overestimated: Two Successful Pre-registered Replications and Extensions of Miller and Ratner (1998)." *Collabra: Psychology* 7(1), 2021. https://online.ucpress.edu/collabra/article/7/1/23443/117009/
38. Haaland, I., Roth, C. and Wohlfart, J. (2020). "Designing Information Provision Experiments." Warwick Economics Research Paper 1275. https://warwick.ac.uk/fac/soc/economics/research/workingpapers/2020/twerp_1275_-_roth.pdf
39. Stantcheva, S. (2021). "Understanding Tax Policy: How do People Reason?" *Quarterly Journal of Economics*. doi:10.1093/qje/qjab033 (Crossref abstract)
40. Chong, D. and Druckman, J. (2007). "Framing Theory." *Annual Review of Political Science* 10. doi:10.1146/annurev.polisci.10.072805.103054 (Crossref abstract)
41. Reuters Institute Digital News Report 2026, United Kingdom page. https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2026/united-kingdom
42. Reuters Institute Digital News Report 2026, executive summary. https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2026/dnr-executive-summary
43. Electoral Commission, "Public attitudes to elections and democracy: 2026 findings." https://www.electoralcommission.org.uk/research-reports-and-data/public-attitudes/public-attitudes-elections-and-democracy-2026-findings
44. Electoral Commission press release, 25 June 2026, "Misinformation concerns grow but public confidence in elections remain high." https://www.electoralcommission.org.uk/media-centre/misinformation-concerns-grow-public-confidence-elections-remain-high
45. Electoral Commission, "Public attitudes to elections and democracy: 2025 findings." https://www.electoralcommission.org.uk/research-reports-and-data/public-attitudes/public-attitudes-elections-and-democracy-2025-findings
46. Electoral Commission press release, 9 July 2025, "Strong confidence in running of elections, but appetite for more voter information." https://www.electoralcommission.org.uk/media-centre/strong-confidence-running-elections-appetite-more-voter-information
47. The Trust Project (2023). "The Search for Credibility." https://thetrustproject.org/wp-content/uploads/2023/09/9.13.23-FINAL-CORRECTED-The-Search-for-Credibility.pdf
48. Karlsson, M., Clerwall, C. and Nord, L. (2014). "You Ain't Seen Nothing Yet: Transparency's (lack of) effect on source and message credibility." *Journalism Studies*. doi:10.1080/1461670X.2014.886837 (Crossref; article page returned 403)
49. Electoral Commission press release, 22 June 2021, "Public confidence in elections at highest level for 10 years." https://www.electoralcommission.org.uk/media-centre/public-confidence-elections-highest-level-10-years
50. Vote Smart, English Wikipedia (Political Courage Test response rates 1996/2008/2016, citing *Wall Street Journal* 25 Oct 2006 and *Washington Monthly* 4 Nov 2016). https://en.wikipedia.org/wiki/Vote_Smart
51. Vote Smart, "Political Courage Test." https://justfacts.votesmart.org/about/political-courage-test
52. smartvote, "About." https://www.smartvote.ch/en/about
53. Democracy Club, "Who's on the ballot? A look at Democracy Club's general election database," 29 June 2024. https://democracyclub.org.uk/blog/2024/06/29/whos-on-the-ballot-a-look-at-democracy-clubs-general-election-database/
54. Democracy Club, "2024 general election postcode search summary," 4 July 2024. https://democracyclub.org.uk/blog/2024/07/04/2024-general-election-postcode-search-summary/
55. Democracy Club, "2024 elections report," 29 August 2024. https://democracyclub.org.uk/blog/2024/08/29/2024-elections-report/
56. Democracy Club, "Collecting candidate statements is hard, let's collect emails instead," 24 January 2024. https://democracyclub.org.uk/blog/2024/01/24/collecting-candidate-statements-is-hard-lets-collect-emails-instead/
57. Democracy Club, "Party and candidate material for the 2024 local elections," 19 April 2024. https://democracyclub.org.uk/blog/2024/04/19/party-and-candidate-material-for-the-2024-local-elections/
58. Tomz, M. and Van Houweling, R. (2009). "The Electoral Implications of Candidate Ambiguity." *American Political Science Review*. doi:10.1017/S0003055409090066 (Crossref abstract)
59. Sanbonmatsu, D., Kardes, F., Posavac, S. and Houghton, D. (1997). "Contextual Influences on Judgment Based on Limited Information." *Organizational Behavior and Human Decision Processes*. doi:10.1006/obhd.1997.2686 (Crossref; the omission-neglect definition is as given in the *Judgment and Decision Making* 2023 abstract found via Semantic Scholar, doi:10.1017/jdm.2022.2)
60. Johnson, R. and Levin, I. (1985). "More Than Meets the Eye: The Effect of Missing Information on Purchase Evaluations." *Journal of Consumer Research*. doi:10.1086/208505 (Crossref)
61. Hsee, C. (1996). "The Evaluability Hypothesis." *Organizational Behavior and Human Decision Processes*. doi:10.1006/obhd.1996.0077 (Crossref)
62. Hsee, C. and Zhang, J. (2010). "General Evaluability Theory." *Perspectives on Psychological Science*. doi:10.1177/1745691610374586 (Crossref abstract)
63. Lupia, A. (1994). "Shortcuts Versus Encyclopedias." *American Political Science Review*. doi:10.2307/2944882 (Crossref abstract)
64. "Conflict-of-interest editing on Wikipedia," English Wikipedia. https://en.wikipedia.org/wiki/Conflict-of-interest_editing_on_Wikipedia
65. Epstein, R. and Robertson, R. (2015). "The search engine manipulation effect (SEME)." *PNAS*. doi:10.1073/pnas.1419828112 (Crossref abstract)
66. Elections Act 2022, Part 6, ss.39–48. https://www.legislation.gov.uk/ukpga/2022/37/part/6 (text read via legislation.gov.uk data feed)
67. Electoral Commission, "Imprints on digital material." https://www.electoralcommission.org.uk/political-registration-and-regulation/imprints/imprints-digital-material
68. Representation of the People Bill, bill page and stages. https://bills.parliament.uk/bills/4080 and https://bills.parliament.uk/bills/4080/stages
69. Representation of the People Bill, HL Bill 47 (as brought from the Commons, 3 September 2026). https://bills.parliament.uk/publications/67603/documents/8726
70. Representation of the People Bill, Explanatory Notes to HL Bill 47, paras 66–67, 95. https://bills.parliament.uk/publications/67627/documents/8732
71. Electoral Commission, Code of Practice for non-party campaigners. https://www.electoralcommission.org.uk/non-party-campaigner-code-practice
72. Electoral Commission, response to consultation on the Code of Practice for non-party campaigners. https://www.electoralcommission.org.uk/news-and-views/our-consultations/response-consultation-code-practice-non-party-campaigners
73. Defamation Act 2013, ss.1–5, 7. https://www.legislation.gov.uk/ukpga/2013/26
74. Representation of the People Act 1983, s.106. https://www.legislation.gov.uk/ukpga/1983/2/section/106
75. Copyright, Designs and Patents Act 1988, s.30(1ZA). https://www.legislation.gov.uk/ukpga/1988/48/section/30
76. Online Safety Act 2023, s.3. https://www.legislation.gov.uk/ukpga/2023/50/section/3
77. Online Safety Act 2023, Schedule 1, paras 4–5. https://www.legislation.gov.uk/ukpga/2023/50/schedule/1
78. Ofcom, "Guide for services" (Online Safety). https://www.ofcom.org.uk/online-safety/illegal-and-harmful-content/guide-for-services
79. ICO, "What is personal information: a guide." https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/personal-information-what-is-it/what-is-personal-information-a-guide/
80. ICO, Guide to PECR, "Cookies and similar technologies." https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/cookies-and-similar-technologies/
81. Data (Use and Access) Act 2025, s.112 (commencement 5 February 2026, SI 2026/82). https://www.legislation.gov.uk/ukpga/2025/18/section/112
82. Data (Use and Access) Act 2025, Schedule 12 (inserting PECR Schedule A1). https://www.legislation.gov.uk/ukpga/2025/18/schedule/12
83. Equality Act 2010, s.29. https://www.legislation.gov.uk/ukpga/2010/15/section/29
84. Public Sector Bodies (Websites and Mobile Applications) (No. 2) Accessibility Regulations 2018, reg. 3. https://www.legislation.gov.uk/uksi/2018/952/regulation/3
85. Shout Out UK, 2 March 2026, "New study reveals 15-year-olds are ready to vote but feel 'locked out'…" (reporting the University of Nottingham / London Metropolitan University study). https://www.shoutoutuk.org/2026/03/02/new-study-reveals-15-year-olds-are-ready-to-vote-but-feel-locked-out-by-lack-of-political-literacy-education/
86. Wagner, M., Johann, D. and Kritzinger, S. (2012). "Voting at 16: Turnout and the quality of vote choice." *Electoral Studies*. doi:10.1016/j.electstud.2012.01.007 (Crossref; abstract not re-read — finding stated from the literature, medium confidence)
87. Eichhorn, J. (2018). "Votes At 16: New Insights from Scotland on Enfranchisement." *Parliamentary Affairs* 71(2). https://academic.oup.com/pa/article/71/2/365/4210024

Pages that would not load today (so nothing from them is cited): pnas.org article pages; tandfonline.com article pages (403); the PubMed record for Kamoen et al. and the Springer page for Freeder et al. (proxy rate limit); ballotpedia.org statistics and annual-report pages; abgeordnetenwatch.de sub-pages (404); the Electoral Commission's 2024 general election report (403); ICO's newer "storage and access technologies" guidance page (404); OSF preprint pages (empty).
