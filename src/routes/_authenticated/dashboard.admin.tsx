import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Shield, Users, FileCheck2, Building2, Check, X as XIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/format";
import { statusLabel } from "@/lib/status";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/admin")({
  head: () => ({ meta: [{ title: "Admin — EstateVerse" }] }),
  component: AdminPage,
});

type Tab = "users" | "verifications" | "properties";

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("verifications");

  if (loading) return <div className="text-muted-foreground">Loading…</div>;
  if (!isAdmin) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-12 text-center">
        <Shield className="mx-auto h-8 w-8 text-muted-foreground" />
        <h2 className="mt-3 font-display text-2xl">Admins only</h2>
        <p className="text-muted-foreground">You don't have access to this area.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-semibold uppercase tracking-widest text-gold">Admin</span>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Moderation center</h1>
        <p className="mt-2 text-muted-foreground">Review users, verify owners, and manage properties.</p>
      </div>

      <div className="flex gap-2 rounded-full border border-border bg-card p-1 w-fit">
        {([
          ["verifications", "Verifications", FileCheck2],
          ["users", "Users", Users],
          ["properties", "Properties", Building2],
        ] as const).map(([k, label, Icon]) => (
          <button key={k} onClick={() => setTab(k)} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${tab === k ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:text-foreground"}`}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "verifications" && <VerificationsTab />}
      {tab === "users" && <UsersTab />}
      {tab === "properties" && <PropertiesTab />}
    </div>
  );
}

type ProfileLite = { id: string; full_name: string | null; email: string | null; phone: string | null; city: string | null; state: string | null };

async function fetchProfilesByIds(ids: string[]): Promise<Record<string, ProfileLite>> {
  if (!ids.length) return {};
  const { data } = await supabase.from("profiles").select("id,full_name,email,phone,city,state").in("id", ids);
  const map: Record<string, ProfileLite> = {};
  (data ?? []).forEach((p) => { map[p.id] = p as ProfileLite; });
  return map;
}

function VerificationsTab() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin-verifications"],
    queryFn: async () => {
      const { data: vs } = await supabase.from("seller_verifications").select("*").order("updated_at", { ascending: false });
      const verifications = vs ?? [];
      const profileMap = await fetchProfilesByIds(verifications.map((v) => v.user_id));
      return verifications.map((v) => ({ ...v, profile: profileMap[v.user_id] }));
    },
  });

  async function review(userId: string, status: "verified" | "rejected", notes?: string) {
    const { error: e1 } = await supabase.from("seller_verifications").update({ status, admin_notes: notes ?? null }).eq("user_id", userId);
    if (e1) return toast.error(e1.message);
    const { error: e2 } = await supabase.from("profiles").update({ verification_status: status }).eq("id", userId);
    if (e2) return toast.error(e2.message);
    toast.success(`Marked as ${status}`);
    qc.invalidateQueries({ queryKey: ["admin-verifications"] });
  }

  async function openDoc(path: string | null) {
    if (!path) return toast.info("Not uploaded");
    if (/^https?:\/\//.test(path)) { window.open(path, "_blank"); return; }
    const { data } = await supabase.storage.from("verification-docs").createSignedUrl(path, 60 * 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    else toast.error("Could not open document");
  }

  return (
    <div className="grid gap-4">
      {data.length === 0 && <Empty label="No verifications to review." />}
      {data.map((v) => (
        <article key={v.id} className="rounded-3xl border border-border bg-card p-6">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-display text-xl font-semibold">{v.profile?.full_name ?? "Unknown"}</div>
              <div className="text-sm text-muted-foreground">{v.profile?.email} · {v.profile?.phone ?? "—"} · {v.profile?.city ?? "—"}, {v.profile?.state ?? "—"}</div>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${v.status === "verified" ? "bg-primary text-primary-foreground" : v.status === "rejected" ? "bg-destructive text-destructive-foreground" : "bg-gold text-gold-foreground"}`}>
              {v.status}
            </span>
          </header>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {([
              ["Aadhaar", v.aadhaar_url],
              ["PAN", v.pan_url],
              ["Gov ID", v.gov_id_url],
              ["Profile photo", v.profile_photo_url],
              ["Ownership doc", v.ownership_doc_url],
              ["Address proof", v.property_address_proof_url],
            ] as const).map(([label, path]) => (
              <button key={label} onClick={() => openDoc(path)} className="rounded-2xl border border-border bg-background p-3 text-left hover:bg-accent">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
                <div className="mt-1 text-sm">{path ? "View document" : "Not uploaded"}</div>
              </button>
            ))}
          </div>

          {v.is_agent && (
            <div className="mt-4 rounded-2xl bg-background p-4 text-sm">
              <div className="font-semibold">Agent details</div>
              <div className="text-muted-foreground mt-1">{v.agency_name} · {v.office_address}</div>
              {v.business_info && <p className="mt-2">{v.business_info}</p>}
            </div>
          )}

          {v.status !== "verified" && v.status !== "rejected" && (
            <div className="mt-5 flex gap-2">
              <Button onClick={() => review(v.user_id, "verified")} className="rounded-full bg-primary text-primary-foreground"><Check className="mr-1.5 h-4 w-4" /> Approve</Button>
              <Button onClick={() => { const n = prompt("Rejection notes (optional):") ?? undefined; review(v.user_id, "rejected", n); }} variant="outline" className="rounded-full border-destructive/40 text-destructive"><XIcon className="mr-1.5 h-4 w-4" /> Reject</Button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

function UsersTab() {
  const { data = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(200);
      return data ?? [];
    },
  });
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-background text-xs uppercase tracking-wider text-muted-foreground">
          <tr><th className="p-3 text-left">Name</th><th className="p-3 text-left">Email</th><th className="p-3 text-left">Phone</th><th className="p-3 text-left">Type</th><th className="p-3 text-left">Verification</th><th className="p-3 text-left">City</th></tr>
        </thead>
        <tbody>
          {data.map((u) => (
            <tr key={u.id} className="border-t border-border">
              <td className="p-3 font-semibold">{u.full_name}</td>
              <td className="p-3">{u.email}</td>
              <td className="p-3 text-muted-foreground">{u.phone ?? "—"}</td>
              <td className="p-3 capitalize">{u.user_type}</td>
              <td className="p-3"><span className="rounded-full bg-muted px-2 py-0.5 text-xs">{u.verification_status}</span></td>
              <td className="p-3 text-muted-foreground">{u.city ?? "—"}, {u.state ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PropertiesTab() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin-properties"],
    queryFn: async () => {
      const { data: props } = await supabase.from("properties").select("id,title,city,price,listing_type,status,owner_id").order("created_at", { ascending: false }).limit(200);
      const list = props ?? [];
      const profileMap = await fetchProfilesByIds(list.map((p) => p.owner_id));
      return list.map((p) => ({ ...p, owner: profileMap[p.owner_id] }));
    },
  });
  async function archive(id: string) {
    const { error } = await supabase.from("properties").update({ status: "archived" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Property archived");
    qc.invalidateQueries({ queryKey: ["admin-properties"] });
  }
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-background text-xs uppercase tracking-wider text-muted-foreground">
          <tr><th className="p-3 text-left">Title</th><th className="p-3 text-left">Owner</th><th className="p-3 text-left">City</th><th className="p-3 text-left">Listing</th><th className="p-3 text-left">Price</th><th className="p-3 text-left">Status</th><th className="p-3"></th></tr>
        </thead>
        <tbody>
          {data.map((p) => (
            <tr key={p.id} className="border-t border-border">
              <td className="p-3 font-semibold max-w-[280px] truncate">{p.title}</td>
              <td className="p-3">{p.owner?.full_name ?? "—"}</td>
              <td className="p-3">{p.city}</td>
              <td className="p-3 capitalize">{p.listing_type}</td>
              <td className="p-3">{formatINR(p.price)}</td>
              <td className="p-3"><span className="rounded-full bg-muted px-2 py-0.5 text-xs">{statusLabel(p.status)}</span></td>
              <td className="p-3"><Button size="sm" variant="outline" onClick={() => archive(p.id)}>Archive</Button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">{label}</div>;
}
