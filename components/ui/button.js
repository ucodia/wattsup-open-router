import { forwardRef } from 'react'

// Simple utility to join class names
function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export const Button = forwardRef(function Button({ className, ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400',
        className
      )}
      {...props}
    />
  )
})
