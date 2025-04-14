/**
 * ExpenseCategoryField Component
 * 
 * A reusable form field for selecting an expense category
 */

import React from 'react';
import { Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Combobox } from '@/components/ui/combobox';
import { Category } from '@/types/expense';

interface ExpenseCategoryFieldProps {
  control: Control<any>;
  categories: Category[];
  disabled?: boolean;
}

const ExpenseCategoryField: React.FC<ExpenseCategoryFieldProps> = ({ 
  control,
  categories,
  disabled = false
}) => {
  // Convert categories to combobox items
  const categoryItems = categories.map(category => ({
    value: category.id,
    label: category.name
  }));

  return (
    <FormField
      control={control}
      name="categoryId"
      render={({ field }) => (
        <FormItem className="col-span-6 md:col-span-3">
          <FormLabel>Category</FormLabel>
          <FormControl>
            <Combobox
              items={categoryItems}
              value={field.value}
              onChange={field.onChange}
              placeholder="Select a category"
              disabled={disabled}
              emptyMessage="No categories found"
              className="w-full"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default ExpenseCategoryField; 