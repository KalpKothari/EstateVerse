import { createFileRoute } from "@tanstack/react-router";
import { ListingPage, validateListingSearch } from "@/components/ListingPage";

export const Route = createFileRoute("/properties")({
  validateSearch: validateListingSearch,
  head: () => ({
    meta: [
      { title: "All Properties — EstateVerse" },
      { name: "description", content: "Every verified listing on EstateVerse — to buy, to rent, in every city we cover." },
      { property: "og:title", content: "All Properties — EstateVerse" },
      { property: "og:description", content: "Every verified listing on EstateVerse." },
    ],
  }),
  component: PropertiesPage,
});

function PropertiesPage() {
  const search = Route.useSearch();
  return <ListingPage listingType={null} title="All Properties" eyebrow="Browse" search={search} />;
}
