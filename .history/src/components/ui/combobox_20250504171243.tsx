import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription
} from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile" // Correct hook name

export type ComboboxItem = {
  value: string
  label: string
}

interface ComboboxProps {
  items: ComboboxItem[]
  value?: string
  onChange: (_value: string) => void // Renamed from onSelect
  onCreateNew?: (_value: string) => void
  placeholder?: string
  createNewLabel?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
  id?: string // Add id prop
  inputClassName?: string // NEW: allow passing className to input
}

// Define props for the inner content component
interface ComboboxContentProps extends ComboboxProps {
  searchQuery: string;
  setSearchQuery: (_query: string) => void;
  setOpen: (_open: boolean) => void;
  filteredItems: ComboboxItem[];
  showCreateNew: boolean;
  exactMatch: ComboboxItem | null;
  handleBlur: () => void;
  handleKeyDown: (_e: React.KeyboardEvent) => void;
  inputClassName?: string;
}

// --- Reusable Content Component ---
const ComboboxContent: React.FC<ComboboxContentProps> = ({
  items,
  value: _value,
  onChange,
  onCreateNew,
  placeholder = "Select an item",
  createNewLabel = "Create new",
  emptyMessage = "No item found.",
  searchQuery: _searchQuery,
  setSearchQuery: _setSearchQuery,
  setOpen: _setOpen,
  filteredItems,
  showCreateNew,
  exactMatch: _exactMatch,
  handleBlur: _handleBlur,
  handleKeyDown: _handleKeyDown,
  inputClassName,
}) => {
  // Enhanced blur handler: close dropdown if input loses focus and no selection is made
  const inputRef = React.useRef<HTMLInputElement>(null);

  const enhancedHandleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // If focus moves outside the popover, close it
    if (!e.relatedTarget || !(e.relatedTarget as HTMLElement).closest('[data-radix-popper-content-wrapper]')) {
      _setOpen(false);
    }
    _handleBlur();
  };

  return (
    <Command shouldFilter={false} className="w-full">
      <CommandInput
        ref={inputRef}
        placeholder={`Search ${placeholder.toLowerCase()}...`}
        value={_searchQuery}
        onValueChange={_setSearchQuery}
        onBlur={enhancedHandleBlur}
        onKeyDown={_handleKeyDown}
        className={cn("h-12 text-base py-3 sm:py-2.5 text-black placeholder-black", inputClassName)} // ENFORCE BLACK
      />
      <CommandList className="max-h-[250px] sm:max-h-[300px] overflow-y-auto">
        <CommandEmpty className="py-3 text-base text-black">{emptyMessage}</CommandEmpty>
        <CommandGroup>
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <CommandItem
                key={item.value}
                value={item.value}
                onSelect={() => {
                  onChange(item.value)
                  _setOpen(false)
                  _setSearchQuery("")
                }}
                className="text-base py-3 sm:py-2.5 text-black" // ENFORCE BLACK
              >
                <Check
                  className={cn(
                    "mr-2 h-5 w-5",
                    _value === item.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {item.label}
              </CommandItem>
            ))
          ) : _searchQuery ? null : (
            items.map((item) => (
              <CommandItem
                key={item.value}
                value={item.value}
                onSelect={() => {
                  onChange(item.value)
                  _setOpen(false)
                  _setSearchQuery("")
                }}
                className="text-base py-3 sm:py-2.5 text-black" // ENFORCE BLACK
              >
                <Check
                  className={cn(
                    "mr-2 h-5 w-5",
                    _value === item.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {item.label}
              </CommandItem>
            ))
          )}
        </CommandGroup>

        {showCreateNew && (
          <>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  if (onCreateNew) {
                    onCreateNew(_searchQuery)
                    _setOpen(false)
                    _setSearchQuery("")
                  }
                }}
                className="text-base py-3 sm:py-2.5 flex items-center text-black" // ENFORCE BLACK
              >
                <Plus className="mr-2 h-5 w-5 flex-shrink-0" />
                <span className="truncate">
                  {createNewLabel}: <span className="font-medium">{_searchQuery}</span>
                </span>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </Command>
  );
};


