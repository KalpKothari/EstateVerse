import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { ArrowLeft, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { uploadPropertyImage } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/properties/new")({
  head: () => ({ meta: [{ title: "New listing — EstateVerse" }] }),
  component: NewPropertyPage,
});

const AMENITIES = ["pool", "gym", "parking", "garden", "wifi", "ac", "lift", "security", "balcony", "pet_friendly"];

const schema = z.object({
  title: z.string().trim().min(3, "Title is too short").max(120),
  description: z.string().trim().min(20, "Add a longer description").max(2000),
  property_type: z.enum(["apartment","house","villa","plot","commercial","penthouse","studio"]),
  listing_type: z.enum(["buy","rent"]),
  price: z.coerce.number().positive("Price required"),
  area_sqft: z.coerce.number().int().positive("Area required"),
  bedrooms: z.coerce.number().int().min(0),
  bathrooms: z.coerce.number().int().min(0),
  furnishing: z.enum(["unfurnished","semi_furnished","furnished"]),
  address: z.string().trim().min(3),
  locality: z.string().trim().optional(),
  city: z.string().trim().min(2),
  state: z.string().trim().min(2),
  pincode: z.string().trim().min(4),
});

function NewPropertyPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile && profile.verification_status !== "verified") {
      toast.warning("You need to be verified to publish listings.");
    }
  }, [profile]);

  function toggle(a: string) {
    setAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const form = new FormData(e.currentTarget);
    const raw = Object.fromEntries(form.entries());
    const parsed = schema.safeParse(raw);
    if (!parsed.success) return toast.error(parsed.error.errors[0].message);

    setBusy(true);
    try {
      const paths: string[] = [];
      for (const f of files) paths.push(await uploadPropertyImage(user.id, f));

      const { data: prop, error } = await supabase
        .from("properties")
        .insert({
          ...parsed.data,
          owner_id: user.id,
          amenities,
          cover_image_url: paths[0] ?? null,
          status: "published",
        })
        .select("id")
        .single();
      if (error) throw error;
      if (paths.length > 1) {
        await supabase.from("property_images").insert(
          paths.slice(1).map((url, i) => ({ property_id: prop.id, url, sort_order: i + 1 }))
        );
      }
      toast.success("Listing published");
      navigate({ to: "/dashboard/properties" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create listing");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/dashboard/properties" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to listings</Link>
      <div>
        <span className="text-xs font-semibold uppercase tracking-widest text-gold">New listing</span>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Publish a property</h1>
        <p className="mt-2 text-muted-foreground">Take a minute. Good photos matter most.</p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <Card title="Photos">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {files.map((f, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
                <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-ink/70 text-cream">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <label className="grid aspect-square cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-border bg-card text-muted-foreground hover:border-primary hover:text-primary">
              <div className="text-center">
                <Upload className="mx-auto h-5 w-5" />
                <div className="mt-1 text-xs font-semibold">Add photo</div>
              </div>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => {
                if (!e.target.files) return;
                setFiles([...files, ...Array.from(e.target.files)].slice(0, 12));
              }} />
            </label>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">First photo is the cover. Up to 12 images.</p>
        </Card>

        <Card title="The basics">
          <Grid cols={2}>
            <Field label="Title"><input name="title" required className={inputCls} placeholder="e.g. Botanical Loft in Indiranagar" /></Field>
            <Field label="Listing">
              <select name="listing_type" defaultValue="rent" className={inputCls}>
                <option value="rent">For Rent</option>
                <option value="buy">For Sale</option>
              </select>
            </Field>
            <Field label="Type">
              <select name="property_type" defaultValue="apartment" className={inputCls}>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="villa">Villa</option>
                <option value="penthouse">Penthouse</option>
                <option value="studio">Studio</option>
                <option value="plot">Plot</option>
                <option value="commercial">Commercial</option>
              </select>
            </Field>
            <Field label="Furnishing">
              <select name="furnishing" defaultValue="semi_furnished" className={inputCls}>
                <option value="unfurnished">Unfurnished</option>
                <option value="semi_furnished">Semi-furnished</option>
                <option value="furnished">Furnished</option>
              </select>
            </Field>
            <Field label="Price (₹)"><input name="price" type="number" required className={inputCls} placeholder="e.g. 75000" /></Field>
            <Field label="Area (sq.ft)"><input name="area_sqft" type="number" required className={inputCls} placeholder="e.g. 1800" /></Field>
            <Field label="Bedrooms"><input name="bedrooms" type="number" defaultValue={0} className={inputCls} /></Field>
            <Field label="Bathrooms"><input name="bathrooms" type="number" defaultValue={0} className={inputCls} /></Field>
          </Grid>
          <Field label="Description">
            <textarea name="description" required rows={5} className={inputCls} placeholder="Describe the home — what makes it special?" />
          </Field>
        </Card>

        <Card title="Where it is">
          <Field label="Address"><input name="address" required className={inputCls} /></Field>
          <Grid cols={4}>
            <Field label="Locality"><input name="locality" className={inputCls} /></Field>
            <Field label="City"><input name="city" required className={inputCls} /></Field>
            <Field label="State"><input name="state" required className={inputCls} /></Field>
            <Field label="Pincode"><input name="pincode" required className={inputCls} /></Field>
          </Grid>
        </Card>

        <Card title="Amenities">
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map((a) => (
              <button key={a} type="button" onClick={() => toggle(a)} className={`rounded-full border px-4 py-2 text-sm capitalize transition-colors ${amenities.includes(a) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-accent"}`}>
                {a.replace("_", " ")}
              </button>
            ))}
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Link to="/dashboard/properties"><Button type="button" variant="outline" className="rounded-full">Cancel</Button></Link>
          <Button type="submit" disabled={busy} className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
            {busy ? "Publishing…" : "Publish listing"}
          </Button>
        </div>
      </form>
    </div>
  );
}

const inputCls = "w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-border bg-background p-6">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}
function Grid({ cols, children }: { cols: 2 | 3 | 4; children: React.ReactNode }) {
  const cls = cols === 2 ? "sm:grid-cols-2" : cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-4";
  return <div className={`grid gap-4 ${cls}`}>{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
