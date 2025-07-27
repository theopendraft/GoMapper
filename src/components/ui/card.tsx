import * as React from "react";

import { cn } from "@/utils/utils"; // Assuming cn is a utility like clsx

type CardVariant = "default" | "elevated" | "flat" | "interactive";

function Card({
  className,
  variant = "default", // Add variant prop
  ...props
}: React.ComponentPropsWithoutRef<"div"> & { variant?: CardVariant }) {
  const baseClasses = "flex flex-col rounded-xl border"; // Common styles

  const variantClasses: Record<CardVariant, string> = {
    default: "bg-card text-card-foreground shadow-sm", // Existing default
    elevated: "bg-card text-card-foreground shadow-md hover:shadow-lg transition-shadow duration-200", // More pronounced shadow
    flat: "bg-card text-card-foreground border-gray-200", // No shadow, maybe a clearer border
    interactive: "bg-card text-card-foreground shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-200", // For clickable cards
  };

  return (
    <div
      data-slot="card"
      className={cn(
        baseClasses,
        variantClasses[variant],
        // You might adjust the gap and padding if they are too opinionated for all card types
        // Example: If interactive card contains less, it might need less gap
        "gap-6 py-6", // Consider making these adjustable if needed
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  );
}

// Add an 'as' prop to CardTitle for semantic heading levels
type CardTitleProps = React.ComponentProps<"div"> & {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "div"; // Add 'div' here
};

function CardTitle({
  className,
  as: Comp = "div", // Default to div if not specified
  ...props
}: CardTitleProps) {
  return (
    <Comp
      data-slot="card-title"
      className={cn("leading-none font-semibold text-lg text-gray-900", className)} // Added default text size/color
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};