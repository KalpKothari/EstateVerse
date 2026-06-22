import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Lock, Sprout, ArrowRight, User, Phone, MapPin, Building2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { INDIA_STATES, citiesForState } from "@/lib/locations";

type Search = { mode?: "login" | "register" };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    mode: s.mode === "register" ? "register" : "login",
  }),
  head: () => ({
    meta: [
      { title: "Sign in or Register — EstateVerse" },
      { name: "description", content: "Sign in to your EstateVerse account or create a new one." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode = "login" } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  return (
    <div className="relative isolate min-h-[calc(100vh-4rem)] grid lg:grid-cols-2">
      <aside className="hidden gradient-forest p-12 text-cream lg:flex lg:flex-col lg:justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gold text-gold-foreground"><Sprout className="h-5 w-5" /></span>
          <span className="font-display text-xl font-semibold">EstateVerse</span>
        </Link>
        <div className="max-w-md">
          <h2 className="font-display text-4xl font-semibold leading-tight">
            A quieter, more <span className="text-gradient-gold italic">considered</span> real estate.
          </h2>
          <p className="mt-5 text-cream/75">Verified owners. Curated listings. A search that learns what you actually like.</p>
        </div>
        <p className="text-xs text-cream/50">© {new Date().getFullYear()} EstateVerse · Crafted with intention.</p>
      </aside>

      <section className="flex items-center justify-center px-4 py-14 sm:px-6 lg:px-12">
        <div className="w-full max-w-md">
          <div className="flex rounded-full border border-border bg-card p-1">
            <Link to="/auth" search={{ mode: "login" }} className={`flex-1 rounded-full px-4 py-2.5 text-center text-sm font-semibold transition-colors ${mode === "login" ? "bg-primary text-primary-foreground" : "text-foreground/60"}`}>Sign in</Link>
            <Link to="/auth" search={{ mode: "register" }} className={`flex-1 rounded-full px-4 py-2.5 text-center text-sm font-semibold transition-colors ${mode === "register" ? "bg-primary text-primary-foreground" : "text-foreground/60"}`}>Create account</Link>
          </div>
          <div className="mt-8">
            {mode === "login" ? <LoginForm /> : <RegisterForm />}
          </div>
        </div>
      </section>
    </div>
  );
}

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) return toast.error(parsed.error.errors[0].message);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      if (error.message.toLowerCase().includes("invalid")) return toast.error("Invalid email or password");
      return toast.error(error.message);
    }
    toast.success("Welcome back");
    navigate({ to: "/dashboard" });
  }

  return (
    <>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-2 text-sm text-muted-foreground">Sign in to manage your listings, saved homes, and visits.</p>

      <form onSubmit={submit} className="mt-6 space-y-3">
        <FieldIcon icon={<Mail className="h-4 w-4" />}><input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent outline-none text-sm" /></FieldIcon>
        <FieldIcon icon={<Lock className="h-4 w-4" />}><input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent outline-none text-sm" /></FieldIcon>
        <Button type="submit" disabled={busy} className="h-12 w-full rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90">
          {busy ? "Signing in…" : <>Sign in <ArrowRight className="ml-2 h-4 w-4" /></>}
        </Button>
      </form>
    </>
  );
}

const registerSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().trim().min(7, "Enter a valid phone"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirm: z.string(),
  address: z.string().trim().min(2, "Enter your address"),
  state: z.string().trim().min(2, "Select a state"),
  city: z.string().trim().min(2, "Select a city"),
  pincode: z.string().trim().min(4),
  user_type: z.enum(["buyer", "tenant", "owner"]),
}).refine((d) => d.password === d.confirm, { message: "Passwords do not match", path: ["confirm"] });

type UserType = "buyer" | "tenant" | "owner";
type RegisterFormState = {
  full_name: string; email: string; phone: string; password: string; confirm: string;
  address: string; state: string; city: string; pincode: string; user_type: UserType;
};

function RegisterForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState<RegisterFormState>({
    full_name: "", email: "", phone: "", password: "", confirm: "",
    address: "", state: "", city: "", pincode: "", user_type: "buyer",
  });
  const [busy, setBusy] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm({ ...form, [k]: v });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.errors[0].message);
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.full_name,
          phone: form.phone,
          address: form.address,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          user_type: form.user_type,
        },
      },
    });
    if (error) { setBusy(false); return toast.error(error.message); }
    // If auto-confirm didn't return a session, sign the user in immediately.
    if (!data.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (signInError) {
        setBusy(false);
        return toast.error(signInError.message);
      }
    }
    setBusy(false);
    toast.success("Account created. Welcome to EstateVerse.");
    navigate({ to: "/dashboard" });
  }

  const cities = citiesForState(form.state);

  return (
    <>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-2 text-sm text-muted-foreground">It takes about a minute.</p>

      <form onSubmit={submit} className="mt-6 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldIcon icon={<User className="h-4 w-4" />}><input placeholder="Full name" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} className="w-full bg-transparent text-sm outline-none" /></FieldIcon>
          <FieldIcon icon={<Phone className="h-4 w-4" />}><input placeholder="Phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} className="w-full bg-transparent text-sm outline-none" /></FieldIcon>
        </div>
        <FieldIcon icon={<Mail className="h-4 w-4" />}><input type="email" placeholder="Email" value={form.email} onChange={(e) => set("email", e.target.value)} className="w-full bg-transparent text-sm outline-none" /></FieldIcon>
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldIcon icon={<Lock className="h-4 w-4" />}><input type="password" placeholder="Password" value={form.password} onChange={(e) => set("password", e.target.value)} className="w-full bg-transparent text-sm outline-none" /></FieldIcon>
          <FieldIcon icon={<Lock className="h-4 w-4" />}><input type="password" placeholder="Confirm" value={form.confirm} onChange={(e) => set("confirm", e.target.value)} className="w-full bg-transparent text-sm outline-none" /></FieldIcon>
        </div>
        <FieldIcon icon={<MapPin className="h-4 w-4" />}><input placeholder="Address" value={form.address} onChange={(e) => set("address", e.target.value)} className="w-full bg-transparent text-sm outline-none" /></FieldIcon>
        <div className="grid gap-3 sm:grid-cols-3">
          <FieldIcon>
            <select value={form.state} onChange={(e) => set("state", e.target.value)} className="w-full bg-transparent text-sm outline-none">
              <option value="">Select State</option>
              {INDIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </FieldIcon>
          <FieldIcon>
            <select value={form.city} onChange={(e) => set("city", e.target.value)} disabled={!form.state} className="w-full bg-transparent text-sm outline-none disabled:opacity-50">
              <option value="">Select City</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </FieldIcon>
          <FieldIcon><input placeholder="Pincode" value={form.pincode} onChange={(e) => set("pincode", e.target.value)} className="w-full bg-transparent text-sm outline-none" /></FieldIcon>
        </div>

        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">I am a</div>
          <div className="grid grid-cols-3 gap-2">
            {(["buyer","tenant","owner"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set("user_type", t)}
                className={`rounded-2xl border px-3 py-3 text-sm font-semibold capitalize transition-all ${form.user_type === t ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-accent"}`}
              >
                <Building2 className="mx-auto mb-1 h-4 w-4" /> {t === "owner" ? "Property Owner" : t}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" disabled={busy} className="h-12 w-full rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90">
          {busy ? "Creating…" : <>Create account <ArrowRight className="ml-2 h-4 w-4" /></>}
        </Button>
      </form>
    </>
  );
}

function FieldIcon({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      {children}
    </label>
  );
}
