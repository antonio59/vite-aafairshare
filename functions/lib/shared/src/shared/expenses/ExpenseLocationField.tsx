/**
 * ExpenseLocationField Component
 * 
 * A reusable form field for selecting an expense location
 */

import React from 'react';
import { Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Combobox } from '@/components/ui/combobox';
import { Location, Expense } from '@shared/types';
import { createLocation } from '@/services/resources.service';
import { useToast } from '@/hooks/use-toast';

interface ExpenseLocationFieldProps {
  control: Control<Expense>;
  locations: Location[];
  disabled?: boolean;
  onLocationAdded?: () => void;
}

const ExpenseLocationField: React.FC<ExpenseLocationFieldProps> = ({ 
  control,
  locations,
  disabled = false,
  onLocationAdded
}) => {
  const { toast } = useToast();

  // Convert locations to combobox items
  const locationItems = locations.map(location => ({
    value: location.id,
    label: location.name
  }));

  // Handle creating a new location
  const handleCreateLocation = async (locationName: string) => {
    try {
      const trimmedName = locationName.trim();
      if (!trimmedName) return;

      // Capitalize first letter of the name
      const capitalizedName = trimmedName.charAt(0).toUpperCase() + trimmedName.slice(1);
      
      // Create the location
      await createLocation({ name: capitalizedName });
      
      // Show success toast
      toast({
        title: "Location Created",
        description: `"${capitalizedName}" has been added to locations.`,
      });
      
      // Call the callback to refresh locations if provided
      if (onLocationAdded) {
        onLocationAdded();
      }
    } catch (error) {
      console.error("Error creating location:", error);
      toast({
        title: "Error",
        description: "Failed to create location. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <FormField
      control={control}
      name="locationId"
      render={({ field }) => (
        <FormItem className="col-span-6 md:col-span-3">
          <FormLabel>Location</FormLabel>
          <FormControl>
            <Combobox
              items={locationItems}
              value={field.value}
              onChange={field.onChange}
              onCreateNew={handleCreateLocation}
              placeholder="Select a location"
              createNewLabel="Add location"
              disabled={disabled}
              emptyMessage="No locations found"
              className="w-full"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default ExpenseLocationField; 