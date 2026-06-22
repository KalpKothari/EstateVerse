import p1 from "@/assets/property-1.jpg";
import p2 from "@/assets/property-2.jpg";
import p3 from "@/assets/property-3.jpg";
import p4 from "@/assets/property-4.jpg";
import p5 from "@/assets/property-5.jpg";
import p6 from "@/assets/property-6.jpg";

export type DemoProperty = {
  id: string;
  title: string;
  city: string;
  locality: string;
  price: number;
  listing_type: "buy" | "rent";
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  image: string;
  badge?: string;
};

export const demoProperties: DemoProperty[] = [
  { id: "d1", title: "The Verdant Penthouse", city: "Mumbai", locality: "Bandra West", price: 85000000, listing_type: "buy", property_type: "Penthouse", bedrooms: 4, bathrooms: 5, area_sqft: 4200, image: p1, badge: "Featured" },
  { id: "d2", title: "Olive Grove Villa", city: "Goa", locality: "Assagao", price: 42500000, listing_type: "buy", property_type: "Villa", bedrooms: 5, bathrooms: 4, area_sqft: 5800, image: p2, badge: "New" },
  { id: "d3", title: "Botanical Loft", city: "Bengaluru", locality: "Indiranagar", price: 145000, listing_type: "rent", property_type: "Apartment", bedrooms: 3, bathrooms: 3, area_sqft: 2100, image: p3 },
  { id: "d4", title: "Emerald Industrial Loft", city: "Pune", locality: "Koregaon Park", price: 95000, listing_type: "rent", property_type: "Loft", bedrooms: 2, bathrooms: 2, area_sqft: 1850, image: p4 },
  { id: "d5", title: "Palm Reserve Estate", city: "Goa", locality: "Anjuna", price: 125000000, listing_type: "buy", property_type: "Estate", bedrooms: 6, bathrooms: 7, area_sqft: 8400, image: p5, badge: "Featured" },
  { id: "d6", title: "Forest Cathedral House", city: "Coorg", locality: "Madikeri", price: 32000000, listing_type: "buy", property_type: "House", bedrooms: 4, bathrooms: 3, area_sqft: 3600, image: p6 },
];

export const trendingLocations = [
  { city: "Mumbai", count: 1240, image: p1 },
  { city: "Bengaluru", count: 982, image: p3 },
  { city: "Goa", count: 487, image: p2 },
  { city: "Pune", count: 765, image: p4 },
  { city: "Coorg", count: 156, image: p6 },
  { city: "Hyderabad", count: 643, image: p5 },
];

export const testimonials = [
  { name: "Aarav & Meera Shah", role: "Bought a home in Mumbai", quote: "EstateVerse turned a year of house-hunting into three weekends. Every listing felt curated, not scraped.", avatar: "AM" },
  { name: "Rohit Kapoor", role: "Property Owner, Bengaluru", quote: "Verification took a day. My listing was inquired about within the hour. This is what real estate should feel like.", avatar: "RK" },
  { name: "Priya Nair", role: "Tenant, Pune", quote: "The map preview alone is worth it. I rented a place sight-unseen and it was exactly what the photos promised.", avatar: "PN" },
];
