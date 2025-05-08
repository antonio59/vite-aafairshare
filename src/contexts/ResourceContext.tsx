/**
 * ResourceContext
 * 
 * This context provides access to application resources such as categories and locations.
 * It separates these concerns from the AuthContext to improve code organization.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Category, Location } from '@shared/types';
import { ResourcesService } from "@/services/resources.service";
import { useAuth } from './NewAuthContext';

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
  const loadResources = useCallback(async () => {
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
      const fetchedCategories = await ResourcesService.getCategories();
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
      const fetchedLocations = await ResourcesService.getLocations();
      console.log(`[ResourceContext] Loaded ${fetchedLocations.length} locations`);
      setLocations(fetchedLocations);
    } catch (error) {
      console.error('[ResourceContext] Error loading locations:', error);
    } finally {
      setLocationsLoading(false);
    }
  }, [currentUser]);
  
  // Initial load when user changes
  useEffect(() => {
    loadResources();
  }, [loadResources]);
  
  // Refresh function for manual reload
  const refreshResources = useCallback(async () => {
    await loadResources();
  }, [loadResources]);
  
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