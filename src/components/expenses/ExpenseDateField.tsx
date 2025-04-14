/**
 * ExpenseDateField Component
 * 
 * A reusable form field for selecting the expense date
 */

import React from 'react';
import { Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { DatePicker } from '@/components/ui/date-picker';

interface ExpenseDateFieldProps {
  control: Control<any>;
  disabled?: boolean;
}

const ExpenseDateField: React.FC<ExpenseDateFieldProps> = ({ 
  control,
  disabled = false
}) => {
  // Function to disable future dates
  const disableFutureDates = (date: Date) => {
    return date > new Date();
  };

  return (
    <FormField
      control={control}
      name="date"
      render={({ field }) => (
        <FormItem className="col-span-6 md:col-span-3">
          <FormLabel>Date</FormLabel>
          <FormControl>
            <DatePicker
              value={field.value}
              onChange={field.onChange}
              disabled={disableFutureDates}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default ExpenseDateField; 