import React, { useEffect } from "react"; // Removed useState
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Location } from "@shared/schema"; // Use Location type from schema
import { z } from "zod"; // Import z
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CATEGORY_COLORS } from "@/lib/constants"; // Import colors
import { MapPin } from "lucide-react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
// Removed Firestore imports
import { useFirestoreFormSubmit } from '@/hooks/useFirestoreFormSubmit'; // Import the hook

interface LocationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location?: Location; // Use Location type from schema
}

// Local Zod schema for form validation
const formSchema = z.object({
  name: z.string().min(1, "Location name is required"),
});

type FormData = z.infer<typeof formSchema>;

export default function LocationForm({ open, onOpenChange, location }: LocationFormProps) {
  // Removed local isSubmitting state and toast

  // Form setup
  const form = useForm<FormData>({ // Use FormData type
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: location?.name || ""
    }
  });

  // Update form when location changes or form opens/closes
  useEffect(() => {
    if (location) {
      form.reset({
        name: location.name
      });
    } else {
      // Reset to default when adding or closing
      form.reset({
        name: ""
      });
    }
  }, [location, form, open]); // Add open dependency

  // Use the custom hook for submission logic
  const { handleSubmit: handleFirestoreSubmit, isSubmitting } = useFirestoreFormSubmit({ // Remove <FormData>
    collectionName: "locations",
    item: location, // Pass the location being edited (if any)
    onSuccess: () => {
      // No need to invalidate queries here if Settings listener handles it
      onOpenChange(false); // Close dialog on success
      form.reset({ name: "" }); // Reset form
    },
    // onError is handled by the hook's default toast
  });

  // Simple hash function for color selection
  const simpleHash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
  };

  // Wrapper function to add color before submitting
  const onSubmit = (data: FormData) => {
    // Only assign color if it's a new location (no location prop passed)
    const dataWithColor = location ? data : {
      ...data,
      color: CATEGORY_COLORS[simpleHash(data.name) % CATEGORY_COLORS.length]
    };
    handleFirestoreSubmit(dataWithColor); // Pass data with color to the hook
  };


  // Create footer buttons (uses isSubmitting from the hook)
  const formFooter = (
    <>
      <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="flex-1 h-11 min-w-[120px] transition-all hover:bg-muted/80 active:scale-[0.98] border-gray-200 dark:border-gray-700 text-foreground">
        Cancel
      </Button>
      <Button type="submit" disabled={isSubmitting} className="flex-1 h-11 min-w-[120px] transition-all hover:brightness-105 active:scale-[0.98] bg-primary text-primary-foreground hover:bg-primary/90" form="location-form">
        {isSubmitting ? "Saving..." : location ? "Update" : "Save"}
      </Button>
    </>
  );

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={location ? "Edit Location" : "Add New Location"}
      description="Locations help track where expenses occur"
      footer={formFooter}
    >
      <div className="py-2">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
            <MapPin className="h-8 w-8 text-primary dark:text-primary-foreground" />
          </div>
        </div>

        <Form {...form}>
          <form id="location-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium text-foreground">Location Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter location name" className="h-11 transition-all focus:ring-2 focus:ring-primary/25 border-gray-200 dark:border-gray-700" />
                  </FormControl>
                  <FormDescription className="text-xs text-muted-foreground">Examples: Grocery Store, Restaurant, Online Shop</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>
    </ResponsiveDialog>
  );
}
