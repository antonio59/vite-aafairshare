import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream;
    setIsIOS(isIOSDevice);

    // For non-iOS devices, listen for the beforeinstallprompt event
    if (!isIOSDevice) {
      const handleBeforeInstallPrompt = (event: Event) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        event.preventDefault();
        // Store the event for later use
        setInstallPrompt(event as BeforeInstallPromptEvent);
        // Show our custom install prompt
        setShowPrompt(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    } else {
      // For iOS, check if the app is already installed
      const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                                (window.navigator as Navigator & { standalone?: boolean }).standalone;
      
      // Only show the iOS instructions if not already in standalone mode
      if (!isInStandaloneMode) {
        // Show our iOS install instructions
        setShowPrompt(true);
      }
    }
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    
    // Show the native install prompt
    await installPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const choiceResult = await installPrompt.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // Clear the saved prompt since it can't be used again
    setInstallPrompt(null);
    setShowPrompt(false);
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    // Save to localStorage to avoid showing again for a while
    localStorage.setItem('installPromptDismissed', Date.now().toString());
  };

  // Don't show if previously dismissed recently (within 7 days)
  useEffect(() => {
    const lastDismissed = localStorage.getItem('installPromptDismissed');
    if (lastDismissed) {
      const dismissedTime = parseInt(lastDismissed, 10);
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < sevenDaysInMs) {
        setShowPrompt(false);
      }
    }
  }, []);

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-50 px-4 pb-4 md:bottom-4">
      <Card className="border border-primary/20 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isIOS ? (
                <>
                  <h3 className="text-lg font-medium mb-2">Install AAFairShare</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Tap <span className="inline-flex items-center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4V20M12 4L18 10M12 4L6 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span> 
                    then "Add to Home Screen" to install
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium mb-2">Install AAFairShare</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Install our app for a better experience
                  </p>
                  <Button 
                    onClick={handleInstallClick} 
                    className="w-full sm:w-auto"
                    size="sm"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Install App
                  </Button>
                </>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={dismissPrompt}
              className="h-8 w-8"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
