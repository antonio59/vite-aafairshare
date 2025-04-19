import * as React from "react";
import { useState } from "react";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import * as Popover from "@radix-ui/react-popover";

interface DatePickerProps {
  value?: Date;
  onChange: (_date: Date | undefined) => void;
  className?: string;
  id?: string;
  name?: string;
  disabled?: (_date: Date) => boolean;
}

export const DatePicker = React.forwardRef<
  HTMLInputElement,
  DatePickerProps
>(({ value, onChange, className, id, name, disabled }, ref) => {
  const [open, setOpen] = useState(false);

  const handleChange = (_date: Date | null) => {
    onChange(_date || undefined);
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <div className="relative w-full">
          <Input
            ref={ref}
            id={id}
            name={name}
            type="text"
            readOnly
            value={value ? formatDate(value) : ""}
            placeholder="Pick a date"
            className={cn(
              "border-0 shadow-none pl-10 h-[40px] text-base w-full bg-background cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              !value && "text-muted-foreground",
              className
            )}
            onClick={() => setOpen(true)}
            tabIndex={0}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label="Pick a date"
          />
          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 dark:text-gray-400 pointer-events-none" aria-hidden="true" />
        </div>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          className="z-50 mt-2 bg-background border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-0 w-[var(--datepicker-width,272px)] min-w-0"
          style={{ width: '100%' }}
        >
          <ReactDatePicker
            selected={value}
            onChange={handleChange}
            filterDate={disabled}
            calendarClassName="!bg-background !border-none !rounded-lg !shadow-lg !p-2 !w-full min-w-0"
            popperClassName="!z-50"
            dayClassName={(date: Date) => {
              const isSelected = value && date.toDateString() === value.toDateString();
              const isToday = date.toDateString() === new Date().toDateString();
              const isDisabled = disabled ? disabled(date) : false;
              return cn(
                "w-9 h-9 flex items-center justify-center rounded-md transition-colors cursor-pointer text-sm",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
                isToday && !isSelected && "border border-primary text-primary font-semibold",
                isDisabled && "text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50",
                !isSelected && !isDisabled && "hover:bg-accent hover:text-accent-foreground"
              );
            }}
            weekDayClassName={(_date: Date) =>
              "text-xs font-medium text-gray-400 dark:text-gray-500 pb-1"
            }
            renderCustomHeader={({ monthDate, decreaseMonth, increaseMonth }) => (
              <div className="flex items-center justify-between px-2 py-1 mb-2">
                <button
                  type="button"
                  onClick={decreaseMonth}
                  className="p-1 rounded hover:bg-accent text-gray-500 dark:text-gray-400"
                  aria-label="Previous month"
                >
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                </button>
                <span className="text-sm font-semibold text-foreground">
                  {monthDate.toLocaleString("default", { month: "long", year: "numeric" })}
                </span>
                <button
                  type="button"
                  onClick={increaseMonth}
                  className="p-1 rounded hover:bg-accent text-gray-500 dark:text-gray-400"
                  aria-label="Next month"
                >
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                </button>
              </div>
            )}
            inline
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
});

DatePicker.displayName = "DatePicker";
