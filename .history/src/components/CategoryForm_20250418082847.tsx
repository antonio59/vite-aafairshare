import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Category } from "@shared/types";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CATEGORY_ICONS } from "@/lib/constants"; // Import icons
import { cn } from "@/lib/utils";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { useFirestoreFormSubmit } from '@/hooks/useFirestoreFormSubmit';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"; // Import ToggleGroup

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category;
  description?: string;
}

// Updated Zod schema with icon and color
const formSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  icon: z.string({ required_error: "Please select an icon" })
});

type FormData = z.infer<typeof formSchema>;

// Add this utility to get all icon names as values
const ICON_NAMES: string[] = [
  'Subscriptions',
  'Utilities',
  'Gifts',
  'Holidays',
  'Groceries',
  'Transport',
  'Health',
  'Entertainment',
  'Dining',
  'Shopping',
  'other',
];

// Helper to map Category to EditableItem (if EditableItem is Record<string, unknown>)
function mapCategoryToEditableItem(category?: Category): Record<string, unknown> | null {
  if (!category) return null;
  return { ...category };
}

export default function CategoryForm({ open, onOpenChange, category, description }: CategoryFormProps) {

  const defaultIcon = ICON_NAMES[0]; // Use the first value from ICON_NAMES


  // Form setup
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: category?.name || "",
      icon: category?.icon || defaultIcon // Use icon, default to first icon
    }
  });

  // Update form when category changes or form opens/closes
  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        icon: category.icon || defaultIcon // Ensure icon has a default
      });
    } else {
       // Optionally reset when closing if desired, or keep last state
       // form.reset({ name: "", icon: defaultIcon });
    }
  }, [category, form, defaultIcon]);

  // Use the custom hook for submission logic
  const { handleSubmit: handleFirestoreSubmit, isSubmitting } = useFirestoreFormSubmit({
    collectionName: "categories",
    item: mapCategoryToEditableItem(category),
    onSuccess: () => {
      onOpenChange(false);
      // Resetting here might clear the form before the dialog fully closes animation-wise
      // Consider resetting in the useEffect based on the 'open' state instead.
      // form.reset({ name: "", icon: defaultIcon });
    },
  });

  // Wrapper function
  const onSubmit = (data: FormData) => {
    // Ensure icon is a valid string before submitting if needed,
    // though Zod schema ensures it's a non-empty string.
    handleFirestoreSubmit(data);
  };

  // Footer buttons styled like ExpenseForm
  const formFooter = (
    <div className="flex justify-between gap-3 pt-4"> {/* Removed sticky/border */}
      <Button
        type="button"
        variant="outline"
        onClick={() => onOpenChange(false)}
        disabled={isSubmitting}
        className="flex-1 h-12 text-base border-gray-300 dark:border-gray-700 text-foreground" // Updated for dark mode
      >
        Cancel
      </Button>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="flex-1 h-12 text-base bg-primary hover:bg-primary/90 text-primary-foreground" // Use theme colors
        form="category-form" // Link to form
      >
        {isSubmitting ? "Saving..." : category ? "Update Category" : "Save Category"}
      </Button>
    </div>
  );

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={category ? "Edit Category" : "Add New Category"}
      description={description || "Categories help you organize expenses."}
      footer={formFooter}
    >
      {/* Removed padding from dialog content if form adds its own */}
      <Form {...form}>
        <form id="category-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
          {/* Name Field - Styled like ExpenseForm */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Groceries, Dining"
                    className="h-12 text-base" // Match ExpenseForm style
                    {...field}
                  />
                </FormControl>
                {/* <FormDescription>Optional: Add a description if needed.</FormDescription> */}
                <FormMessage className="text-xs text-destructive" />
              </FormItem>
            )}
          />

          {/* Icon Field - Replaces Color Picker */}
          <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">Icon</FormLabel>
                <FormControl>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    value={field.value}
                    onValueChange={field.onChange}
                    className="grid grid-cols-4 sm:grid-cols-5 gap-2 pt-1" // Adjust grid columns
                  >
                    {ICON_NAMES.map((iconName: string) => {
                      const IconComponent = CATEGORY_ICONS[iconName];
                      return (
                        <ToggleGroupItem
                          key={iconName}
                          value={iconName}
                          aria-label={iconName}
                          className={cn(
                            "flex flex-col items-center justify-center h-16 rounded-lg border border-gray-200 dark:border-gray-700 data-[state=on]:bg-blue-100 dark:data-[state=on]:bg-blue-900/30 data-[state=on]:border-blue-500 dark:data-[state=on]:border-blue-700 data-[state=on]:text-blue-700 dark:data-[state=on]:text-blue-300",
                            "hover:bg-gray-50 dark:hover:bg-gray-800"
                          )}
                        >
                          <IconComponent className="w-5 h-5 mb-1" />
                          <span className="text-xs font-medium">{iconName}</span>
                        </ToggleGroupItem>
                      );
                    })}
                  </ToggleGroup>
                </FormControl>
                 <FormDescription>Select an icon to represent this category.</FormDescription>
                <FormMessage className="text-xs text-destructive" />
              </FormItem>
            )}
          />

        </form>
      </Form>
    </ResponsiveDialog>
  );
}
