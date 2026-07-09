/** Canonical production URL — bare domain redirects to www. */
export const SITE_URL = "https://www.quickkeyrentalcar.com";

export const SITE_METADATA = {
  url: SITE_URL,
  name: "QuickKey Rental Curaçao",
  title: "QuickKey Rental Curaçao",
  description:
    "Affordable and reliable car rentals in Curaçao. Airport delivery, hotel delivery, and local pickup available.",
  ogImage: `${SITE_URL}/og-image.jpg`,
  ogImageAlt: "QuickKey Rental Curaçao — affordable car rentals with airport and hotel delivery",
  themeColor: "#e8282e",
} as const;
