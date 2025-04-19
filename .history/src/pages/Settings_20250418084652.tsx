import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Pencil, Trash, Plus } from "lucide-react";
import { Category, Location } from "@shared/types";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import CategoryForm from "@/components/CategoryForm";
import LocationForm from "@/components/LocationForm";
import { getCategoryBackgroundColorClass } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { CATEGORY_ICONS } from "@/lib/constants";
import type { CategoryIconName } from "@shared/types";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("categories");
  const [isCategoryFormOpen, setCategoryFormOpen] = useState(false);
  const [isLocationFormOpen, setLocationFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(undefined);
  const [selectedLocation, setSelectedLocation] = useState<Location | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'category' | 'location'; id: string } | null>(null);
  const { toast } = useToast();

  // State for Firestore data
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [locationsLoading, setLocationsLoading] = useState(true);

  // Fetch Categories from Firestore
  useEffect(() => {
    setCategoriesLoading(true);
    const catCol = collection(db, "categories");
    const q = query(catCol, orderBy("name"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedCategories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(fetchedCategories);
      setCategoriesLoading(false);
    }, (error) => {
      console.error("Error fetching categories:", error);
      toast({ title: "Error", description: "Could not load categories.", variant: "destructive" });
      setCategoriesLoading(false);
    });
    return () => unsubscribe();
  }, [toast]);

  // Fetch Locations from Firestore
  useEffect(() => {
    setLocationsLoading(true);
    const locCol = collection(db, "locations");
    const q = query(locCol, orderBy("name"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLocations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
      setLocations(fetchedLocations);
      setLocationsLoading(false);
    }, (error) => {
      console.error("Error fetching locations:", error);
      toast({ title: "Error", description: "Could not load locations.", variant: "destructive" });
      setLocationsLoading(false);
    });
    return () => unsubscribe();
  }, [toast]);


  const openDeleteDialog = (type: 'category' | 'location', id: string) => {
    setItemToDelete({ type, id });
    setDeleteDialogOpen(true);
  };

  // Updated handleDelete using Firestore
  const handleDelete = async () => {
    if (!itemToDelete) return;

    const { type, id } = itemToDelete;
    const collectionName = type === 'category' ? 'categories' : 'locations'; // Correct pluralization
    const itemRef = doc(db, collectionName, id);

    try {
      await deleteDoc(itemRef);
      toast({
        title: "Success",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully.`,
      });
      // No need to invalidate queries, listener handles updates
    } catch (error: unknown) { // Changed 'any' to 'unknown'
      console.error(`Error deleting ${type}:`, error);
      // Type check before accessing properties
      const errorMessage = error instanceof Error ? error.message : `Failed to delete ${type}. It might be in use or there was a server error.`;
      // Check for specific Firestore error codes if needed, e.g., if deletion fails due to rules
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
        setDeleteDialogOpen(false);
        setItemToDelete(null);
    }
  };

  const handleCategorySuccess = () => {
    // Handle successful category addition
    setCategoryFormOpen(false);
    setSelectedCategory(undefined);
  };

  return (
    <div className="container py-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Categories</CardTitle>
                <CardDescription>Manage expense categories</CardDescription>
              </div>
              <Button onClick={() => { setSelectedCategory(undefined); setCategoryFormOpen(true); }}> {/* Reset selected on add */}
                <Plus className="h-4 w-4 mr-2" /> Add Category
              </Button>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <div className="space-y-2"> <Skeleton className="h-12" /> <Skeleton className="h-12" /> <Skeleton className="h-12" /> </div>
              ) : categories.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {categories.map((category) => {
                    // Get the icon component, default to a placeholder if not found
                    const IconComponent = category.icon ? CATEGORY_ICONS[category.icon as CategoryIconName] || (() => <span className="text-xs">?</span>) : (() => <span className="text-xs">?</span>);
                    return (
                      <Card key={category.id} className="border-gray-200 dark:border-gray-700">
                        <CardContent className="flex items-center justify-between p-3 sm:p-4">
                          <div className="flex items-center space-x-3 sm:space-x-4">
                            {/* Color Swatch */}
                            <div className={`h-5 w-5 rounded-full border ${getCategoryBackgroundColorClass(category.name)}`}></div>
                            {/* Icon */}
                            <IconComponent className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            <span>{category.name}</span>
                        </div>
                        <div className="flex space-x-1 sm:space-x-2"> {/* Adjusted Spacing */}
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedCategory(category); setCategoryFormOpen(true); }} className="h-8 w-8 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary">
                            <Pencil className="h-4 w-4" /> <span className="sr-only">Edit</span>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openDeleteDialog('category', category.id)} className="h-8 w-8 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400">
                            <Trash className="h-4 w-4" /> <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ); // Close the return statement
                  })} {/* Add closing brace for the map block */}
                </div>
              ) : (
                <div className="p-4 text-center"><p className="text-gray-600 dark:text-gray-400">No categories found.</p></div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations">
          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Locations</CardTitle>
                <CardDescription>Manage expense locations</CardDescription>
              </div>
              <Button onClick={() => { setSelectedLocation(undefined); setLocationFormOpen(true); }}> {/* Reset selected on add */}
                <Plus className="h-4 w-4 mr-2" /> Add Location
              </Button>
            </CardHeader>
            {/* Removed overflow-y-auto and max-h for better mobile scrolling */}
            <CardContent>
              {locationsLoading ? (
                 <div className="space-y-2"> <Skeleton className="h-12" /> <Skeleton className="h-12" /> <Skeleton className="h-12" /> </div>
              ) : locations.length > 0 ? (
                 <div className="space-y-4"> {/* Reverted to vertical stack */}
                  {locations.map((location) => (
                    <Card key={location.id} className="border-gray-200 dark:border-gray-700">
                      <CardContent className="flex items-center justify-between p-3 sm:p-4"> {/* Adjusted Padding */}
                        <span>{location.name}</span>
                        <div className="flex space-x-1 sm:space-x-2"> {/* Adjusted Spacing */}
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedLocation(location); setLocationFormOpen(true); }} className="h-8 w-8 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary">
                            <Pencil className="h-4 w-4" /> <span className="sr-only">Edit</span>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openDeleteDialog('location', location.id)} className="h-8 w-8 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400">
                            <Trash className="h-4 w-4" /> <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                 <div className="p-4 text-center"><p className="text-gray-600 dark:text-gray-400">No locations found.</p></div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Category Form */}
      <CategoryForm
        category={selectedCategory}
        onSuccess={handleCategorySuccess}
        onCancel={() => setCategoryFormOpen(false)}
      />

      {/* Location Form */}
      <LocationForm
        open={isLocationFormOpen}
        onOpenChange={(open) => {
          setLocationFormOpen(open);
          if (!open) setSelectedLocation(undefined);
        }}
        location={selectedLocation}
        description="Locations help track where expenses occur."
      />

      {/* Delete Confirmation Dialog using AlertDialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this {itemToDelete?.type}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
