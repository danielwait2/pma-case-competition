import { FormEvent, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Lock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchSite } from "@/lib/siteSearch";

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(queryParam);

  useEffect(() => setQuery(queryParam), [queryParam]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    setSearchParams(trimmed ? { q: trimmed } : {});
  };

  const results = searchSite(queryParam);

  return (
    <main className="min-h-screen bg-background pt-28 pb-16">
      <div className="container mx-auto max-w-5xl px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">PMA site search</p>
          <h1 className="text-3xl font-bold md:text-5xl">Find what you need for your PM journey</h1>
          <p className="mt-4 text-muted-foreground">Search events, student information, resources, and practice interviews in one place.</p>
          <form onSubmit={onSubmit} className="relative mt-8 flex gap-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try “case interview”, “product sense”, or “APM internships”"
              className="h-13 flex-1 pl-12 text-base"
              aria-label="Search the PMA website"
            />
            <Button type="submit" size="lg">Search</Button>
          </form>
        </div>

        {queryParam && (
          <section className="mt-10" aria-live="polite">
            <p className="mb-5 text-sm text-muted-foreground">
              {results.length ? `${results.length} result${results.length === 1 ? "" : "s"} for “${queryParam}”` : `No results for “${queryParam}”`}
            </p>
            {results.length ? (
              <div className="grid gap-4">
                {results.map((result) => (
                  <Link
                    key={result.id}
                    to={result.path}
                    className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50 hover:bg-muted/40"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-medium">
                          <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">{result.kind}</span>
                          {result.memberOnly && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-primary">
                              <Lock className="h-3 w-3" /> Members only
                            </span>
                          )}
                        </div>
                        <h2 className="text-lg font-semibold text-card-foreground">{result.title}</h2>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{result.description}</p>
                      </div>
                      <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
                Try a broader phrase such as “interview,” “internship,” or “events.”
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
};

export default SearchPage;