// --- Main Combobox Component ---
export const Combobox = React.forwardRef<HTMLButtonElement, ComboboxProps>(({
  items,
  value,
  onChange,
  onCreateNew,
  placeholder = "Select an item",
  createNewLabel = "Create new",
  emptyMessage = "No item found.",
  className,
  disabled = false,
  id,
  inputClassName,
}, ref) => {
  const isMobile = useIsMobile(); // Use correct hook name
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  // Add debug logging
  React.useEffect(() => {
    console.log("Combobox received items:", items);
    console.log("Combobox current value:", value);
  }, [items, value]);

  const selectedItem = React.useMemo(
    () => items.find((item) => item.value === value),
    [items, value]
  )

  const filteredItems = React.useMemo(() => {
    // Ensure items is an array before filtering
    if (!Array.isArray(items)) {
      console.warn("Combobox: items is not an array", items);
      return [];
    }
    
    if (!searchQuery) return items
    const lowerSearchQuery = searchQuery.toLowerCase()

    // First look for an exact match
    const exactMatches = items.filter((item) =>
      item.label.toLowerCase() === lowerSearchQuery
    )

    if (exactMatches.length > 0) {
      return exactMatches
    }

    // Then look for a starting-with match
    const startingMatches = items.filter((item) =>
      item.label.toLowerCase().startsWith(lowerSearchQuery)
    )

    if (startingMatches.length > 0) {
      return startingMatches
    }

    // Finally fall back to includes match
    return items.filter((item) =>
      item.label.toLowerCase().includes(lowerSearchQuery)
    )
  }, [items, searchQuery])

  // Ensure exactMatch returns null, not undefined
  const exactMatch: ComboboxItem | null = React.useMemo(() => {
    if (!searchQuery) return null;
    return items.find(
      (item) => item.label.toLowerCase() === searchQuery.toLowerCase()
    ) ?? null; // Ensure null if find returns undefined
  }, [items, searchQuery]);

  // Only show create new when there's no exact match
  const showCreateNew = React.useMemo(() => {
    // Explicitly return boolean
    return !!(
      onCreateNew &&
      searchQuery &&
      !exactMatch
    );
  }, [exactMatch, onCreateNew, searchQuery]);

  // Handle blur event on input to auto-select exact match
  const handleBlur = () => {
    if (exactMatch && searchQuery) {
      onChange(exactMatch.value); // Use onChange
      setSearchQuery("");
    }
  };

  // Handle keyboard submission
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // If Enter is pressed and we have an exact match, select it
    if (e.key === 'Enter' && exactMatch) {
      e.preventDefault();
      onChange(exactMatch.value); // Use onChange
      setOpen(false);
      setSearchQuery("");
    }
    // If Enter is pressed and we have a create new option, create it
    else if (e.key === 'Enter' && showCreateNew && onCreateNew) {
      e.preventDefault();
      onCreateNew(searchQuery);
      setOpen(false);
      setSearchQuery("");
    }
  };

  // Pass all props needed by ComboboxContent
  // Provide default for showCreateNew if needed, ensure exactMatch is passed correctly
  const contentProps: ComboboxContentProps = {
    items, value, onChange, onCreateNew, placeholder, createNewLabel, emptyMessage,
    searchQuery, setSearchQuery, setOpen, filteredItems,
    showCreateNew,
    exactMatch,
    handleBlur, handleKeyDown,
    inputClassName,
  };

  if (isMobile) {
    // Generate stable IDs for accessibility
    const titleId = `${id || 'combobox'}-drawer-title`;
    const descriptionId = `${id || 'combobox'}-drawer-description`;

    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button
            ref={ref}
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between h-12 text-base", className)} // Consistent height
            disabled={disabled}
          >
            {selectedItem ? selectedItem.label : placeholder}
            <ChevronsUpDown className="ml-2 h-5 w-5 shrink-0 opacity-50" />
          </Button>
        </DrawerTrigger>
        <DrawerContent
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
        >
          <DrawerHeader className="sr-only">
            <DrawerTitle id={titleId}>{placeholder}</DrawerTitle>
            <DrawerDescription id={descriptionId}>Select from available options</DrawerDescription>
          </DrawerHeader>
          {/* Add padding/margin as needed for drawer layout */}
          <div className="mt-4 border-t p-2">
            <ComboboxContent {...contentProps} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop view (Popover)
  return (
    <Popover open={open} onOpenChange={(nextOpen) => {
      console.log('[Combobox] Popover onOpenChange:', nextOpen);
      setOpen(nextOpen);
    }}>
      <PopoverTrigger asChild>
        <Button
          ref={ref} // Pass the ref to the Button
          id={id} // Pass the id prop here
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-12 text-base border-gray-200", className)} // Consistent height
          disabled={disabled}
        >
          {selectedItem ? selectedItem.label : placeholder}
          <ChevronsUpDown className="ml-2 h-5 w-5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      {/* Use PopoverContent for desktop */}
      <PopoverContent
        className="p-0 w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height]" // Use CSS vars for width/height
        align="start"
        aria-label={`Options for ${placeholder}`}
      >
        {/* Render the reusable content */}
        <ComboboxContent {...contentProps} />
      </PopoverContent>
    </Popover>
  )
});
Combobox.displayName = "Combobox"; // Add display name
