import { VIDEO_LIBRARY } from "./videoLibrary";

const topicLabels: Record<string, { label: string; aliases: string[] }> = {
  basics: {
    label: "Practice interviews and mock videos",
    aliases: ["interview videos", "mock interview videos", "practice interview", "mock interview"],
  },
  "product-sense": {
    label: "Product sense and case interview practice",
    aliases: ["case", "case study", "case interviews", "product sense interview"],
  },
  behavioral: {
    label: "Behavioral interview questions",
    aliases: ["behavorial", "behavioral questions", "tell me about yourself", "star method"],
  },
  execution: {
    label: "Execution interviews and root cause analysis",
    aliases: ["execution interview", "root cause"],
  },
};

const videoAliases: Record<string, string[]> = {
  kMDkoDGbqwo: ["google interview"],
  _fhphljJBNo: ["meta interview"],
};

export function normalizeSearch(text: string) {
  return text.toLowerCase().trim().replace(/\s+/g, " ");
}

export function findInterviewResults(query: string) {
  const topics = VIDEO_LIBRARY.filter((topic) => topic.videos.length).map((topic) => ({
    slug: topic.slug,
    title: topicLabels[topic.slug]?.label ?? topic.title,
    keywords: [topic.title, ...(topicLabels[topic.slug]?.aliases ?? [])],
  }));
  return {
    topics: topics.filter((topic) =>
      [topic.title, ...topic.keywords].some((value) => normalizeSearch(value).includes(query))),
    videos: VIDEO_LIBRARY.flatMap((topic) => topic.videos).filter((video) =>
      [video.title, ...(videoAliases[video.youtubeId] ?? [])].some((value) => normalizeSearch(value).includes(query))),
  };
}
