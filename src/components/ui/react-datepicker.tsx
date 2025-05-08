import * as React from "react";
import { format } from "date-fns";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface DatePickerProps {
  value?: Date;
  onChange: (_date: Date | null) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  error?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  showTimeSelect?: boolean;
  dateFormat?: string;
  isClearable?: boolean;
  id?: string;
}

interface CustomHeaderProps {
  monthDate: Date;
  decreaseMonth: () => void;
  increaseMonth: () => void;
  prevMonthButtonDisabled: boolean;
  nextMonthButtonDisabled: boolean;
}

const DatePicker = React.forwardRef<HTMLDivElement, DatePickerProps>(
  ({
    value,
    onChange,
    label,
    placeholder = "Pick a date",
    className,
    error,
    disabled = false,
    minDate,
    maxDate,
    showTimeSelect = false,
    dateFormat = "PPP",
    isClearable = true,
    id,
  }, ref) => {
    return (
      <div ref={ref} className={cn("grid gap-2", className)}>
        {label && <Label htmlFor={id}>{label}</Label>}
        <ReactDatePicker
          selected={value}
          onChange={onChange}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive",
            className
          )}
          placeholderText={placeholder}
          disabled={disabled}
          minDate={minDate}
          maxDate={maxDate}
          showTimeSelect={showTimeSelect}
          dateFormat={dateFormat}
          isClearable={isClearable}
          id={id}
          renderCustomHeader={({
            monthDate,
            decreaseMonth,
            increaseMonth,
            prevMonthButtonDisabled,
            nextMonthButtonDisabled,
          }: CustomHeaderProps) => (
            <div className="flex items-center justify-between px-2 py-2">
              <Button
                variant="outline"
                className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                onClick={decreaseMonth}
                disabled={prevMonthButtonDisabled}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm font-medium">
                {format(monthDate, "MMMM yyyy")}
              </div>
              <Button
                variant="outline"
                className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                onClick={increaseMonth}
                disabled={nextMonthButtonDisabled}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        />
        {error && (
          <p className="text-sm font-medium text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

DatePicker.displayName = "DatePicker";

export { DatePicker };
