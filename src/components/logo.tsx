import logoOfficial from "@/assets/quick-key-rental-logo-transparent.png";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  tone?: "default" | "light";
};

const sizeStyles = {
  sm: "h-12 w-auto min-w-[10.5rem]",
  md: "h-14 w-auto min-w-[12.5rem] md:h-16",
  lg: "h-16 w-auto min-w-[14rem] md:h-[4.5rem]",
} as const;

export function Logo({ className, size = "sm" }: LogoProps) {
  const { messages } = useI18n();

  return (
    <img
      src={logoOfficial}
      alt={messages.logo.aria}
      className={cn("block object-contain object-left", sizeStyles[size], className)}
      width={1024}
      height={386}
      decoding="async"
    />
  );
}
