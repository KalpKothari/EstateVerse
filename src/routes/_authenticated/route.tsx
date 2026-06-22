import { createFileRoute, Outlet, redirect, Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Home, LayoutDashboard, Heart, Building2, Calendar, ShieldCheck, UserCog, LogOut, Sprout, MessageSquare, Sparkles, Shield } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: { mode: "login" } });
    return { user: data.user };
  },
  component: AuthedLayout,
});

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact: boolean };

function navForRole(userType: string | undefined, isAdmin: boolean): NavItem[] {
  const common: NavItem[] = [
    { to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
    { to: "/dashboard/favorites", label: "Saved Properties", icon: Heart, exact: true },
    { to: "/dashboard/bookings", label: "Visits", icon: Calendar, exact: true },
    { to: "/dashboard/messages", label: "Messages", icon: MessageSquare, exact: false },
    { to: "/dashboard/recommendations", label: "AI Recommendations", icon: Sparkles, exact: true },
  ];
  const ownerOnly: NavItem[] = [
    { to: "/dashboard/properties", label: "My Listings", icon: Building2, exact: false },
    { to: "/dashboard/verification", label: "Verification", icon: ShieldCheck, exact: true },
  ];
  const profile: NavItem[] = [{ to: "/dashboard/profile", label: "Profile", icon: UserCog, exact: true }];
  const adminItem: NavItem[] = isAdmin ? [{ to: "/dashboard/admin", label: "Admin", icon: Shield, exact: false }] : [];
  const isOwner = userType === "owner" || userType === "agent";
  return [...common, ...(isOwner ? ownerOnly : []), ...adminItem, ...profile];
}

function AuthedLayout() {
  const { profile, signOut, isAdmin } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navItems = navForRole(profile?.user_type, isAdmin);

  return (
    <div className="mx-auto max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[260px_1fr] lg:px-10">
      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-3xl border border-border bg-card p-5">
          <div className="flex items-center gap-3 rounded-2xl bg-primary-soft p-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground font-semibold">
              {profile?.full_name?.slice(0,2)?.toUpperCase() ?? "EV"}
            </span>
            <div className="min-w-0">
              <div className="truncate font-semibold">{profile?.full_name || "Welcome"}</div>
              <div className="text-xs capitalize text-muted-foreground">{isAdmin ? "Admin" : (profile?.user_type === "owner" ? "Property Owner" : profile?.user_type ?? "—")}</div>
            </div>
          </div>

          <nav className="mt-5 grid gap-1">
            {navItems.map((n) => {
              const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
              return (
                <Link key={n.to} to={n.to} className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors ${active ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-accent"}`}>
                  <n.icon className="h-4 w-4" /> {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-5 border-t border-border pt-4 grid gap-1">
            <Link to="/" className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-foreground/70 hover:bg-accent"><Home className="h-4 w-4" /> Back to site</Link>
            <button onClick={signOut} className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-foreground/70 hover:bg-accent"><LogOut className="h-4 w-4" /> Sign out</button>
          </div>
        </div>
      </aside>

      <section className="min-w-0">
        <div className="mb-6 flex items-center gap-2 text-xs text-muted-foreground lg:hidden">
          <Sprout className="h-3.5 w-3.5 text-primary" /> Your dashboard
        </div>
        <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 lg:hidden">
          {navItems.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold ${active ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground/70"}`}>
                {n.label}
              </Link>
            );
          })}
        </div>
        <Outlet />
      </section>
    </div>
  );
}
