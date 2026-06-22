import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Upload, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { uploadVerificationDoc } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/verification")({
  head: () => ({ meta: [{ title: "Verification — EstateVerse" }] }),
  component: VerificationPage,
});

function VerificationPage() {
  const { user, profile, refresh } = useAuth();
  const [isAgent, setIsAgent] = useState(false);
  const [agencyName, setAgencyName] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [businessInfo, setBusinessInfo] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [files, setFiles] = useState<{ aadhaar?: File; pan?: File; gov?: File; photo?: File; ownership?: File; addressProof?: File }>({});
  const [urls, setUrls] = useState<{ aadhaar_url: string; pan_url: string; gov_id_url: string; profile_photo_url: string; ownership_doc_url: string; property_address_proof_url: string }>({
    aadhaar_url: "", pan_url: "", gov_id_url: "", profile_photo_url: "", ownership_doc_url: "", property_address_proof_url: "",
  });
  const [busy, setBusy] = useState(false);

  const { data: existing, refetch } = useQuery({
    queryKey: ["verification", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("seller_verifications").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (existing) {
      setIsAgent(existing.is_agent);
      setAgencyName(existing.agency_name ?? "");
      setOfficeAddress(existing.office_address ?? "");
      setBusinessInfo(existing.business_info ?? "");
      setUrls({
        aadhaar_url: existing.aadhaar_url ?? "",
        pan_url: existing.pan_url ?? "",
        gov_id_url: existing.gov_id_url ?? "",
        profile_photo_url: existing.profile_photo_url ?? "",
        ownership_doc_url: existing.ownership_doc_url ?? "",
        property_address_proof_url: existing.property_address_proof_url ?? "",
      });
    }
  }, [existing]);

  const status = profile?.verification_status ?? "none";
  const submitted = status === "submitted" || status === "under_review";
  const verified = status === "verified";
  const rejected = status === "rejected";

  // Owner-only access
  const isOwner = profile?.user_type === "owner" || profile?.user_type === "agent";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      const uploads: Record<string, string> = { ...urls };
      // Strip empty URLs so DB nulls stay nulls
      Object.keys(uploads).forEach((k) => { if (!uploads[k]) delete uploads[k]; });

      // Optional file uploads — fall back silently if bucket fails
      const tryUpload = async (file: File | undefined, kind: string, field: string) => {
        if (!file) return;
        try {
          uploads[field] = await uploadVerificationDoc(user.id, file, kind);
        } catch (err) {
          console.warn(`Upload failed for ${kind}, falling back to URL field`, err);
        }
      };
      await tryUpload(files.aadhaar, "aadhaar", "aadhaar_url");
      await tryUpload(files.pan, "pan", "pan_url");
      await tryUpload(files.gov, "gov-id", "gov_id_url");
      await tryUpload(files.photo, "photo", "profile_photo_url");
      await tryUpload(files.ownership, "ownership", "ownership_doc_url");
      await tryUpload(files.addressProof, "address-proof", "property_address_proof_url");

      const payload = {
        user_id: user.id,
        is_agent: isAgent,
        agency_name: agencyName || null,
        office_address: officeAddress || propertyAddress || null,
        business_info: businessInfo || null,
        ...uploads,
        status: "submitted" as const,
      };
      const { error } = await supabase.from("seller_verifications").upsert(payload, { onConflict: "user_id" });
      if (error) throw error;
      await supabase.from("profiles").update({ verification_status: "submitted" }).eq("id", user.id);
      toast.success("Verification submitted — we'll review within 48 hours.");
      await refresh();
      await refetch();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setBusy(false);
    }
  }

  if (!isOwner) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-12 text-center">
        <h2 className="font-display text-2xl">Property Owners only</h2>
        <p className="mt-2 text-muted-foreground">Switch your account type to Property Owner from Profile to start verification.</p>
      </div>
    );
  }

  // Required field progress
  const has = (field: keyof typeof urls, file?: File) => !!(file || urls[field] || (existing as Record<string, string | null> | null)?.[field]);
  const checks = [
    !!profile?.full_name,
    !!profile?.email,
    !!profile?.phone,
    !!profile?.city,
    has("aadhaar_url", files.aadhaar),
    has("pan_url", files.pan),
    has("gov_id_url", files.gov),
    has("profile_photo_url", files.photo),
    has("ownership_doc_url", files.ownership),
  ];
  const progress = Math.round((checks.filter(Boolean).length / checks.length) * 100);

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-semibold uppercase tracking-widest text-gold">Verification</span>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Become a verified seller</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Verification unlocks property listing privileges, a trust badge, and 3.4× more inquiries.</p>
      </div>

      <StatusBanner status={status} />

      {rejected && existing?.admin_notes && (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div className="flex-1">
              <div className="font-display text-lg font-semibold text-destructive">Admin feedback</div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{existing.admin_notes}</p>
              <p className="mt-3 text-xs text-muted-foreground">Reviewed on {existing.updated_at ? new Date(existing.updated_at).toLocaleString() : "—"}. Address the points above and resubmit below.</p>
            </div>
          </div>
        </div>
      )}

      {!verified && (
        <>
          <div className="rounded-3xl border border-border bg-card p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">Verification progress</span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <section className="rounded-3xl border border-border bg-card p-7">
              <h2 className="font-display text-xl font-semibold">Your details</h2>
              <p className="mt-1 text-sm text-muted-foreground">Auto-filled from your profile.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <ReadOnly label="Full name" value={profile?.full_name} />
                <ReadOnly label="Email" value={profile?.email} />
                <ReadOnly label="Phone" value={profile?.phone ?? "—"} />
                <ReadOnly label="City / State" value={`${profile?.city ?? "—"}, ${profile?.state ?? "—"}`} />
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-card p-7">
              <h2 className="font-display text-xl font-semibold">Account type</h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <TypeButton selected={!isAgent} onClick={() => setIsAgent(false)} title="Individual Owner" desc="I own the property myself." />
                <TypeButton selected={isAgent} onClick={() => setIsAgent(true)} title="Multiple Properties" desc="I manage several listings." />
              </div>
              {isAgent && (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Field label="Business name"><input value={agencyName} onChange={(e) => setAgencyName(e.target.value)} className={inputCls} /></Field>
                  <Field label="Office address"><input value={officeAddress} onChange={(e) => setOfficeAddress(e.target.value)} className={inputCls} /></Field>
                  <div className="sm:col-span-2">
                    <Field label="Business information"><textarea value={businessInfo} onChange={(e) => setBusinessInfo(e.target.value)} rows={3} className={inputCls} /></Field>
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-border bg-card p-7">
              <h2 className="font-display text-xl font-semibold">Identity verification</h2>
              <p className="mt-1 text-sm text-muted-foreground">Upload a file or paste a Google Drive / Dropbox / OneDrive / direct image / PDF link.</p>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <DocField label="Aadhaar Card" url={urls.aadhaar_url} onUrl={(v) => setUrls({ ...urls, aadhaar_url: v })} onFile={(f) => setFiles({ ...files, aadhaar: f })} done={has("aadhaar_url", files.aadhaar)} />
                <DocField label="PAN Card" url={urls.pan_url} onUrl={(v) => setUrls({ ...urls, pan_url: v })} onFile={(f) => setFiles({ ...files, pan: f })} done={has("pan_url", files.pan)} />
                <DocField label="Government ID" url={urls.gov_id_url} onUrl={(v) => setUrls({ ...urls, gov_id_url: v })} onFile={(f) => setFiles({ ...files, gov: f })} done={has("gov_id_url", files.gov)} />
                <DocField label="Profile photo" url={urls.profile_photo_url} onUrl={(v) => setUrls({ ...urls, profile_photo_url: v })} onFile={(f) => setFiles({ ...files, photo: f })} done={has("profile_photo_url", files.photo)} />
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-card p-7">
              <h2 className="font-display text-xl font-semibold">Property documents</h2>
              <p className="mt-1 text-sm text-muted-foreground">Add at least one ownership document. URL or upload both work.</p>
              <div className="mt-5 grid gap-5">
                <Field label="Property address"><input value={propertyAddress} onChange={(e) => setPropertyAddress(e.target.value)} className={inputCls} placeholder="Full address of property you'll list" /></Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <DocField label="Ownership document" url={urls.ownership_doc_url} onUrl={(v) => setUrls({ ...urls, ownership_doc_url: v })} onFile={(f) => setFiles({ ...files, ownership: f })} done={has("ownership_doc_url", files.ownership)} />
                  <DocField label="Address proof / supporting" url={urls.property_address_proof_url} onUrl={(v) => setUrls({ ...urls, property_address_proof_url: v })} onFile={(f) => setFiles({ ...files, addressProof: f })} done={has("property_address_proof_url", files.addressProof)} />
                </div>
              </div>
            </section>

            <div className="flex justify-end">
              <Button type="submit" disabled={busy} className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                <ShieldCheck className="mr-2 h-4 w-4" />
                {busy ? "Submitting…" : submitted ? "Resubmit for review" : rejected ? "Resubmit" : "Submit for verification"}
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

function StatusBanner({ status }: { status: string }) {
  const map = {
    verified: { i: CheckCircle2, t: "You're verified", d: "Your verified-owner badge appears on every listing.", cls: "bg-primary text-primary-foreground" },
    submitted: { i: Clock, t: "Under review", d: "We're reviewing your submission — usually within 48 hours.", cls: "bg-gold text-gold-foreground" },
    under_review: { i: Clock, t: "Under review", d: "We're reviewing your submission — usually within 48 hours.", cls: "bg-gold text-gold-foreground" },
    rejected: { i: AlertCircle, t: "Verification needs updates", d: "Please check the notes and resubmit your documents.", cls: "bg-destructive text-destructive-foreground" },
    none: { i: ShieldCheck, t: "Not verified yet", d: "Complete the form below to start the verification process.", cls: "bg-card text-foreground border border-border" },
  } as const;
  const cfg = map[status as keyof typeof map] ?? map.none;
  return (
    <div className={`flex items-start gap-4 rounded-3xl p-6 ${cfg.cls}`}>
      <cfg.i className="mt-1 h-6 w-6 shrink-0" />
      <div>
        <div className="font-display text-lg font-semibold">{cfg.t}</div>
        <div className="mt-1 text-sm opacity-85">{cfg.d}</div>
      </div>
    </div>
  );
}

function TypeButton({ selected, onClick, title, desc }: { selected: boolean; onClick: () => void; title: string; desc: string }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-2xl border p-5 text-left transition-all ${selected ? "border-primary bg-primary-soft" : "border-border bg-background hover:bg-accent"}`}>
      <div className="font-display text-lg font-semibold">{title}</div>
      <div className="mt-1 text-sm text-muted-foreground">{desc}</div>
    </button>
  );
}

function FileUpload({ label, onFile, done }: { label: string; onFile: (f: File) => void; done: boolean }) {
  return (
    <label className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed p-4 transition-colors ${done ? "border-primary bg-primary-soft" : "border-border bg-background hover:border-primary/50"}`}>
      <span className={`grid h-11 w-11 place-items-center rounded-xl ${done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
        {done ? <CheckCircle2 className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
      </span>
      <span className="flex-1">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-xs text-muted-foreground">{done ? "Uploaded — replace?" : "Click to upload"}</span>
      </span>
      <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
    </label>
  );
}

function DocField({ label, url, onUrl, onFile, done }: { label: string; url: string; onUrl: (v: string) => void; onFile: (f: File) => void; done: boolean }) {
  return (
    <div className={`grid gap-2 rounded-2xl border-2 border-dashed p-4 transition-colors ${done ? "border-primary bg-primary-soft" : "border-border bg-background"}`}>
      <div className="flex items-center gap-3">
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          {done ? <CheckCircle2 className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
        </span>
        <span className="text-sm font-semibold">{label}</span>
      </div>
      <input
        type="url"
        value={url}
        onChange={(e) => onUrl(e.target.value)}
        placeholder="Paste Drive / Dropbox / OneDrive / PDF / image URL"
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
      />
      <label className="text-xs text-muted-foreground inline-flex items-center gap-2 cursor-pointer hover:text-foreground">
        <Upload className="h-3.5 w-3.5" /> or upload a file
        <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      </label>
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="rounded-2xl border border-border bg-background px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm">{value || "—"}</div>
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
