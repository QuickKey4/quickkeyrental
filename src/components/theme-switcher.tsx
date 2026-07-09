import { Check, Palette } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTheme } from "@/components/theme-provider";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import type { CaribbeanThemeId } from "@/lib/themes";

function ThemeOption({
  id,
  name,
  tagline,
  swatches,
  selected,
  onSelect,
}: {
  id: CaribbeanThemeId;
  name: string;
  tagline: string;
  swatches: [string, string, string, string];
  selected: boolean;
  onSelect: (id: CaribbeanThemeId) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={cn(
        "w-full rounded-xl border p-3 text-left transition-colors",
        selected
          ? "border-primary bg-primary/8 shadow-[var(--shadow-sm)]"
          : "border-border/70 hover:border-primary/40 hover:bg-foreground/4",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{tagline}</p>
        </div>
        {selected ? <Check className="mt-0.5 size-4 shrink-0 text-primary" /> : null}
      </div>
      <div className="mt-3 flex items-center gap-1.5">
        {swatches.map((color) => (
          <span
            key={color}
            className="h-5 w-5 rounded-full border border-foreground/10 shadow-sm"
            style={{ backgroundColor: color }}
            aria-hidden
          />
        ))}
      </div>
    </button>
  );
}

export function ThemeSwitcher({ className }: { className?: string }) {
  const { themeId, themes, setThemeId } = useTheme();
  const { messages } = useI18n();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={messages.themes.chooseAria}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground",
            className,
          )}
        >
          <Palette className="size-4" />
          <span className="hidden lg:inline">{messages.common.colors}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 max-h-[min(32rem,80vh)] overflow-y-auto p-3">
        <div className="mb-2">
          <p className="text-sm font-semibold text-foreground">{messages.themes.title}</p>
          <p className="text-xs text-muted-foreground">{messages.themes.subtitle}</p>
        </div>
        <div className="space-y-2">
          {themes.map((theme) => {
            const palette = messages.themes.palettes[theme.id];
            return (
              <ThemeOption
                key={theme.id}
                id={theme.id}
                name={palette.name}
                tagline={palette.tagline}
                swatches={theme.swatches}
                selected={themeId === theme.id}
                onSelect={setThemeId}
              />
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
