import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Sparkles, BarChart3, Camera, FileCheck2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/sell")({
  head: () => ({
    meta: [
      { title: "Sell or List Your Property — EstateVerse" },
      { name: "description", content: "Get verified once. Reach buyers and renters who are actually ready to move." },
      { property: "og:title", content: "Sell or List Your Property — EstateVerse" },
      { property: "og:description", content: "List with verified-owner trust on EstateVerse." },
    ],
  }),
  component: SellPage,
});

function SellPage() {
  const { user, profile } = useAuth();
  return (
    <>
      <section className="relative isolate overflow-hidden gradient-forest text-cream">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-10 lg:py-32">
          <span className="inline-flex items-center gap-2 rounded-full bg-cream/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest">
            <ShieldCheck className="h-3.5 w-3.5 text-gold" /> Verified sellers only
          </span>
          <h1 className="mt-6 max-w-3xl font-display text-5xl font-semibold leading-[1.05] tracking-tight lg:text-6xl">
            List a property. Reach buyers <span className="text-gradient-gold italic">with intent</span>.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-cream/80">
            Get verified once. Publish unlimited listings. We bring you buyers and renters who actually open your photos — not bots.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            {user ? (
              profile?.verification_status === "verified" ? (
                <Link to="/dashboard/properties/new"><Button className="h-12 rounded-full bg-gold px-7 text-gold-foreground hover:bg-gold/90 shadow-lift">List a property <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
              ) : (
                <Link to="/dashboard/verification"><Button className="h-12 rounded-full bg-gold px-7 text-gold-foreground hover:bg-gold/90 shadow-lift">Get verified <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
              )
            ) : (
              <Link to="/auth" search={{ mode: "register" }}><Button className="h-12 rounded-full bg-gold px-7 text-gold-foreground hover:bg-gold/90 shadow-lift">Start verification <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            )}
            <Link to="/dashboard"><Button variant="outline" className="h-12 rounded-full border-cream/30 bg-transparent px-7 text-cream hover:bg-cream/10 hover:text-cream">Go to dashboard</Button></Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-10">
        <h2 className="font-display text-3xl font-semibold tracking-tight lg:text-4xl">How it works</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { i: Users, n: "01", t: "Create an account", d: "Select Property Owner or Agent during sign-up." },
            { i: FileCheck2, n: "02", t: "Submit KYC", d: "Upload Aadhaar, PAN, and ownership documents." },
            { i: Camera, n: "03", t: "List your property", d: "Add photos, amenities, price, and availability." },
            { i: BarChart3, n: "04", t: "Track performance", d: "See views, saves, and inquiries in real-time." },
          ].map((s) => (
            <div key={s.n} className="rounded-3xl border border-border bg-card p-6 hover-lift">
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground"><s.i className="h-5 w-5" /></span>
                <span className="font-display text-3xl text-gold/60">{s.n}</span>
              </div>
              <div className="mt-5 font-display text-lg font-semibold">{s.t}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-10">
        <div className="rounded-[2rem] border border-border bg-card p-10 lg:p-16">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <Sparkles className="h-8 w-8 text-gold" />
              <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight">The Verified Owner Badge</h2>
              <p className="mt-4 text-muted-foreground">Earn it once. Wear it on every listing. Verified owners get up to 3.4× more inquiries, prioritized search placement, and a trust badge buyers actually recognize.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { t: "3.4×", d: "more inquiries" },
                { t: "48 hrs", d: "average time to verify" },
                { t: "Free", d: "for individual owners" },
                { t: "100%", d: "document privacy" },
              ].map((m) => (
                <div key={m.t} className="rounded-3xl gradient-ivory border border-border p-6">
                  <div className="font-display text-4xl font-semibold text-primary">{m.t}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{m.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
