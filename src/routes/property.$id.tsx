import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BedDouble, Bath, Maximize2, MapPin, Calendar, MessageSquare, ShieldCheck, ArrowLeft, Trees, Wifi, Car, Dumbbell, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useImageUrl } from "@/lib/storage";
import { useAuth } from "@/lib/auth";
import { formatINR, formatArea, priceSuffix } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { demoProperties } from "@/lib/demo";
import { PropertyStatusBadge } from "@/components/PropertyStatusBadge";
import { MessageDialog } from "@/components/MessageDialog";
import { canInteract, statusLabel } from "@/lib/status";

export const Route = createFileRoute("/property/$id")({
  head: () => ({
    meta: [
      { title: "Property — EstateVerse" },
      { name: "description", content: "Full property details, gallery, and contact." },
    ],
  }),
  component: PropertyDetailPage,
});

function PropertyDetailPage() {
  const { id } = useParams({ from: "/property/$id" });
  const { user } = useAuth();

  const { data: live, isLoading } = useQuery({
    queryKey: ["property", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("properties")
        .select("*, property_images(url,sort_order)")
        .eq("id", id)
        .maybeSingle();
      if (!data) return null;
      const { data: owner } = await supabase.from("profiles").select("full_name,phone,email,verification_status,avatar_url").eq("id", data.owner_id).maybeSingle();
      return { ...data, owner };
    },
    enabled: !id.startsWith("d"),
  });

  const demo = demoProperties.find((d) => d.id === id);

  if (isLoading && !demo) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-10">
        <div className="h-8 w-40 animate-pulse rounded-full bg-muted" />
        <div className="mt-6 aspect-[16/9] w-full animate-pulse rounded-3xl bg-muted" />
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-3">
            <div className="h-10 w-3/4 animate-pulse rounded-2xl bg-muted" />
            <div className="h-6 w-1/2 animate-pulse rounded-2xl bg-muted" />
            <div className="h-40 w-full animate-pulse rounded-2xl bg-muted" />
          </div>
          <div className="h-72 w-full animate-pulse rounded-3xl bg-muted" />
        </div>
      </div>
    );
  }

  if (!live && !demo) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-32 text-center">
        <h1 className="font-display text-4xl font-semibold">Property not found</h1>
        <Link to="/properties" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-primary-foreground"><ArrowLeft className="h-4 w-4" /> Back to listings</Link>
      </div>
    );
  }

  const isDemo = !!demo && !live;
  const fallback = demo ? {
    id: demo.id, title: demo.title, description: "A premium home, curated for those who notice the details.", price: demo.price,
    city: demo.city, locality: demo.locality, address: `${demo.locality}, ${demo.city}`, state: "—", pincode: "—",
    property_type: demo.property_type, listing_type: demo.listing_type, bedrooms: demo.bedrooms, bathrooms: demo.bathrooms,
    area_sqft: demo.area_sqft, furnishing: "semi_furnished", amenities: ["pool","gym","parking","garden","wifi"] as string[],
    cover_image_url: null as string | null, owner_id: "", status: "available", property_images: [] as { url: string; sort_order: number }[],
    owner: { full_name: "EstateVerse Curated", phone: null, email: "concierge@estateverse.app", verification_status: "verified", avatar_url: null },
  } : null;
  const p = (live ?? fallback) as PropertyShape;

  return <PropertyView p={p} demoImage={demo?.image} user={user} isDemo={isDemo} />;
}

type PropertyShape = {
  id: string; title: string; description: string; price: number; city: string; locality: string | null; address: string; state: string; pincode: string | null;
  property_type: string; listing_type: "buy" | "rent"; bedrooms: number; bathrooms: number; area_sqft: number; furnishing: string; amenities: string[];
  cover_image_url: string | null; owner_id: string; status: string; property_images: { url: string; sort_order: number }[];
  owner: { full_name: string | null; phone: string | null; email: string; verification_status: string; avatar_url: string | null } | null;
};

