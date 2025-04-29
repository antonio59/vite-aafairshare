import { User, UUID, ISODateString } from "../types";
export declare function toUUID(id: string): UUID;
/**
 * Converts a Date, Firestore Timestamp, string, or undefined/null to an ISODateString.
 * If input is undefined or null, defaults to new Date().
 */
export declare function toISODateString(date: Date | string | {
    toDate?: () => Date;
} | undefined | null): ISODateString;
export declare function toUser(data: unknown): User | null;
export {};
