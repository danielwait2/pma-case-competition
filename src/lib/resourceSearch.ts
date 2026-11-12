import { RESOURCE_CATEGORIES, type CuratedResource, type ResourceCategory } from "@/lib/resources";
import { VIDEO_LIBRARY, type LibraryVideo, type VideoTopic } from "@/lib/videoLibrary";

// Words members actually type, mapped to the Practice Interviews tab that answers them.
const TOPIC_SYNONYMS: Record<string, string[]> = {
  "product-sense": ["case", "case interview", "case study", "product sense", "product design", "design", "improve", "favorite product", "circles"],
  behavioral: ["behavioral", "behavioural", "behavorial", "behaviorial", "star", "star method", "tell me about yourself", "leadership", "story", "stories", "why this company", "amazon lp", "leadership principles"],
  estimation: ["estimation", "estimate", "estimating", "market size", "market sizing", "guesstimate", "fermi"],
  execution: ["execution", "analytical", "metrics", "metric", "root cause", "a/b", "ab test", "north star", "drop", "decline"],
  strategy: ["strategy", "strategic", "launch", "go to market"],
  technical: ["technical", "system design", "ai risk", "api"],
  basics: ["mock", "mock interview", "practice interview", "interview videos", "first round", "interview prep", "rubric", "interview structure", "what to expect", "google interview", "meta interview", "openai interview"],
  "breaking-in": ["apm", "internship", "resume", "breaking in", "no experience", "day in the life"],
};

const WEAK_WORDS = new Set(["pm", "interview", "interviews", "prep", "video", "videos", "question", "questions", "for", "the", "a", "an", "and", "to", "of", "how", "what", "help", "with", "my", "practice"]);

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9/ ]+/g, " ").replace(/\s+/g, " ").trim();

export interface TopicHit { topic: VideoTopic; score: number }
export interface VideoHit { video: LibraryVideo; topic: VideoTopic; score: number }
export interface ResourceHit { resource: CuratedResource; category: ResourceCategory; score: number }

export interface SearchResults {
  topics: TopicHit[];
  videos: VideoHit[];
  resources: ResourceHit[];
  total: number;
}

const topicText = (t: VideoTopic) =>
  normalize([t.title, t.description, t.guide?.tests, t.guide?.where, ...(t.guide?.approach ?? [])].filter(Boolean).join(" "));

const hasWord = (text: string, word: string) => ` ${text}`.includes(` ${word}`);

const scoreText = (q: string, tokens: string[], title: string, body: string) => {
  let score = 0;
  if (hasWord(title, q)) score += 10;
  else if (hasWord(body, q)) score += 5;
  for (const t of tokens) {
    if (hasWord(title, t)) score += 3;
    else if (hasWord(body, t)) score += 1;
  }
  return score;
};

export const matchedTopicSlugs = (query: string) => {
  const q = ` ${normalize(query)} `;
  return Object.entries(TOPIC_SYNONYMS)
    .filter(([, words]) => words.some((w) => q.includes(` ${w} `) || q.includes(` ${w}s `)))
    .map(([slug]) => slug);
};

export const searchLibrary = (query: string): SearchResults => {
  const q = normalize(query);
  if (!q) return { topics: [], videos: [], resources: [], total: 0 };
  const tokens = q.split(" ").filter((t) => t.length > 2 && !WEAK_WORDS.has(t));
  const synonymTopics = new Set(matchedTopicSlugs(q));

  const topics: TopicHit[] = VIDEO_LIBRARY.map((topic) => ({
    topic,
    score: (synonymTopics.has(topic.slug) ? 20 : 0) + scoreText(q, tokens, normalize(topic.title), topicText(topic)),
  })).filter((h) => h.score >= 3);

  const videos: VideoHit[] = VIDEO_LIBRARY.flatMap((topic) =>
    topic.videos.map((video) => ({
      video,
      topic,
      score:
        (synonymTopics.has(topic.slug) ? 6 + (video.startHere ? 3 : 0) : 0) +
        scoreText(q, tokens, normalize(video.title), normalize(topic.title)),
    })),
  ).filter((h) => h.score >= 3);

  const resources: ResourceHit[] = RESOURCE_CATEGORIES.flatMap((category) =>
    category.resources.map((resource) => ({
      resource,
      category,
      score: scoreText(q, tokens, normalize(resource.title), normalize([resource.description, ...resource.tips, category.title].join(" "))),
    })),
  ).filter((h) => h.score >= 3);

  topics.sort((a, b) => b.score - a.score);
  videos.sort((a, b) => b.score - a.score || a.video.minutes - b.video.minutes);
  resources.sort((a, b) => b.score - a.score);

  const result = { topics: topics.slice(0, 2), videos: videos.slice(0, 6), resources: resources.slice(0, 6) };
  return { ...result, total: result.topics.length + result.videos.length + result.resources.length };
};

// Shown when nothing matches, so an empty search never ends in a dead end.
export const STARTER_VIDEOS: VideoHit[] = VIDEO_LIBRARY.flatMap((topic) =>
  topic.videos.filter((v) => v.minutes <= 6 && /structure|rubric|story bank/i.test(v.title)).map((video) => ({ video, topic, score: 0 })),
);

export const STARTER_TOPICS = ["product-sense", "behavioral", "estimation", "execution"]
  .map((slug) => VIDEO_LIBRARY.find((t) => t.slug === slug))
  .filter((t): t is VideoTopic => !!t);
