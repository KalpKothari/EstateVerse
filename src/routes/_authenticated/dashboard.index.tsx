import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, Heart, Calendar, ShieldCheck, ArrowRight, Sparkles, MessageSquare, Shield } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({ meta: [{ title: "Dashboard — EstateVerse" }] }),
  component: DashboardHome,
});

function DashboardHome() {
  const { profile, user, isAdmin } = useAuth();
  const isOwner = profile?.user_type === "owner" || profile?.user_type === "agent";

  const { data: counts } = useQuery({
    queryKey: ["dash-counts", user?.id],
    queryFn: async () => {
      if (!user) return { listings: 0, favorites: 0, bookings: 0, messages: 0 };
      const [l, f, b, m] = await Promise.all([
        supabase.from("properties").select("id", { count: "exact", head: true }).eq("owner_id", user.id),
        supabase.from("favorites").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("bookings").select("id", { count: "exact", head: true }).or(`user_id.eq.${user.id},owner_id.eq.${user.id}`),
        supabase.from("conversations").select("id", { count: "exact", head: true }).or(`buyer_id.eq.${user.id},owner_id.eq.${user.id}`),
      ]);
      return { listings: l.count ?? 0, favorites: f.count ?? 0, bookings: b.count ?? 0, messages: m.count ?? 0 };
    },
    enabled: !!user,
  });

  const verified = profile?.verification_status === "verified";
  const submitted = profile?.verification_status === "submitted" || profile?.verification_status === "under_review";

  return (
    <div className="space-y-8">
      <header>
        <span className="text-xs font-semibold uppercase tracking-widest text-gold">Dashboard</span>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Welcome, {profile?.full_name?.split(" ")[0] || "there"}.</h1>
        <p className="mt-2 text-muted-foreground">Here's what's happening across your EstateVerse.</p>
      </header>

      {isOwner && !verified && (
        <div className="overflow-hidden rounded-3xl gradient-forest p-7 text-cream">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-cream/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold"><ShieldCheck className="h-3 w-3" /> {submitted ? "Verification in review" : "Get verified"}</span>
              <h3 className="mt-3 font-display text-2xl font-semibold">{submitted ? "We're reviewing your documents" : "Unlock listing privileges"}</h3>
              <p className="mt-1 text-sm text-cream/80">{submitted ? "We'll notify you within 48 hours." : "Verified sellers get 3.4× more inquiries and a trust badge."}</p>
            </div>
            <Link to="/dashboard/verification"><Button className="rounded-full bg-gold text-gold-foreground hover:bg-gold/90">{submitted ? "View status" : "Start verification"} <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="overflow-hidden rounded-3xl bg-sidebar p-7 text-sidebar-foreground">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-cream/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold"><Shield className="h-3 w-3" /> Admin tools</span>
              <h3 className="mt-3 font-display text-2xl font-semibold">Moderation center</h3>
              <p className="mt-1 text-sm opacity-80">Review verifications, users, and properties.</p>
            </div>
            <Link to="/dashboard/admin"><Button className="rounded-full bg-gold text-gold-foreground hover:bg-gold/90">Open admin <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isOwner && <StatCard icon={<Building2 className="h-5 w-5" />} label="My listings" value={counts?.listings ?? 0} to="/dashboard/properties" />}
        <StatCard icon={<Heart className="h-5 w-5" />} label="Saved" value={counts?.favorites ?? 0} to="/dashboard/favorites" />
        <StatCard icon={<Calendar className="h-5 w-5" />} label="Visits" value={counts?.bookings ?? 0} to="/dashboard/bookings" />
        <StatCard icon={<MessageSquare className="h-5 w-5" />} label="Messages" value={counts?.messages ?? 0} to="/dashboard/messages" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-7">
          <Sparkles className="h-6 w-6 text-gold" />
          <h2 className="mt-4 font-display text-2xl font-semibold">AI Recommendations</h2>
          <p className="mt-2 text-sm text-muted-foreground">Natural-language search, commute-optimized picks, and lifestyle matches — tuned to your activity.</p>
          <Link to="/dashboard/recommendations"><Button variant="outline" className="mt-5 rounded-full border-primary/30">Open recommendations <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
        {isOwner ? (
          <div className="rounded-3xl border border-border bg-card p-7">
            <Building2 className="h-6 w-6 text-primary" />
            <h2 className="mt-4 font-display text-2xl font-semibold">List a property</h2>
            <p className="mt-2 text-sm text-muted-foreground">Verified sellers can publish unlimited listings.</p>
            <Link to={verified ? "/dashboard/properties/new" : "/dashboard/verification"}>
              <Button className="mt-5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                {verified ? "Create listing" : "Get verified first"} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="rounded-3xl border border-border bg-card p-7">
            <Heart className="h-6 w-6 text-primary" />
            <h2 className="mt-4 font-display text-2xl font-semibold">Browse properties</h2>
            <p className="mt-2 text-sm text-muted-foreground">{profile?.user_type === "tenant" ? "Discover homes for rent across India." : "Find your next home to buy."}</p>
            <Link to={profile?.user_type === "tenant" ? "/rent" : "/buy"}>
              <Button className="mt-5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                Browse listings <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, to }: { icon: React.ReactNode; label: string; value: number; to: string }) {
  return (
    <Link to={to} className="group rounded-3xl border border-border bg-card p-6 hover-lift">
      <div className="flex items-center justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-soft text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">{icon}</span>
        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
      </div>
      <div className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-4xl font-semibold">{value}</div>
    </Link>
  );
}
