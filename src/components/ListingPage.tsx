import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PropertyCard, type PropertyCardData } from "@/components/PropertyCard";
import { demoProperties } from "@/lib/demo";
import { useAuth } from "@/lib/auth";

type Search = { q?: string; type?: string; max?: string; city?: string };

export function validateListingSearch(s: Record<string, unknown>): Search {
  return {
    q: typeof s.q === "string" ? s.q : undefined,
    type: typeof s.type === "string" ? s.type : undefined,
    max: typeof s.max === "string" ? s.max : undefined,
    city: typeof s.city === "string" ? s.city : undefined,
  };
}

const STATUS_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "under_negotiation", label: "Under Negotiation" },
  { value: "sold", label: "Sold" },
  { value: "rented_out", label: "Rented Out" },
  { value: "all", label: "All" },
];

export function ListingPage({
  listingType,
  title,
  eyebrow,
  search,
}: {
  listingType: "buy" | "rent" | null;
  title: string;
  eyebrow: string;
  search: Search;
}) {
  const { profile } = useAuth();
  const [q, setQ] = useState(search.q ?? "");
  const [type, setType] = useState(search.type ?? "");
  const [maxPrice, setMaxPrice] = useState(search.max ?? "");
  const [bedrooms, setBedrooms] = useState("");
  const [status, setStatus] = useState("available");
  const [city, setCity] = useState(search.city ?? "");

  // Role gating
  const userType = profile?.user_type;
  const isOwner = userType === "owner" || userType === "agent";
  const blocked =
    (isOwner && (listingType === "buy" || listingType === "rent")) ||
    (listingType === "buy" && userType === "tenant") ||
    (listingType === "rent" && userType === "buyer");

  const { data } = useQuery({
    queryKey: ["listings", listingType, status],
    queryFn: async () => {
      let query = supabase
        .from("properties")
        .select("id,title,city,locality,price,listing_type,property_type,bedrooms,bathrooms,area_sqft,cover_image_url,is_featured,status")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (listingType) query = query.eq("listing_type", listingType);
      if (status === "available") query = query.in("status", ["available", "published"] as never);
      else if (status !== "all") query = query.eq("status", status as never);
      const { data } = await query;
      return data ?? [];
    },
  });

  const all = useMemo<(PropertyCardData & { status?: string })[]>(() => {
    const live = (data ?? []).map((p) => ({
      ...p,
      property_type: p.property_type as string,
      listing_type: p.listing_type as "buy" | "rent",
    }));
    if (live.length) return live;
    return (listingType ? demoProperties.filter((p) => p.listing_type === listingType) : demoProperties).map((p) => ({ ...p, status: "available" }));
  }, [data, listingType]);

  const filtered = useMemo(() => {
    return all.filter((p) => {
      if (q && !`${p.title} ${p.city} ${p.locality ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (type && !p.property_type.toLowerCase().includes(type.toLowerCase())) return false;
      if (city && p.city.toLowerCase() !== city.toLowerCase()) return false;
      if (maxPrice && p.price > Number(maxPrice)) return false;
      if (bedrooms && p.bedrooms < Number(bedrooms)) return false;
      return true;
    });
  }, [all, q, type, city, maxPrice, bedrooms]);

  if (blocked) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-32 text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-gold">Restricted</span>
        <h1 className="mt-3 font-display text-4xl font-semibold">
          {isOwner ? "Owners manage listings, not browse them" : listingType === "buy" ? "Tenants browse only rentals" : "Buyers browse only sale properties"}
        </h1>
        <p className="mt-3 text-muted-foreground">{isOwner ? "Head to your Dashboard to manage your properties, visits, and messages." : "Update your account type from Profile to access this section."}</p>
      </div>
    );
  }


  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-gold">{eyebrow}</span>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight lg:text-5xl">{title}</h1>
          <p className="mt-2 text-muted-foreground">
            {filtered.length} curated listings
            {city && <button onClick={() => setCity("")} className="ml-3 inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">in {city} <span aria-hidden>×</span></button>}
            {type && <button onClick={() => setType("")} className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary capitalize">{type} <span aria-hidden>×</span></button>}
          </p>
        </div>
      </div>


      <div className="mt-8 rounded-3xl border border-border bg-card p-3 shadow-soft">
        <div className="grid gap-2 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="City, locality, or title"
            className="rounded-2xl bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-2xl bg-background px-4 py-3 text-sm outline-none">
            <option value="">Any type</option>
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="villa">Villa</option>
            <option value="penthouse">Penthouse</option>
            <option value="studio">Studio</option>
            <option value="plot">Plot</option>
            <option value="commercial">Commercial</option>
          </select>
          <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="rounded-2xl bg-background px-4 py-3 text-sm outline-none">
            <option value="">Any beds</option>
            <option value="1">1+ bed</option>
            <option value="2">2+ beds</option>
            <option value="3">3+ beds</option>
            <option value="4">4+ beds</option>
            <option value="5">5+ beds</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-2xl bg-background px-4 py-3 text-sm outline-none">
            {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <input
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max price (₹)"
            inputMode="numeric"
            className="rounded-2xl bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button className="rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            <SlidersHorizontal className="inline h-4 w-4 mr-1.5" /> Filter
          </button>
        </div>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <PropertyCard key={p.id} p={p} />
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="mt-20 rounded-3xl border border-dashed border-border p-16 text-center">
          <h3 className="font-display text-2xl">No listings match those filters.</h3>
          <p className="mt-2 text-muted-foreground">Try widening your budget or clearing a filter.</p>
        </div>
      )}
    </div>
  );
}
