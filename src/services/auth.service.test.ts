import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auth, googleProvider } from '@/lib/firebase';
import { 
  User as FirebaseUser, 
  Auth,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { User, UUID, ISODateString } from '@shared/types';
import {
  signInWithGoogle,
  logout,
  getCurrentUser,
  convertFirebaseUserToAppUser,
  onAuthStateChange
} from './auth.service';

vi.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: null,
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn()
  } as unknown as Auth,
  googleProvider: { id: 'google.com' }
}));

vi.mock('firebase/auth', () => ({
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn()
}));

describe('Auth Service', () => {
  const mockUUID = 'firebase-user-123' as UUID;
  const mockDate = new Date().toISOString() as ISODateString;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('convertFirebaseUserToAppUser', () => {
    it('should convert Firebase user to app user format', () => {
      const mockFirebaseUser = {
        uid: mockUUID,
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
        isAnonymous: false,
        creationTime: mockDate,
        lastSignInTime: mockDate,
        providerData: []
      } as unknown as FirebaseUser;

      const expectedAppUser: User = {
        id: mockUUID,
        uid: mockUUID,
        email: 'test@example.com',
        username: 'test',
        photoURL: 'https://example.com/photo.jpg',
        createdAt: mockDate,
        updatedAt: mockDate,
        isAnonymous: false
      };

      const result = convertFirebaseUserToAppUser(mockFirebaseUser);
      expect(result).toEqual(expectedAppUser);
    });

    it('should handle missing optional fields', () => {
      const mockFirebaseUser = {
        uid: mockUUID,
        email: 'test@example.com',
        displayName: null,
        photoURL: null,
        isAnonymous: false,
        creationTime: null,
        lastSignInTime: null,
        providerData: []
      } as unknown as FirebaseUser;

      const expectedAppUser: User = {
        id: mockUUID,
        uid: mockUUID,
        email: 'test@example.com',
        username: 'test',
        photoURL: null,
        createdAt: mockDate,
        updatedAt: mockDate,
        isAnonymous: false
      };

      const result = convertFirebaseUserToAppUser(mockFirebaseUser);
      expect(result).toEqual(expectedAppUser);
    });
  });

  describe('signInWithGoogle', () => {
    it('should call signInWithPopup with the correct arguments', async () => {
      (signInWithPopup as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ user: {} });
      await signInWithGoogle();
      expect(signInWithPopup).toHaveBeenCalledWith(auth, googleProvider);
    });
  });

  describe('logout', () => {
    it('should call signOut with the auth instance', async () => {
      (signOut as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);
      await logout();
      expect(signOut).toHaveBeenCalledWith(auth);
    });
  });

  describe('onAuthStateChange', () => {
    it('should call onAuthStateChanged with auth and a callback', () => {
      const mockCallback = vi.fn();
      (onAuthStateChanged as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(
        (_auth: Auth, callback: (_user: FirebaseUser | null) => void) => {
          callback(null);
          return vi.fn();
        }
      );

      const unsubscribe = onAuthStateChange(mockCallback);
      expect(onAuthStateChanged).toHaveBeenCalledWith(auth, expect.any(Function));
      expect(mockCallback).toHaveBeenCalledWith(null);
      expect(unsubscribe).toBeTypeOf('function');
    });

    it('should convert Firebase user to app user and pass to callback', () => {
      const mockCallback = vi.fn();
      const mockFirebaseUser = {
        uid: mockUUID,
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
        isAnonymous: false,
        creationTime: mockDate,
        lastSignInTime: mockDate,
        providerData: []
      } as unknown as FirebaseUser;

      (onAuthStateChanged as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(
        (_auth: Auth, callback: (_user: FirebaseUser | null) => void) => {
          callback(mockFirebaseUser);
          return vi.fn();
        }
      );

      onAuthStateChange(mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({
        id: mockUUID,
        email: 'test@example.com',
        username: 'test',
        photoURL: 'https://example.com/photo.jpg'
      }));
    });
  });

  describe('getCurrentUser', () => {
    it('should return null when no user is authenticated', () => {
      const result = getCurrentUser();
      expect(result).toBeNull();
    });

    it('should return the converted user when authenticated', () => {
      const mockFirebaseUser = {
        uid: mockUUID,
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
        isAnonymous: false,
        creationTime: mockDate,
        lastSignInTime: mockDate,
        providerData: []
      } as unknown as FirebaseUser;

      vi.spyOn(auth, 'currentUser', 'get').mockReturnValue(mockFirebaseUser);

      const result = getCurrentUser();
      expect(result).toEqual(expect.objectContaining({
        id: mockUUID,
        email: 'test@example.com',
        username: 'test',
        photoURL: 'https://example.com/photo.jpg'
      }));
    });
  });
}); 