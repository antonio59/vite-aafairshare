import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/react-datepicker";
import { Combobox, ComboboxItem } from "@/components/ui/combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { RecurringExpense, RecurringFrequency, Category, Location, User } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { collection, addDoc, updateDoc, doc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { queryClient } from "@/lib/queryClient";
import { SPLIT_TYPES, CATEGORY_ICONS, CategoryIconName } from "@/lib/constants";
import { getMonthFromDate, cn } from "@/lib/utils";

// Zod Schema for Recurring Expense Form
const formSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  categoryId: z.string().min(1, "Category is required"),
  locationId: z.string().min(1, "Location is required"),
  splitType: z.enum(["Equal", "Owned"]),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date().optional().nullable(),
  frequency: z.enum(["daily", "weekly", "biweekly", "monthly", "quarterly", "yearly"]),
  isActive: z.boolean(), // Make isActive required without default
  // Title is derived from description in the submit handler
});

export type RecurringExpenseFormData = z.infer<typeof formSchema>;

interface RecurringExpenseFormProps {
  initialData?: RecurringExpense;
  onClose: (needsRefetch?: boolean) => void;
  categories: Category[];
  locations: Location[];
  users: User[];
  isLoading?: boolean;
}

export default function RecurringExpenseForm({
  initialData,
  onClose,
  categories,
  locations,
  users,
  isLoading = false
}: RecurringExpenseFormProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingLocation, setIsCreatingLocation] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // React Hook Form Setup with Zod validation
  const form = useForm<RecurringExpenseFormData, any, RecurringExpenseFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: initialData?.amount ?? undefined,
      categoryId: initialData?.categoryId || "",
      locationId: initialData?.locationId || "",
      splitType: initialData?.splitType === "100%" ? "Owned" : "Equal",
      description: initialData?.description || initialData?.title || "",
      startDate: initialData?.startDate ?
        (initialData.startDate instanceof Date ? initialData.startDate : new Date(initialData.startDate)) :
        new Date(),
      endDate: initialData?.endDate ?
        (initialData.endDate instanceof Date ? initialData.endDate : new Date(initialData.endDate)) :
        undefined,
      frequency: initialData?.frequency || "monthly",
      isActive: initialData?.isActive ?? true,
    },
  });

  // Mobile Keyboard Handling Effect
  useEffect(() => {
    const formElement = formRef.current;
    const scrollContainer = scrollContainerRef.current;
    if (!formElement || !scrollContainer) return;

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (target.matches('input, select, textarea, button') && formElement.contains(target)) {
        setTimeout(() => {
          if (window.visualViewport) {
            const viewport = window.visualViewport;
            const targetRect = target.getBoundingClientRect();
            const scrollContainerRect = scrollContainer.getBoundingClientRect();
            const isObscured = targetRect.bottom > viewport.height - viewport.offsetTop;
            const isAbove = targetRect.top < scrollContainerRect.top;
            if (isObscured || isAbove) {
               target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          } else {
            target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 300);
      }
    };
    formElement.addEventListener('focusin', handleFocusIn);
    return () => {
      formElement.removeEventListener('focusin', handleFocusIn);
    };
  }, []);

  // Location Creation Logic
  const handleCreateLocation = async (locationName: string) => {
    const trimmedName = locationName.trim();
    if (!trimmedName || isCreatingLocation) return;

    // Capitalize first letter
    const capitalizedName = trimmedName.charAt(0).toUpperCase() + trimmedName.slice(1);

    setIsCreatingLocation(true);
    try {
      const locationData = {
        name: capitalizedName,
        createdAt: serverTimestamp()
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, "locations"), locationData);

      toast({
        title: "Location created",
        description: `"${capitalizedName}" added.`
      });

      // Refetch locations query
      await queryClient.refetchQueries({ queryKey: ['locations'] });

      // Set the newly created location in the form
      form.setValue("locationId", docRef.id, { shouldValidate: true });

    } catch (error: unknown) {
      console.error("Error creating location:", error);
      const errorMessage = error instanceof Error ? error.message : "Could not add the new location.";
      toast({
        title: "Error creating location",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCreatingLocation(false);
    }
  };

  // Submission Handler
  const onSubmit = async (data: RecurringExpenseFormData) => {
    if (!currentUser) {
      toast({
        title: "Authentication Error",
        description: "User not logged in",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Ensure dates are valid Date objects
      const startDate = data.startDate instanceof Date ? data.startDate : new Date();
      const endDate = data.endDate instanceof Date ? data.endDate : null;

      // Prepare data for Firestore
      const recurringExpenseData = {
        amount: data.amount,
        categoryId: data.categoryId,
        locationId: data.locationId,
        splitType: data.splitType === "Owned" ? "100%" : "50/50", // Map back to stored values
        description: data.description,
        startDate: Timestamp.fromDate(startDate),
        endDate: endDate ? Timestamp.fromDate(endDate) : null,
        frequency: data.frequency,
        isActive: data.isActive,
        paidByUserId: currentUser.uid,
        title: data.description || "Recurring Expense", // Add title field
        // Add createdAt/updatedAt timestamps
        ...(initialData?.id ? { updatedAt: serverTimestamp() } : { createdAt: serverTimestamp() }),
      };

      if (initialData?.id) {
        // Update existing recurring expense
        await updateDoc(doc(db, "recurringExpenses", initialData.id), recurringExpenseData);
        toast({ title: "Recurring expense updated" });
      } else {
        // Create new recurring expense
        await addDoc(collection(db, "recurringExpenses"), recurringExpenseData);
        toast({ title: "Recurring expense added" });
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['recurringExpenses'] });

      onClose(true); // Close and indicate refetch needed

    } catch (error: unknown) {
      console.error("Error saving recurring expense:", error);
      const errorMessage = error instanceof Error ? error.message : "Please try again";
      toast({
        title: "Error saving recurring expense",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6 p-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-8 w-1/4" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  // Prepare items for Location Combobox
  const locationItems: ComboboxItem[] = locations.map(l => ({ value: l.id, label: l.name }));

  return (
    <Form {...form}>
      <form
        ref={formRef}
        onSubmit={form.handleSubmit(onSubmit as any)}
        className="flex flex-col h-full bg-background"
      >
        <h2 className="text-xl font-semibold text-center px-4 text-foreground">
          {initialData ? "Edit Recurring Expense" : "Add Recurring Expense"}
        </h2>

        {/* Scrollable Content Area */}
        <div ref={scrollContainerRef} className="flex-grow overflow-y-auto p-4 space-y-6">

          {/* Amount */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">Amount</FormLabel>
                <FormControl>
                  <div className="relative">
                     <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                       <span className="text-gray-500 dark:text-gray-400 sm:text-sm">£</span>
                     </div>
                     <Input
                       type="number"
                       step="0.01"
                       min="0"
                       placeholder="0.00"
                       className="pl-7 h-12 text-base"
                       {...field}
                     />
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-destructive" />
              </FormItem>
            )}
          />

          {/* Category */}
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">Category</FormLabel>
                <FormControl>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    value={field.value}
                    onValueChange={field.onChange}
                    className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-1"
                  >
                    {categories.map((category) => {
                      const IconComponent = category.icon && CATEGORY_ICONS[category.icon as CategoryIconName]
                        ? CATEGORY_ICONS[category.icon as CategoryIconName]
                        : ({ className }: { className?: string }) => <span className={cn("text-xl", className)}>❓</span>;
                      return (
                        <ToggleGroupItem
                          key={category.id}
                          value={category.id}
                          aria-label={category.name}
                          className={cn(
                            "flex flex-col items-center justify-center h-20 rounded-lg border border-gray-200 data-[state=on]:bg-blue-100 data-[state=on]:border-blue-500 data-[state=on]:text-blue-700",
                            "hover:bg-gray-50"
                          )}
                        >
                          <IconComponent className="w-6 h-6 mb-1" />
                          <span className="text-xs font-medium">{category.name}</span>
                        </ToggleGroupItem>
                      );
                    })}
                  </ToggleGroup>
                </FormControl>
                <FormMessage className="text-xs text-red-600" />
              </FormItem>
            )}
          />

          {/* Location */}
          <FormField
            control={form.control}
            name="locationId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                 <FormLabel className="text-sm font-medium text-foreground">Location</FormLabel>
                 <FormControl>
                   <Combobox
                     items={locationItems}
                     onCreateNew={handleCreateLocation}
                     placeholder="Select or add location"
                     createNewLabel="Add new location..."
                     emptyMessage="No location found."
                     className="h-12 text-base"
                     disabled={isCreatingLocation}
                     {...field}
                   />
                 </FormControl>
                 <FormMessage className="text-xs text-destructive" />
              </FormItem>
            )}
          />

          {/* Split Type */}
          <FormField
            control={form.control}
            name="splitType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">Split Type</FormLabel>
                <FormControl>
                  <ToggleGroup
                    type="single"
                    value={field.value}
                    onValueChange={field.onChange}
                    className="grid grid-cols-2 gap-3 pt-1"
                  >
                    <ToggleGroupItem
                      value="Equal"
                      aria-label="Split equally"
                      className={cn(
                        "flex flex-col items-start justify-center h-auto p-3 rounded-lg border border-gray-200 dark:border-gray-700 data-[state=on]:bg-blue-100 dark:data-[state=on]:bg-blue-900/30 data-[state=on]:border-blue-500 dark:data-[state=on]:border-blue-700 data-[state=on]:text-blue-700 dark:data-[state=on]:text-blue-300",
                        "hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
                      )}
                    >
                      <span className="font-semibold">Equal</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 data-[state=on]:text-blue-600 dark:data-[state=on]:text-blue-400">Split equally among all</span>
                    </ToggleGroupItem>
                    <ToggleGroupItem
                       value="Owned"
                       aria-label="Owned by other user"
                       className={cn(
                         "flex flex-col items-start justify-center h-auto p-3 rounded-lg border border-gray-200 dark:border-gray-700 data-[state=on]:bg-blue-100 dark:data-[state=on]:bg-blue-900/30 data-[state=on]:border-blue-500 dark:data-[state=on]:border-blue-700 data-[state=on]:text-blue-700 dark:data-[state=on]:text-blue-300",
                         "hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
                       )}
                    >
                       <span className="font-semibold">Percent</span>
                       <span className="text-xs text-gray-500 dark:text-gray-400 data-[state=on]:text-blue-600 dark:data-[state=on]:text-blue-400">100% owed by the other user</span>
                    </ToggleGroupItem>
                  </ToggleGroup>
                </FormControl>
                <FormMessage className="text-xs text-destructive" />
              </FormItem>
            )}
          />

          {/* Frequency */}
          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">Frequency</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage className="text-xs text-destructive" />
              </FormItem>
            )}
          />

          {/* Start Date */}
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-sm font-medium text-foreground">Start Date</FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    className="h-12 text-base w-full"
                   />
                </FormControl>
                <FormMessage className="text-xs text-destructive" />
              </FormItem>
            )}
          />

          {/* End Date (Optional) */}
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-sm font-medium text-foreground">End Date (Optional)</FormLabel>
                  {field.value && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => field.onChange(undefined)}
                      className="h-8 text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <FormControl>
                  <DatePicker
                    value={field.value || undefined}
                    onChange={field.onChange}
                    className="h-12 text-base w-full"
                    disabled={(date) => {
                      const startDate = form.getValues().startDate;
                      return startDate ? date < startDate : false;
                    }}
                   />
                </FormControl>
                <FormMessage className="text-xs text-destructive" />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter description"
                    className="min-h-[80px] text-base"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs text-destructive" />
              </FormItem>
            )}
          />

          {/* Active Status */}
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary dark:bg-gray-800"
                  />
                </FormControl>
                <FormLabel className="text-sm font-medium text-foreground">Active</FormLabel>
              </FormItem>
            )}
          />

        </div>

        {/* Sticky Buttons Container */}
        <div className="flex justify-between gap-3 p-4 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-background">
          <Button
            type="button"
            variant="outline"
            onClick={() => onClose(false)}
            disabled={isSubmitting}
            className="flex-1 h-12 text-base border-gray-200 dark:border-gray-700 text-foreground"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 h-12 text-base bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isSubmitting ? "Saving..." : initialData ? "Update Expense" : "Save Expense"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
