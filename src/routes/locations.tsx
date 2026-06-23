import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/locations")({
  head: () => ({
    meta: [
      { title: "Locations — EstateVerse" },
      {
        name: "description",
        content: "Explore EstateVerse properties by city.",
      },
    ],
  }),
  component: LocationsPage,
});

const DEFAULT_CITIES = ["Mumbai", "Pune", "Bengaluru", "Goa"];

function LocationsPage() {
  const { data: cityImages = {}, isLoading } = useQuery({
    queryKey: ["location-city-images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("city, cover_image_url")
        .eq("status", "published");

      if (error) throw error;

      const cityMap: Record<string, string> = {};

      data?.forEach((property) => {
        if (
          property.city &&
          property.cover_image_url &&
          !cityMap[property.city]
        ) {
          const imageUrl = supabase.storage
            .from("property-images")
            .getPublicUrl(property.cover_image_url).data.publicUrl;

          cityMap[property.city] = imageUrl;
        }
      });

      return cityMap;
    },
  });

  const cities = Array.from(
    new Set([...DEFAULT_CITIES, ...Object.keys(cityImages)])
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-10">
      <span className="text-xs font-semibold uppercase tracking-widest text-gold">
        Locations
      </span>

      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight lg:text-5xl">
        Where we are
      </h1>

      <p className="mt-3 max-w-xl text-muted-foreground">
        Discover curated properties across India's most desirable locations.
      </p>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cities.map((city) => (
          <Link
            key={city}
            to="/properties"
            search={{ city } as never}
            className="group relative overflow-hidden rounded-3xl"
          >
            <div className="aspect-[5/4] overflow-hidden bg-muted">
              {cityImages[city] ? (
                <img
                  src={cityImages[city]}
                  alt={city}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  No Properties Yet
                </div>
              )}
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-6 text-cream">
              <div className="font-display text-3xl font-semibold tracking-tight">
                {city}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {isLoading && (
        <div className="mt-10 text-center text-muted-foreground">
          Loading locations...
        </div>
      )}
    </div>
  );
}