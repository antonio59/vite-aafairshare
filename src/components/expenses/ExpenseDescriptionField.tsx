/**
 * ExpenseDescriptionField Component
 * 
 * A reusable form field for entering expense descriptions
 */

import React from 'react';
import { Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

interface ExpenseDescriptionFieldProps {
  control: Control<any>;
  disabled?: boolean;
}

const ExpenseDescriptionField: React.FC<ExpenseDescriptionFieldProps> = ({ 
  control,
  disabled = false
}) => {
  return (
    <FormField
      control={control}
      name="description"
      render={({ field }) => (
        <FormItem className="col-span-6">
          <FormLabel>Description (Optional)</FormLabel>
          <FormControl>
            <Textarea
              placeholder="Enter a description for this expense"
              className="resize-none"
              {...field}
              disabled={disabled}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default ExpenseDescriptionField; 