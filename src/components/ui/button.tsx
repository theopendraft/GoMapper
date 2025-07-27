import * as React from "react";

// Define strict types for variants and sizes for better type safety and auto-completion
type ButtonVariant = "default" | "outline" | "primary" | "secondary" | "ghost" | "link" | "destructive";
type ButtonSize = "sm" | "md" | "lg" | "icon"; // Added 'icon' for square buttons with just an icon

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize; // Use the defined ButtonSize type
  // Add a prop for `asChild` for composability with other components (e.g., Link from a router)
  // asChild?: boolean; // Uncomment if you use a component like Radix UI's `asChild` pattern
};

export const Button = ({
  className = "",
  variant = "default",
  size = "md", // Set a default size
  // asChild = false, // Uncomment if you use asChild
  ...props
}: ButtonProps) => {
  // Define base styles that apply to all buttons
  const baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

  // Define variant-specific styles
  const variantClasses: Record<ButtonVariant, string> = {
    default: "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500",
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500", // Example primary color
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus-visible:ring-gray-400", // Example secondary color
    outline: "border border-gray-400 text-gray-700 bg-white hover:bg-gray-100 focus-visible:ring-gray-500",
    ghost: "hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-300", // For subtle buttons
    link: "text-blue-600 underline-offset-4 hover:underline focus-visible:ring-blue-500", // For text-based buttons
    destructive: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500", // For danger actions
  };

  // Define size-specific styles
  const sizeClasses: Record<ButtonSize, string> = {
    sm: "h-8 px-3",
    md: "h-9 px-4 py-2", // Standard size
    lg: "h-10 px-6",
    icon: "h-9 w-9", // Square button for icons
  };

  // const Comp = asChild ? Slot : "button"; // If using Radix UI Slot for asChild pattern

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
};