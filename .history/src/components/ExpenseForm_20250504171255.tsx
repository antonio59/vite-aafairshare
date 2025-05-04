import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Category, Location, ExpenseWithDetails, User } from "@shared/types";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, doc, serverTimestamp, getDocs } from "firebase/firestore";
import { queryClient } from "@/lib/queryClient";
import { CATEGORY_ICONS } from "@/lib/constants";
import type { CategoryIconName } from "@shared/types";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePicker } from "@/components/ui/react-datepicker";
import { Combobox } from "@/components/ui/combobox";
import type { ComboboxItem } from "@/components/ui/combobox";
import { getMonthFromDate, cn, normalizeToDate } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// --- Zod Schema (Adjust if needed based on new inputs) ---
const formSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  categoryId: z.string().min(1, "Category is required"),
  locationId: z.string().min(1, "Location is required"),
  splitType: z.enum(["Equal", "Owned"]), // Form uses 'Equal' | 'Owned'
  date: z.date(), // Always a Date in the form
  description: z.string().optional(),
  splitBetweenIds: z.array(z.string()).optional(),
});

export type ExpenseFormData = z.infer<typeof formSchema>;

// --- Component Props ---
export interface ExpenseFormProps {
  expense?: ExpenseWithDetails;
  onClose: (_needsRefetch?: boolean) => void;
  categories?: Category[];  // Now optional since we'll fetch directly
  locations?: Location[];   // Now optional since we'll fetch directly
  users: User[];           // Keeping this as it might be used elsewhere
  isLoading?: boolean;
}

