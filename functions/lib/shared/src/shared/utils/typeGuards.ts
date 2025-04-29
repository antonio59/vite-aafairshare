import { User, UUID, ISODateString } from "../types";

export function toUUID(id: string): UUID {
  // Optionally validate UUID format here
  return id as UUID;
}

/**
 * Converts a Date, Firestore Timestamp, string, or undefined/null to an ISODateString.
 * If input is undefined or null, defaults to new Date().
 */
export function toISODateString(date: Date | string | { toDate?: () => Date } | undefined | null): ISODateString {
  if (!date) {
    // Optionally log a warning here
    return new Date().toISOString() as ISODateString;
  }
  if (typeof date === "string") return date as ISODateString;
  if (date instanceof Date) return date.toISOString() as ISODateString;
  if (typeof date === "object" && typeof date.toDate === "function") return date.toDate().toISOString() as ISODateString;
  throw new Error("Invalid date type for toISODateString");
}

export function toUser(data: unknown): User | null {
  if (
    typeof data === "object" &&
    data !== null &&
    typeof (data as { id?: unknown }).id === "string" &&
    typeof (data as { uid?: unknown }).uid === "string" &&
    typeof (data as { email?: unknown }).email === "string" &&
    typeof (data as { username?: unknown }).username === "string" &&
    (typeof (data as { photoURL?: unknown }).photoURL === "string" || (data as { photoURL?: unknown }).photoURL === null) &&
    typeof (data as { createdAt?: unknown }).createdAt === "string" &&
    typeof (data as { updatedAt?: unknown }).updatedAt === "string" &&
    typeof (data as { isAnonymous?: unknown }).isAnonymous === "boolean"
  ) {
    return {
      ...(data as object),
      id: toUUID((data as { id: string }).id),
      createdAt: toISODateString((data as { createdAt: string }).createdAt),
      updatedAt: toISODateString((data as { updatedAt: string }).updatedAt),
    } as User;
  }
  return null;
}

// TODO: Add similar guards for Expense, Settlement, etc.
export {} 