import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { trendingLocations } from "@/lib/demo";
import { supabase } from "@/integrations/supabase/client";
import { landmarkFor } from "@/lib/city-landmarks";

export const Route = createFileRoute("/locations")({
  head: () => ({
    meta: [
      { title: "Locations — EstateVerse" },
      { name: "description", content: "Explore EstateVerse properties by city — from Mumbai to Coorg." },
      { property: "og:title", content: "Locations — EstateVerse" },
      { property: "og:description", content: "Explore EstateVerse properties by city." },
    ],
  }),
  component: LocationsPage,
});

const DEFAULT_CITIES = ["Mumbai", "Pune","Bengaluru", "Goa"];

function LocationsPage() {
  const { data: cityHero = {} } = useQuery({
    queryKey: ["city-hero-images"],
    queryFn: async () => {
      const { data } = await supabase
        .from("properties")
        .select("city,cover_image_url")
        .eq("status", "published");
      const map: Record<string, string | null> = {};
      (data ?? []).forEach((r: { city: string; cover_image_url: string | null }) => {
        if (!(r.city in map) || (!map[r.city] && r.cover_image_url)) map[r.city] = r.cover_image_url;
      });
      return map;
    },
  });

  const demoFallback: Record<string, string> = {};
  trendingLocations.forEach((l) => { demoFallback[l.city] = l.image; });
  const anyDemoImg = trendingLocations[0]?.image;

  const cities = Array.from(new Set([...Object.keys(cityHero), ...DEFAULT_CITIES]));

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-10">
      <span className="text-xs font-semibold uppercase tracking-widest text-gold">Locations</span>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight lg:text-5xl">Where we are</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">Each city, hand-picked. From beach houses in Goa to glass cabins in Coorg.</p>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cities.map((cityName) => {
          const landmark = landmarkFor(cityName);
          const fallback = demoFallback[cityName] ?? anyDemoImg;
          return (
            <Link key={cityName} to="/properties" search={{ city: cityName } as never} className="group relative overflow-hidden rounded-3xl">
              <div className="aspect-[5/4]">
                <CityImage primary={landmark} fallback={fallback} alt={cityName} />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-cream">
                <div className="font-display text-3xl font-semibold tracking-tight">{cityName}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function CityImage({ primary, fallback, alt }: { primary?: string; fallback?: string; alt: string }) {
  const [src, setSrc] = useState<string>(primary ?? fallback ?? "");
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
