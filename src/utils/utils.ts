// src/lib/utils.ts
export function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
