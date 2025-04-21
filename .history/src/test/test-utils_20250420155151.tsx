import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

// Create a custom render function that includes providers if needed
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return {
    user: userEvent.setup(),
    ...render(ui, {
      // Add providers here as needed
      // wrapper: ({ children }) => (
      //   <SomeProvider>
      //     {children}
      //   </SomeProvider>
      // ),
      ...options,
    }),
  };
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';

// Override the render method with our custom version
export { customRender as render };

// Mock data helpers
export const mockUser = {
  id: 'user-1',
  displayName: 'Test User',
  email: 'test@example.com',
  photoURL: 'https://example.com/photo.jpg',
};

export const mockCategory = {
  id: 'category-1',
  name: 'Groceries',
  icon: 'shopping-cart',
  createdAt: new Date('2023-01-01'),
};

export const mockLocation = {
  id: 'location-1',
  name: 'Supermarket',
  createdAt: new Date('2023-01-01'),
};

export const mockExpense = {
  id: 'expense-1',
  amount: 42.50,
  description: 'Weekly groceries',
  date: new Date('2023-06-15'),
  categoryId: 'category-1',
  locationId: 'location-1',
  createdById: 'user-1',
  splitType: 'Equal',
  createdAt: new Date('2023-06-15'),
};

// Mocks a resolved promise
export function mockResolvedValue<T>(value: T) {
  return vi.fn().mockResolvedValue(value);
}

// Mocks a rejected promise
export function mockRejectedValue(error: Error) {
  return vi.fn().mockRejectedValue(error);
}

// Helper to wait for promises to resolve
export const waitForPromises = () => new Promise(resolve => setTimeout(resolve, 0));

// Creates a mock component for testing
export function createMockComponent(displayName: string) {
  const component = ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid={`mock-${displayName}`} {...props}>
      {children}
    </div>
  );
  component.displayName = displayName;
  return component;
} 