import { RESOURCE_CATEGORIES } from "@/lib/resources";
import { VIDEO_LIBRARY } from "@/lib/videoLibrary";

export type SearchResult = {
  id: string;
  title: string;
  description: string;
  kind: "Page" | "Resource" | "Practice interview";
  path: string;
  memberOnly: boolean;
  keywords: string[];
};

const PUBLIC_PAGES: SearchResult[] = [
  { id: "home", title: "Home", description: "BYU Product Management Association", kind: "Page", path: "/", memberOnly: false, keywords: ["pma", "product management", "club"] },
  { id: "events", title: "Events", description: "Upcoming PMA events, workshops, and meetings", kind: "Page", path: "/events", memberOnly: false, keywords: ["calendar", "meeting", "workshop"] },
  { id: "students", title: "For Students", description: "Learn about product management and preparing for a PM career", kind: "Page", path: "/students", memberOnly: false, keywords: ["career", "major", "classes", "become a pm"] },
  { id: "companies", title: "For Companies", description: "Partner with BYU PMA", kind: "Page", path: "/companies", memberOnly: false, keywords: ["sponsor", "partner", "internship"] },
  { id: "team", title: "PMA Team", description: "Meet the BYU PMA leadership team", kind: "Page", path: "/team", memberOnly: false, keywords: ["officers", "leadership", "contact"] },
  { id: "contact", title: "Contact PMA", description: "Get in touch with the BYU Product Management Association", kind: "Page", path: "/contact", memberOnly: false, keywords: ["email", "help", "question"] },
  { id: "hackathon", title: "AI Product Hackathon", description: "Build, learn, and compete with product and tech", kind: "Page", path: "/hackathon", memberOnly: false, keywords: ["hackathon", "competition", "ai"] },
];

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const editDistance = (left: string, right: string) => {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let row = 1; row <= left.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= right.length; column += 1) {
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[right.length];
};

const matchScore = (term: string, words: string[]) => {
  if (words.some((word) => word.includes(term))) return 10;

  // Keep search forgiving for high-intent terms such as "interiew" or "behavorial"
  // without treating short, unrelated words as matches.
  if (term.length >= 5 && words.some((word) => Math.abs(word.length - term.length) <= 2 && editDistance(term, word) <= 2)) {
    return 6;
  }

  return 0;
};

const aliasesFor = (value: string) => {
  const normalized = normalize(value);
  const aliases: string[] = [];
  if (/(interview|product sense|behavioral|leadership|execution|estimation)/.test(normalized)) {
    aliases.push("case interview pm interview product manager interview mock interview interview prep");
  }
  if (/(behavioral|leadership)/.test(normalized)) aliases.push("behavioral questions star method tell me about yourself");
  if (/(product sense|product design)/.test(normalized)) aliases.push("product sense product design case interview");
  if (/(video|mock)/.test(normalized)) aliases.push("mock interview videos practice interview videos");
  return aliases;
};

const MEMBER_RESULTS: SearchResult[] = [
  ...RESOURCE_CATEGORIES.flatMap((category) =>
    category.resources.map((resource) => ({
      id: `resource-${category.slug}-${resource.title}`,
      title: resource.title,
      description: resource.description,
      kind: "Resource" as const,
      path: `/resources?search=${encodeURIComponent(resource.title)}`,
      memberOnly: true,
      keywords: [category.title, ...resource.tips, ...aliasesFor(`${category.title} ${resource.title} ${resource.description}`)],
    })),
  ),
  ...VIDEO_LIBRARY.flatMap((topic) =>
    topic.videos.map((video) => ({
      id: `video-${topic.slug}-${video.youtubeId}`,
      title: video.title,
      description: `${topic.title} practice interview${video.startHere ? " · Start here" : ""} · ${video.minutes} min`,
      kind: "Practice interview" as const,
      path: `/resources?topic=${encodeURIComponent(topic.slug)}`,
      memberOnly: true,
      keywords: [topic.title, topic.description, ...(topic.guide?.approach ?? []), ...aliasesFor(`${topic.title} ${video.title}`)],
    })),
  ),
];

export const SITE_SEARCH_RESULTS = [...PUBLIC_PAGES, ...MEMBER_RESULTS];

export const searchSite = (query: string) => {
  const normalizedQuery = normalize(query);
  const terms = normalizedQuery.split(" ").filter(Boolean);
  if (!terms.length) return [];

  return SITE_SEARCH_RESULTS
    .map((result) => {
      const searchable = normalize([result.title, result.description, ...result.keywords].join(" "));
      const words = searchable.split(" ").filter(Boolean);
      const termScores = terms.map((term) => matchScore(term, words));
      const matchedTerms = termScores.filter(Boolean).length;
      const exactPhrase = searchable.includes(normalizedQuery);
      const titleMatch = normalize(result.title).includes(normalizedQuery);
      const score = termScores.reduce((total, value) => total + value, 0) + (exactPhrase ? 8 : 0) + (titleMatch ? 12 : 0);
      return { result, score, matchedTerms };
    })
    .filter(({ matchedTerms }) => matchedTerms === terms.length)
    .sort((a, b) => b.score - a.score || a.result.title.localeCompare(b.result.title))
    .map(({ result }) => result);
};
