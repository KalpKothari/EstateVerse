import { createFileRoute } from "@tanstack/react-router";
import { ListingPage, validateListingSearch } from "@/components/ListingPage";

export const Route = createFileRoute("/buy")({
  validateSearch: validateListingSearch,
  head: () => ({
    meta: [
      { title: "Buy a Home — EstateVerse" },
      { name: "description", content: "Browse curated properties for sale across India. Verified owners, premium listings, and intelligent filters." },
      { property: "og:title", content: "Buy a Home — EstateVerse" },
      { property: "og:description", content: "Curated homes for sale. Verified owners and premium listings." },
    ],
  }),
  component: BuyPage,
});

function BuyPage() {
  const search = Route.useSearch();
  return <ListingPage listingType="buy" title="Homes to Buy" eyebrow="Buy" search={search} />;
}
