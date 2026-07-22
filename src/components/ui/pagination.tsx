import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { ButtonProps, buttonVariants } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";

const Pagination = ({
  className,
  "aria-label": ariaLabel,
  ...props
}: React.ComponentProps<"nav">) => {
  const { messages } = useI18n();

  return (
    <nav
      role="navigation"
      aria-label={ariaLabel ?? messages.common.pagination.label}
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
};
Pagination.displayName = "Pagination";

const PaginationContent = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn("flex flex-row items-center gap-1", className)} {...props} />
  ),
);
PaginationContent.displayName = "PaginationContent";

const PaginationItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(
  ({ className, ...props }, ref) => <li ref={ref} className={cn("", className)} {...props} />,
);
PaginationItem.displayName = "PaginationItem";

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">;

const PaginationLink = ({ className, isActive, size = "icon", ...props }: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size,
      }),
      className,
    )}
    {...props}
  />
);
PaginationLink.displayName = "PaginationLink";

const PaginationPrevious = ({
  className,
  children,
  "aria-label": ariaLabel,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => {
  const { messages } = useI18n();

  return (
    <PaginationLink
      aria-label={ariaLabel ?? messages.common.pagination.previousAria}
      size="default"
      className={cn("gap-1 pl-2.5", className)}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
      {children ?? <span>{messages.common.pagination.previous}</span>}
    </PaginationLink>
  );
};
PaginationPrevious.displayName = "PaginationPrevious";

const PaginationNext = ({
  className,
  children,
  "aria-label": ariaLabel,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => {
  const { messages } = useI18n();

  return (
    <PaginationLink
      aria-label={ariaLabel ?? messages.common.pagination.nextAria}
      size="default"
      className={cn("gap-1 pr-2.5", className)}
      {...props}
    >
      {children ?? <span>{messages.common.pagination.next}</span>}
      <ChevronRight className="h-4 w-4" />
    </PaginationLink>
  );
};
PaginationNext.displayName = "PaginationNext";

const PaginationEllipsis = ({ className, ...props }: React.ComponentProps<"span">) => {
  const { messages } = useI18n();

  return (
    <span
      aria-hidden
      className={cn("flex h-9 w-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">{messages.common.pagination.more}</span>
    </span>
  );
};
PaginationEllipsis.displayName = "PaginationEllipsis";

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};
