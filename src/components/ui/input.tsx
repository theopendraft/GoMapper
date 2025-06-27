import * as React from "react";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => (
    <input
      ref={ref}
      className={`border px-3 py-2 rounded-md w-full ${className}`}
      {...props}
    />
  )
);

Input.displayName = "Input";
