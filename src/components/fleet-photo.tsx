import { cn } from "@/lib/utils";

type FleetPhotoProps = {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  fit?: "cover" | "contain";
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
  width?: number;
  height?: number;
  objectPosition?: string;
  tint?: boolean;
};

export function FleetPhoto({
  src,
  alt,
  className,
  imgClassName,
  fit = "contain",
  loading,
  fetchPriority,
  width,
  height,
  objectPosition,
  tint = true,
}: FleetPhotoProps) {
  return (
    <div className={cn("relative overflow-hidden bg-background-secondary/80", className)}>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        decoding="async"
        fetchPriority={fetchPriority}
        className={cn(
          "photo-frame-image h-full w-full",
          fit === "cover" ? "object-cover" : "object-contain",
          imgClassName,
        )}
        style={objectPosition ? { objectPosition } : undefined}
      />
      {tint ? (
        <div
          className="pointer-events-none absolute inset-0 bg-primary/[0.06] mix-blend-multiply"
          aria-hidden
        />
      ) : null}
    </div>
  );
}
