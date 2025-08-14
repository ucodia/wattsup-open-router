import React, { forwardRef } from "react";

// Simple utility to join class names
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export const Select = forwardRef(function Select(
  { className, children, ...props },
  ref
) {
  return (
    <select
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-gray-200 border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});

export const SelectOption = forwardRef(function SelectOption(
  { className, ...props },
  ref
) {
  return (
    <option
      ref={ref}
      className={cn(
        "relative cursor-default select-none py-1.5 pl-8 pr-2 text-sm",
        className
      )}
      {...props}
    />
  );
});
