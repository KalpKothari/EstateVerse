import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Sprout } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const allNavLinks = [
  { to: "/", label: "Home" },
  { to: "/buy", label: "Buy" },
  { to: "/rent", label: "Rent" },
  { to: "/sell", label: "Sell" },
  { to: "/properties", label: "Properties" },
  { to: "/locations", label: "Locations" },
  { to: "/about", label: "About" },
] as const;

const ownerNavLinks = [
  { to: "/", label: "Home" },
  { to: "/sell", label: "Sell" },
  { to: "/locations", label: "Locations" },
  { to: "/about", label: "About" },
] as const;

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const isOwner = profile?.user_type === "owner" || profile?.user_type === "agent";
  const navLinks = isOwner ? ownerNavLinks : allNavLinks;

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-6 px-4 py-3 sm:px-6 lg:px-10">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground transition-transform group-hover:rotate-6">
            <Sprout className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">
            Estate<span className="text-gradient-gold">Verse</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{ className: "rounded-full px-3.5 py-2 text-sm font-medium bg-primary text-primary-foreground" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              <Link to="/dashboard">
                <Button variant="ghost" className="rounded-full">Dashboard</Button>
              </Link>
              <Button onClick={signOut} variant="outline" className="rounded-full border-primary/30">
                {profile?.full_name?.split(" ")[0] ?? "Sign out"}
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth" search={{ mode: "login" }}>
                <Button variant="ghost" className="rounded-full">Login</Button>
              </Link>
              <Link to="/auth" search={{ mode: "register" }}>
                <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        <button
          aria-label="Toggle menu"
          className="grid h-10 w-10 place-items-center rounded-xl border border-border lg:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium text-foreground/80 hover:bg-accent"
                activeProps={{ className: "rounded-xl px-4 py-3 text-sm font-medium bg-primary text-primary-foreground" }}
                activeOptions={{ exact: l.to === "/" }}
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2 border-t border-border pt-3">
              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setOpen(false)} className="flex-1">
                    <Button className="w-full rounded-full">Dashboard</Button>
                  </Link>
                  <Button onClick={signOut} variant="outline" className="rounded-full">Sign out</Button>
                </>
              ) : (
                <>
                  <Link to="/auth" search={{ mode: "login" }} onClick={() => setOpen(false)} className="flex-1">
                    <Button variant="outline" className="w-full rounded-full">Login</Button>
                  </Link>
                  <Link to="/auth" search={{ mode: "register" }} onClick={() => setOpen(false)} className="flex-1">
                    <Button className="w-full rounded-full">Register</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
