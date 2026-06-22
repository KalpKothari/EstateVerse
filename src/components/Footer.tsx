import { Link } from "@tanstack/react-router";
import { Sprout, Instagram, Twitter, Linkedin, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-32 bg-sidebar text-sidebar-foreground">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gold text-gold-foreground">
                <Sprout className="h-5 w-5" />
              </span>
              <span className="font-display text-2xl font-semibold">
                Estate<span className="text-gold">Verse</span>
              </span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-sidebar-foreground/70">
              A new home for real estate. Curated listings, verified owners, and a quietly intelligent way to buy, rent, or sell.
            </p>
            <div className="mt-6 flex gap-2">
              {[Instagram, Twitter, Linkedin, Mail].map((Icon, i) => (
                <a key={i} href="#" className="grid h-10 w-10 place-items-center rounded-full border border-sidebar-border/40 transition-colors hover:bg-gold hover:text-gold-foreground hover:border-gold">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <FooterCol title="Explore" links={[
            { to: "/buy", label: "Buy a Home" },
            { to: "/rent", label: "Rent a Home" },
            { to: "/sell", label: "List Property" },
            { to: "/properties", label: "All Properties" },
            { to: "/locations", label: "Locations" },
          ]} />
          <FooterCol title="Company" links={[
            { to: "/about", label: "About" },
            { to: "/contact", label: "Contact" },
            { to: "/dashboard", label: "Dashboard" },
          ]} />
          <FooterCol title="Account" links={[
            { to: "/auth", label: "Sign In" },
            { to: "/auth", label: "Register" },
          ]} />
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-3 border-t border-sidebar-border/40 pt-8 text-xs text-sidebar-foreground/60 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} EstateVerse. Crafted with intention.</p>
          <p>Privacy · Terms · Verified by EstateVerse Trust™</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div>
      <h4 className="font-display text-sm font-semibold uppercase tracking-widest text-gold">{title}</h4>
      <ul className="mt-5 space-y-3 text-sm">
        {links.map((l) => (
          <li key={l.label}>
            <Link to={l.to} className="text-sidebar-foreground/75 transition-colors hover:text-gold">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
