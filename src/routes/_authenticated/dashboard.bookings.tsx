import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Check, X, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/bookings")({
  head: () => ({ meta: [{ title: "Visits — EstateVerse" }] }),
  component: BookingsPage,
});

type Booking = {
  id: string; visit_date: string; visit_time: string; notes: string | null; status: string;
  property_id: string; user_id: string; owner_id: string;
  propTitle?: string | null; propCity?: string | null; visitorName?: string | null;
};

async function loadBookings(userId: string): Promise<Booking[]> {
  const { data } = await supabase
    .from("bookings")
    .select("id,visit_date,visit_time,notes,status,property_id,user_id,owner_id")
    .or(`user_id.eq.${userId},owner_id.eq.${userId}`)
    .order("visit_date", { ascending: true });
  const list = data ?? [];
  if (!list.length) return [];
  const propIds = Array.from(new Set(list.map((b) => b.property_id)));
  const visitorIds = Array.from(new Set(list.map((b) => b.user_id)));
  const [{ data: props }, { data: profs }] = await Promise.all([
    supabase.from("properties").select("id,title,city").in("id", propIds),
    supabase.from("profiles").select("id,full_name").in("id", visitorIds),
  ]);
  const propMap = Object.fromEntries((props ?? []).map((p) => [p.id, p]));
  const profMap = Object.fromEntries((profs ?? []).map((p) => [p.id, p]));
  return list.map((b) => ({
    ...b,
    propTitle: propMap[b.property_id]?.title ?? null,
    propCity: propMap[b.property_id]?.city ?? null,
    visitorName: profMap[b.user_id]?.full_name ?? null,
  }));
}

function BookingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["bookings", user?.id],
    queryFn: () => loadBookings(user!.id),
    enabled: !!user,
  });

  async function update(id: string, status: "confirmed" | "cancelled" | "completed") {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Visit ${status}`);
    qc.invalidateQueries({ queryKey: ["bookings", user?.id] });
  }

  const incoming = data.filter((b) => b.owner_id === user?.id);
  const outgoing = data.filter((b) => b.user_id === user?.id);

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs font-semibold uppercase tracking-widest text-gold">Visits</span>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Visit requests</h1>
      </div>

      {incoming.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-semibold mb-4">Incoming (your properties)</h2>
          <div className="grid gap-3">
            {incoming.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border bg-card p-5">
                <div>
                  <div className="font-display text-lg font-semibold">{b.propTitle ?? "Property"}</div>
                  <div className="text-sm text-muted-foreground">{b.visitorName ?? "Visitor"} · {b.propCity} · {b.visit_date} at {b.visit_time}</div>
                  {b.notes && <div className="mt-1 text-sm text-foreground/70">"{b.notes}"</div>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${b.status === "confirmed" ? "bg-primary text-primary-foreground" : b.status === "cancelled" ? "bg-destructive text-destructive-foreground" : b.status === "completed" ? "bg-gold text-gold-foreground" : "bg-muted text-foreground"}`}>{b.status}</span>
                  {b.status === "pending" && (
                    <>
                      <Button size="sm" onClick={() => update(b.id, "confirmed")} className="rounded-full bg-primary text-primary-foreground"><Check className="mr-1 h-3.5 w-3.5" /> Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => update(b.id, "cancelled")} className="rounded-full text-destructive"><X className="mr-1 h-3.5 w-3.5" /> Reject</Button>
                    </>
                  )}
                  {b.status === "confirmed" && (
                    <Button size="sm" variant="outline" onClick={() => update(b.id, "completed")} className="rounded-full"><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Mark completed</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-display text-xl font-semibold mb-4">Your visit requests</h2>
        {outgoing.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center">
            <Calendar className="mx-auto h-8 w-8 text-muted-foreground" />
            <h3 className="mt-4 font-display text-2xl">No visits scheduled</h3>
            <p className="mt-2 text-muted-foreground">Request a visit from any property page.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {outgoing.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border bg-card p-5">
                <div>
                  <div className="font-display text-lg font-semibold">{b.propTitle ?? "Property"}</div>
                  <div className="text-sm text-muted-foreground">{b.propCity} · {b.visit_date} at {b.visit_time}</div>
                  {b.notes && <div className="mt-1 text-sm text-foreground/70">"{b.notes}"</div>}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${b.status === "confirmed" ? "bg-primary text-primary-foreground" : b.status === "cancelled" ? "bg-destructive text-destructive-foreground" : b.status === "completed" ? "bg-gold text-gold-foreground" : "bg-muted text-foreground"}`}>{b.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
