export function SectionSkeleton({ className = "h-64" }: { className?: string }) {
  return (
    <div
      className={className}
      aria-hidden
    >
      <div className="mx-auto h-full max-w-7xl animate-pulse px-5 md:px-8">
        <div className="h-3 w-28 rounded bg-black/[0.06]" />
        <div className="mt-4 h-10 w-2/3 max-w-md rounded bg-black/[0.06]" />
        <div className="mt-8 h-40 rounded-xl bg-black/[0.04]" />
      </div>
    </div>
  );
}
