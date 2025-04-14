import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, DocumentReference } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

// Define the structure for the item being edited (must have an id)
interface EditableItem {
  id: string;
  // Using 'any' here for flexibility as the hook is generic.
  // Consider creating more specific hooks if stricter typing is needed.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

// Define the options for the hook
// Removed unused TFormData generic from options
interface UseFirestoreFormSubmitOptions {
  collectionName: string;
  item?: EditableItem | null; // The item being edited (if any)
  // Optional: Add specific query keys to invalidate on success
  invalidateQueryKeys?: (string | number)[][];
  // Optional: Custom success/error messages or callbacks
  onSuccess?: (docRef?: DocumentReference) => void;
  // Changed 'any' to 'unknown' for error type
  onError?: (error: unknown) => void;
  successAddTitle?: string;
  successUpdateTitle?: string;
  successAddDescription?: string;
  successUpdateDescription?: string;
  errorTitle?: string;
  errorDescription?: string;
}

// Define the return type of the hook
// Removed unused TFormData generic from result
interface UseFirestoreFormSubmitResult {
  handleSubmit: (data: object) => Promise<void>; // Use object for data type
  isSubmitting: boolean;
}

// Capitalize first letter helper
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Removed unused TFormData generic from hook function
export function useFirestoreFormSubmit(
  options: UseFirestoreFormSubmitOptions
): UseFirestoreFormSubmitResult {
  const {
    collectionName,
    item,
    invalidateQueryKeys = [],
    onSuccess,
    onError,
    // Generate default messages based on collectionName
    successAddTitle = `${capitalize(collectionName.slice(0, -1))} added`,
    successUpdateTitle = `${capitalize(collectionName.slice(0, -1))} updated`,
    successAddDescription = `The ${collectionName.slice(0, -1)} has been added successfully.`,
    successUpdateDescription = `The ${collectionName.slice(0, -1)} has been updated successfully.`,
    errorTitle = `Error saving ${collectionName.slice(0, -1)}`,
    errorDescription = "Failed to save. Please try again.",
  } = options;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Use 'object' for data type
  const handleSubmit = async (data: object) => {
    setIsSubmitting(true);
    try {
      let docRef: DocumentReference | undefined = undefined;
      const dataToSave = { ...data }; // Copy data to avoid modifying original

      if (item?.id) {
        // Update existing item
        const itemRef = doc(db, collectionName, item.id);
        await updateDoc(itemRef, dataToSave);
        toast({ title: successUpdateTitle, description: successUpdateDescription });
        docRef = itemRef; // Store ref for callback
      } else {
        // Add new item
        // Note: We are not adding 'createdAt' here to keep the hook generic.
        // Add it in the component's onSubmit data preparation if needed.
        docRef = await addDoc(collection(db, collectionName), dataToSave);
        toast({ title: successAddTitle, description: successAddDescription });
      }

      // Invalidate specified queries
      invalidateQueryKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
      });

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(docRef);
      }

    } catch (error: unknown) { // Changed 'any' to 'unknown'
      console.error(`Error saving ${collectionName.slice(0, -1)}:`, error);
      // Type check before accessing properties
      const errorMessage = error instanceof Error ? error.message : errorDescription;
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
      // Call error callback if provided
      if (onError) {
        onError(error); // Pass the original unknown error
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return { handleSubmit, isSubmitting };
}
