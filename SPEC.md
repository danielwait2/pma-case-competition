# Resources search in members’ own words

**Problem.** Members search for interview topics. Search checks resource titles and descriptions, leaving relevant practice sections out of the results. Moving sections higher would still leave searchers at an empty result.

**Evidence and size.** In events.csv, filter Oct 11–Nov 7 to signed-in /resources searches with results_count = 0. Counting rows, distinct queries, and distinct user IDs gives 76 searches, 18 phrases, and 44 members. Owen said, “I don't know what the officers call things.” (case-kit/interviews/02-owen.md)

**Spec.** Give existing guides, practice sections, and videos plain-language topic labels. Map common queries and observed misspellings to relevant labels. Keep exact-title matches first and show each destination once. Scope the change to search. Measure the share of sessions with a targeted query that subsequently open relevant content, then track next-week return. Guardrail: previously successful title searches still surface their original resource.

**Shipped.** [Live demo](https://pma-member-resource-search.vercel.app/auth). Sign in as `member@byu.edu` with `demo1234`. Try `case interview`, `behavorial`, or `google interview`. Desktop and mobile browser checks found the intended destination for all 18 phrases. Post-launch conversion and retention remain unmeasured.
