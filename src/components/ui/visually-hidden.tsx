import * as React from "react";

// Simple VisuallyHidden component based on Radix UI patterns
// Hides content visually while keeping it accessible to screen readers
export const VisuallyHidden = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ style, ...props }, ref) => {
  return (
    <span
      ref={ref}
      style={{
        position: 'absolute',
        border: 0,
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        wordWrap: 'normal',
        ...style, // Allow overriding styles if needed
      }}
      {...props}
    />
  );
});
VisuallyHidden.displayName = "VisuallyHidden";
