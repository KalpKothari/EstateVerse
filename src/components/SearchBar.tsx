import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, MapPin, Home, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SearchBar({ defaultTab = "buy" }: { defaultTab?: "buy" | "rent" }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"buy" | "rent">(defaultTab);
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [budget, setBudget] = useState("");

  return (
    <div className="rounded-3xl border border-border bg-card/95 p-2 shadow-lift backdrop-blur">
      <div className="flex gap-1 px-2 pt-1">
        {(["buy", "rent"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-5 py-2 text-sm font-semibold uppercase tracking-wider transition-all ${
              tab === t
                ? "bg-primary text-primary-foreground shadow-soft"
                : "text-foreground/60 hover:text-foreground"
            }`}
          >
            {t === "buy" ? "Buy" : "Rent"}
          </button>
        ))}
      </div>
      <form
        className="mt-2 grid gap-2 rounded-2xl bg-background/60 p-2 md:grid-cols-[1.4fr_1fr_1fr_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          const params = new URLSearchParams();
          if (city) params.set("q", city);
          if (type) params.set("type", type);
          if (budget) params.set("max", budget);
          navigate({ to: tab === "rent" ? "/rent" : "/buy", search: Object.fromEntries(params) as Record<string, string> });
        }}
      >
        <Field icon={<MapPin className="h-4 w-4" />} label="Where">
          <input
            placeholder="City or locality"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </Field>
        <Field icon={<Home className="h-4 w-4" />} label="Type">
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-transparent text-sm outline-none">
            <option value="">Any</option>
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="villa">Villa</option>
            <option value="penthouse">Penthouse</option>
            <option value="plot">Plot</option>
            <option value="commercial">Commercial</option>
          </select>
        </Field>
        <Field icon={<IndianRupee className="h-4 w-4" />} label="Max Budget">
          <select value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full bg-transparent text-sm outline-none">
            <option value="">Any</option>
            {tab === "rent" ? (
              <>
                <option value="30000">Up to ₹30K</option>
                <option value="75000">Up to ₹75K</option>
                <option value="150000">Up to ₹1.5L</option>
                <option value="500000">Up to ₹5L</option>
              </>
            ) : (
              <>
                <option value="5000000">Up to ₹50L</option>
                <option value="20000000">Up to ₹2 Cr</option>
                <option value="50000000">Up to ₹5 Cr</option>
                <option value="200000000">Up to ₹20 Cr</option>
              </>
            )}
          </select>
        </Field>
        <Button type="submit" className="h-full rounded-2xl bg-primary px-6 text-primary-foreground hover:bg-primary/90">
          <Search className="mr-2 h-4 w-4" /> Search
        </Button>
      </form>
    </div>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-3 rounded-xl bg-background px-4 py-3">
      <span className="text-primary">{icon}</span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
        {children}
      </span>
    </label>
  );
}
