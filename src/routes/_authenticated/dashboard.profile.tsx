import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { INDIA_STATES, citiesForState } from "@/lib/locations";

export const Route = createFileRoute("/_authenticated/dashboard/profile")({
  head: () => ({ meta: [{ title: "Profile — EstateVerse" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, refresh } = useAuth();
  const [form, setForm] = useState({
    full_name: "", phone: "", address: "", city: "", state: "", pincode: "", bio: "", user_type: "buyer" as "buyer" | "tenant" | "owner",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm((f) => ({
        ...f,
        full_name: profile.full_name ?? "",
        phone: profile.phone ?? "",
        city: profile.city ?? "",
        state: profile.state ?? "",
        user_type: (profile.user_type === "agent" ? "owner" : profile.user_type) as "buyer" | "tenant" | "owner",
      }));
    }
  }, [profile]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update(form).eq("id", user.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    refresh();
  }

  const cities = citiesForState(form.state);

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-semibold uppercase tracking-widest text-gold">Profile</span>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Account settings</h1>
      </div>

      <form onSubmit={save} className="rounded-3xl border border-border bg-card p-7 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name"><input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={inputCls} /></Field>
          <Field label="Phone"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} /></Field>
          <Field label="State">
            <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value, city: "" })} className={inputCls}>
              <option value="">Select state</option>
              {INDIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="City">
            <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} disabled={!form.state} className={inputCls}>
              <option value="">Select city</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Account type">
            <select value={form.user_type} onChange={(e) => setForm({ ...form, user_type: e.target.value as typeof form.user_type })} className={inputCls}>
              <option value="buyer">Buyer</option>
              <option value="tenant">Tenant</option>
              <option value="owner">Property Owner</option>
            </select>
          </Field>
        </div>
        <Field label="Bio"><textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={4} className={inputCls} /></Field>
        <div className="flex justify-end">
          <Button type="submit" disabled={busy} className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">{busy ? "Saving…" : "Save changes"}</Button>
        </div>
      </form>
    </div>
  );
}

const inputCls = "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
