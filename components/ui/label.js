import React, { forwardRef } from "react";

// Simple utility to join class names
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export const Label = forwardRef(function Label({ className, ...props }, ref) {
  return (
    <label
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  );
});