// --- Component ---
export default function ExpenseForm({ expense, onClose, categories: propCategories, locations: propLocations, isLoading: propsLoading }: ExpenseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingLocation, setIsCreatingLocation] = useState(false);
  const [loading, setLoading] = useState(propsLoading || false);
  const [categories, setCategories] = useState<Category[]>(propCategories || []);
  const [locations, setLocations] = useState<Location[]>(propLocations || []);
  const [dataLoadError, setDataLoadError] = useState<string | null>(null);
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch data directly from Firestore if not provided via props
  useEffect(() => {
    const fetchData = async () => {
      if ((propCategories?.length === 0 || propLocations?.length === 0) && !propsLoading) {
        setLoading(true);
        try {
          // Fetch categories directly
          console.log("📥 ExpenseForm: Directly fetching categories from Firestore");
          const categoriesSnapshot = await getDocs(collection(db, "categories"));
          const categoriesData = categoriesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Category[];
          console.log(`✅ ExpenseForm: Directly fetched ${categoriesData.length} categories`);
          setCategories(categoriesData);
          
          // Fetch locations directly
          console.log("📥 ExpenseForm: Directly fetching locations from Firestore");
          const locationsSnapshot = await getDocs(collection(db, "locations"));
          const locationsData = locationsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Location[];
          console.log(`✅ ExpenseForm: Directly fetched ${locationsData.length} locations`);
          setLocations(locationsData);
          
          setDataLoadError(null);
        } catch (error) {
          console.error("Error fetching form data directly:", error);
          setDataLoadError("Failed to load required data. Please try again.");
          toast({
            title: "Error",
            description: "Failed to load categories and locations. Please try again.",
            variant: "destructive"
          });
        } finally {
          setLoading(false);
        }
      } else if (propCategories && propCategories.length > 0 && propLocations && propLocations.length > 0) {
        // Use the props if they're provided and not empty
        setCategories(propCategories);
        setLocations(propLocations);
        console.log("📤 ExpenseForm: Using categories and locations from props", {
          categories: propCategories.length,
          locations: propLocations.length
        });
      }
    };

    fetchData();
  }, [propCategories, propLocations, propsLoading, toast]);

  // Add logging to debug categories and locations
  useEffect(() => {
    console.log("ExpenseForm categories state:", categories);
    console.log("ExpenseForm locations state:", locations);
  }, [categories, locations]);

  // Sort categories and locations alphabetically
  const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));
  const sortedLocations = [...locations].sort((a, b) => a.name.localeCompare(b.name));

  // Prepare items for Location Combobox - moved up before any conditional returns
  const locationItems: ComboboxItem[] = sortedLocations.map(l => ({ value: l.id, label: l.name }));

  // Added logging to debug Combobox items - moved up before any conditional returns
  useEffect(() => {
    console.log("Location items prepared for Combobox:", locationItems);
  }, [locationItems]);

  // --- React Hook Form Setup ---
  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: expense?.amount ?? undefined,
      categoryId: expense?.categoryId || "",
      locationId: expense?.locationId || "",
      splitType: expense?.splitType === "100%" ? "Owned" : "Equal", // Always 'Equal' | 'Owned' in form
      date: normalizeToDate(expense?.date) || new Date(),
      description: expense?.description || "",
      splitBetweenIds: expense?.splitBetweenIds || [],
    },
  });

  // --- Mobile Keyboard Handling Effect ---
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
               target.scrollIntoView({ behavior: 'smooth', block: 'center' }); // Changed to 'center' for better visibility
            }
          } else {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' }); // Changed to 'center' for better visibility
          }
        }, 300);
      }
    };
    formElement.addEventListener('focusin', handleFocusIn);

    // Handle resize events for mobile virtual keyboard
    const handleResize = () => {
      if (window.visualViewport) {
        scrollContainer.style.height = `${window.visualViewport.height}px`;
      }
    };
    window.addEventListener('resize', handleResize);
    
    // Initial setup
    handleResize();

    return () => {
      formElement.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // --- Start: Add Location Creation Logic ---
  const fetchLocations = async () => {
    try {
      const locationsSnapshot = await getDocs(collection(db, "locations"));
      const locationsData = locationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Location[];
      setLocations(locationsData);
      return locationsData;
    } catch (error) {
      console.error("Error fetching locations:", error);
      toast({
        title: "Error",
        description: "Failed to load locations. Please try again.",
        variant: "destructive"
      });
      return [];
    }
  };

  const handleCreateLocation = async (locationName: string) => {
    const trimmedName = locationName.trim();
    if (!trimmedName || isCreatingLocation) return;

    // Capitalize first letter
    const capitalizedName = trimmedName.charAt(0).toUpperCase() + trimmedName.slice(1);

    setIsCreatingLocation(true);
    try {
      const locationData = {
        name: capitalizedName, // Use capitalized name
        createdAt: serverTimestamp()
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, "locations"), locationData);

      toast({
        title: "Location created",
        description: `"${capitalizedName}" added.`
      });

      // Refetch locations and set the new one as selected
      const updatedLocations = await fetchLocations();
      form.setValue("locationId", docRef.id, { shouldValidate: true });
      setLocations(updatedLocations);
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
  // --- End: Add Location Creation Logic ---

  // --- Submission Handler ---
  const onSubmit = async (data: ExpenseFormData) => {
    if (!currentUser) {
      toast({ title: "Authentication Error", description: "User not logged in", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      // Map form data to domain model
      const expenseData = {
        amount: data.amount,
        categoryId: data.categoryId,
        locationId: data.locationId,
        splitType: data.splitType === "Owned" ? "100%" : "50/50", // Map to domain value
        date: data.date.toISOString(), // Store as ISO string
        description: data.description,
        paidById: currentUser.uid,
        month: getMonthFromDate(data.date),
        splitBetweenIds: data.splitBetweenIds || [],
        ...(expense?.id ? { updatedAt: serverTimestamp() } : { createdAt: serverTimestamp() }),
      };

      if (expense?.id) {
        await updateDoc(doc(db, "expenses", expense.id), expenseData);
        toast({ title: "Expense updated" });
      } else {
        await addDoc(collection(db, "expenses"), expenseData);
        toast({ title: "Expense added" });
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: [`expenses`, expenseData.month] });
      queryClient.invalidateQueries({ queryKey: [`summary`, expenseData.month] });

      onClose(true); // Close and indicate refetch needed

    } catch (error: unknown) {
      console.error("Error saving expense:", error);
      const errorMessage = error instanceof Error ? error.message : "Please try again";
      toast({ title: "Error saving expense", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Loading State ---
  if (loading) {
    return (
      <div className="space-y-6 p-4">
        {/* Simplified skeleton for the new layout */}
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-8 w-1/4" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        {/* Add more skeletons as needed */}
      </div>
    );
  }

  // Show error message if data failed to load
  if (dataLoadError) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-500 mb-4">{dataLoadError}</div>
        <Button onClick={() => window.location.reload()} variant="outline">
          Reload Page
        </Button>
      </div>
    );
  }

  // Show a warning if no categories or locations are available
  if (categories.length === 0 || locations.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-amber-500 mb-4">
          {categories.length === 0 ? "No categories available. " : ""}
          {locations.length === 0 ? "No locations available. " : ""}
          Please add some before creating an expense.
        </div>
        <Button onClick={() => window.location.reload()} variant="outline" className="mr-2">
          Reload Page
        </Button>
        <Button onClick={() => onClose(false)} variant="outline">
          Cancel
        </Button>
      </div>
    );
  }

  // --- Render Component ---
  return (
    <Form {...form}>
      <form
        ref={formRef}
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col h-full bg-background" // Using theme background color
      >
        {/* Header div removed */}
        {/* Title moved before scrollable area */}
        <h2 className="text-xl font-semibold text-center px-4 text-foreground">{expense ? "Edit Expense" : "Add Expense"}</h2> {/* Added text-foreground */}

        {/* Scrollable Content Area */}
        <div ref={scrollContainerRef} className="flex-grow overflow-y-auto p-4 space-y-6">

          {/* Amount and Date in 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Amount */}
            <div>
              <FormLabel className="text-sm font-medium text-foreground">Amount</FormLabel>
              <div className="border rounded-md overflow-hidden mt-1.5">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem className="m-0 p-0">
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
                            className="border-0 shadow-none pl-7 h-[40px] text-base w-full text-black placeholder-black"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs text-black" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Date */}
            <div>
              <FormLabel className="text-sm font-medium text-foreground">Date</FormLabel>
              <div className="border rounded-md overflow-hidden mt-1.5">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="m-0 p-0">
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          className="border-0 shadow-none h-[40px] text-base w-full"
                          id={field.name}
                          name={field.name}
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-destructive" />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Category */}
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">Category</FormLabel>
                <FormControl>
                  {/* Using ToggleGroup for single selection visually similar to buttons */}
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    value={field.value}
                    onValueChange={field.onChange}
                    className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-1" // Increased gap from 2 to 3
                  >
                    {sortedCategories && sortedCategories.length > 0 ? sortedCategories.map((category) => {
                      // Use the icon field from the category data, fallback to placeholder
                      const IconComponent = category.icon && CATEGORY_ICONS[category.icon as CategoryIconName]
                        ? CATEGORY_ICONS[category.icon as CategoryIconName]
                        : ({ className }: { className?: string }) => <span className={cn("text-xl", className)}>❓</span>; // Placeholder if icon missing or invalid
                      return (
                        <ToggleGroupItem
                          key={category.id}
                          value={category.id}
                          aria-label={category.name}
                          className={cn(
                            "flex flex-col items-center justify-center h-20 rounded-lg border border-gray-200 dark:border-gray-700",
                            // Selected state: black bg, white text
                            "data-[state=on]:bg-black data-[state=on]:text-white font-semibold",
                            // Hover state: black bg, white text
                            "hover:bg-black hover:text-white"
                          )}
                        >
                          <IconComponent className="w-6 h-6 mb-1" />
                          <span className="text-xs font-medium">{category.name}</span>
                        </ToggleGroupItem>
                      );
                    }) : (
                      <div className="col-span-3 sm:col-span-5 text-center text-gray-500 py-4">No categories available</div>
                    )}
                  </ToggleGroup>
                </FormControl>
                <FormMessage className="text-xs text-red-600" />
              </FormItem>
            )}
          />

          {/* Location */}
          <FormField
            control={form.control}
            name="locationId" // Use locationId
            render={({ field }) => (
              <FormItem className="flex flex-col"> {/* Ensure proper layout for Combobox */}
                 <FormLabel className="text-sm font-medium text-foreground">Location</FormLabel>
                 <FormControl>
                   <Combobox
                     items={locationItems}
                     onCreateNew={handleCreateLocation} // Connect create handler
                     placeholder="Select or add location"
                     createNewLabel="Add new location..." // Updated label
                     emptyMessage="No location found."
                     className="h-12 text-base"
                     disabled={isCreatingLocation} // Disable while creating
                     {...field} // Spread field props (value, onChange, etc.)
                     inputClassName="text-black placeholder-black"
                   />
                 </FormControl>
                 <FormMessage className="text-xs text-black" />
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
                        "flex flex-col items-start justify-center h-auto p-3 rounded-lg border border-gray-200 dark:border-gray-700",
                        "data-[state=on]:bg-black data-[state=on]:text-white font-semibold",
                        "hover:bg-black hover:text-white text-left"
                      )}
                    >
                      <span className="font-semibold">Equal</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 data-[state=on]:text-blue-600 dark:data-[state=on]:text-blue-400">Split equally among all</span>
                    </ToggleGroupItem>
                    <ToggleGroupItem
                       value="Owned"
                       aria-label="Owned by other user"
                       className={cn(
                         "flex flex-col items-start justify-center h-auto p-3 rounded-lg border border-gray-200 dark:border-gray-700",
                         "data-[state=on]:bg-black data-[state=on]:text-white font-semibold",
                         "hover:bg-black hover:text-white text-left"
                       )}
                    >
                       <span className="font-semibold">Percent</span>
                       <span className="text-xs text-gray-500 dark:text-gray-400 data-[state=on]:text-blue-600 dark:data-[state=on]:text-blue-400">100% owed by the other user</span>
                    </ToggleGroupItem>
                  </ToggleGroup>
                </FormControl>
                <FormMessage className="text-xs text-black" />
              </FormItem>
            )}
          />

          {/* Description (Optional) */}
          <div className="w-full">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">
                  Description <span className="text-gray-500 text-xs font-normal">(Optional)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter description (optional)"
                    className="h-12 text-base w-full text-black placeholder-black"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs text-black" />
              </FormItem>
            )}
          />
          </div>

        </div> {/* End Scrollable Content Area */}

        {/* Sticky Buttons Container */}
        <div className="flex justify-between gap-3 p-4 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-background">
          <Button
            type="button"
            variant="outline" // Style based on image
            onClick={() => onClose(false)}
            disabled={isSubmitting}
            className="flex-1 h-12 text-base border-gray-200 dark:border-gray-700 text-foreground" // Updated for dark mode
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 h-12 text-base bg-primary hover:bg-primary/90 text-primary-foreground" // Use primary color from theme
          >
            {isSubmitting ? "Saving..." : "Save Expense"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
