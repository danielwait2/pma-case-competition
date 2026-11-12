# Team Dawson: Search that finds interview prep

**Problem.** Search on /resources only indexes category links, so existing members who search for interview prep ("case interview", "product sense", "behavioral") hit "No resources found" and leave, even though Practice Interviews covers it. This beats slow member approval, which affects new accounts the north star doesn't count yet, and video overload (about 5 members).

**Evidence and size.** 76 of 97 searches (78%) returned zero results (events.csv, `search` with `results_count = 0`, Oct 11 to Nov 7). Members with a zero-result search came back the next week 12% of the time vs 74% without one; 37 of 53 lost member-weeks followed one. 49 of 65 north star members hit it. "We search, we get nothing, we leave." (interviews/02-owen.md)

**Spec.** For: existing members prepping for PM interviews. Does: search covers Practice Interviews videos, tabs and APM Playbook steps with synonyms; a zero-result search shows Practice Interviews instead of a dead end; a "Start here for interview prep" link at the top helps members who browse. Not building: approval changes, dark mode, more content. Success metric: zero-result search rate (78% now) and next-week return of searchers (12% now). Guardrail: resource clicks must not fall.

**Shipped.** New `src/lib/siteSearch.ts` indexes resources, videos, interview tabs and playbook steps with synonyms; wired into `/resources`. All 18 distinct zero-result queries from events.csv now return results.
