import { useEffect, useState } from "react";
import { ArrowUpRight, CalendarClock, Check, ClipboardList, PartyPopper, PlayCircle, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import apmList from "@/data/apmList.json";
import { STARTER_VIDEOS } from "@/lib/resourceSearch";
import { VIDEO_LIBRARY, type LibraryVideo } from "@/lib/videoLibrary";

interface Program {
  company: string;
  type: string;
  status: string;
  url: string;
  guide: string | null;
  updatedAt: string | null;
}

const isWebUrl = (u: string | null): u is string => !!u && /^https?:\/\//i.test(u);

const PROGRAMS = (apmList.programs as Program[])
  .filter((p) => isWebUrl(p.url))
  .map((p) => ({ ...p, guide: isWebUrl(p.guide) ? p.guide : null }));
const SYNCED_AT = new Date(apmList.syncedAt);
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Denver" }) : "";

const isRecent = (iso: string | null) => !!iso && SYNCED_AT.getTime() - new Date(iso).getTime() <= WEEK_MS;

const byNewest = (a: Program, b: Program) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");

const GROUPS = {
  internship: PROGRAMS.filter((p) => p.type === "Internship"),
  fulltime: PROGRAMS.filter((p) => p.type !== "Internship"),
};

type GroupKey = keyof typeof GROUPS;

const programKey = (p: Program) => `${p.company}|${p.url}`;
const APPLIED_KEY = "pma-applied-programs";

interface AppliedRecord {
  key: string;
  company: string;
  type: string;
  at: string;
}

const readApplied = (): AppliedRecord[] => {
  try {
    const raw: unknown[] = JSON.parse(localStorage.getItem(APPLIED_KEY) ?? "[]");
    return raw.map((r) =>
      typeof r === "string" ? { key: r, company: r.split("|")[0], type: "", at: "" } : (r as AppliedRecord),
    );
  } catch {
    return [];
  }
};

const PROGRAM_BY_KEY = new Map(PROGRAMS.map((p) => [programKey(p), p]));

const STATUS_STYLE: Record<string, string> = {
  Open: "border-green-600/40 text-green-700 dark:text-green-400",
  "Closed for 2027": "border-destructive/40 text-destructive",
  Paused: "border-amber-500/40 text-amber-700 dark:text-amber-400",
};

// Recommend a mock interview from a company that is hiring right now, newest posting first.
// Refreshes every time the APM List sync runs.
const pickRecommendation = (): { video: LibraryVideo; program: Program | null } => {
  const allVideos = VIDEO_LIBRARY.flatMap((t) => t.videos);
  const openByNewest = PROGRAMS.filter((p) => p.status === "Open").sort(byNewest);
  for (const program of openByNewest) {
    const name = program.company.toLowerCase();
    const matches = allVideos
      .filter((v) => v.title.toLowerCase().startsWith(name) && v.minutes <= 30)
      .sort((a, b) => Number(Boolean(b.startHere)) - Number(Boolean(a.startHere)) || a.minutes - b.minutes);
    if (matches[0]) return { video: matches[0], program };
  }
  const fallback = allVideos.find((v) => v.startHere) ?? allVideos[0];
  return { video: fallback, program: null };
};

const RECOMMENDED = pickRecommendation();

interface PlaylistItem {
  video: LibraryVideo;
  label: string;
  note: string;
}

const PLAYLIST: PlaylistItem[] = [
  ...STARTER_VIDEOS.map(({ video }, i) => ({
    video,
    label: `Start here · ${i + 1} of ${STARTER_VIDEOS.length}`,
    note: "Short and quick to watch. Covers what every PM interview expects.",
  })),
  {
    video: RECOMMENDED.video,
    label: "Recommended this week",
    note: RECOMMENDED.program
      ? `${RECOMMENDED.program.company} applications are open now. See how their PM interview runs before you apply.`
      : "A full mock interview to watch once you've seen the basics.",
  },
];

const InlinePlayer = ({ item, playing, onPlay }: { item: PlaylistItem; playing: boolean; onPlay: () => void }) => {
  const { video } = item;
  return (
    <div className="rounded-lg border border-primary/40 overflow-hidden mb-4">
      <div className="relative aspect-video bg-muted">
        {playing ? (
          <iframe
            key={video.youtubeId}
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
            title={video.title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button type="button" onClick={onPlay} className="group absolute inset-0" aria-label={`Play ${video.title}, ${video.minutes} min`}>
            <img src={`https://i.ytimg.com/vi/${video.youtubeId}/mqdefault.jpg`} alt="" className="h-full w-full object-cover" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 group-hover:bg-primary transition-colors">
                <PlayCircle className="h-7 w-7 text-white" />
              </span>
            </span>
            <span className="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 text-xs font-medium text-white">{video.minutes} min</span>
          </button>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">{item.label}</p>
        <p className="mt-1 text-sm font-semibold leading-snug text-card-foreground">{video.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{item.note}</p>
      </div>
    </div>
  );
};

const RecruitingThisWeek = () => {
  const [group, setGroup] = useState<GroupKey>("internship");
  const [activeVideo, setActiveVideo] = useState(PLAYLIST.length - 1);
  const [playing, setPlaying] = useState(false);
  const playVideo = (i: number) => {
    setActiveVideo(i);
    setPlaying(true);
  };
  const [applied, setApplied] = useState<AppliedRecord[]>(readApplied);

  useEffect(() => {
    try {
      localStorage.setItem(APPLIED_KEY, JSON.stringify(applied));
    } catch {
      // Private browsing can block storage; the list still works for this visit.
    }
  }, [applied]);

  const [view, setView] = useState<"open" | "mine">("open");
  const appliedKeys = new Set(applied.map((r) => r.key));
  const markApplied = (p: Program) =>
    setApplied((a) => [...a, { key: programKey(p), company: p.company, type: p.type, at: new Date().toISOString() }]);
  const unmarkApplied = (key: string) => setApplied((a) => a.filter((r) => r.key !== key));
  const programs = GROUPS[group];
  const open = programs.filter((p) => p.status === "Open").sort(byNewest);
  const toShow = open.filter((p) => !appliedKeys.has(programKey(p)));
  const myApplications = [...applied].sort((a, b) => b.at.localeCompare(a.at));
  const notYetOpen = programs.filter((p) => p.status === "Not Yet Open").length;
  const newThisWeek = open.filter((p) => isRecent(p.updatedAt)).length;

  return (
    <section id="recruiting-this-week" aria-labelledby="recruiting-this-week-title" className="max-w-6xl mx-auto mb-12 scroll-mt-24">
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-3 p-5 md:px-8 md:pt-6 md:pb-4 border-b border-border">
          <div>
            <h2 id="recruiting-this-week-title" className="text-xl md:text-2xl font-extrabold text-card-foreground">
              This week in recruiting
            </h2>
            <p className="text-sm text-muted-foreground">What's hiring now, and where to start if you have an interview coming up.</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Updated {fmtDate(apmList.syncedAt)} from{" "}
            <a href={apmList.source} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
              APM List by Aced
            </a>
          </p>
        </div>

        <div className="grid gap-6 p-5 md:p-8 lg:grid-cols-5">
          <div className="lg:col-span-3 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <Tabs value={view} onValueChange={(v) => setView(v as "open" | "mine")}>
                <TabsList className="h-8">
                  <TabsTrigger value="open" className="text-xs gap-1.5">
                    <CalendarClock className="w-3.5 h-3.5" /> Open now
                  </TabsTrigger>
                  <TabsTrigger value="mine" className="text-xs gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5" /> My applications
                    <span className="text-muted-foreground tabular-nums">{applied.length}</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              {view === "open" && (
                <Tabs value={group} onValueChange={(v) => setGroup(v as GroupKey)}>
                  <TabsList className="h-8">
                    <TabsTrigger value="internship" className="text-xs">Internships</TabsTrigger>
                    <TabsTrigger value="fulltime" className="text-xs">Full time APM</TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            </div>

            {view === "mine" ? (
              <div>
                {myApplications.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border px-4 py-8 text-center">
                    <p className="text-sm font-semibold text-card-foreground">No applications tracked yet</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Click <span className="font-medium">Applied</span> next to a program and it moves here, so you can see where you stand.
                    </p>
                    <Button variant="outline" size="sm" className="mt-4 h-8 text-xs" onClick={() => setView("open")}>
                      See what's open
                    </Button>
                  </div>
                ) : (
                  <ul className="divide-y divide-border rounded-md border border-border">
                    {myApplications.map((r) => {
                      const p = PROGRAM_BY_KEY.get(r.key);
                      const status = p?.status ?? "No longer listed";
                      return (
                        <li key={r.key} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5">
                          <span className="min-w-0 flex-1">
                            <span className="block font-semibold text-sm text-card-foreground">{r.company}</span>
                            <span className="block text-xs text-muted-foreground">
                              {(p?.type ?? r.type) || "Program"}
                              {r.at && ` · marked applied ${fmtDate(r.at)}`}
                            </span>
                          </span>
                          <Badge variant="outline" className={`text-[11px] ${STATUS_STYLE[status] ?? "text-muted-foreground"}`}>
                            {status}
                          </Badge>
                          {p?.guide && (
                            <a href={p.guide} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
                              Interview guide
                            </a>
                          )}
                          {p && (
                            <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
                              Posting
                            </a>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-muted-foreground"
                            onClick={() => unmarkApplied(r.key)}
                            aria-label={`Remove ${r.company} from my applications`}
                          >
                            <Undo2 className="w-3.5 h-3.5 mr-1" /> Not applied
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <p className="mt-3 text-xs text-muted-foreground">Saved on this device. Status updates come from APM List each day.</p>
              </div>
            ) : (
            <>

            <dl className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Open now", value: open.length },
                { label: "Updated this week", value: newThisWeek },
                { label: "Not open yet", value: notYetOpen },
              ].map((s) => (
                <div key={s.label} className="rounded-md bg-muted px-3 py-2">
                  <dt className="text-xs text-muted-foreground">{s.label}</dt>
                  <dd className="text-xl font-bold tabular-nums text-card-foreground">{s.value}</dd>
                </div>
              ))}
            </dl>

            <ul className="divide-y divide-border rounded-md border border-border">
              {toShow.slice(0, 5).map((p) => (
                <li key={programKey(p)} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5">
                  <span className="font-semibold text-sm text-card-foreground min-w-0 flex-1">{p.company}</span>
                  {isRecent(p.updatedAt) && <Badge variant="secondary" className="text-[11px]">New this week</Badge>}
                  <span className="text-xs text-muted-foreground tabular-nums">Updated {fmtDate(p.updatedAt)}</span>
                  {p.guide && (
                    <a href={p.guide} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
                      Interview guide
                    </a>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground"
                    onClick={() => markApplied(p)}
                    aria-label={`I applied to ${p.company}. Move it to my applications.`}
                  >
                    <Check className="w-3.5 h-3.5 mr-1" /> Applied
                  </Button>
                  <Button asChild size="sm" className="h-7 px-3 text-xs">
                    <a href={p.url} target="_blank" rel="noopener noreferrer" aria-label={`Apply to ${p.company}`}>
                      Apply <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                    </a>
                  </Button>
                </li>
              ))}
              {open.length === 0 && <li className="px-3 py-4 text-sm text-muted-foreground">Nothing open right now. Check back next week.</li>}
              {open.length > 0 && toShow.length === 0 && (
                <li className="flex items-center gap-3 px-3 py-5">
                  <PartyPopper className="w-6 h-6 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-card-foreground">You've applied to all of our open suggestions for now.</p>
                    <p className="text-xs text-muted-foreground">Nice work. New postings show up here as soon as they open.</p>
                  </div>
                </li>
              )}
            </ul>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              {toShow.length > 5 && (
                <a href={apmList.source} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                  See all {toShow.length} open on APM List <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              )}
              {applied.length > 0 && (
                <button
                  type="button"
                  onClick={() => setView("mine")}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ClipboardList className="w-3.5 h-3.5" /> View my {applied.length} application{applied.length !== 1 ? "s" : ""}
                </button>
              )}
            </div>
            </>
            )}
          </div>

          <div className="lg:col-span-2 min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-card-foreground mb-4">
              <PlayCircle className="w-4 h-4 text-primary" />
              Interview coming up? Start here
            </div>
            <InlinePlayer item={PLAYLIST[activeVideo]} playing={playing} onPlay={() => setPlaying(true)} />
            <ol className="space-y-2">
              {PLAYLIST.map((item, i) => {
                const isActive = i === activeVideo;
                return (
                  <li key={item.video.youtubeId}>
                    <button
                      type="button"
                      onClick={() => playVideo(i)}
                      aria-current={isActive ? "true" : undefined}
                      className={`group flex w-full items-center gap-3 rounded-md border p-2 text-left transition-colors hover:bg-muted ${
                        isActive ? "border-primary/40 bg-primary/5" : "border-border"
                      }`}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {i < STARTER_VIDEOS.length ? i + 1 : <PlayCircle className="h-3.5 w-3.5" />}
                      </span>
                      <span className="flex-1 min-w-0 text-sm font-medium leading-snug group-hover:text-primary">{item.video.title}</span>
                      <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                        {isActive && playing ? "Playing" : `${item.video.minutes} min`}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RecruitingThisWeek;
