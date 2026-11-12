import { VIDEO_LIBRARY, type LibraryVideo, type VideoTopic } from "@/lib/videoLibrary";

export type LengthTag = "Quick" | "Medium" | "Full mock";
export type LevelTag = "Beginner" | "Practice";

export interface TaggedVideo extends LibraryVideo {
  topicSlug: string;
  round: string;
  length: LengthTag;
  company: string | null;
  level: LevelTag;
  haystack: string;
}

const COMPANIES = ["Google", "Meta", "Amazon", "Microsoft", "Airbnb", "Netflix", "Uber", "Flipkart", "OpenAI"];

// Words students actually type, mapped to the interview round they mean.
const TOPIC_SYNONYMS: Record<string, string[]> = {
  basics: ["basics", "structure", "rubric", "overview", "process", "what to expect", "beginner", "intro"],
  "product-sense": ["product sense", "product design", "design", "case", "case interview", "improve", "favorite product", "circles"],
  strategy: ["strategy", "go to market", "gtm", "growth", "market entry", "competition", "case", "business"],
  execution: ["execution", "analytical", "analytics", "metrics", "metric", "root cause", "a/b", "ab test", "north star", "kpi", "data"],
  estimation: ["estimation", "estimate", "market sizing", "sizing", "guesstimate", "fermi", "math"],
  behavioral: ["behavioral", "behavioural", "behavior", "star", "star method", "leadership", "story", "stories", "tell me about yourself", "why this company", "googleyness", "culture fit", "conflict"],
  technical: ["technical", "tech", "system design", "engineering", "ai", "machine learning"],
  "breaking-in": ["breaking in", "apm", "internship", "resume", "career", "new grad", "job"],
};

const LENGTH_SYNONYMS: Record<LengthTag, string[]> = {
  Quick: ["quick", "short", "fast", "under 10"],
  Medium: ["medium"],
  "Full mock": ["full mock", "long", "full"],
};

const STOPWORDS = new Set([
  "interview", "interviews", "interviewing", "question", "questions", "mock", "mocks", "practice", "prep", "preparation",
  "video", "videos", "pm", "for", "the", "a", "an", "to", "how", "of", "on", "and", "with", "my", "round", "rounds",
]);

const lengthOf = (minutes: number): LengthTag => (minutes < 10 ? "Quick" : minutes < 25 ? "Medium" : "Full mock");

const companyOf = (title: string) => {
  const lead = title.split(":")[0];
  return COMPANIES.find((company) => lead.includes(company)) ?? null;
};

const levelOf = (topic: VideoTopic, video: LibraryVideo): LevelTag =>
  video.startHere || topic.slug === "basics" || topic.slug === "breaking-in" ? "Beginner" : "Practice";

export const TAGGED_VIDEOS: TaggedVideo[] = VIDEO_LIBRARY.flatMap((topic) =>
  topic.videos.map((video) => {
    const length = lengthOf(video.minutes);
    const company = companyOf(video.title);
    const level = levelOf(topic, video);
    const haystack = [
      video.title,
      topic.title,
      topic.description,
      length,
      company ?? "",
      level,
      ...(TOPIC_SYNONYMS[topic.slug] ?? []),
      ...LENGTH_SYNONYMS[length],
    ]
      .join(" | ")
      .toLowerCase();
    return { ...video, topicSlug: topic.slug, round: topic.title, length, company, level, haystack };
  }),
);

export const TAGS_BY_VIDEO = new Map(TAGGED_VIDEOS.map((video) => [video.youtubeId, video]));

export const queryTerms = (query: string) =>
  query
    .toLowerCase()
    .replace(/[^a-z0-9/\s]/g, " ")
    .split(/\s+/)
    .filter((term) => term && !STOPWORDS.has(term));

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const matchesTerms = (haystack: string, terms: string[]) => {
  const text = haystack.toLowerCase();
  return terms.every((term) => new RegExp(`(^|[^a-z0-9])${escapeRegExp(term)}`).test(text));
};

export const searchVideos = (query: string) => {
  if (!query.trim()) return [];
  const terms = queryTerms(query);
  // A query made only of generic words ("mock interview videos") means "show me the videos".
  if (terms.length === 0) return TAGGED_VIDEOS;
  return TAGGED_VIDEOS.filter((video) => matchesTerms(video.haystack, terms)).sort(
    (a, b) => Number(Boolean(b.startHere)) - Number(Boolean(a.startHere)) || a.minutes - b.minutes,
  );
};

export const SUGGESTED_SEARCHES = ["Product sense", "Behavioral", "Estimation", "Metrics", "Strategy", "Quick"];
