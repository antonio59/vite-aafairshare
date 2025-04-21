/* global console */
// Firestore utility functions for AAFairShare
import { collection, query, orderBy, getDocs, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Fetch all categories from Firestore
 * @returns {Promise<Array>} - A promise that resolves to an array of category objects
 */
export async function fetchCategories() {
  try {
    const categoriesQuery = query(collection(db, 'categories'), orderBy('name'));
    const categoriesSnapshot = await getDocs(categoriesQuery);
    return categoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

/**
 * Fetch all locations from Firestore
 * @returns {Promise<Array>} - A promise that resolves to an array of location objects
 */
export async function fetchLocations() {
  try {
    const locationsQuery = query(collection(db, 'locations'), orderBy('name'));
    const locationsSnapshot = await getDocs(locationsQuery);
    return locationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching locations:', error);
    throw error;
  }
}

/**
 * Add a new category to Firestore
 * @param {Object} categoryData - The category data to add
 * @returns {Promise<Object>} - A promise that resolves to the added category object
 */
export async function addCategory(categoryData) {
  try {
    const docRef = await addDoc(collection(db, 'categories'), categoryData);
    return {
      id: docRef.id,
      ...categoryData
    };
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
}

/**
 * Update an existing category in Firestore
 * @param {string} categoryId - The ID of the category to update
 * @param {Object} categoryData - The updated category data
 * @returns {Promise<Object>} - A promise that resolves to the updated category object
 */
export async function updateCategory(categoryId, categoryData) {
  try {
    const categoryRef = doc(db, 'categories', categoryId);
    await updateDoc(categoryRef, categoryData);
    return {
      id: categoryId,
      ...categoryData
    };
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
}

/**
 * Delete a category from Firestore
 * @param {string} categoryId - The ID of the category to delete
 * @returns {Promise<void>} - A promise that resolves when the category is deleted
 */
export async function deleteCategory(categoryId) {
  try {
    const categoryRef = doc(db, 'categories', categoryId);
    await deleteDoc(categoryRef);
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
}

/**
 * Add a new location to Firestore
 * @param {Object} locationData - The location data to add
 * @returns {Promise<Object>} - A promise that resolves to the added location object
 */
export async function addLocation(locationData) {
  try {
    const docRef = await addDoc(collection(db, 'locations'), locationData);
    return {
      id: docRef.id,
      ...locationData
    };
  } catch (error) {
    console.error('Error adding location:', error);
    throw error;
  }
}

/**
 * Update an existing location in Firestore
 * @param {string} locationId - The ID of the location to update
 * @param {Object} locationData - The updated location data
 * @returns {Promise<Object>} - A promise that resolves to the updated location object
 */
export async function updateLocation(locationId, locationData) {
  try {
    const locationRef = doc(db, 'locations', locationId);
    await updateDoc(locationRef, locationData);
    return {
      id: locationId,
      ...locationData
    };
  } catch (error) {
    console.error('Error updating location:', error);
    throw error;
  }
}

/**
 * Delete a location from Firestore
 * @param {string} locationId - The ID of the location to delete
 * @returns {Promise<void>} - A promise that resolves when the location is deleted
 */
export async function deleteLocation(locationId) {
  try {
    const locationRef = doc(db, 'locations', locationId);
    await deleteDoc(locationRef);
  } catch (error) {
    console.error('Error deleting location:', error);
    throw error;
  }
}