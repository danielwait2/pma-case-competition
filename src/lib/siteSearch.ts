import { PLAYBOOK_STEPS } from "@/lib/apmPlaybook";
import { RESOURCE_CATEGORIES } from "@/lib/resources";
import { VIDEO_LIBRARY, type LibraryVideo } from "@/lib/videoLibrary";

const TOPIC_KEYWORDS: Record<string, string[]> = {
  basics: [
    "basics", "structure", "framework", "circles", "rubric", "first round", "first time", "what to expect", "interview process",
    "how interviews work", "beginner", "prepare", "overview", "answer", "good answer", "example", "sample", "google interview",
    "meta interview", "openai",
  ],
  "product-sense": ["product sense", "product design", "design", "case", "case interview", "case study", "improve", "favorite product"],
  strategy: ["strategy", "market strategy", "launch", "growth", "competitor"],
  execution: ["execution", "analytical", "metrics", "root cause", "goals", "kpi", "decline", "a/b", "a/b testing"],
  estimation: ["estimation", "estimate", "market sizing", "sizing", "guesstimate", "fermi", "how many"],
  behavioral: [
    "behavioral", "behavioural", "behavorial", "leadership", "tell me about yourself", "star", "star method", "stpar", "why pm", "conflict",
    "amazon leadership",
  ],
  technical: ["technical", "system design", "engineering", "api", "architecture"],
  "breaking-in": ["breaking in", "career", "day in the life", "new to pm", "what is a pm", "what do pms do"],
};

const PLAYBOOK_KEYWORDS: Record<string, string[]> = {
  interviews: ["interview", "case", "behavioral", "behavorial", "tell me about yourself", "star"],
  resume: ["resume", "cv"],
  networking: ["networking", "coffee chat", "referral", "linkedin"],
  applications: ["deadline", "apply", "application", "apm", "internship", "job"],
};

const STOP_WORDS = new Set(
  "a an the and or of to in on for with from by at is are was be do does did i me my you your it this that what where when how can could should would need want find get about last week weeks meeting tips help some any".split(" "),
);
const WEAK_WORDS = new Set(["interview", "product", "pm", "prep", "practice", "question", "mock", "video", "watch"]);
const SHORT_WORDS = new Set(["short", "quick", "brief", "min", "mins", "minute", "minutes", "fast"]);

const singular = (w: string) => (w.length > 4 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w);

const withinOneEdit = (a: string, b: string) => {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  if (a.length === b.length) {
    if (a.slice(i + 1) === b.slice(i + 1)) return true;
    return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2);
  }
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
};

const wordMatches = (token: string, word: string) =>
  token === word || (token.length >= 5 && word.length >= 5 && withinOneEdit(token, word));

const toWords = (text: string) => text.toLowerCase().split(/[^a-z0-9/]+/).filter((w) => w.length > 1).map(singular);

export type SearchHit =
  | { kind: "topic"; slug: string; title: string; description: string; count: number; score: number }
  | { kind: "video"; video: LibraryVideo; topicSlug: string; topicTitle: string; score: number }
  | { kind: "playbook"; stepId: string; title: string; description: string; score: number }
  | { kind: "resource"; title: string; categorySlug: string; score: number };

type HitBase = SearchHit extends infer H ? (H extends SearchHit ? Omit<H, "score"> : never) : never;

interface Entry {
  hit: HitBase;
  titleWords: string[];
  textWords: string[];
  keywords: string[][];
  boost: number;
  minutes?: number;
}

const entry = (hit: HitBase, title: string, text: string, keywords: string[], boost = 0, minutes?: number): Entry => ({
  hit,
  titleWords: toWords(title),
  textWords: toWords(text),
  keywords: keywords.map(toWords),
  boost,
  minutes,
});

const ENTRIES: Entry[] = [
  ...VIDEO_LIBRARY.filter((t) => t.videos.length > 0).flatMap((topic) => {
    const keywords = TOPIC_KEYWORDS[topic.slug] ?? [];
    return [
      entry(
        { kind: "topic", slug: topic.slug, title: topic.title, description: topic.description, count: topic.videos.length },
        topic.title,
        topic.description,
        keywords,
        2,
      ),
      ...topic.videos.map((video) =>
        entry(
          { kind: "video", video, topicSlug: topic.slug, topicTitle: topic.title },
          video.title,
          topic.title,
          keywords,
          (video.startHere ? 1 : 0) + (video.minutes <= 10 ? 1 : 0),
          video.minutes,
        ),
      ),
    ];
  }),
  ...PLAYBOOK_STEPS.map((step) =>
    entry(
      { kind: "playbook", stepId: step.id, title: `APM Playbook: ${step.title}`, description: step.lede },
      `${step.title} ${step.shortTitle}`,
      [step.lede, ...step.lists.flatMap((l) => l.items)].join(" "),
      PLAYBOOK_KEYWORDS[step.id] ?? [],
    ),
  ),
  ...RESOURCE_CATEGORIES.flatMap((category) =>
    category.resources.map((resource) =>
      entry(
        { kind: "resource", title: resource.title, categorySlug: category.slug },
        resource.title,
        [resource.description, category.title, ...resource.tips].join(" "),
        [],
        1,
      ),
    ),
  ),
];

const containsPhrase = (query: string[], phrase: string[]) =>
  phrase.length > 0 &&
  query.some((_, i) => phrase.every((p, j) => query[i + j] !== undefined && wordMatches(query[i + j], p)));

const scoreEntry = (e: Entry, query: string[], tokens: string[], wantsShort: boolean) => {
  let score = 0;
  for (const keyword of e.keywords) if (containsPhrase(query, keyword)) score += keyword.length > 1 ? 4 : 3;
  for (const token of tokens) {
    if (e.titleWords.some((w) => wordMatches(token, w))) score += 2;
    else if (e.textWords.some((w) => wordMatches(token, w))) score += 1;
  }
  if (score === 0) return 0;
  if (wantsShort && e.minutes !== undefined) score += e.minutes <= 10 ? 4 : -2;
  return Math.max(score + e.boost, 0.5);
};

export const searchSite = (raw: string): SearchHit[] => {
  const words = toWords(raw);
  const wantsShort = words.some((w) => SHORT_WORDS.has(w) || /^\d+$/.test(w));
  const query = words.filter((w) => !SHORT_WORDS.has(w) && !/^\d+$/.test(w));
  const content = query.filter((w) => !STOP_WORDS.has(w));
  const strong = content.filter((w) => !WEAK_WORDS.has(w));
  const tokens = strong.length > 0 ? strong : content;
  if (tokens.length === 0) return [];
  return ENTRIES.map((e) => ({ ...e.hit, score: scoreEntry(e, query, tokens, wantsShort) }) as SearchHit)
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score);
};
