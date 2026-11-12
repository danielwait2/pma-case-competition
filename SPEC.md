# Ligia and Dan: Make Resources search find interview prep

**Problem.** Search only checks resource card titles and descriptions, so searches like "case interview" return nothing despite 56 practice interview videos, and members leave. Among dropped members, 35 hit an empty search versus 9 with a video-only last visit; the approval leak hits new accounts that never counted toward the 41.

**Evidence and size.** In events.csv, for members active one week but not the next (Oct 11 to 31), 48 of 51 searches in their final session returned results_count = 0, versus 7 of 13 for members who returned. That touches 35 distinct members, 10 to 13 of the 16 to 19 who drop each week. Owen (interviews/02-owen.md): "We search, we get nothing, we leave."

**Spec.** For: members searching for interview prep. Does: searches the video library and resource tips, matching word by word plus common terms like "case interview" and "star method". Not building: typo correction, playbook search, approval changes. Success metric: 0-result search rate (78% of 97 searches, Oct 11 to Nov 7). Guardrail: share of searches followed by a resource click or video open.

**Shipped.** PR on branch `fix/search-interview-prep`: `src/lib/search.ts`, `ResourcesPage.tsx`. 82 of 85 past 0-result searches now return results.
