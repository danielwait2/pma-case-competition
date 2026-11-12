# Fortnite: Make interview prep findable from search

**Problem.** Returning members search for interview prep, get "No resources found", and stop coming back. Search only checks the 16 link cards, never the 55 practice interview videos, and typing a query hides the video library. This beats the lock screen (new accounts that never counted toward the north star) and dark mode or mobile nav (3 users).

**Evidence and size.** Members approved before Oct 11 fell from 38 to 16 weekly actives (−22 of the −18 net drop). 23 of the 27 who lapsed hit a zero-result search. After a member's first search, 3 of 20 came back within 14 days when it found nothing vs 12 of 12 when it found something (events.csv joined to users.csv). "search doesn't work?? typed product sense and it said no resources found" (feedback.csv).

**Spec.** For: returning members prepping for interviews (49 hit a dead-end search). Does: moves Practice Interviews to the top; tags every video (round, length, company, level); search covers videos with synonyms (case, behavioral, STAR, market sizing); videos stay visible while searching; dead ends suggest topics. Not building: new content, dark mode, mobile nav, approval flow. Success metric: weekly active members on /resources. Leading: zero-result search rate. Guardrail: resource clicks and video opens per member.

**Shipped.** `src/lib/videoSearch.ts`, `PracticeInterviews.tsx`, `ResourcesPage.tsx`.
