/**
 * Resources Service
 * 
 * This service provides methods for managing resources like
 * categories and locations used in the expense tracking app.
 */

import { Category, Location } from '@/types/expense';
import { 
  getDocuments, 
  createDocument, 
  updateDocument, 
  deleteDocument,
  orderByConstraint
} from './firestore.service';

// Collection names
const CATEGORIES_COLLECTION = 'categories';
const LOCATIONS_COLLECTION = 'locations';

/**
 * Gets all categories, sorted by name
 * 
 * @returns A promise that resolves to an array of categories
 */
export const getCategories = async (): Promise<Category[]> => {
  return getDocuments<Category>(
    CATEGORIES_COLLECTION,
    [orderByConstraint('name')]
  );
};

/**
 * Creates a new category
 * 
 * @param category - The category to create (without id and createdAt)
 * @returns A promise that resolves when the category is created
 */
export const createCategory = async (
  category: Omit<Category, 'id' | 'createdAt'>
): Promise<string> => {
  const docRef = await createDocument(CATEGORIES_COLLECTION, category);
  return docRef.id;
};

/**
 * Updates an existing category
 * 
 * @param id - The ID of the category to update
 * @param category - The category data to update
 * @returns A promise that resolves when the category is updated
 */
export const updateCategory = async (
  id: string,
  category: Partial<Omit<Category, 'id' | 'createdAt'>>
): Promise<void> => {
  return updateDocument(CATEGORIES_COLLECTION, id, category);
};

/**
 * Deletes a category
 * 
 * @param id - The ID of the category to delete
 * @returns A promise that resolves when the category is deleted
 */
export const deleteCategory = async (id: string): Promise<void> => {
  return deleteDocument(CATEGORIES_COLLECTION, id);
};

/**
 * Gets all locations, sorted by name
 * 
 * @returns A promise that resolves to an array of locations
 */
export const getLocations = async (): Promise<Location[]> => {
  return getDocuments<Location>(
    LOCATIONS_COLLECTION,
    [orderByConstraint('name')]
  );
};

/**
 * Creates a new location
 * 
 * @param location - The location to create (without id and createdAt)
 * @returns A promise that resolves to the ID of the new location
 */
export const createLocation = async (
  location: Omit<Location, 'id' | 'createdAt'>
): Promise<string> => {
  const docRef = await createDocument(LOCATIONS_COLLECTION, location);
  return docRef.id;
};

/**
 * Updates an existing location
 * 
 * @param id - The ID of the location to update
 * @param location - The location data to update
 * @returns A promise that resolves when the location is updated
 */
export const updateLocation = async (
  id: string,
  location: Partial<Omit<Location, 'id' | 'createdAt'>>
): Promise<void> => {
  return updateDocument(LOCATIONS_COLLECTION, id, location);
};

/**
 * Deletes a location
 * 
 * @param id - The ID of the location to delete
 * @returns A promise that resolves when the location is deleted
 */
export const deleteLocation = async (id: string): Promise<void> => {
  return deleteDocument(LOCATIONS_COLLECTION, id);
}; 