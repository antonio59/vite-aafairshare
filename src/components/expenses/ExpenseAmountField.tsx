/**
 * ExpenseAmountField Component
 * 
 * A reusable form field for entering expense amounts
 */

import React from 'react';
import { Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PoundSterling } from 'lucide-react';

interface ExpenseAmountFieldProps {
  control: Control<any>;
  disabled?: boolean;
}

const ExpenseAmountField: React.FC<ExpenseAmountFieldProps> = ({ 
  control,
  disabled = false
}) => {
  return (
    <FormField
      control={control}
      name="amount"
      render={({ field }) => (
        <FormItem className="col-span-6 md:col-span-3">
          <FormLabel>Amount</FormLabel>
          <FormControl>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <PoundSterling className="w-4 h-4 text-gray-500" />
              </div>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="0.00"
                className="pl-9"
                {...field}
                onChange={(e) => {
                  const value = e.target.value;
                  // Convert to number with 2 decimal places max
                  const numValue = parseFloat(value);
                  field.onChange(isNaN(numValue) ? '' : numValue);
                }}
                disabled={disabled}
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default ExpenseAmountField; 