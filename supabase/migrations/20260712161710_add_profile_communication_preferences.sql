alter table public.profiles
  add column if not exists marketing_email boolean not null default false,
  add column if not exists marketing_whatsapp boolean not null default false;

comment on column public.profiles.marketing_email is
  'Customer consent to receive marketing offers by email.';

comment on column public.profiles.marketing_whatsapp is
  'Customer consent to receive marketing offers and updates through WhatsApp.';
