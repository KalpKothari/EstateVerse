import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { PropertyCard } from "@/components/PropertyCard";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/favorites")({
  head: () => ({ meta: [{ title: "Saved — EstateVerse" }] }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("favorites")
        .select("property_id, properties(id,title,city,locality,price,listing_type,property_type,bedrooms,bathrooms,area_sqft,cover_image_url)")
        .eq("user_id", user!.id);
      return (data ?? []).map((f) => f.properties).filter(Boolean);
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-semibold uppercase tracking-widest text-gold">Saved</span>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Your shortlist</h1>
        <p className="mt-2 text-muted-foreground">Homes you've tucked away.</p>
      </div>

      {(!data || data.length === 0) ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center">
          <Heart className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-4 font-display text-2xl">No saved homes yet</h2>
          <p className="mt-2 text-muted-foreground">Tap the heart on any listing to keep it here.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((p) => (
            <PropertyCard key={p!.id} p={{ ...p!, property_type: p!.property_type as string, listing_type: p!.listing_type as "buy" | "rent" }} />
          ))}
        </div>
      )}
    </div>
  );
}
