import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PlayableVideo {
  youtubeId: string;
  title: string;
  minutes?: number;
}

type Mode = "large" | "mini";

interface VideoPlayerContextValue {
  open: (video: PlayableVideo) => void;
}

const VideoPlayerContext = createContext<VideoPlayerContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useVideoPlayer = () => useContext(VideoPlayerContext);

export const VideoPlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [video, setVideo] = useState<PlayableVideo | null>(null);
  const [mode, setMode] = useState<Mode>("large");
  const panelRef = useRef<HTMLDivElement>(null);

  const open = useCallback((v: PlayableVideo) => {
    setVideo(v);
    setMode("large");
  }, []);
  const close = () => setVideo(null);

  useEffect(() => {
    if (!video) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mode === "large") setMode("mini");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [video, mode]);

  useEffect(() => {
    if (video && mode === "large") panelRef.current?.focus();
  }, [video, mode]);

  const large = mode === "large";

  return (
    <VideoPlayerContext.Provider value={{ open }}>
      {children}
      {video && (
        <>
          {large && (
            <div className="fixed inset-0 z-[60] bg-black/70 animate-in fade-in" onClick={() => setMode("mini")} aria-hidden="true" />
          )}
          <div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal={large}
            aria-label={`Video player: ${video.title}`}
            className={`fixed z-[61] overflow-hidden rounded-xl border border-border bg-card shadow-2xl outline-none transition-all duration-300 ${
              large
                ? "left-1/2 top-1/2 w-[min(92vw,1100px)] -translate-x-1/2 -translate-y-1/2"
                : "bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] w-[min(88vw,360px)]"
            }`}
          >
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <p className={`min-w-0 flex-1 truncate font-semibold text-card-foreground ${large ? "text-sm" : "text-xs"}`}>
                {video.title}
                {video.minutes ? <span className="ml-2 font-normal text-muted-foreground">{video.minutes} min</span> : null}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setMode(large ? "mini" : "large")}
                aria-label={large ? "Shrink to corner and keep browsing" : "Expand video"}
                title={large ? "Shrink to corner and keep browsing" : "Expand"}
              >
                {large ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={close} aria-label="Close video" title="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative aspect-video bg-black">
              <iframe
                key={video.youtubeId}
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
                title={video.title}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
              />
            </div>
            {large && (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                Press <Minimize2 className="inline h-3 w-3" /> or Esc to shrink it to the corner and keep browsing.
              </p>
            )}
          </div>
        </>
      )}
    </VideoPlayerContext.Provider>
  );
};
