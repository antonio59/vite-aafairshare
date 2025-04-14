import * as React from "react"

import { cn } from "@/lib/utils"

// Extended input props with mobile-specific attributes
export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  // Add mobile-friendly props
  fullWidth?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, fullWidth, inputMode, ...props }, ref) => {
    return (
      <input
        type={type}
        // Enhanced touch target size with min-height
        // Added inputMode for showing appropriate keyboard on mobile
        className={cn(
          "flex min-h-[44px] w-full rounded-md border border-gray-200 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          fullWidth ? "w-full" : "w-auto",
          className
        )}
        // Include inputMode attribute if provided (for virtual keyboard type)
        inputMode={inputMode}
        // Add autocapitalize="none" for better mobile UX when typing usernames/emails
        autoCapitalize={props.autoCapitalize || (type === 'email' || type === 'username' ? 'none' : undefined)}
        // Add autocomplete for better form filling on mobile
        autoComplete={props.autoComplete || getAutoCompleteValue(type)}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

// Helper function to determine appropriate autocomplete value
function getAutoCompleteValue(type?: string): string | undefined {
  switch (type) {
    case 'email': return 'email';
    case 'password': return 'current-password';
    case 'tel': return 'tel';
    case 'search': return 'off';
    case 'number': return 'off';
    default: return undefined;
  }
}

export { Input }
