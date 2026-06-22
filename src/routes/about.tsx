import { createFileRoute } from "@tanstack/react-router";
import { Trees, Sparkles, ShieldCheck, Star } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — EstateVerse" },
      { name: "description", content: "EstateVerse is real estate, reimagined. Verified owners, curated listings, intelligent search." },
      { property: "og:title", content: "About — EstateVerse" },
      { property: "og:description", content: "Real estate, reimagined." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-10">
      <span className="text-xs font-semibold uppercase tracking-widest text-gold">Our story</span>
      <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight lg:text-6xl">
        Real estate, <span className="text-gradient-gold italic">quietly</span> reimagined.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        We started EstateVerse because finding a home shouldn't feel like scrolling through ten years of stock photos. Every listing here is from a verified owner, reviewed by a human, and presented the way the home actually feels.
      </p>

      <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { i: ShieldCheck, t: "Verified", d: "Every owner, agent, and ownership document." },
          { i: Sparkles, t: "Curated", d: "We review listings before they go live." },
          { i: Trees, t: "Considered", d: "Designed for the way you actually search." },
          { i: Star, t: "Trusted", d: "4.9★ from 12,000+ users." },
        ].map((v) => (
          <div key={v.t} className="rounded-3xl border border-border bg-card p-6">
            <v.i className="h-6 w-6 text-primary" />
            <div className="mt-4 font-display text-xl font-semibold">{v.t}</div>
            <div className="mt-1 text-sm text-muted-foreground">{v.d}</div>
          </div>
        ))}
      </div>

      <div className="mt-20 rounded-3xl gradient-forest p-10 text-cream lg:p-14">
        <h2 className="font-display text-3xl font-semibold lg:text-4xl">Our promise</h2>
        <p className="mt-4 max-w-2xl text-cream/80">
          A home is not a transaction. It's a place you'll live. We promise verified listings, transparent terms, and a quietly intelligent search — for everyone, regardless of budget.
        </p>
      </div>
    </div>
  );
}
