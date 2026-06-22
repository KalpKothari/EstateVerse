import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — EstateVerse" },
      { name: "description", content: "Get in touch with the EstateVerse team. We respond within one business day." },
      { property: "og:title", content: "Contact — EstateVerse" },
      { property: "og:description", content: "Get in touch with the EstateVerse team." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return toast.error("Please complete the form");
    toast.success("Thanks — we'll be in touch within one business day.");
    setForm({ name: "", email: "", message: "" });
  }
  return (
    <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-10">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-gold">Contact</span>
          <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight">Let's talk.</h1>
          <p className="mt-4 text-muted-foreground">Whether you're buying, selling, or just curious — we'd love to hear from you.</p>
          <div className="mt-10 space-y-5">
            {[
              { i: Mail, t: "hello@estateverse.app", s: "Email" },
              { i: Phone, t: "+91 800 123 4567", s: "Phone" },
              { i: MapPin, t: "Bandra West, Mumbai 400050", s: "Studio" },
            ].map((c) => (
              <div key={c.s} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground"><c.i className="h-5 w-5" /></span>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.s}</div>
                  <div className="font-semibold">{c.t}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={submit} className="rounded-3xl border border-border bg-card p-8 shadow-lift">
          <h2 className="font-display text-2xl font-semibold">Send a message</h2>
          <div className="mt-6 grid gap-4">
            <Field label="Name"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" /></Field>
            <Field label="Email"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" /></Field>
            <Field label="Message"><textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={6} className="w-full rounded-xl bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" /></Field>
            <Button type="submit" className="h-12 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90">
              <Send className="mr-2 h-4 w-4" /> Send message
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
