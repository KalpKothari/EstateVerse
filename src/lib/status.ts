// Property status helpers. We treat 'published' and 'available' as synonyms (legacy).

export type PropertyStatus =
  | "draft"
  | "published"
  | "available"
  | "under_negotiation"
  | "sold"
  | "rented"
  | "rented_out"
  | "temporarily_unavailable"
  | "archived";

export const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  published: "Available",
  available: "Available",
  under_negotiation: "Under Negotiation",
  sold: "Sold",
  rented: "Rented Out",
  rented_out: "Rented Out",
  temporarily_unavailable: "Temporarily Unavailable",
  archived: "Archived",
};

export const STATUS_TONE: Record<string, string> = {
  available: "bg-primary text-primary-foreground",
  published: "bg-primary text-primary-foreground",
  under_negotiation: "bg-gold text-gold-foreground",
  sold: "bg-destructive text-destructive-foreground",
  rented: "bg-foreground text-background",
  rented_out: "bg-foreground text-background",
  temporarily_unavailable: "bg-muted text-foreground",
  draft: "bg-muted text-muted-foreground",
  archived: "bg-muted text-muted-foreground",
};

export const OWNER_SETTABLE_STATUSES: { value: string; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "under_negotiation", label: "Under Negotiation" },
  { value: "sold", label: "Sold" },
  { value: "rented_out", label: "Rented Out" },
  { value: "temporarily_unavailable", label: "Temporarily Unavailable" },
];

export function isActiveStatus(s: string): boolean {
  return s === "available" || s === "published" || s === "under_negotiation";
}

export function canInteract(s: string): boolean {
  // Whether inquiries / visit requests are allowed
  return s === "available" || s === "published";
}

export function statusLabel(s: string | null | undefined): string {
  if (!s) return "—";
  return STATUS_LABELS[s] ?? s;
}