function PropertyView({ p: prop, demoImage, user, isDemo }: { p: PropertyShape; demoImage?: string; user: { id: string } | null; isDemo: boolean }) {

  const cover = useImageUrl(demoImage ? null : prop.cover_image_url);
  const heroSrc = demoImage ?? cover ?? "";
  const owner = prop.owner;
  const verified = owner?.verification_status === "verified";
  const interactive = canInteract(prop.status);
  const isOwnProperty = !!user && !!prop.owner_id && user.id === prop.owner_id;

  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("11:00");
  const [message, setMessage] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [savedBusy, setSavedBusy] = useState(false);

  async function scheduleVisit() {
    if (!user) return toast.error("Please sign in to schedule a visit");
    if (isDemo) return toast.info("This is a demo listing — sign in and try a real one.");
    if (!interactive) return toast.error("Visit requests are disabled for this property.");
    if (!visitDate) return toast.error("Pick a date");
    const { error } = await supabase.from("bookings").insert({
      property_id: prop.id, user_id: user.id, owner_id: prop.owner_id,
      visit_date: visitDate, visit_time: visitTime, notes: message, status: "pending",
    });
    if (error) return toast.error(error.message);
    toast.success("Visit requested — the owner will confirm shortly.");
    setVisitDate(""); setMessage("");
  }

  async function saveToFavorites() {
    if (!user) return toast.error("Please sign in to save");
    if (isDemo) return toast.info("Demo listing — sign in and save real ones.");
    setSavedBusy(true);
    const { error } = await supabase.from("favorites").insert({ user_id: user.id, property_id: prop.id });
    setSavedBusy(false);
    if (error && !error.message.includes("duplicate")) return toast.error(error.message);
    toast.success("Saved to your shortlist");
  }

  function openChat() {
    if (!user) return toast.error("Please sign in to message the owner");
    if (isDemo) return toast.info("This is a demo listing — sign in and try a real one.");
    if (!interactive) return toast.error("Messaging is disabled for this property.");
    setChatOpen(true);
  }

  const amenityIcons: Record<string, typeof Trees> = { pool: Trees, gym: Dumbbell, parking: Car, wifi: Wifi, garden: Trees };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
      <Link to="/properties" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All properties
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="overflow-hidden rounded-3xl bg-muted aspect-[16/10]">
          {heroSrc ? (
            <img src={heroSrc} alt={prop.title} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-muted-foreground">No image</div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(prop.property_images ?? []).slice(0, 4).map((img, i) => (
            <GalleryThumb key={i} path={img.url} alt={`${prop.title} ${i+1}`} />
          ))}
          {(prop.property_images ?? []).length === 0 && Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-muted grid place-items-center text-xs text-muted-foreground">+ more</div>
          ))}
        </div>
      </div>

      {!interactive && (prop.status === "sold" || prop.status === "rented_out" || prop.status === "rented" || prop.status === "temporarily_unavailable") && (
        <div className={`mt-6 rounded-3xl p-5 ${prop.status === "sold" ? "bg-destructive/10 text-destructive" : "bg-muted text-foreground"}`}>
          <div className="font-display text-lg font-semibold">
            {prop.status === "sold" && "This property has already been sold."}
            {(prop.status === "rented_out" || prop.status === "rented") && "This property has already been rented out."}
            {prop.status === "temporarily_unavailable" && "This property is temporarily unavailable."}
          </div>
          <div className="mt-1 text-sm opacity-80">It remains visible for transparency. Inquiries and visit requests are disabled.</div>
        </div>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              {prop.listing_type === "rent" ? "For Rent" : "For Sale"} · {prop.property_type}
            </span>
            <PropertyStatusBadge status={prop.status} />
          </div>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight lg:text-5xl">{prop.title}</h1>
          <p className="mt-2 flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /> {prop.address}, {prop.city}</p>

          <div className="mt-6 flex flex-wrap items-center gap-6 rounded-3xl border border-border bg-card p-6">
            <Spec icon={<BedDouble className="h-5 w-5" />} label="Bedrooms" value={String(prop.bedrooms)} />
            <Spec icon={<Bath className="h-5 w-5" />} label="Bathrooms" value={String(prop.bathrooms)} />
            <Spec icon={<Maximize2 className="h-5 w-5" />} label="Area" value={formatArea(prop.area_sqft)} />
            <Spec icon={<ShieldCheck className="h-5 w-5" />} label="Furnishing" value={prop.furnishing.replace("_"," ")} />
          </div>

          <div className="mt-8">
            <h2 className="font-display text-2xl font-semibold">About this home</h2>
            <p className="mt-3 leading-relaxed text-foreground/80">{prop.description || "A premium home, curated for those who notice the details."}</p>
          </div>

          <div className="mt-8">
            <h2 className="font-display text-2xl font-semibold">Amenities</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {(prop.amenities ?? []).map((a) => {
                const Icon = amenityIcons[a] ?? ShieldCheck;
                return (
                  <span key={a} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm capitalize">
                    <Icon className="h-3.5 w-3.5 text-primary" /> {a.replace("_"," ")}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-lift">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{prop.listing_type === "rent" ? "Monthly rent" : "Sale price"}</div>
                <div className="font-display text-4xl font-semibold">
                  {formatINR(prop.price)}<span className="text-base font-normal text-muted-foreground">{priceSuffix(prop.listing_type)}</span>
                </div>
              </div>
              <PropertyStatusBadge status={prop.status} />
            </div>

            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-background p-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground font-semibold">
                {(owner?.full_name ?? "EV").slice(0,2)}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-1.5 font-semibold">{owner?.full_name ?? "Owner"} {verified && <ShieldCheck className="h-4 w-4 text-gold" />}</div>
                <div className="text-xs text-muted-foreground">{verified ? "Verified owner" : "Owner"}</div>
              </div>
            </div>

            <div className="mt-5 grid gap-2">
              {isOwnProperty ? (
                <div className="rounded-2xl border border-dashed border-border bg-background p-4 text-sm text-muted-foreground">
                  This is your listing. Manage incoming visit requests and messages from your <Link to="/dashboard" className="font-semibold text-primary underline-offset-4 hover:underline">Dashboard</Link>.
                </div>
              ) : (
                <>
                  <Button onClick={openChat} disabled={!interactive} className="h-12 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                    <MessageSquare className="mr-2 h-4 w-4" /> Message Owner
                  </Button>
                  <Button onClick={saveToFavorites} disabled={savedBusy} variant="outline" className="h-12 rounded-2xl border-primary/30">
                    <Heart className="mr-2 h-4 w-4" /> Save to shortlist
                  </Button>
                </>
              )}
            </div>
          </div>

          {!isOwnProperty && (
            <div className="rounded-3xl border border-border bg-card p-6">
              <h3 className="font-display text-xl font-semibold">Schedule a visit</h3>
              {!interactive && (
                <p className="mt-2 text-sm text-muted-foreground">Visit requests are disabled — status: {statusLabel(prop.status)}.</p>
              )}
              <div className={`mt-4 grid gap-3 ${interactive ? "" : "opacity-50 pointer-events-none"}`}>
                <label className="grid gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</span>
                  <input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} min={new Date().toISOString().split("T")[0]} className="rounded-xl bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time</span>
                  <select value={visitTime} onChange={(e) => setVisitTime(e.target.value)} className="rounded-xl bg-background px-3 py-2.5 text-sm outline-none">
                    {["10:00","11:00","14:00","16:00","18:00"].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes (optional)</span>
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="rounded-xl bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="Anything the owner should know" />
                </label>
                <Button onClick={scheduleVisit} disabled={!interactive} className="h-12 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90">
                  <Calendar className="mr-2 h-4 w-4" /> Request visit
                </Button>
              </div>
            </div>
          )}
        </aside>
      </div>

      <MessageDialog
        open={chatOpen}
        onOpenChange={setChatOpen}
        propertyId={prop.id}
        ownerId={prop.owner_id}
        ownerName={owner?.full_name ?? "Owner"}
        propertyTitle={prop.title}
      />
    </div>
  );
}

function Spec({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-soft text-primary">{icon}</span>
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="font-semibold capitalize">{value}</div>
      </div>
    </div>
  );
}

function GalleryThumb({ path, alt }: { path: string; alt: string }) {
  const url = useImageUrl(path);
  return (
    <div className="aspect-square overflow-hidden rounded-2xl bg-muted">
      {url && <img src={url} alt={alt} loading="lazy" className="h-full w-full object-cover" />}
    </div>
  );
}
