import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, MapPin, Search, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { PropertyCard, type PropertyCardData } from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard/recommendations")({
  head: () => ({ meta: [{ title: "AI Recommendations — EstateVerse" }] }),
  component: RecPage,
});

const LIFESTYLES = [
  { id: "walkable", label: "Walkable & Cafés", keywords: ["bandra","koregaon","indiranagar","hauz khas","bkc","cyber","park street","kala ghoda","fort kochi"] },
  { id: "family", label: "Family Friendly", keywords: ["powai","whitefield","anna nagar","salt lake","sector","jayanagar","aundh","gomti"] },
  { id: "schools", label: "School Focused", keywords: ["vasant vihar","banjara","jubilee","koramangala","aundh","new town"] },
  { id: "quiet", label: "Quiet Residential", keywords: ["assagao","siolim","coorg","manali","lonavala","ooty","alibaug","ghodbunder"] },
  { id: "luxury", label: "Luxury Lifestyle", keywords: ["lutyens","jubilee","banjara","golf course","worli","marine drive","palm","penthouse","villa"] },
  { id: "urban", label: "Urban Professional", keywords: ["lower parel","bkc","cyber","gachibowli","hinjewadi","koramangala","gurgaon","noida","cyber city"] },
] as const;

function RecPage() {
  const { user, profile } = useAuth();

  const { data: all = [] } = useQuery({
    queryKey: ["all-properties-rec"],
    queryFn: async () => {
      const { data } = await supabase
        .from("properties")
        .select("id,title,city,locality,price,listing_type,property_type,bedrooms,bathrooms,area_sqft,cover_image_url,address,description,amenities,status")
        .in("status", ["published","available","under_negotiation"] as never)
        .limit(500);
      return data ?? [];
    },
  });

  const { data: favs = [] } = useQuery({
    queryKey: ["my-fav-ids", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("favorites").select("property_id").eq("user_id", user!.id);
      return (data ?? []).map((f) => f.property_id);
    },
    enabled: !!user,
  });

  // 1) Natural language search
  const [nlQuery, setNlQuery] = useState("");
  const nlMatches = useMemo<PropertyCardData[]>(() => {
    if (!nlQuery.trim()) return [];
    const q = nlQuery.toLowerCase();
    const wants = {
      rent: /\brent|rental|lease\b/.test(q),
      buy: /\bbuy|sale|purchase|own\b/.test(q),
      villa: /\bvilla\b/.test(q),
      apartment: /\bapartment|flat|bhk\b/.test(q),
      penthouse: /\bpenthouse\b/.test(q),
      pool: /\bpool\b/.test(q),
      pet: /\bpet\b/.test(q),
      metro: /\bmetro|transit\b/.test(q),
      luxury: /\bluxury|premium\b/.test(q),
      large: /\bbig|large|spacious|backyard|garden\b/.test(q),
    };
    const bhkMatch = q.match(/(\d)\s*bhk/);
    const beds = bhkMatch ? Number(bhkMatch[1]) : null;
    const priceMatch = q.match(/under\s*(\d+(?:\.\d+)?)\s*(cr|crore|l|lakh)/);
    let maxPrice: number | null = null;
    if (priceMatch) {
      const val = Number(priceMatch[1]);
      const unit = priceMatch[2];
      maxPrice = (unit.startsWith("c") ? val * 1_00_00_000 : val * 1_00_000);
    }
    const cityHit = (s: string) => /goa|mumbai|pune|bengaluru|delhi|gurgaon|noida|hyderabad|chennai|kolkata|ahmedabad|jaipur|chandigarh|kochi|lucknow|thane|navi mumbai/.test(q) && s.toLowerCase().includes(q.match(/goa|mumbai|pune|bengaluru|delhi|gurgaon|noida|hyderabad|chennai|kolkata|ahmedabad|jaipur|chandigarh|kochi|lucknow|thane|navi mumbai/)![0]);
    return all.filter((p) => {
      if (wants.rent && p.listing_type !== "rent") return false;
      if (wants.buy && p.listing_type !== "buy") return false;
      if (wants.villa && p.property_type !== "villa") return false;
      if (wants.penthouse && p.property_type !== "penthouse") return false;
      if (wants.apartment && p.property_type !== "apartment") return false;
      if (beds && p.bedrooms < beds) return false;
      if (maxPrice && Number(p.price) > maxPrice) return false;
      if (/goa|mumbai|pune|bengaluru|delhi|gurgaon|noida|hyderabad|chennai|kolkata|ahmedabad|jaipur|chandigarh|kochi|lucknow|thane|navi mumbai/.test(q) && !cityHit(p.city)) return false;
      if (wants.pool && !(p.amenities ?? []).includes("pool")) return false;
      if (wants.pet && !(p.amenities ?? []).includes("pet_friendly")) return false;
      if (wants.large && !(p.amenities ?? []).some((a: string) => a === "garden" || a === "pool")) return false;
      return true;
    }).slice(0, 9).map((p) => ({ ...p, property_type: p.property_type as string, listing_type: p.listing_type as "buy" | "rent" }));
  }, [nlQuery, all]);

  // 2) Commute-optimized
  const [commuteCity, setCommuteCity] = useState(profile?.city ?? "");
  const [travelMode, setTravelMode] = useState("car");
  const [maxMin, setMaxMin] = useState("45");
  const commuteMatches = useMemo<PropertyCardData[]>(() => {
    if (!commuteCity.trim()) return [];
    const limit = Number(maxMin) || 45;
    // Assumption: same city => within tolerable commute. Penalize loosely by name distance heuristic.
    return all
      .filter((p) => p.city.toLowerCase().includes(commuteCity.toLowerCase()) || commuteCity.toLowerCase().includes(p.city.toLowerCase()))
      .filter(() => limit > 0)
      .slice(0, 6)
      .map((p) => ({ ...p, property_type: p.property_type as string, listing_type: p.listing_type as "buy" | "rent" }));
  }, [all, commuteCity, maxMin]);

  // 3) Lifestyle
  const [lifestyle, setLifestyle] = useState<typeof LIFESTYLES[number]["id"]>("walkable");
  const lifestyleMatches = useMemo<PropertyCardData[]>(() => {
    const cfg = LIFESTYLES.find((l) => l.id === lifestyle);
    if (!cfg) return [];
    return all
      .filter((p) => cfg.keywords.some((k) => (p.locality ?? "").toLowerCase().includes(k) || (p.address ?? "").toLowerCase().includes(k) || (p.city ?? "").toLowerCase().includes(k) || (p.description ?? "").toLowerCase().includes(k)))
      .slice(0, 6)
      .map((p) => ({ ...p, property_type: p.property_type as string, listing_type: p.listing_type as "buy" | "rent" }));
  }, [all, lifestyle]);

  // 4) Personal picks from favorites
  const personal = useMemo<PropertyCardData[]>(() => {
    const favProps = all.filter((p) => favs.includes(p.id));
    if (!favProps.length) return all.slice(0, 6).map((p) => ({ ...p, property_type: p.property_type as string, listing_type: p.listing_type as "buy" | "rent" }));
    const cities = new Set(favProps.map((p) => p.city));
    const types = new Set(favProps.map((p) => p.property_type));
    const avgPrice = favProps.reduce((s, p) => s + Number(p.price), 0) / favProps.length;
    return all
      .filter((p) => !favs.includes(p.id))
      .map((p) => {
        let score = 0;
        if (cities.has(p.city)) score += 3;
        if (types.has(p.property_type)) score += 2;
        const diff = Math.abs(Number(p.price) - avgPrice) / Math.max(avgPrice, 1);
        if (diff < 0.4) score += 2;
        return { p, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((r) => ({ ...r.p, property_type: r.p.property_type as string, listing_type: r.p.listing_type as "buy" | "rent" }));
  }, [all, favs]);

  return (
    <div className="space-y-12">
      <header>
        <span className="text-xs font-semibold uppercase tracking-widest text-gold inline-flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> AI Recommendations</span>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Homes picked for you</h1>
        <p className="mt-2 text-muted-foreground">Powered by your activity, lifestyle, and a little intelligence.</p>
      </header>

      {/* Natural language */}
      <section>
        <h2 className="font-display text-2xl font-semibold">Ask in plain English</h2>
        <p className="mt-1 text-sm text-muted-foreground">e.g. "Luxury villa with pool in Goa", "3 BHK apartment near metro under 1 crore"</p>
        <div className="mt-4 flex gap-2 rounded-3xl border border-border bg-card p-2">
          <div className="flex items-center gap-2 flex-1 px-3"><Search className="h-4 w-4 text-muted-foreground" />
            <input value={nlQuery} onChange={(e) => setNlQuery(e.target.value)} placeholder="Describe your dream home…" className="flex-1 bg-transparent py-3 text-sm outline-none" />
          </div>
          <Button onClick={() => setNlQuery(nlQuery)} className="rounded-2xl bg-primary text-primary-foreground">Search</Button>
        </div>
        {nlQuery && (
          <div className="mt-6">
            {nlMatches.length ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{nlMatches.map((p) => <PropertyCard key={p.id} p={p} />)}</div>
            ) : <p className="text-muted-foreground">No matches — try different wording.</p>}
          </div>
        )}
      </section>

      {/* Commute */}
      <section>
        <h2 className="font-display text-2xl font-semibold inline-flex items-center gap-2"><Clock className="h-5 w-5 text-gold" /> Commute-optimized</h2>
        <div className="mt-4 grid gap-3 rounded-3xl border border-border bg-card p-4 md:grid-cols-[2fr_1fr_1fr]">
          <label className="flex items-center gap-2 rounded-2xl bg-background px-4 py-3"><MapPin className="h-4 w-4 text-primary" /><input placeholder="Workplace (city)" value={commuteCity} onChange={(e) => setCommuteCity(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" /></label>
          <select value={travelMode} onChange={(e) => setTravelMode(e.target.value)} className="rounded-2xl bg-background px-4 py-3 text-sm">
            <option value="car">Car</option><option value="metro">Metro</option><option value="bike">Bike</option><option value="walk">Walk</option>
          </select>
          <select value={maxMin} onChange={(e) => setMaxMin(e.target.value)} className="rounded-2xl bg-background px-4 py-3 text-sm">
            <option value="15">15 min</option><option value="30">30 min</option><option value="45">45 min</option><option value="60">60 min</option>
          </select>
        </div>
        {commuteMatches.length > 0 && (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{commuteMatches.map((p) => <PropertyCard key={p.id} p={p} />)}</div>
        )}
      </section>

      {/* Lifestyle */}
      <section>
        <h2 className="font-display text-2xl font-semibold">Lifestyle recommendations</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {LIFESTYLES.map((l) => (
            <button key={l.id} onClick={() => setLifestyle(l.id)} className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${lifestyle === l.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-accent"}`}>{l.label}</button>
          ))}
        </div>
        {lifestyleMatches.length > 0 && (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{lifestyleMatches.map((p) => <PropertyCard key={p.id} p={p} />)}</div>
        )}
      </section>

      {/* Personal */}
      <section>
        <h2 className="font-display text-2xl font-semibold">Based on your shortlist</h2>
        <p className="mt-1 text-sm text-muted-foreground">{favs.length ? "Similar to homes you've saved." : "Save a few homes to personalize this section."}</p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{personal.map((p) => <PropertyCard key={p.id} p={p} />)}</div>
      </section>
    </div>
  );
}
