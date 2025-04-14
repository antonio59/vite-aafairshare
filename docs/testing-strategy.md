# Testing Strategy

This document outlines the testing approach for the FairShare expense sharing application.

## Testing Layers

We'll implement a comprehensive testing strategy with three layers:

1. **Unit Tests**: Testing individual functions, hooks, and utilities
2. **Component Tests**: Testing UI components in isolation
3. **End-to-End Tests**: Testing critical user flows

## Testing Tools

We'll use the following testing stack:

- **Vitest**: Fast unit and component testing framework, compatible with Vite
- **React Testing Library**: Component testing with user-centric approach
- **MSW (Mock Service Worker)**: Network request mocking
- **Cypress**: End-to-end testing

## Test Coverage Targets

- **Services & Utilities**: 80%+ coverage
- **Core Components**: 70%+ coverage
- **Critical User Flows**: 100% E2E test coverage

## Testing Approach By Type

### Unit Tests

Focus on testing pure logic such as:
- Service functions
- Utility functions
- Custom hooks
- Context providers
- Data transformations

Example unit test structure:
```ts
describe('authService', () => {
  describe('convertFirebaseUserToUser', () => {
    it('should correctly transform Firebase user to app user model', () => {
      // Arrange
      const firebaseUser = { /* ... */ };
      
      // Act
      const result = convertFirebaseUserToUser(firebaseUser);
      
      // Assert
      expect(result).toEqual({ /* expected output */ });
    });
    
    it('should handle null input', () => {
      // ... 
    });
  });
});
```

### Component Tests

Focus on testing component rendering and interactions:
- Form components
- UI widgets
- Interactive elements
- State-dependent rendering

Example component test structure:
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ExpenseForm } from './ExpenseForm';

describe('ExpenseForm', () => {
  it('should render all fields', () => {
    // Arrange
    render(<ExpenseForm />);
    
    // Assert
    expect(screen.getByLabelText('Amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    // ...
  });
  
  it('should validate required fields', async () => {
    // Arrange
    render(<ExpenseForm />);
    
    // Act
    fireEvent.click(screen.getByText('Submit'));
    
    // Assert
    expect(await screen.findByText('Amount is required')).toBeInTheDocument();
  });
});
```

### End-to-End Tests

Focus on testing critical user flows:
- Authentication
- Expense creation and management
- Monthly settlement
- Data visualization

Example E2E test structure:
```ts
describe('Expense Management', () => {
  beforeEach(() => {
    cy.login(); // Custom command to authenticate
    cy.visit('/expenses');
  });
  
  it('should allow users to add a new expense', () => {
    // Act
    cy.findByText('Add Expense').click();
    cy.findByLabelText('Amount').type('42.50');
    cy.findByLabelText('Description').type('Dinner');
    cy.findByText('Submit').click();
    
    // Assert
    cy.findByText('Expense added successfully').should('be.visible');
    cy.findByText('Dinner').should('be.visible');
    cy.findByText('£42.50').should('be.visible');
  });
});
```

## Test Organization

### Directory Structure

```
src/
├── components/
│   ├── ExpenseForm/
│   │   ├── ExpenseForm.tsx
│   │   ├── ExpenseForm.test.tsx  # Component tests
│   ├── ...
├── services/
│   ├── auth.service.ts
│   ├── auth.service.test.ts      # Unit tests
├── hooks/
│   ├── useExpenses.ts
│   ├── useExpenses.test.ts       # Hook tests
└── ...
cypress/
├── e2e/                          # E2E tests
│   ├── authentication.spec.ts
│   ├── expenses.spec.ts
```

## Mocking Strategy

- **Firebase Services**: Create test doubles for Firebase services
- **API Requests**: Use MSW to intercept and mock network requests
- **Authentication**: Provide test users for authentication flows

## Implementation Plan

### Phase 1: Setup & Infrastructure
- [x] Document testing strategy
- [ ] Install testing dependencies (Vitest, RTL, MSW)
- [ ] Configure Vitest for unit and component testing
- [ ] Create test utilities and helpers

### Phase 2: Unit Tests
- [ ] Test services layer (auth, resources, expenses)
- [ ] Test utility functions
- [ ] Test custom hooks
- [ ] Test context providers

### Phase 3: Component Tests
- [ ] Test form components (ExpenseForm, etc.)
- [ ] Test data visualization components (charts)
- [ ] Test core interactive components

### Phase 4: End-to-End Tests
- [ ] Setup Cypress
- [ ] Create authentication flow tests
- [ ] Create expense management flow tests
- [ ] Create settlement flow tests

## Continuous Integration

All tests will be run:
- Before merging pull requests
- On the main branch after merges
- During nightly builds

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Mock Service Worker](https://mswjs.io/)
- [Cypress Documentation](https://docs.cypress.io/) 