/** Canonical production URL — bare domain redirects to www. */
export const SITE_URL = "https://www.quickkeyrentalcar.com";

export const SITE_METADATA = {
  url: SITE_URL,
  name: "Quick Key Rental Curaçao",
  title: "Quick Key Rental Curaçao",
  description:
    "Affordable and reliable car rentals in Curaçao. Airport delivery, hotel delivery, and local pickup available.",
  ogImage: `${SITE_URL}/quick-key-rental-link-preview.jpg?v=20260715`,
  ogImageAlt: "Quick Key Rental Curaçao — affordable car rentals with airport and hotel delivery",
  themeColor: "#e8282e",
} as const;
