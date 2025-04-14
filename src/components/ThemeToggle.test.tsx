import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/test/test-utils';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';

// Mock the ThemeContext
vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: vi.fn()
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Moon: () => <div data-testid="moon-icon">Moon</div>,
  Sun: () => <div data-testid="sun-icon">Sun</div>
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props} data-testid="theme-button">
      {children}
    </button>
  )
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children, content }: any) => (
    <div data-testid="tooltip" data-content={content}>
      {children}
    </div>
  )
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the useEffect to set mounted to true immediately
    vi.spyOn(React, 'useEffect').mockImplementation(f => f());
    
    // Mock useState to return [true, setState]
    vi.spyOn(React, 'useState').mockImplementation(() => [true, vi.fn()]);
  });
  
  it('renders a button with a sun icon in light mode', () => {
    // Arrange
    const mockToggleTheme = vi.fn();
    (useTheme as ReturnType<typeof vi.fn>).mockReturnValue({
      theme: 'light',
      toggleTheme: mockToggleTheme
    });
    
    // Act
    render(<ThemeToggle />);
    
    // Assert
    expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('moon-icon')).not.toBeInTheDocument();
    
    const button = screen.getByTestId('theme-button');
    expect(button).toHaveAttribute('aria-label', 'Switch to dark theme');
  });
  
  it('renders a button with a moon icon in dark mode', () => {
    // Arrange
    const mockToggleTheme = vi.fn();
    (useTheme as ReturnType<typeof vi.fn>).mockReturnValue({
      theme: 'dark',
      toggleTheme: mockToggleTheme
    });
    
    // Act
    render(<ThemeToggle />);
    
    // Assert
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('sun-icon')).not.toBeInTheDocument();
    
    const button = screen.getByTestId('theme-button');
    expect(button).toHaveAttribute('aria-label', 'Switch to light theme');
  });
  
  it('calls toggleTheme when the button is clicked', () => {
    // Arrange
    const mockToggleTheme = vi.fn();
    (useTheme as ReturnType<typeof vi.fn>).mockReturnValue({
      theme: 'light',
      toggleTheme: mockToggleTheme
    });
    
    // Act
    render(<ThemeToggle />);
    
    // Click the button
    fireEvent.click(screen.getByTestId('theme-button'));
    
    // Assert
    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });
  
  it('contains the correct tooltip content', () => {
    // Arrange
    (useTheme as ReturnType<typeof vi.fn>).mockReturnValue({
      theme: 'light',
      toggleTheme: vi.fn()
    });
    
    // Act
    render(<ThemeToggle />);
    
    // Assert
    const tooltip = screen.getByTestId('tooltip');
    expect(tooltip).toHaveAttribute('data-content', 'Switch to dark theme');
  });
}); 