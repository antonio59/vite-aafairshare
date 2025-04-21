import React, { useState, useEffect, useCallback } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { notificationHapticFeedback, errorHapticFeedback, successHapticFeedback } from '@/lib/haptics';

const toastVariants = cva(
  'fixed left-0 right-0 mx-auto w-[90%] max-w-md p-4 rounded-lg shadow-lg flex items-center gap-3 z-50 transition-all duration-300 ease-in-out',
  {
    variants: {
      variant: {
        default: 'bg-white  text-gray-900  border border-gray-200 ',
        success: 'bg-green-50  text-green-900  border border-green-200 ',
        error: 'bg-red-50  text-red-900  border border-red-200 ',
        warning: 'bg-yellow-50  text-yellow-900  border border-yellow-200 ',
        info: 'bg-blue-50  text-blue-900  border border-blue-200 ',
      },
      position: {
        top: 'top-4',
        bottom: 'bottom-20', // Higher than bottom nav
      },
    },
    defaultVariants: {
      variant: 'default',
      position: 'top',
    },
  }
);

export interface MobileToastProps extends VariantProps<typeof toastVariants> {
  title?: string;
  description?: string;
  duration?: number;
  onClose?: () => void;
  icon?: React.ReactNode;
  showClose?: boolean;
}

export function MobileToast({
  title,
  description,
  variant = 'default',
  position = 'top',
  duration = 3000,
  onClose,
  icon,
  showClose = true,
}: MobileToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  // Determine icon based on variant if not provided
  const toastIcon = icon || (
    variant === 'success' ? <CheckCircle className="h-5 w-5 text-green-500" /> :
    variant === 'error' ? <AlertCircle className="h-5 w-5 text-red-500" /> :
    variant === 'warning' ? <AlertTriangle className="h-5 w-5 text-yellow-500" /> :
    variant === 'info' ? <Info className="h-5 w-5 text-blue-500" /> : null
  );

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300); // Match the transition duration
  }, [onClose]);

  // Trigger haptic feedback based on variant
  useEffect(() => {
    if (variant === 'success') {
      successHapticFeedback();
    } else if (variant === 'error') {
      errorHapticFeedback();
    } else {
      notificationHapticFeedback();
    }
  }, [variant]);

  // Auto-dismiss after duration
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(handleClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, handleClose]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        toastVariants({ variant, position }),
        isExiting ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
      )}
    >
      {toastIcon && <div className="flex-shrink-0">{toastIcon}</div>}
      <div className="flex-1 min-w-0">
        {title && <h3 className="font-medium text-sm">{title}</h3>}
        {description && <p className="text-xs opacity-90 mt-0.5 line-clamp-2">{description}</p>}
      </div>
      {showClose && (
        <button
          onClick={handleClose}
          className="flex-shrink-0 rounded-full p-1 hover:bg-gray-200  transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// Toast container to manage multiple toasts
interface ToastContainerProps {
  children: React.ReactNode;
}

export function MobileToastContainer({ children }: ToastContainerProps) {
  return (
    <div className="pointer-events-none fixed inset-0 flex flex-col items-center justify-start gap-2 p-4 z-50">
      {children}
    </div>
  );
}

// Toast provider context
type ToastContextType = {
  showToast: (_props: MobileToastProps) => void;
};

 
const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function useMobileToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useMobileToast must be used within a MobileToastProvider');
  }
  return context;
}

export function MobileToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<(MobileToastProps & { id: string })[]>([]);

  const showToast = (_props: MobileToastProps) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ..._props, id }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <MobileToastContainer>
        {toasts.map((toast) => (
          <MobileToast
            key={toast.id}
            {...toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </MobileToastContainer>
    </ToastContext.Provider>
  );
}
