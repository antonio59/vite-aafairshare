import * as React from "react";
// Removed useIsMobile import
// import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
// Removed Sheet imports as they are no longer used
// import {
//   Sheet,
//   SheetContent,
//   SheetHeader,
//   SheetTitle,
//   SheetFooter,
//   SheetClose,
//   SheetDescription,
// } from "@/components/ui/sheet";
// Removed X icon import as it's handled by DialogContent
// import { X } from "lucide-react";
// Removed Button import as it's handled by DialogContent
// import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
// Import the local VisuallyHidden component
import { VisuallyHidden } from "@/components/ui/visually-hidden";
// DialogPrimitive import removed as Close button is handled by DialogContent wrapper now

export interface ResponsiveDialogProps {
  onOpenChange: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function ResponsiveDialog({
  onOpenChange,
  title,
  description, // Description prop received
  children,
  footer,
  className,
}: ResponsiveDialogProps) {
  // Removed isMobile hook usage and related logic

  // Define safe fallbacks
  const safeTitle = title || "Dialog"; // Ensure title is never empty
  const safeDescription = description || `Information about ${safeTitle}`; // Fallback description

  // Generate stable IDs based on the safe title
  const titleId = `dialog-title-${safeTitle.replace(/\s+/g, '-').toLowerCase()}`;
  const descriptionId = `dialog-description-${safeTitle.replace(/\s+/g, '-').toLowerCase()}`;

  // Always render Dialog
  return (
    <Dialog
      onOpenChange={onOpenChange}
    >
      <DialogContent
        className={cn(
          "sm:max-w-[600px]", // Keep desktop max-width
          "w-[90vw] max-w-[90vw] rounded-lg", // Add mobile-friendly width and rounding
          className
        )}
        // Explicitly set both labels
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <DialogHeader>
          {/* Add ID to DialogTitle */}
          <DialogTitle id={titleId}>{safeTitle}</DialogTitle>
          {/* Add ID to DialogDescription and wrap content with VisuallyHidden */}
          {description && ( // Only render description if provided
            <DialogDescription id={descriptionId}>
              <VisuallyHidden>
                {safeDescription}
              </VisuallyHidden>
            </DialogDescription>
          )}
        </DialogHeader>
        {/* Children rendered after header */}
        {/* Add max-height and overflow for scrollable content */}
        <div className="py-4 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
        {/* Close button is implicitly handled by DialogContent wrapper */}
        {footer && (
          <DialogFooter>
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
