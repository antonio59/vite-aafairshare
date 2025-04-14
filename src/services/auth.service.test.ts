import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  convertFirebaseUserToAppUser, 
  signInWithGoogle, 
  signOutUser, 
  onAuthStateChange, 
  getCurrentUser 
} from './auth.service';
import { auth, googleProvider } from '@/config/firebase';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  Auth,
  User as FirebaseUser
} from 'firebase/auth';

// Mock Firebase modules
vi.mock('firebase/auth', () => ({
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  GoogleAuthProvider: vi.fn()
}));

// Mock the auth object with a writable currentUser property
const mockAuth = {
  currentUser: null as FirebaseUser | null
};

vi.mock('@/config/firebase', () => ({
  auth: mockAuth,
  googleProvider: {}
}));

describe('Auth Service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Reset currentUser before each test
    mockAuth.currentUser = null;
  });

  describe('convertFirebaseUserToAppUser', () => {
    it('should correctly convert a Firebase user to an app user', () => {
      // Arrange
      const mockFirebaseUser = {
        uid: 'firebase-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg'
      } as FirebaseUser;

      // Act
      const result = convertFirebaseUserToAppUser(mockFirebaseUser);

      // Assert
      expect(result).toEqual({
        id: 'firebase-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg'
      });
    });

    it('should handle missing optional fields', () => {
      // Arrange
      const mockFirebaseUser = {
        uid: 'firebase-user-123',
        email: 'test@example.com',
        displayName: null,
        photoURL: null
      } as FirebaseUser;

      // Act
      const result = convertFirebaseUserToAppUser(mockFirebaseUser);

      // Assert
      expect(result).toEqual({
        id: 'firebase-user-123',
        email: 'test@example.com',
        displayName: null,
        photoURL: null
      });
    });
  });

  describe('signInWithGoogle', () => {
    it('should call signInWithPopup with the correct arguments', async () => {
      // Arrange
      (signInWithPopup as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ user: {} });

      // Act
      await signInWithGoogle();

      // Assert
      expect(signInWithPopup).toHaveBeenCalledWith(auth, googleProvider);
    });
  });

  describe('signOutUser', () => {
    it('should call signOut with the auth instance', async () => {
      // Arrange
      (signOut as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);

      // Act
      await signOutUser();

      // Assert
      expect(signOut).toHaveBeenCalledWith(auth);
    });
  });

  describe('onAuthStateChange', () => {
    it('should call onAuthStateChanged with auth and a callback', () => {
      // Arrange
      const mockCallback = vi.fn();
      (onAuthStateChanged as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(
        (_auth: Auth, callback: (user: FirebaseUser | null) => void) => {
          callback(null);
          return vi.fn(); // Return mock unsubscribe function
        }
      );

      // Act
      const unsubscribe = onAuthStateChange(mockCallback);

      // Assert
      expect(onAuthStateChanged).toHaveBeenCalledWith(auth, expect.any(Function));
      expect(mockCallback).toHaveBeenCalledWith(null);
      expect(unsubscribe).toBeTypeOf('function');
    });

    it('should convert Firebase user to app user and pass to callback', () => {
      // Arrange
      const mockCallback = vi.fn();
      const mockFirebaseUser = {
        uid: 'firebase-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg'
      } as FirebaseUser;

      (onAuthStateChanged as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(
        (_auth: Auth, callback: (user: FirebaseUser | null) => void) => {
          callback(mockFirebaseUser);
          return vi.fn();
        }
      );

      // Act
      onAuthStateChange(mockCallback);

      // Assert
      expect(mockCallback).toHaveBeenCalledWith({
        id: 'firebase-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg'
      });
    });
  });

  describe('getCurrentUser', () => {
    it('should return null when no user is authenticated', () => {
      // Arrange - mockAuth.currentUser is already null from beforeEach

      // Act
      const result = getCurrentUser();

      // Assert
      expect(result).toBeNull();
    });

    it('should return the converted user when authenticated', () => {
      // Arrange
      const mockFirebaseUser = {
        uid: 'firebase-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg'
      } as FirebaseUser;
      
      // Update the mock to include a current user
      mockAuth.currentUser = mockFirebaseUser;

      // Act
      const result = getCurrentUser();

      // Assert
      expect(result).toEqual({
        id: 'firebase-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg'
      });
    });
  });
}); 