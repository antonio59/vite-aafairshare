/* eslint-disable @typescript-eslint/no-explicit-any */
/*
  NOTE: This file uses `as any` for refs passed to ResizablePrimitive.PanelGroup, Panel, and PanelResizeHandle.
  This is required due to incomplete or incompatible type definitions in the `react-resizable-panels` library,
  which does not support React refs in a type-safe way. This is a known, intentional, and safe workaround
  until the library provides proper type support. See related issues in the library for more details.
*/
import * as React from "react"
import { GripVertical } from "lucide-react"
import * as ResizablePrimitive from "react-resizable-panels"

import { cn } from "@/lib/utils"

const ResizablePanelGroup = React.forwardRef<
  React.ElementRef<typeof ResizablePrimitive.PanelGroup>,
  React.ComponentPropsWithoutRef<typeof ResizablePrimitive.PanelGroup>
>(({ className, ...props }, ref) => (
  <ResizablePrimitive.PanelGroup
    ref={ref as any}
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    )}
    {...props}
  />
))
ResizablePanelGroup.displayName = "ResizablePanelGroup"

const ResizablePanel = React.forwardRef<
  React.ElementRef<typeof ResizablePrimitive.Panel>,
  React.ComponentPropsWithoutRef<typeof ResizablePrimitive.Panel>
>(({ className, ...props }, ref) => (
  <ResizablePrimitive.Panel
    ref={ref as any}
    className={cn("relative flex h-full w-full", className)}
    {...props}
  />
))
ResizablePanel.displayName = "ResizablePanel"

const ResizableHandle = React.forwardRef<
  React.ElementRef<typeof ResizablePrimitive.PanelResizeHandle>,
  React.ComponentPropsWithoutRef<typeof ResizablePrimitive.PanelResizeHandle>
>(({ className, ...props }, _ref) => (
  <ResizablePrimitive.PanelResizeHandle
    className={cn(
      "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&:hover]:bg-border",
      className
    )}
    {...props}
  >
    <GripVertical className="h-4 w-4" />
  </ResizablePrimitive.PanelResizeHandle>
))
ResizableHandle.displayName = "ResizableHandle"

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
