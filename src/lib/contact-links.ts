import type { Messages } from "@/i18n/messages";

export type ContactLinkIcon =
  | "review"
  | "facebook"
  | "instagram"
  | "email"
  | "website"
  | "whatsapp"
  | "tiktok";

export type ContactLink = {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: ContactLinkIcon;
};

export const contactHrefs = {
  review: "https://g.page/r/CceJeMPEbOHZEBM/review",
  facebook: "https://www.facebook.com/profile.php?id=61580811896650",
  instagram: "https://www.instagram.com/quickkeyrentalcar/",
  tiktok: "https://www.tiktok.com/@quickkeyrentalcar",
  email: "mailto:info@quickkeyrentalcar.com",
  website: "https://www.quickkeyrentalcar.com",
  whatsapp: "https://wa.me/31616210283",
} as const;

export function getContactLinks(messages: Messages): ContactLink[] {
  const { links } = messages.contact;

  return [
    { id: "review", ...links.review, href: contactHrefs.review, icon: "review" },
    { id: "facebook", ...links.facebook, href: contactHrefs.facebook, icon: "facebook" },
    { id: "instagram", ...links.instagram, href: contactHrefs.instagram, icon: "instagram" },
    { id: "tiktok", ...links.tiktok, href: contactHrefs.tiktok, icon: "tiktok" },
    { id: "email", ...links.email, href: contactHrefs.email, icon: "email" },
    { id: "website", ...links.website, href: contactHrefs.website, icon: "website" },
    {
      id: "whatsapp",
      ...links.whatsapp,
      href: contactHrefs.whatsapp,
      icon: "whatsapp",
    },
  ];
}
