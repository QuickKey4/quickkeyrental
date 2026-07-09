import { useEffect, useId, useMemo, useState } from "react";
import { Facebook, Globe, Instagram, Mail, Star, X } from "lucide-react";

import { getContactLinks, type ContactLink, type ContactLinkIcon } from "@/lib/contact-links";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.884 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

function ContactIcon({ icon, className }: { icon: ContactLinkIcon; className?: string }) {
  switch (icon) {
    case "review":
      return <Star className={className} />;
    case "facebook":
      return <Facebook className={className} />;
    case "instagram":
      return <Instagram className={className} />;
    case "email":
      return <Mail className={className} />;
    case "website":
      return <Globe className={className} />;
    case "whatsapp":
      return <WhatsAppIcon className={className} />;
    case "tiktok":
      return <TikTokIcon className={className} />;
  }
}

function ContactLinkItem({ link, onNavigate }: { link: ContactLink; onNavigate: () => void }) {
  const external = !link.href.startsWith("mailto:");

  return (
    <a
      href={link.href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-3 rounded-2xl border border-[var(--fab-item-border)]",
        "bg-[var(--fab-item-bg)] px-3 py-2.5 transition-all",
        "hover:border-primary/35 hover:bg-[var(--fab-item-bg-hover)] hover:shadow-[var(--shadow-sm)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          "bg-[var(--fab-icon-bg)] text-[var(--fab-icon-fg)]",
          "transition-transform group-hover:scale-105",
        )}
      >
        <ContactIcon icon={link.icon} className="size-[1.15rem]" />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm font-semibold text-foreground">{link.label}</span>
        <span className="block truncate text-xs text-muted-foreground">{link.description}</span>
      </span>
    </a>
  );
}

export function ContactFab() {
  const { messages } = useI18n();
  const contactLinks = useMemo(() => getContactLinks(messages), [messages]);
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label={messages.contact.closeMenu}
          className="fixed inset-0 z-40 bg-foreground/15 backdrop-blur-[2px] md:bg-foreground/8"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="pointer-events-none fixed bottom-[calc(3.75rem+env(safe-area-inset-bottom,0px))] right-5 z-50 flex w-[min(100vw-2.5rem,20rem)] flex-col items-end gap-3 md:bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] md:right-8">
        <div
          id={panelId}
          role="region"
          aria-label={messages.contact.panelTitle}
          className={cn(
            "w-full origin-bottom-right transition-all duration-300 ease-out",
            open
              ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
              : "pointer-events-none translate-y-3 scale-95 opacity-0",
          )}
        >
          <div
            className={cn(
              "overflow-hidden rounded-[1.35rem] border border-[var(--fab-panel-border)]",
              "bg-[var(--fab-panel-bg)] p-3 shadow-[var(--shadow-lg)] backdrop-blur-xl",
            )}
          >
            <div className="mb-3 flex items-start justify-between gap-3 px-1 pt-1">
              <div>
                <p className="font-display text-sm font-bold text-foreground">
                  {messages.contact.panelTitle}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {messages.contact.panelSubtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full",
                  "text-muted-foreground transition-colors hover:bg-foreground/6 hover:text-foreground",
                )}
                aria-label={messages.contact.closeMenu}
              >
                <X className="size-4" />
              </button>
            </div>

            <ul className="flex max-h-[min(52vh,22rem)] flex-col gap-2 overflow-y-auto overscroll-contain pr-0.5">
              {contactLinks.map((link) => (
                <li key={link.id}>
                  <ContactLinkItem link={link} onNavigate={() => setOpen(false)} />
                </li>
              ))}
            </ul>
          </div>
        </div>

        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? messages.contact.closeMenu : messages.contact.openMenu}
          onClick={() => setOpen((value) => !value)}
          className={cn(
            "pointer-events-auto relative flex size-14 items-center justify-center rounded-full",
            "bg-[var(--fab-trigger-bg)] text-[var(--fab-trigger-fg)] shadow-[var(--shadow-glow)]",
            "transition-all hover:scale-105 hover:bg-[var(--fab-trigger-bg-hover)] active:scale-95",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          )}
        >
          <span
            className={cn(
              "absolute transition-all duration-300",
              open ? "scale-75 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100",
            )}
            aria-hidden
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="size-6"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16h6M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </span>
          <X
            className={cn(
              "size-6 transition-all duration-300",
              open ? "scale-100 rotate-0 opacity-100" : "scale-75 -rotate-90 opacity-0",
            )}
            aria-hidden
          />
          {!open ? (
            <span className="absolute -right-0.5 -top-0.5 flex size-3.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--fab-pulse)] opacity-75" />
              <span className="relative inline-flex size-3.5 rounded-full bg-[var(--fab-pulse)]" />
            </span>
          ) : null}
        </button>
      </div>
    </>
  );
}
