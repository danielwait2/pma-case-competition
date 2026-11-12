# Lonely Cougars: Search that finds the interview prep

**Problem.** Members search Resources for interview prep, get zero results, and stop coming back. It beats other causes because it hits existing members: 24 of the 29 who dropped hit an empty search, versus 17 of 29 who opened a video. Approval delays only hit non-members.

**Evidence and size.** 76 of 97 searches on /resources from Oct 11 to Nov 7 returned 0 results (`events.csv`, `event = search`, `results_count = 0`). 24 of the 29 members active Oct 11 to 17 but not Nov 1 to 7 hit at least one. "We search, we get nothing, we leave." (`case-kit/interviews/02-owen.md`)

**Spec.** For: members searching Resources for interview prep. Does: search also matches Practice Interviews video titles and section names; when nothing matches, an encouraging message replaces the dead end. Not building: any change to the videos. Success metric: at least 90% of searches return a result (now 21 of 97, 22%). Guardrail: share of searches with results followed by opening a result, video, or category must not drop.

**Shipped.** Search now matches interview sections and videos, tolerates typos, and shows an encouraging empty state with buttons to each round. Replaying all 97 real searches: 97 return results (was 21).
