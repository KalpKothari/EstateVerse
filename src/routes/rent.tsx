import { createFileRoute } from "@tanstack/react-router";
import { ListingPage, validateListingSearch } from "@/components/ListingPage";

export const Route = createFileRoute("/rent")({
  validateSearch: validateListingSearch,
  head: () => ({
    meta: [
      { title: "Rent a Home — EstateVerse" },
      { name: "description", content: "Premium rental homes across India. Verified owners, transparent terms, and listings that look like the home." },
      { property: "og:title", content: "Rent a Home — EstateVerse" },
      { property: "og:description", content: "Premium rentals with verified owners and transparent terms." },
    ],
  }),
  component: RentPage,
});

function RentPage() {
  const search = Route.useSearch();
  return <ListingPage listingType="rent" title="Homes to Rent" eyebrow="Rent" search={search} />;
}
