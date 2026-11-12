import { PLAYBOOK_STEPS } from "@/lib/apmPlaybook";
import { RESOURCE_CATEGORIES } from "@/lib/resources";
import { VIDEO_LIBRARY, type LibraryVideo } from "@/lib/videoLibrary";

const TOPIC_KEYWORDS: Record<string, string[]> = {
  basics: ["basics", "structure", "rubric", "first round", "what to expect", "interview process", "how interviews work", "beginner", "start", "google interview", "meta interview", "openai"],
  "product-sense": ["product sense", "product design", "design", "case", "case interview", "improve", "favorite product", "mock"],
  strategy: ["strategy", "market", "launch", "growth", "business", "competitor"],
  execution: ["execution", "analytical", "metrics", "root cause", "goals", "kpi", "data", "decline", "a/b"],
  estimation: ["estimation", "estimate", "market sizing", "sizing", "guesstimate", "fermi", "how many"],
  behavioral: ["behavioral", "behavorial", "behavioural", "leadership", "tell me about yourself", "star", "star method", "stpar", "why pm", "conflict", "drive", "amazon leadership"],
  technical: ["technical", "system design", "engineering", "api", "architecture"],
  "breaking-in": ["breaking in", "career", "day in the life", "new to pm", "what is a pm", "apm"],
};

const PLAYBOOK_KEYWORDS: Record<string, string[]> = {
  interviews: ["interview", "case", "behavioral", "behavorial", "tell me about yourself", "star"],
  resume: ["resume", "cv"],
  networking: ["networking", "coffee chat", "referral", "linkedin"],
  applications: ["deadline", "deadlines", "apply", "application", "apm", "internship", "jobs"],
};

const WEAK_WORDS = new Set(["interview", "interviews", "pm", "prep", "practice", "question", "questions", "mock", "mocks", "video", "videos", "the", "a", "an", "for", "to", "how", "of", "and", "in", "on", "my"]);

export type SearchHit =
  | { kind: "topic"; slug: string; title: string; description: string; count: number; score: number }
  | { kind: "video"; video: LibraryVideo; topicSlug: string; topicTitle: string; score: number }
  | { kind: "playbook"; stepId: string; title: string; description: string; score: number }
  | { kind: "resource"; title: string; categorySlug: string; score: number };

type HitBase = SearchHit extends infer H ? (H extends SearchHit ? Omit<H, "score"> : never) : never;

interface Entry {
  hit: HitBase;
  title: string;
  text: string;
  keywords: string[];
  boost: number;
}

const ENTRIES: Entry[] = [
  ...VIDEO_LIBRARY.filter((t) => t.videos.length > 0).flatMap((topic) => {
    const keywords = TOPIC_KEYWORDS[topic.slug] ?? [];
    const guide = topic.guide ? [topic.guide.tests, topic.guide.where].join(" ") : "";
    return [
      {
        hit: { kind: "topic", slug: topic.slug, title: topic.title, description: topic.description, count: topic.videos.length },
        title: topic.title,
        text: `${topic.description} ${guide}`,
        keywords,
        boost: 2,
      } as Entry,
      ...topic.videos.map(
        (video): Entry => ({
          hit: { kind: "video", video, topicSlug: topic.slug, topicTitle: topic.title },
          title: video.title,
          text: topic.title,
          keywords,
          boost: video.startHere ? 1 : 0,
        }),
      ),
    ];
  }),
  ...PLAYBOOK_STEPS.map(
    (step): Entry => ({
      hit: { kind: "playbook", stepId: step.id, title: `APM Playbook: ${step.title}`, description: step.lede },
      title: `${step.title} ${step.shortTitle}`,
      text: [step.lede, step.callout, ...step.lists.flatMap((l) => [l.heading, ...l.items])].join(" "),
      keywords: PLAYBOOK_KEYWORDS[step.id] ?? [],
      boost: 0,
    }),
  ),
  ...RESOURCE_CATEGORIES.flatMap((category) =>
    category.resources.map(
      (resource): Entry => ({
        hit: { kind: "resource", title: resource.title, categorySlug: category.slug },
        title: resource.title,
        text: [resource.description, category.title, ...resource.tips].join(" "),
        keywords: [],
        boost: 0,
      }),
    ),
  ),
].map((e) => ({ ...e, title: e.title.toLowerCase(), text: e.text.toLowerCase() }));

const scoreEntry = (entry: Entry, query: string, tokens: string[]) => {
  let score = 0;
  for (const keyword of entry.keywords) if (` ${query} `.includes(` ${keyword} `)) score += keyword.includes(" ") ? 4 : 3;
  for (const token of tokens) {
    if (entry.title.includes(token)) score += 2;
    else if (entry.text.includes(token)) score += 1;
  }
  return score > 0 ? score + entry.boost : 0;
};

export const searchSite = (raw: string): SearchHit[] => {
  const words = raw.toLowerCase().split(/[^a-z0-9/]+/).filter((w) => w.length > 1);
  const query = words.join(" ");
  if (!query) return [];
  const strong = words.filter((w) => !WEAK_WORDS.has(w));
  const tokens = strong.length > 0 ? strong : words.filter((w) => w.length > 3);
  return ENTRIES.map((entry) => ({ ...entry.hit, score: scoreEntry(entry, query, tokens) }) as SearchHit)
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score);
};
