import * as React from "react";
import { useState } from "react"; // Import useState
// Removed format import from date-fns
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils"; // Added formatDate
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Accept RHF field props directly
interface DatePickerProps {
  value?: Date; // Expect 'value' from RHF field
  onChange: (date: Date | undefined) => void; // Expect 'onChange' from RHF field
  className?: string;
  id?: string;
  name?: string;
  disabled?: (date: Date) => boolean;
}

// Wrap with forwardRef
export const DatePicker = React.forwardRef<
  HTMLButtonElement, // The type of the element the ref will point to (the Button)
  DatePickerProps
>(({ value, onChange, className, id, name, disabled }, ref) => {
  const [isOpen, setIsOpen] = useState(false); // Add state for popover

  const handleSelect = (date: Date | undefined) => {
    onChange(date); // Call original onChange
    if (date) {
      setIsOpen(false); // Close popover if a date is selected
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}> {/* Control popover state */}
      <PopoverTrigger asChild>
        <Button
          ref={ref} // Pass the ref to the Button
          id={id}
          name={name}
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal h-12 text-base border-gray-200 dark:border-gray-700",
            !value && "text-muted-foreground", // Use value
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? formatDate(value) : <span>Pick a date</span>} {/* Use formatDate */}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-gray-200 dark:border-gray-700" align="start">
        <Calendar
          mode="single"
          selected={value} // Use value
          onSelect={handleSelect} // Use the new handler
          disabled={disabled}
          initialFocus
          className="rounded-md border-gray-200 dark:border-gray-700"
        />
      </PopoverContent>
    </Popover>
  );
});
DatePicker.displayName = "DatePicker"; // Add display name for better debugging
