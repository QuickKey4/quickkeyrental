const phone = { display: "+31 6 16210283", tel: "+31616210283" } as const;

export const BRAND = {
  name: "Quick Key Rental",
  location: "Curaçao Airport (Hato)",
  locationShort: "Hato Airport",
  phones: [phone] as const,
  bookingPhone: phone,
  customerCarePhone: phone,
  phone: phone.display,
  phoneTel: phone.tel,
  email: "info@quickkeyrentalcar.com",
  website: "https://www.quickkeyrentalcar.com",
  address: "Willemstad, Curaçao",
  currency: "USD",
} as const;

export function formatPrice(amount: number, intlLocale = "en-US"): string {
  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency: BRAND.currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
