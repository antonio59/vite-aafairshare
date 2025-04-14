/**
 * ResourceContext
 * 
 * This context provides access to application resources such as categories and locations.
 * It separates these concerns from the AuthContext to improve code organization.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Category, Location } from '@/types/expense';
import { getCategories, getLocations } from '@/services/resources.service';
import { useAuth } from './AuthContext';

interface ResourceContextType {
  categories: Category[];
  locations: Location[];
  categoriesLoading: boolean;
  locationsLoading: boolean;
  refreshResources: () => Promise<void>;
}

const ResourceContext = createContext<ResourceContextType | undefined>(undefined);

export function useResources(): ResourceContextType {
  const context = useContext(ResourceContext);
  if (!context) {
    throw new Error('useResources must be used within a ResourceProvider');
  }
  return context;
}

export function ResourceProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [locationsLoading, setLocationsLoading] = useState(true);
  
  const { currentUser } = useAuth();
  
  // Function to load resources
  const loadResources = async () => {
    if (!currentUser) {
      // Reset states if no user is authenticated
      setCategories([]);
      setLocations([]);
      setCategoriesLoading(false);
      setLocationsLoading(false);
      return;
    }
    
    // Load categories
    setCategoriesLoading(true);
    try {
      const fetchedCategories = await getCategories();
      console.log(`[ResourceContext] Loaded ${fetchedCategories.length} categories`);
      setCategories(fetchedCategories);
    } catch (error) {
      console.error('[ResourceContext] Error loading categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
    
    // Load locations
    setLocationsLoading(true);
    try {
      const fetchedLocations = await getLocations();
      console.log(`[ResourceContext] Loaded ${fetchedLocations.length} locations`);
      setLocations(fetchedLocations);
    } catch (error) {
      console.error('[ResourceContext] Error loading locations:', error);
    } finally {
      setLocationsLoading(false);
    }
  };
  
  // Initial load when user changes
  useEffect(() => {
    loadResources();
  }, [currentUser]);
  
  // Refresh function for manual reload
  const refreshResources = async () => {
    await loadResources();
  };
  
  const value: ResourceContextType = {
    categories,
    locations,
    categoriesLoading,
    locationsLoading,
    refreshResources
  };
  
  return (
    <ResourceContext.Provider value={value}>
      {children}
    </ResourceContext.Provider>
  );
} 