# Parity audit (WP-B1), 19 September 2026

Every template and query was read for party-dependent branches. Findings:

| Place | Branch on party? | Result |
|---|---|---|
| Candidate row (`CandidateCard`) | Colour and emblem only, from `parties.colour_hex` / `emblem_url`; neutral grey and no emblem when absent. Layout, order, slots identical. | Parity |
| Comparison matrix | Column colour bar only; all candidates default; ballot order. | Parity |
| Topic page | Row colour bar only. | Parity |
| Coverage grid | Identical count computation; independents listed individually. | Parity |
| Claims lookup (`claimsFor`) | Party-level claims attach by effective party (joint registrations inherit parent). Independents have no party layer by definition; their own statements are counted identically. | Parity, documented on About |
| Invitation state | Same five wordings for everyone; default "Not yet invited". | Parity |
| Action block | Party-site link only when a party site exists; otherwise omitted, never replaced. | Parity |
| Receipt | Modelled sets exist only where a sourced pledge maps to a PolicyEngine parameter; the absence line is identical for all. | Parity; note that only parties with modellable pledges can ever show one |
| Party colours | Established public colours only; 12 of 21 parties. Others neutral with a stored note. No colour is assigned by us. | Parity by rule; Romily to confirm colours at all |

Open item: invitations must actually be issued to every nominated candidate before polling day; the log at /ledger proves whether that happened.
