import React, { Component, ReactNode, useState, useCallback } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
// Removed unused useToast import
// import { useToast } from '@/hooks/use-toast'; 

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (_error: Error, _errorInfo: React.ErrorInfo) => void;
  resetKey?: string | number; // Key that changes to reset the error boundary
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * ErrorBoundary component that catches JavaScript errors in child component trees
 * and displays a fallback UI instead of component tree that crashed.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(_error: Error, _errorInfo: React.ErrorInfo) {
    // Update state with error info for display
    this.setState({ errorInfo: _errorInfo });
    
    // Call optional onError callback
    if (this.props.onError) {
      this.props.onError(_error, _errorInfo);
    }
    
    // Log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('ErrorBoundary caught an error:', _error, _errorInfo);
    }
  }
  
  // Reset the error state to allow a retry
  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };
  
  // If resetKey changes, reset the error state
  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (
      this.state.hasError &&
      prevProps.resetKey !== this.props.resetKey
    ) {
      this.resetErrorBoundary();
    }
  }

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }
      
      // Otherwise show default error UI with retry button
      return (
        <DefaultErrorFallback
          error={error}
          resetErrorBoundary={this.resetErrorBoundary}
        />
      );
    }

    return children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  resetErrorBoundary: () => void;
}

/**
 * Default error fallback UI component
 */
const DefaultErrorFallback = ({ error, resetErrorBoundary }: ErrorFallbackProps) => {
  return (
    <Alert variant="destructive" className="my-4">
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription>
        <div className="mt-2 text-sm">
          {error?.message || 'An unexpected error occurred'}
        </div>
        <div className="mt-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={resetErrorBoundary}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try again</span>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

/**
 * Creates a component with an error boundary wrapped around it
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: {
    fallback?: ReactNode;
    onError?: (_error: Error, _errorInfo: React.ErrorInfo) => void;
  }
) {
  const ComponentWithErrorBoundary = (props: P) => {
    // Use state to generate a new resetKey for forcing resets
    const [resetKey, setResetKey] = useState(0);
    
    // Create a callback to force the error boundary to reset
    const forceReset = useCallback(() => {
      setResetKey(prev => prev + 1);
    }, []);
    
    return (
      <ErrorBoundary 
        fallback={options?.fallback} 
        onError={options?.onError}
        resetKey={resetKey}
      >
        <WrappedComponent {...props} resetErrorBoundary={forceReset} />
      </ErrorBoundary>
    );
  };

  // Set display name for easier debugging
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  ComponentWithErrorBoundary.displayName = `WithErrorBoundary(${displayName})`;

  return ComponentWithErrorBoundary;
}

export default ErrorBoundary;
