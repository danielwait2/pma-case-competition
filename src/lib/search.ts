import { VIDEO_LIBRARY, type LibraryVideo, type VideoTopic } from "@/lib/videoLibrary";

const normalize = (word: string) => word.replace(/s$/, "");

const tokenize = (text: string) =>
  text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 1)
    .map(normalize);

export const matchesQuery = (query: string, fields: (string | undefined)[]) => {
  const tokens = tokenize(query);
  if (tokens.length === 0) return false;
  const haystack = fields.filter(Boolean).join(" ").toLowerCase();
  const words = new Set(tokenize(haystack));
  return tokens.every((token) => words.has(token) || haystack.includes(token));
};

const topicFields = (topic: VideoTopic) => [
  topic.title,
  topic.description,
  topic.slug,
  ...(topic.keywords ?? []),
  topic.guide?.tests,
  topic.guide?.where,
  ...(topic.guide?.approach ?? []),
  ...(topic.guide?.works ?? []),
  ...(topic.guide?.hurts ?? []),
];

export interface VideoSearchResult {
  topic: VideoTopic;
  videos: LibraryVideo[];
}

export const searchVideoLibrary = (query: string): VideoSearchResult[] =>
  VIDEO_LIBRARY.map((topic) => {
    const fields = [...topicFields(topic), "practice interview video mock"];
    const videos = topic.videos.filter((video) => matchesQuery(query, [video.title, ...fields]));
    return {
      topic,
      videos: [...videos].sort((a, b) => Number(Boolean(b.startHere)) - Number(Boolean(a.startHere))),
    };
  }).filter((result) => result.videos.length > 0);
