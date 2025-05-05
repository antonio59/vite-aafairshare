import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Pencil, Trash, Plus } from "lucide-react";
import { Category, Location } from "@shared/types";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import CategoryForm from "@/components/settings/CategoryForm";
import LocationForm from "@/components/settings/LocationForm";
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
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, addDoc } from "firebase/firestore";
import { CATEGORY_ICONS } from "@/lib/constants";
import type { CategoryIconName } from "@shared/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

export default function Settings() {
  const [editingLocation, setEditingLocation] = useState<Location | undefined>(undefined);
  const [activeTab, setActiveTab] = useState("categories");
  const [isLocationFormOpen, setLocationFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(undefined);
  
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
    setEditingLocation(undefined); // reset editing on delete

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
    setSelectedCategory(undefined);
  };

  const [isCategoryFormOpen, setCategoryFormOpen] = useState(false);

  return (
    <div className="container py-4 px-2 sm:py-6 sm:px-0">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex flex-col sm:flex-row gap-2 sm:gap-0 mb-4">
          <TabsTrigger value="categories" className="flex-1">Categories</TabsTrigger>
          <TabsTrigger value="locations" className="flex-1">Locations</TabsTrigger>
        </TabsList>
        <TabsContent value="categories">
          <Card className="border-gray-200 ">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <div>
                <CardTitle>Categories</CardTitle>
                <CardDescription>Manage expense categories</CardDescription>
              </div>
              <Button onClick={() => { setSelectedCategory(undefined); setCategoryFormOpen(true); }} className="w-full sm:w-auto mt-2 sm:mt-0">
                <Plus className="h-4 w-4 mr-2" /> Add Category
              </Button>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <div className="space-y-2"> <Skeleton className="h-12" /> <Skeleton className="h-12" /> <Skeleton className="h-12" /> </div>
              ) : categories.length > 0 ? (
                <div className="grid gap-2 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {categories.map((category: Category) => {
                    const IconComponent = category.icon ? CATEGORY_ICONS[category.icon as CategoryIconName] || (() => <span className="text-xs">?</span>) : (() => <span className="text-xs">?</span>);
                    return (
                      <Card key={category.id} className="border-gray-200 ">
                        <CardContent className="flex items-center justify-between p-2 sm:p-4">
                          <div className="flex items-center space-x-2 sm:space-x-4">
                            <div className={`h-5 w-5 rounded-full border ${getCategoryBackgroundColorClass(category.name)}`}></div>
                            <IconComponent className="h-5 w-5 text-gray-600 " />
                            <span>{category.name}</span>
                          </div>
                          <div className="flex space-x-1 sm:space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => { setSelectedCategory(category); setCategoryFormOpen(true); }} className="h-8 w-8 text-gray-500 hover:text-primary ">
                              <Pencil className="h-4 w-4" /> <span className="sr-only">Edit</span>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openDeleteDialog('category', category.id)} className="h-8 w-8 text-gray-500 hover:text-red-500 ">
                              <Trash className="h-4 w-4" /> <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-center"><p className="text-gray-600 ">No categories found.</p></div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="locations">
          <Card className="border-gray-200 ">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <div>
                <CardTitle>Locations</CardTitle>
                <CardDescription>Manage expense locations</CardDescription>
              </div>
              <Button onClick={() => { setEditingLocation(undefined); setLocationFormOpen(true); }} className="w-full sm:w-auto mt-2 sm:mt-0">
                <Plus className="h-4 w-4 mr-2" /> Add Location
              </Button>
            </CardHeader>
            <CardContent>
              {locationsLoading ? (
                <div className="space-y-2"> <Skeleton className="h-12" /> <Skeleton className="h-12" /> <Skeleton className="h-12" /> </div>
              ) : locations.length > 0 ? (
                <div className="space-y-2 sm:space-y-4">
                  {locations.map((location: Location) => (
                    <Card key={location.id} className="border-gray-200 ">
                      <CardContent className="flex items-center justify-between p-2 sm:p-4">
                        <span>{location.name}</span>
                        <div className="flex space-x-1 sm:space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => { setEditingLocation(location); setLocationFormOpen(true); }} className="h-8 w-8 text-gray-500 hover:text-primary ">
                            <Pencil className="h-4 w-4" /> <span className="sr-only">Edit</span>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openDeleteDialog('location', location.id)} className="h-8 w-8 text-gray-500 hover:text-red-500 ">
                            <Trash className="h-4 w-4" /> <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center"><p className="text-gray-600 ">No locations found.</p></div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Category Form Modal */}
      <Dialog open={isCategoryFormOpen} onOpenChange={setCategoryFormOpen}>
        <DialogContent
          className="max-w-md w-full p-0"
          aria-labelledby="category-dialog-title"
          aria-describedby="category-dialog-description"
        >
          <DialogHeader>
            <DialogTitle id="category-dialog-title">
              <VisuallyHidden>{selectedCategory ? "Edit Category" : "Add Category"}</VisuallyHidden>
            </DialogTitle>
            <DialogDescription id="category-dialog-description">
              <VisuallyHidden>
                {selectedCategory
                  ? "Edit the details of the selected category."
                  : "Fill in the details to add a new category."}
              </VisuallyHidden>
            </DialogDescription>
          </DialogHeader>
          <CategoryForm
            _category={selectedCategory}
            onSuccess={handleCategorySuccess}
            onCancel={() => setCategoryFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Location Form Modal */}
      <Dialog open={isLocationFormOpen} onOpenChange={setLocationFormOpen}>
        <DialogContent
          className="max-w-md w-full p-0"
          aria-labelledby="location-dialog-title"
          aria-describedby="location-dialog-description"
        >
          <DialogHeader>
            <DialogTitle id="location-dialog-title">
              <VisuallyHidden>{editingLocation ? "Edit Location" : "Add Location"}</VisuallyHidden>
            </DialogTitle>
            <DialogDescription id="location-dialog-description">
              <VisuallyHidden>
                {editingLocation
                  ? "Edit the details of the selected location."
                  : "Fill in the details to add a new location."}
              </VisuallyHidden>
            </DialogDescription>
          </DialogHeader>
          <LocationForm
            _location={editingLocation}
            onSuccess={async (locationData) => {
              if (editingLocation) {
                // Update existing location in Firestore
                const locationRef = doc(db, 'locations', locationData.id);
                await updateDoc(locationRef, { name: locationData.name });
                setEditingLocation(undefined);
              } else {
                // Add new location to Firestore
                await addDoc(collection(db, 'locations'), { name: locationData.name });
              }
              setLocationFormOpen(false);
            }}
            onCancel={() => {
              setLocationFormOpen(false);
              setEditingLocation(undefined);
            }}
          />
        </DialogContent>
      </Dialog>

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
