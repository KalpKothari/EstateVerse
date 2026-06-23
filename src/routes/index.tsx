import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useCallback } from "react";
import { ArrowRight, Sparkles, ShieldCheck, MapPinned, Star, Building2, Trees, KeyRound, Tags, TrendingUp, Heart, Smartphone, Monitor, AlertCircle } from "lucide-react";
import heroImg from "@/assets/hero-villa.jpg";
import { SearchBar } from "@/components/SearchBar";
import { PropertyCard } from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { demoProperties, trendingLocations, testimonials } from "@/lib/demo";
import { supabase } from "@/integrations/supabase/client";
import { useImageUrl } from "@/lib/storage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EstateVerse — Real estate, reimagined" },
      { name: "description", content: "Curated homes to buy, rent, or list. Verified owners, intelligent search, and a quietly luxurious experience." },
      { property: "og:title", content: "EstateVerse — Real estate, reimagined" },
      { property: "og:description", content: "Curated homes to buy, rent, or list. Verified owners and intelligent search." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: liveProps } = useQuery({
    queryKey: ["home-featured-props"],
    queryFn: async () => {
      const { data } = await supabase
        .from("properties")
        .select("id,title,city,locality,price,listing_type,property_type,bedrooms,bathrooms,area_sqft,cover_image_url,is_featured")
        .eq("status", "published")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(12);
      return data ?? [];
    },
  });

  const { data: cityHero } = useQuery({
    queryKey: ["home-city-hero"],
    queryFn: async () => {
      const { data } = await supabase
        .from("properties")
        .select("city,cover_image_url")
        .eq("status", "published")
        .not("cover_image_url", "is", null);
      const map: Record<string, string> = {};
      (data ?? []).forEach((r: { city: string; cover_image_url: string | null }) => {
        if (r.cover_image_url && !map[r.city]) map[r.city] = r.cover_image_url;
      });
      return map;
    },
  });

  const liveFeatured = (liveProps ?? []).map((p) => ({ ...p, property_type: p.property_type as string, listing_type: p.listing_type as "buy" | "rent" }));
  const featured = liveFeatured.length >= 6
    ? liveFeatured.slice(0, 6)
    : [...liveFeatured, ...demoProperties.filter((d) => !liveFeatured.some((l) => l.title === d.title))].slice(0, 6);

  const FEATURED_CITIES = ["Mumbai", "Pune", "Bengaluru", "Goa"];
  const demoFallback: Record<string, string> = {};
  trendingLocations.forEach((l) => { demoFallback[l.city] = l.image; });
  const anyDemoImg = trendingLocations[0]?.image;

  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={heroImg} alt="" width={1920} height={1080} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-ink/40 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/60 via-ink/20 to-transparent" />
        </div>

        <div className="mx-auto max-w-7xl px-4 pt-20 pb-32 sm:px-6 lg:px-10 lg:pt-32 lg:pb-44">
          <div className="max-w-2xl text-cream animate-float-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-cream/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-gold" /> A new home for real estate
            </span>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-6xl lg:text-7xl">
              Find a place that <span className="text-gradient-gold italic">feels</span> like yours.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream/80">
              EstateVerse is a quietly intelligent platform for buying, renting, and listing property — with verified owners and listings that actually look like the home you'll move into.
            </p>
          </div>

          <div className="mt-10 max-w-4xl animate-float-up" style={{ animationDelay: "120ms" }}>
            <SearchBar />
          </div>

          <div className="mt-10 flex flex-wrap gap-6 text-cream/90 animate-float-up" style={{ animationDelay: "240ms" }}>
            <Stat k="4.8★" v="Avg. rating" />
            <Stat k="100%" v="Verified owners" />
            <Stat k="<24h" v="Avg. response time" />
            <Stat k="Zero" v="Brokerage fee" />
          </div>
        </div>
      </section>

      {/* THREE PILLARS */}
      <section className="mx-auto -mt-24 max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="grid gap-4 md:grid-cols-3">
          <PillarCard
            tone="primary"
            icon={<KeyRound className="h-6 w-6" />}
            kicker="Rent"
            title="A home, on your terms"
            body="Short or long lease. Verified owners. No surprises."
            href="/rent"
          />
          <PillarCard
            tone="gold"
            icon={<Building2 className="h-6 w-6" />}
            kicker="Buy"
            title="Own something rare"
            body="Curated apartments, villas, and estates worth keeping."
            href="/buy"
          />
          <PillarCard
            tone="dark"
            icon={<Tags className="h-6 w-6" />}
            kicker="Sell"
            title="List with confidence"
            body="Verified once. Reach real buyers, with real intent."
            href="/sell"
          />
        </div>
      </section>

      {/* FEATURED */}
      <section className="mx-auto mt-28 max-w-7xl px-4 sm:px-6 lg:px-10">
        <SectionHead
          eyebrow="Featured"
          title="Homes worth a second look"
          sub="Hand-picked listings from verified owners across India."
          cta={{ label: "Browse all", to: "/properties" }}
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.slice(0, 6).map((p) => (
            <PropertyCard key={p.id} p={p as never} />
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto mt-28 max-w-7xl px-4 sm:px-6 lg:px-10">
        <SectionHead eyebrow="Categories" title="Find by what you love" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Apartments", icon: Building2, key: "apartment", tagline: "Urban living, ready to move in" },
            { label: "Villas & Estates", icon: Trees, key: "villa", tagline: "Private gardens, room to breathe" },
            { label: "Penthouses", icon: Sparkles, key: "penthouse", tagline: "Skyline views from the top floor" },
            { label: "Commercial", icon: TrendingUp, key: "commercial", tagline: "Offices, retail and workspaces" },
          ].map((c) => (
            <Link key={c.label} to="/properties" search={{ type: c.key } as never} className="group rounded-3xl border border-border bg-card p-6 transition-all hover-lift">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <c.icon className="h-5 w-5" />
              </div>
              <div className="mt-5 font-display text-xl font-semibold">{c.label}</div>
              <div className="mt-1 text-sm text-muted-foreground">{c.tagline}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* LOCATIONS */}
      <section className="mx-auto mt-28 max-w-7xl px-4 sm:px-6 lg:px-10">
        <SectionHead eyebrow="Trending" title="Cities people are moving to" cta={{ label: "Explore locations", to: "/locations" }} />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED_CITIES.map((cityName) => {
            const dbPath = cityHero?.[cityName];
            const fallback = demoFallback[cityName] ?? anyDemoImg;
            return (
              <Link key={cityName} to="/properties" search={{ city: cityName } as never} className="group relative aspect-[5/3] overflow-hidden rounded-3xl">
                <CityCard dbPath={dbPath} fallback={fallback} alt={cityName} />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-cream">
                  <div className="font-display text-2xl font-semibold">{cityName}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* WHY */}
      <section className="mx-auto mt-28 max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="rounded-[2rem] gradient-forest p-10 text-cream lg:p-16">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-cream/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-gold">
                <ShieldCheck className="h-3.5 w-3.5" /> Why EstateVerse
              </span>
              <h2 className="mt-5 font-display text-4xl font-semibold leading-tight tracking-tight lg:text-5xl">
                Built for the way you actually look for a home.
              </h2>
              <p className="mt-5 text-cream/80">
                Every owner is verified. Every listing is reviewed. Every search learns from what you actually like.
              </p>
              <Link to="/about" className="mt-7 inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 font-semibold text-gold-foreground hover-lift">
                Our promise <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { i: ShieldCheck, t: "Verified Owners", d: "Multi-step KYC for every seller and agent." },
                { i: Sparkles, t: "AI Recommendations", d: "Listings tuned to what you actually open." },
                { i: MapPinned, t: "Live Map Search", d: "Walk the neighbourhood before you visit." },
                { i: Star, t: "Honest Reviews", d: "From people who've actually moved in." },
              ].map((f, i) => (
                <div key={i} className="rounded-2xl border border-cream/15 bg-cream/5 p-5 backdrop-blur">
                  <f.i className="h-5 w-5 text-gold" />
                  <div className="mt-4 font-display text-lg font-semibold">{f.t}</div>
                  <div className="mt-1 text-sm text-cream/70">{f.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="mx-auto mt-28 max-w-7xl px-4 sm:px-6 lg:px-10">
        <SectionHead eyebrow="Loved by" title="People who found their place" />
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.name} className="rounded-3xl border border-border bg-card p-7 hover-lift">
              <div className="flex gap-1 text-gold">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-5 font-display text-lg leading-relaxed text-foreground/85">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground font-semibold">
                  {t.avatar}
                </span>
                <span>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-28 max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="overflow-hidden rounded-[2rem] border border-border bg-card p-10 text-center lg:p-16">
          <h2 className="font-display text-4xl font-semibold tracking-tight lg:text-5xl">
            Have a property to <span className="text-gradient-gold italic">list</span>?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
            Get verified once. Reach buyers and renters who are actually ready to move.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/sell">
              <Button className="h-12 rounded-full bg-primary px-7 text-primary-foreground hover:bg-primary/90 shadow-lift">
                List your property <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/auth" search={{ mode: "register" }}>
              <Button variant="outline" className="h-12 rounded-full border-primary/30 px-7">
                Create an account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* SUPPORT */}
      <SupportSection />
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   SUPPORT SECTION — UPI direct payment, no gateway
   Layout: compact single card — header left, controls right on desktop
   (desktop layout/behavior is unchanged from before).
   Mobile  → stacked, full-width controls, instant window.location
            redirect into the installed UPI app. NO QR ever rendered.
   Desktop → dynamic QR appears inline below the button, fades + slides
            in, and auto-regenerates whenever the amount changes.
───────────────────────────────────────────────────────────────────── */

const UPI_ID     = "kalpkothari14@oksbi";
const UPI_NAME   = "EstateVerse%20Support";
const PRESETS    = [49, 99, 199] as const;
const MIN_AMOUNT = 10;

function buildUpiLink(amount: number) {
  return `upi://pay?pa=${UPI_ID}&pn=${UPI_NAME}&am=${amount}&cu=INR`;
}

function buildQrUrl(upiLink: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(upiLink)}&margin=10&format=png`;
}

function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function SupportSection() {
  const [selected, setSelected]   = useState<number | null>(null);
  const [custom, setCustom]       = useState("");
  const [qrVisible, setQrVisible] = useState(false);
  const [qrUrl, setQrUrl]         = useState<string | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [mobile, setMobile]       = useState(false);

  // resolve on client only — avoids SSR/hydration mismatch
  useEffect(() => {
    setMobile(isMobileDevice());
  }, []);

  const amount: number | null = (() => {
    if (custom.trim() !== "") {
      const n = parseFloat(custom);
      return isNaN(n) ? null : n;
    }
    return selected;
  })();

  const valid = amount !== null && amount >= MIN_AMOUNT;

  /* auto-refresh QR when amount changes after initial reveal */
  useEffect(() => {
    if (mobile || !qrVisible) return;
    if (!valid || amount === null) { setQrUrl(null); return; }
    setQrUrl(buildQrUrl(buildUpiLink(amount)));
  }, [amount, valid, qrVisible, mobile]);

  const pickPreset = (v: number) => {
    setSelected(v); setCustom(""); setError(null);
    setQrVisible(false); setQrUrl(null);
  };

  const onCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelected(null); setCustom(e.target.value); setError(null);
    setQrVisible(false); setQrUrl(null);
  };

  const handlePay = useCallback(() => {
    if (!valid || amount === null) {
      setError(`Please enter an amount of ₹${MIN_AMOUNT} or more.`);
      return;
    }
    setError(null);
    const link = buildUpiLink(amount);
    if (mobile) {
      window.location.href = link;
    } else {
      setQrUrl(buildQrUrl(link));
      setQrVisible(true);
    }
  }, [valid, amount, mobile]);

  return (
    <section className="mx-auto mt-16 max-w-7xl px-4 pb-16 sm:mt-20 sm:px-6 sm:pb-20 lg:px-10">
      <div className="overflow-hidden rounded-3xl border border-border bg-card sm:rounded-[2rem]">

        {/* ── single row on desktop (unchanged), stacked on mobile ── */}
        <div className="grid lg:grid-cols-[auto_1fr]">

          {/* left — identity strip */}
          <div className="gradient-forest px-6 py-7 text-cream sm:px-8 sm:py-8 lg:px-10 lg:py-10 flex flex-col justify-center lg:min-w-[260px] lg:max-w-xs">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-cream/10 flex-shrink-0">
                <Heart className="h-4 w-4 fill-gold text-gold" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-gold">
                Support
              </span>
            </div>
            <h2 className="mt-4 font-display text-xl sm:text-2xl font-semibold leading-snug tracking-tight">
              If you found this tool helpful or interesting, {" "}
              <span className="italic text-gold">consider supporting its development.</span>
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-cream/70">
              Paid directly via UPI — no account needed.
            </p>
          </div>

          {/* right — controls */}
          <div className="px-6 py-7 sm:px-8 sm:py-8 lg:px-10 lg:py-10">

            {/* preset + custom + button — wraps on mobile, one row on desktop */}
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">

              {/* preset pills */}
              <div className="flex gap-2 sm:gap-3">
                {PRESETS.map((v) => (
                  <button
                    key={v}
                    onClick={() => pickPreset(v)}
                    className={[
                      "flex-1 sm:flex-none rounded-full border px-4 sm:px-5 py-2.5 sm:py-2 font-display text-base font-semibold transition-all hover-lift",
                      selected === v
                        ? "bg-primary text-primary-foreground border-primary shadow-lift"
                        : "border-border bg-background text-foreground hover:border-primary/50",
                    ].join(" ")}
                  >
                    ₹{v}
                  </button>
                ))}
              </div>

              {/* custom input */}
              <div className="flex flex-col gap-1">
                <div className="relative w-full sm:w-32">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-semibold text-muted-foreground">
                    ₹
                  </span>
                  <input
                    id="upi-custom"
                    type="number"
                    min={MIN_AMOUNT}
                    step="1"
                    inputMode="numeric"
                    placeholder="Other"
                    value={custom}
                    onChange={onCustomChange}
                    className={[
                      "w-full rounded-full border bg-background py-2.5 sm:py-2 pl-7 pr-3 text-base font-medium",
                      "placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors",
                      error ? "border-destructive" : "border-border",
                    ].join(" ")}
                  />
                </div>
              </div>

              {/* pay button */}
              <Button
                onClick={handlePay}
                disabled={!valid}
                className={[
                  "h-11 sm:h-10 w-full sm:w-auto rounded-full px-6 text-sm font-semibold shadow-lift transition-all",
                  valid
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "opacity-40 cursor-not-allowed",
                ].join(" ")}
              >
                {mobile ? (
                  <><Smartphone className="mr-1.5 h-3.5 w-3.5" />Pay {valid ? `₹${amount}` : "—"} via UPI</>
                ) : (
                  <><Monitor className="mr-1.5 h-3.5 w-3.5" />{qrVisible ? "Refresh QR" : "Show QR"}{valid ? ` — ₹${amount}` : ""}</>
                )}
              </Button>
            </div>

            {/* error */}
            {error && (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-destructive">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />{error}
              </p>
            )}

            {/* QR — inline, below controls, desktop only. Fade + slide-up entrance. */}
            {!mobile && (
              <div
                className="grid transition-[grid-template-rows,opacity] duration-500 ease-out"
                style={{
                  gridTemplateRows: qrVisible && qrUrl ? "1fr" : "0fr",
                  opacity: qrVisible && qrUrl ? 1 : 0,
                }}
                aria-hidden={!(qrVisible && qrUrl)}
              >
                <div className="overflow-hidden">
                  {qrUrl && (
                    <div
                      className="mt-5 inline-flex items-center gap-6 rounded-2xl border border-border bg-background px-6 py-5 transition-all duration-500 ease-out"
                      style={{
                        transform: qrVisible ? "translateY(0)" : "translateY(12px)",
                        opacity: qrVisible ? 1 : 0,
                      }}
                    >
                      <img
                        key={qrUrl}
                        src={qrUrl}
                        alt="UPI QR Code"
                        width={180}
                        height={180}
                        className="rounded-xl flex-shrink-0"
                      />
                      <div className="flex flex-col">
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                          Scan to pay
                        </p>
                        <p className="font-display text-4xl font-semibold text-foreground mt-1">
                          ₹{amount}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">{UPI_ID}</p>
                        <p className="text-xs text-muted-foreground mt-3">
                          Open any UPI app → Scan → Confirm
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* disclaimer */}
            <p className="mt-5 text-xs leading-relaxed text-muted-foreground border-t border-border pt-4">
              Voluntary contribution · paid directly via UPI · not automatically verified · no purchase implied.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── shared helpers (unchanged) ───────────────────────────────────── */

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="font-display text-3xl font-semibold">{k}</div>
      <div className="text-sm opacity-75">{v}</div>
    </div>
  );
}

function CityCard({ dbPath, fallback, alt }: { dbPath?: string | null; fallback?: string; alt: string }) {
  const signed = useImageUrl(dbPath ?? null);
  const [src, setSrc] = useState<string>(fallback ?? "");
  useEffect(() => { if (signed) setSrc(signed); }, [signed]);
  if (!src) return <div className="h-full w-full bg-muted" />;
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
      onError={() => { if (fallback && src !== fallback) setSrc(fallback); }}
    />
  );
}

function SectionHead({ eyebrow, title, sub, cta }: { eyebrow: string; title: string; sub?: string; cta?: { label: string; to: string } }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <span className="text-xs font-semibold uppercase tracking-widest text-gold">{eyebrow}</span>
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight lg:text-4xl">{title}</h2>
        {sub && <p className="mt-2 text-muted-foreground">{sub}</p>}
      </div>
      {cta && (
        <Link to={cta.to} className="inline-flex items-center gap-2 rounded-full border border-primary/30 px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
          {cta.label} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function PillarCard({ tone, icon, kicker, title, body, href }: {
  tone: "primary" | "gold" | "dark";
  icon: React.ReactNode; kicker: string; title: string; body: string; href: string;
}) {
  const palette = {
    primary: "bg-card text-foreground border-border",
    gold: "gradient-gold text-gold-foreground border-transparent",
    dark: "bg-sidebar text-sidebar-foreground border-transparent",
  }[tone];
  const iconBg = {
    primary: "bg-primary text-primary-foreground",
    gold: "bg-gold-foreground/15 text-gold-foreground",
    dark: "bg-gold text-gold-foreground",
  }[tone];
  return (
    <Link to={href} className={`group relative overflow-hidden rounded-3xl border p-7 hover-lift ${palette}`}>
      <div className={`grid h-12 w-12 place-items-center rounded-2xl ${iconBg}`}>{icon}</div>
      <div className="mt-7 text-xs font-semibold uppercase tracking-widest opacity-70">{kicker}</div>
      <div className="mt-1 font-display text-2xl font-semibold tracking-tight">{title}</div>
      <p className="mt-2 text-sm opacity-80">{body}</p>
      <div className="mt-7 inline-flex items-center gap-2 text-sm font-semibold">
        Explore <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}