export function formatINR(value: number | string | null | undefined): string {
  if (value == null || value === "") return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "—";
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)} L`;
  return `₹${new Intl.NumberFormat("en-IN").format(n)}`;
}

export function formatArea(sqft: number | null | undefined): string {
  if (!sqft) return "—";
  return `${new Intl.NumberFormat("en-IN").format(sqft)} sq.ft`;
}

export function listingLabel(t: "buy" | "rent"): string {
  return t === "rent" ? "For Rent" : "For Sale";
}

export function priceSuffix(t: "buy" | "rent"): string {
  return t === "rent" ? "/mo" : "";
}
