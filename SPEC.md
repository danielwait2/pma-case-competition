# Braxdon Simmons: Search that finds interview prep

**Problem.** Resources search only checks the 16 library links, not the practice videos or interview guides, so members searching "case interview" or "behavioral" get "No resources found" and leave. This beats the hackathon (0 of 29 lost members visited it), the paywall (affects people never counted) and dark mode (about 3 people).

**Evidence and size.** 85 of 106 searches returned nothing (`events.csv`, `results_count = 0`). 25 of the 29 members active Oct 11 to 17 but not Nov 1 to 7 hit an empty search; only 14 of 49 empty-search members came back, against 5 of 9 whose searches worked. In replays (`clicks.csv`), 16 of 23 sessions ended right after the empty message. "We search, we get nothing, we leave." (`interviews/02-owen.md`)

**Spec.** For: members prepping for interviews. Does: searches videos, guides and student synonyms; no dead-end empty state; "This week in recruiting" strip with open APM List programs and starter videos; videos play in place. Not building: calendar, account-synced tracking. Success metric: searches with results, 20% to 80%+. Guardrail: resource and video clicks per session don't drop.

**Shipped.** All 106 logged searches now return results. Pull request against `/resources`.
