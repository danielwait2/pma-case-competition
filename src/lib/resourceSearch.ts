import { RESOURCE_CATEGORIES, type CuratedResource } from "./resources";
import { VIDEO_LIBRARY, type LibraryVideo, type VideoTopic } from "./videoLibrary";

const TOPIC_KEYWORDS: Record<string, string> = {
  basics: "structure rubric process format how interviews work",
  "product-sense": "product sense design improve favorite product",
  strategy: "case case study case interview strategy market entry growth go to market",
  execution: "execution metrics analytics analytical root cause goals ab test",
  estimation: "estimation estimate market sizing guesstimate math",
  behavioral: "behavioral behavior star method story stories tell me about yourself leadership drive why this company",
  technical: "technical system design engineering",
  "breaking-in": "breaking in apm internship internships resume job",
};

const VIDEO_KEYWORDS = "mock interview interviews video videos practice";

const STOPWORDS = new Set(["a", "an", "the", "for", "of", "to", "and", "how", "on", "in", "pm", "question", "questions", "prep"]);

const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const words = (text: string) => normalize(text).split(" ").filter(Boolean);

const editDistance = (a: string, b: string) => {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = temp;
    }
  }
  return prev[b.length];
};

const tokenMatches = (token: string, word: string) => {
  if (word === token) return true;
  if (token.length >= 3 && word.startsWith(token)) return true;
  if (word.length >= 4 && token.startsWith(word)) return true;
  if (token.length >= 5) return editDistance(token, word) <= (token.length >= 8 ? 2 : 1);
  return false;
};

const matchesAll = (tokens: string[], haystack: string[]) =>
  tokens.every((token) => haystack.some((word) => tokenMatches(token, word)));

export const queryTokens = (query: string) => {
  const all = words(query);
  const meaningful = all.filter((t) => !STOPWORDS.has(t));
  return meaningful.length > 0 ? meaningful : all;
};

export interface ResourceHit {
  resource: CuratedResource;
  categorySlug: string;
}

export interface VideoHit {
  video: LibraryVideo;
  topic: VideoTopic;
}

export interface SearchResults {
  resources: ResourceHit[];
  topics: VideoTopic[];
  videos: VideoHit[];
  total: number;
}

const topicHaystack = (topic: VideoTopic) =>
  words(`${topic.title} ${topic.description} ${TOPIC_KEYWORDS[topic.slug] ?? ""} ${VIDEO_KEYWORDS}`);

export const searchLibrary = (query: string): SearchResults => {
  const tokens = queryTokens(query);
  if (tokens.length === 0) return { resources: [], topics: [], videos: [], total: 0 };

  const resources = RESOURCE_CATEGORIES.flatMap((category) =>
    category.resources
      .filter((resource) => matchesAll(tokens, words(`${resource.title} ${resource.description} ${category.title}`)))
      .map((resource) => ({ resource, categorySlug: category.slug })),
  );

  const topics = VIDEO_LIBRARY.filter((topic) => topic.videos.length > 0 && matchesAll(tokens, topicHaystack(topic)));

  const videos = VIDEO_LIBRARY.flatMap((topic) => {
    const base = topicHaystack(topic);
    return topic.videos
      .filter((video) => matchesAll(tokens, [...words(video.title), ...base]))
      .map((video) => ({ video, topic }));
  }).sort((a, b) => Number(Boolean(b.video.startHere)) - Number(Boolean(a.video.startHere)));

  return { resources, topics, videos, total: resources.length + topics.length + videos.length };
};
