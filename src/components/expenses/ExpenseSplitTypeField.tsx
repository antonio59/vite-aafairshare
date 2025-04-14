/**
 * ExpenseSplitTypeField Component
 * 
 * A reusable form field for selecting the expense split type
 */

import React from 'react';
import { Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Split, UserRound } from 'lucide-react';
import { SplitType } from '@shared/types';

interface ExpenseSplitTypeFieldProps {
  control: Control<any>;
  disabled?: boolean;
}

const ExpenseSplitTypeField: React.FC<ExpenseSplitTypeFieldProps> = ({ 
  control,
  disabled = false
}) => {
  return (
    <FormField
      control={control}
      name="splitType"
      render={({ field }) => (
        <FormItem className="col-span-6">
          <FormLabel>Split Type</FormLabel>
          <FormControl>
            <ToggleGroup
              type="single"
              value={field.value}
              onValueChange={(value) => {
                if (value) field.onChange(value);
              }}
              disabled={disabled}
              className="justify-start"
            >
              <ToggleGroupItem
                value={SplitType.EQUAL}
                className="flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                aria-label="Equal split"
              >
                <Split className="w-4 h-4 mr-2" />
                <span>Equal Split (50/50)</span>
              </ToggleGroupItem>
              <ToggleGroupItem
                value={SplitType.OWNED}
                className="flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                aria-label="Owned fully"
              >
                <UserRound className="w-4 h-4 mr-2" />
                <span>Owned (100%)</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default ExpenseSplitTypeField; 