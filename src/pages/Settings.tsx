import { useState } from "react";
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
import { CATEGORY_ICONS } from "@/lib/constants";
import type { CategoryIconName } from "@shared/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SupabaseService } from '@/services/supabase.service';
import type { Tables } from '@/services/supabase.service';

export default function Settings() {
  const [editingLocation, setEditingLocation] = useState<Location | undefined>(undefined);
  const [activeTab, setActiveTab] = useState("categories");
  const [isLocationFormOpen, setLocationFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'category' | 'location'; id: string } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCategoryFormOpen, setCategoryFormOpen] = useState(false);

  // Fetch Categories from Supabase
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const cats = await SupabaseService.get('categories', { order: { column: 'name', ascending: true } });
      if (!Array.isArray(cats) || cats.length === 0) return [];
      if (typeof cats[0] === 'object' && 'error' in cats[0]) return [];
      return (cats as unknown as Tables['categories']['Row'][]).map(cat => ({
        id: cat.id,
        name: cat.name,
        color: cat.color ?? '#000000',
        icon: cat.icon ?? 'default',
        createdAt: ''
      }));
    }
  });

  // Fetch Locations from Supabase
  const { data: locations = [], isLoading: locationsLoading } = useQuery<Location[]>({
    queryKey: ['locations'],
    queryFn: async () => {
      const locs = await SupabaseService.get('locations', { order: { column: 'name', ascending: true } });
      if (!Array.isArray(locs) || locs.length === 0) return [];
      if (typeof locs[0] === 'object' && 'error' in locs[0]) return [];
      return (locs as unknown as Tables['locations']['Row'][]).map(loc => ({
        id: loc.id,
        name: loc.name
      }));
    }
  });

  const openDeleteDialog = (type: 'category' | 'location', id: string) => {
    setEditingLocation(undefined); // reset editing on delete
    setItemToDelete({ type, id });
    setDeleteDialogOpen(true);
  };

  // Delete handler using Supabase
  const handleDelete = async () => {
    if (!itemToDelete) return;
    const { type, id } = itemToDelete;
    try {
      await SupabaseService.delete(type === 'category' ? 'categories' : 'locations', id);
      toast({
        title: "Success",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully.`,
      });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: [type === 'category' ? 'categories' : 'locations'] });
    } catch (error: unknown) {
      console.error(`Error deleting ${type}:`, error);
      const errorMessage = error instanceof Error ? error.message : `Failed to delete ${type}. It might be in use or there was a server error.`;
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleCategorySuccess = () => {
    setSelectedCategory(undefined);
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  };

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

      {/* Category Form Dialog */}
      <Dialog open={isCategoryFormOpen} onOpenChange={setCategoryFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedCategory ? "Edit Category" : "Add Category"}</DialogTitle>
            <DialogDescription>
              {selectedCategory ? "Update the category details below." : "Enter the details for the new category."}
            </DialogDescription>
          </DialogHeader>
          <CategoryForm
            _category={selectedCategory}
            onSuccess={handleCategorySuccess}
            onCancel={() => setCategoryFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Location Form Dialog */}
      <Dialog open={isLocationFormOpen} onOpenChange={setLocationFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingLocation ? "Edit Location" : "Add Location"}</DialogTitle>
            <DialogDescription>
              {editingLocation ? "Update the location details below." : "Enter the details for the new location."}
            </DialogDescription>
          </DialogHeader>
          <LocationForm
            _location={editingLocation}
            onSuccess={() => queryClient.invalidateQueries({ queryKey: ['locations'] })}
            onCancel={() => setLocationFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {itemToDelete?.type === 'category' ? 'Category' : 'Location'}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {itemToDelete?.type}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
