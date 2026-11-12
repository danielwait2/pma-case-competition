# Resources search in members’ own words

**Problem.** Weekly active members fell from 41 to 23. Members searching for interview topics missed relevant practice content because search only checked resource titles and descriptions.

**Evidence and size.** Filter events.csv to signed-in /resources searches with zero results, Oct 11–Nov 7. Count rows, unique phrases, and unique members: 76 searches, 18 phrases, 44 members. Owen said, “I don't know what the officers call things.” (case-kit/interviews/02-owen.md)

The [supplemental click log](https://drive.google.com/drive/folders/1AtuzHJMGt2meIxbtXTMCMa6d0CpnwlRa) showed 33 signed-in Resources sessions with a search-box click, Oct 20–Nov 9. Only 3 also recorded a result click (9%). This favored improving results over moving the search box.

**Spec.** Match members’ phrases and common misspellings to existing resource cards, practice topics, and videos. Preserve exact-title matches. Measure targeted search sessions followed by a relevant content open, then track next-week return.

**Shipped.** [Open the public Resources search demo](https://pma-member-resource-search.vercel.app/resources). No sign-in required. Try `case interview`, `behavorial`, or `google interview`. Desktop and mobile checks verified relevant destinations for all 18 phrases. Post-launch impact remains unmeasured.
