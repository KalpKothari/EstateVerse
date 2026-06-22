import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/format";
import { useImageUrl } from "@/lib/storage";
import { toast } from "sonner";
import { OWNER_SETTABLE_STATUSES, statusLabel } from "@/lib/status";
import { PropertyStatusBadge } from "@/components/PropertyStatusBadge";

export const Route = createFileRoute("/_authenticated/dashboard/properties/")({
  head: () => ({ meta: [{ title: "My Listings — EstateVerse" }] }),
  component: MyPropertiesPage,
});

function MyPropertiesPage() {
  const { user, profile } = useAuth();
  const verified = profile?.verification_status === "verified";
  const isOwner = profile?.user_type === "owner" || profile?.user_type === "agent";
  const qc = useQueryClient();

  const { data, refetch } = useQuery({
    queryKey: ["my-properties", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("properties")
        .select("id,title,city,price,listing_type,status,cover_image_url,views_count,created_at")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  async function remove(id: string) {
    if (!confirm("Delete this listing?")) return;
    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Listing removed");
    refetch();
  }

  async function changeStatus(id: string, status: string) {
    const { error } = await supabase.from("properties").update({ status: status as never }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Marked as ${statusLabel(status)}`);
    qc.invalidateQueries({ queryKey: ["my-properties", user?.id] });
  }

  if (!isOwner) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-12 text-center">
        <h2 className="font-display text-2xl">Property owners only</h2>
        <p className="mt-2 text-muted-foreground">Switch your account type to Property Owner from Profile to access listings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-gold">Listings</span>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">My properties</h1>
        </div>
        <Link to={verified ? "/dashboard/properties/new" : "/dashboard/verification"}>
          <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" /> {verified ? "New listing" : "Get verified to list"}
          </Button>
        </Link>
      </div>

      {(!data || data.length === 0) && (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
          <h2 className="font-display text-2xl">No listings yet</h2>
          <p className="mt-2 text-muted-foreground">{verified ? "Publish your first property to start receiving inquiries." : "Verify your account first to list properties."}</p>
        </div>
      )}

      <div className="grid gap-4">
        {(data ?? []).map((p) => (
          <ListingRow key={p.id} p={p} onDelete={() => remove(p.id)} onStatus={(s) => changeStatus(p.id, s)} />
        ))}
      </div>
    </div>
  );
}

function ListingRow({ p, onDelete, onStatus }: { p: { id: string; title: string; city: string; price: number; listing_type: string; status: string; cover_image_url: string | null; views_count: number }; onDelete: () => void; onStatus: (s: string) => void }) {
  const url = useImageUrl(p.cover_image_url);
  return (
    <div className="grid gap-4 rounded-3xl border border-border bg-card p-4 sm:grid-cols-[120px_1fr_auto] sm:items-center">
      <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-muted sm:aspect-square sm:h-24 sm:w-30">
        {url && <img src={url} alt={p.title} className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-display text-lg font-semibold">{p.title}</h3>
          <PropertyStatusBadge status={p.status} />
        </div>
        <div className="mt-1 text-sm text-muted-foreground">{p.city} · {p.listing_type === "rent" ? "For Rent" : "For Sale"}</div>
        <div className="mt-2 font-display text-xl font-semibold">{formatINR(p.price)}</div>
        <div className="mt-1 text-xs text-muted-foreground inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {p.views_count} views</div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select value={p.status === "published" ? "available" : p.status} onChange={(e) => onStatus(e.target.value)} className="rounded-full border border-border bg-background px-3 py-2 text-xs font-semibold">
          {OWNER_SETTABLE_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <Link to={`/property/${p.id}`}><Button variant="outline" size="sm" className="rounded-full">View</Button></Link>
        <Button size="sm" variant="outline" className="rounded-full text-destructive" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}
