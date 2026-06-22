import { Link } from "@tanstack/react-router";
import { BedDouble, Bath, Maximize2, MapPin, Heart } from "lucide-react";
import { useImageUrl } from "@/lib/storage";
import { formatINR, formatArea, priceSuffix } from "@/lib/format";
import { PropertyStatusBadge } from "@/components/PropertyStatusBadge";

export type PropertyCardData = {
  id: string;
  title: string;
  city: string;
  locality?: string | null;
  price: number;
  listing_type: "buy" | "rent";
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  cover_image_url?: string | null;
  image?: string;
  badge?: string;
  status?: string;
};

export function PropertyCard({ p, to }: { p: PropertyCardData; to?: string }) {
  const signed = useImageUrl(p.image ? null : p.cover_image_url ?? null);
  const src = p.image ?? signed ?? "";
  const href = to ?? `/property/${p.id}`;
  const status = p.status ?? "available";
  const isActive = status === "available" || status === "published" || status === "under_negotiation";

  return (
    <Link
      to={href}
      className="group block overflow-hidden rounded-3xl border border-border bg-card hover-lift"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {src ? (
          <img
            src={src}
            alt={p.title}
            loading="lazy"
            className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${!isActive ? "grayscale" : ""}`}
          />
        ) : (
          <div className="grid h-full place-items-center text-muted-foreground text-sm">No image</div>
        )}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
          <span className="rounded-full bg-background/85 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-foreground backdrop-blur">
            {p.listing_type === "rent" ? "For Rent" : "For Sale"}
          </span>
          <div className="flex flex-col gap-1.5 items-end">
            {p.badge && (
              <span className="rounded-full bg-gold px-3 py-1 text-xs font-semibold text-gold-foreground shadow-soft">
                {p.badge}
              </span>
            )}
            <PropertyStatusBadge status={status} />
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); }}
          aria-label="Save"
          className="absolute bottom-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-background/85 text-foreground opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100 hover:bg-primary hover:text-primary-foreground"
        >
          <Heart className="h-4 w-4" />
        </button>
      </div>

      <div className="p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="truncate font-display text-lg font-semibold tracking-tight">{p.title}</h3>
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{p.locality ? `${p.locality}, ` : ""}{p.city}</span>
        </p>

        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><BedDouble className="h-3.5 w-3.5" />{p.bedrooms} bd</span>
          <span className="inline-flex items-center gap-1.5"><Bath className="h-3.5 w-3.5" />{p.bathrooms} ba</span>
          <span className="inline-flex items-center gap-1.5"><Maximize2 className="h-3.5 w-3.5" />{formatArea(p.area_sqft)}</span>
        </div>

        <div className="mt-5 flex items-end justify-between border-t border-border pt-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{p.property_type}</div>
            <div className="font-display text-xl font-semibold text-foreground">
              {formatINR(p.price)}<span className="text-sm font-normal text-muted-foreground">{priceSuffix(p.listing_type)}</span>
            </div>
          </div>
          <span className="rounded-full bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}
