import { MessageCircle } from "lucide-react";

import { useI18n } from "@/i18n/provider";
import { contactHrefs } from "@/lib/contact-links";
import { cn } from "@/lib/utils";

type WhatsAppSupportButtonProps = {
  className?: string;
  compact?: boolean;
};

export function WhatsAppSupportButton({ className, compact }: WhatsAppSupportButtonProps) {
  const { messages } = useI18n();

  return (
    <a
      href={contactHrefs.whatsapp}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[4px] border border-[#25D366]/30 bg-[#25D366]/10 text-sm font-semibold text-[#128C7E] transition-colors hover:bg-[#25D366]/15",
        compact ? "px-3 py-2 text-xs" : "px-4 py-2.5",
        className,
      )}
    >
      <MessageCircle className="size-4" />
      {messages.account.support.whatsapp}
    </a>
  );
}
