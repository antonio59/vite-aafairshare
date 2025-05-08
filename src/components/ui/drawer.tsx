import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"
import { VisuallyHidden } from "@/components/ui/visually-hidden"

const Drawer = ({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    {...props}
  />
)
Drawer.displayName = "Drawer"

const DrawerTrigger = DrawerPrimitive.Trigger

const DrawerPortal = DrawerPrimitive.Portal

const DrawerClose = DrawerPrimitive.Close

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/80", className)}
    {...props}
  />
))
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  // Generate a stable ID for accessibility if not provided
  const defaultTitleId = React.useId();
  const titleId = props["aria-labelledby"] || defaultTitleId;
  const descriptionId = props["aria-describedby"];

  // Check if children contain DrawerTitle
  const [hasTitle, setHasTitle] = React.useState(false);

  // Use effect to check for DrawerTitle in children
  React.useEffect(() => {
    // Function to check if children contain DrawerTitle
    const checkForTitle = (children: React.ReactNode): boolean => {
      if (!children) return false;

      if (Array.isArray(children)) {
        return children.some(child => checkForTitle(child));
      }

      if (React.isValidElement(children)) {
        // Check if the child is DrawerTitle
        if (children.type === DrawerTitle ||
            (children.type && typeof children.type !== 'string' &&
             'displayName' in children.type &&
             (children.type as { displayName?: string }).displayName === DrawerPrimitive.Title.displayName)) {
          return true;
        }

        // Check children of this element
        if (children.props && typeof children.props === 'object' && 'children' in children.props) {
          return checkForTitle(children.props.children as React.ReactNode);
        }
      }

      return false;
    };

    setHasTitle(checkForTitle(children));
  }, [children]);

  return (
    <>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        ref={ref}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background",
          className
        )}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        {...props}
      >
        <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
        {!hasTitle && (
          <DrawerPrimitive.Title id={titleId} className="sr-only">
            <VisuallyHidden>Drawer</VisuallyHidden>
          </DrawerPrimitive.Title>
        )}
        {children}
      </DrawerPrimitive.Content>
    </>
  );
})
DrawerContent.displayName = "DrawerContent"

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
    {...props}
  />
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-auto flex flex-col gap-2 p-4", className)}
    {...props}
  />
)
DrawerFooter.displayName = "DrawerFooter"

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DrawerTitle.displayName = DrawerPrimitive.Title.displayName

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DrawerDescription.displayName = DrawerPrimitive.Description.displayName

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
