// Pulls the APM List (apmlist.com, by Aced) into src/data/apmList.json.
// Run with `npm run sync:apm`. The site reads the saved file, so visitors never call apmlist.com.
// Each run also records status changes in src/data/apmHistory.json (for example the day a
// program flips from "Not Yet Open" to "Open"), so a real application calendar can be built
// from observed dates next season instead of guesses.
import { readFile, writeFile, mkdir } from "node:fs/promises";

const SOURCE = "https://apmlist.com";
const DATA_DIR = new URL("../src/data/", import.meta.url);
const LIST_FILE = new URL("apmList.json", DATA_DIR);
const HISTORY_FILE = new URL("apmHistory.json", DATA_DIR);

const readJson = async (file, fallback) => {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return fallback;
  }
};

const res = await fetch(SOURCE, { headers: { "User-Agent": "pma-resources-sync" } });
if (!res.ok) throw new Error(`apmlist.com returned ${res.status}`);
const html = await res.text();
const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
if (!match) throw new Error("Could not find the program list on apmlist.com. The page layout may have changed.");

const { fulltime = [], internship = [] } = JSON.parse(match[1]).props.pageProps.opportunities;
const programs = [...fulltime, ...internship]
  .filter((o) => o.Approved !== false && o.Company && o.URL)
  .map((o) => ({
    company: o.Company,
    type: o.Type,
    status: o.Status,
    url: o.URL,
    guide: o.Guide || null,
    updatedAt: o["Last Modified"] || null,
  }));

if (programs.length === 0) throw new Error("apmlist.com returned no programs. Keeping the previous data.");

const previous = await readJson(LIST_FILE, { programs: [] });
const history = await readJson(HISTORY_FILE, { changes: [] });
const key = (p) => `${p.company}|${p.type}|${p.url}`;
const before = new Map(previous.programs.map((p) => [key(p), p.status]));
const today = new Date().toISOString().slice(0, 10);

let changed = 0;
for (const p of programs) {
  const was = before.get(key(p)) ?? null;
  if (was !== p.status) {
    history.changes.push({ date: today, company: p.company, type: p.type, from: was, to: p.status });
    changed++;
  }
}

const now = new Date().toISOString();
await mkdir(DATA_DIR, { recursive: true });
await writeFile(LIST_FILE, JSON.stringify({ source: SOURCE, syncedAt: now, programs }, null, 2) + "\n");
await writeFile(HISTORY_FILE, JSON.stringify(history, null, 2) + "\n");
console.log(`Saved ${programs.length} programs. Recorded ${changed} status changes.`);
