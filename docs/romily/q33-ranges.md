# Round ten, Q33: money figures from a partly answered household

For Romily to look at on the draft before suggesting changes. Website only; the app is unchanged.

## What you will see

Until now, the money figures under each candidate's "Money and cost of living" topic appeared only after all seven household questions were answered.

On the draft:
- **Income band not answered:** no money figures, as now.
- **Income band answered, and some other questions not:** each candidate whose party has a modelled pledge shows a range. It runs from the lowest to the highest monthly change across every household in our grid that matches the answers given. It never shows a middle figure and never says "about". For example:
  > Between £18 and £73 more a month for households like yours.
  > Answer your age, your household, your children and your home to narrow it.
- **The range crosses zero** (some matching households gain and some lose): no figures. It says:
  > Could be more or less a month, depending on your home.
- **Every matching household gets the same change:** one figure, for example "£33 more a month for households like yours", or "No change for households like yours".
- **All seven answered:** exactly as now. That means the full table, with the "About £35 a month more" headline.

Every party gets the same template, in ballot-paper order, as now. Under each figure, a "Why a range?" link opens a short explanation: how many households in the grid matched, and that the middle of a range is no more likely than its ends.

The household summary line now says "Money figures show as a range until every question is answered." Before the income band is answered, it says "Money figures start once you give your household income." It used to say "Money figures need every answer."

## Where to look

Open the draft link Barny sends, then add these paths. The Holborn and St Pancras by-election (8 October 2026) is the only current ballot with modelled pledges: Reform UK, the Liberal Democrats and the Green Party. Open a candidate and scroll to "Money and cost of living".

| What | Path to add to the draft link |
|---|---|
| A range (income and work answered) | `/ballot/parl.holborn-and-st-pancras.by.2026-10-08?income_band=25k_40k&employment=employed` |
| A narrower range (plus a couple) | `/ballot/parl.holborn-and-st-pancras.by.2026-10-08?income_band=25k_40k&employment=employed&household=couple` |
| Income only (wider) | `/ballot/parl.holborn-and-st-pancras.by.2026-10-08?income_band=25k_40k` |
| A range of losses (Greens, high income) | `/ballot/parl.holborn-and-st-pancras.by.2026-10-08?income_band=over_100k` |
| Complete: exactly as now | `/ballot/parl.holborn-and-st-pancras.by.2026-10-08?age_band=25_34&household=couple&children=none&tenure=private_rent&income_band=25k_40k&employment=employed&student=no` |
| No income answered: nothing shown | `/ballot/parl.holborn-and-st-pancras.by.2026-10-08?employment=employed&household=couple` |
| The 2024 archive (Conservatives' 6% National Insurance, under 2024 law) | `/ballot/parl.holborn-and-st-pancras.2024-07-04?income_band=40k_60k` |

**A range that crosses zero: there's no live example.** Each of the four pledges we model moves money one way only for every household: three only add money and the Greens' only takes it away. So no partly answered household gets "could be more or less" today. The wording is built and tested, and it will appear as soon as a pledge that mixes gains and losses is modelled.

What the first link shows, per candidate:

| Party | Shown |
|---|---|
| Reform UK (personal allowance £15,000) | Between £18 and £73 more a month |
| Liberal Democrats (personal allowance and NI threshold £15,000) | Between £26 and £92 more a month |
| Green Party (remove the NI upper earnings limit) | No change for households like yours |

## Things that differ from the proposal

1. **Which answers are named.** The proposal's example was "Answer your household and your home to narrow it". We now name every missing answer that would narrow the range for some way of answering it. For income plus "employed", that is all four: a pensioner, a couple, no children, or owning a home each raises the lowest figure. So the sentence reads "Answer your age, your household, your children and your home to narrow it." With "a couple" added too, it becomes "your age and your home".
2. **Households we never show figures for are left out of the range.** The site withholds figures for 16 and 17-year-old households, for a household on a visa or seeking asylum, and for single full-time students with no children. Their rows are not counted in the range either. The proposal's counts were 1,350, 270 and 90 matching households. On the draft they are 1,125, 225 and 75, and the ranges are the same: £0 to £73, £18 to £73, £33 to £73.
3. **A single figure is exact.** When every matching household gets the same change, we show it to the pound ("£33 more a month"). The complete view still rounds to £5 with "About" ("About £35 a month more"), as now. The proposal's table said "£33 more (as now)", but today's complete view says "About £35".

## Questions for you

1. **Naming the answers:** name every answer that would narrow it (as built), or only the one or two that narrow it most? The full list can run to four.
2. **A range that starts at nothing:** for income alone, the range reads "Between £0 and £73 more a month". Is that clear, or would you prefer "Up to £73 more a month"?
3. **Crossing zero:** is "Could be more or less a month, depending on your home." the wording you want? An alternative is "Some households like yours would get more and some less, depending on your home."
4. **The single figure:** keep it exact when the answers are partial ("£33 more"), or match the complete view's rounded "About £35"?
5. **The app:** should the app get the same rule now? It already downloads every household in each pledge, so it can work the ranges out on the phone with the same code. No change to what the website sends it is needed.
