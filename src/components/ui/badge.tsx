import * as React from "react";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "success" | "warning" | "danger";
};

export const Badge = ({ className = "", variant = "default", ...props }: BadgeProps) => {
  const variantClass = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
  }[variant];

  return (
    <span
      className={`text-sm font-medium px-2 py-1 rounded ${variantClass} ${className}`}
      {...props}
    />
  );
};
