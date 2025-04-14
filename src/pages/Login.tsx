import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Use react-router-dom hook
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// Removed Chrome icon import
import { useToast } from "@/hooks/use-toast";
// Switch to signInWithRedirect
import { signInWithRedirect, GoogleAuthProvider, getRedirectResult, signInWithPopup } from "firebase/auth"; // Add signInWithPopup
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext"; // Corrected path


export default function Login() {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const { toast } = useToast();
  const { currentUser, userProfile, loading: authLoading, profileLoading } = useAuth(); // Get profileLoading too
  const navigate = useNavigate();

  // --- Handle Redirect Result ---
  useEffect(() => {
    console.log("Login.tsx: Checking for redirect result...");
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          console.log("Login.tsx: Redirect result found:", result);
          // User signed in via redirect
          toast({ title: "Login Successful", description: "Welcome back!" });
          // Navigation to '/' should happen automatically via the other useEffect
        } else {
          console.log("Login.tsx: No redirect result found.");
          // No redirect result, maybe user landed here directly or cancelled
        }
      })
      .catch((error) => {
        console.error("Login.tsx: Google Redirect Login Error:", error);
        // Log more detailed error information
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        // For Firebase Auth errors
        if (error.customData && error.customData._tokenResponse) {
          console.error("Token response error:", error.customData._tokenResponse);
        }
        
        toast({
          title: "Login Failed",
          description: error instanceof Error ? error.message : "Could not complete sign in.",
          variant: "destructive",
        });
      });
  }, [toast]); // Run once on component mount

  // --- Redirect if already logged in AND profile is loaded ---
  useEffect(() => {
    if (!authLoading && !profileLoading && currentUser && userProfile) {
      console.log("Login Page: User authenticated and profile loaded, redirecting to /");
      navigate("/", { replace: true });
    }
  }, [authLoading, profileLoading, currentUser, userProfile, navigate]);

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    try {
      const provider = new GoogleAuthProvider();
      
      // Add required OAuth scopes
      provider.addScope('email');
      provider.addScope('profile');
      
      // Set custom OAuth parameters
      provider.setCustomParameters({
        // Force account selection even if user is already signed in
        prompt: 'select_account',
      });
      
      // Configure auth settings for proper redirect handling in different environments
      // This is especially important for local development with staging config
      if (window.location.hostname === 'localhost') {
        console.log("Running on localhost - using popup instead of redirect");
        // On localhost, use popup authentication instead of redirect
        // This avoids issues with port numbers in redirect URLs
        try {
          const result = await signInWithPopup(auth, provider);
          console.log("Popup authentication successful:", result.user.uid);
          toast({ title: "Login Successful", description: "Welcome back!" });
          
          // Explicitly reset loading state after successful authentication
          setLoadingGoogle(false);
          
          // For localhost environments, bypass the profile check and navigate directly
          console.log("Bypassing profile check and forcing navigation to home page");
          
          // Navigate directly to home page
          navigate("/", { replace: true });
        } catch (popupError) {
          console.error("Popup authentication error:", popupError);
          setLoadingGoogle(false);
          toast({
            title: "Login Failed",
            description: popupError instanceof Error ? popupError.message : "Popup authentication failed",
            variant: "destructive",
          });
        }
      } else {
        // On deployed environments, use redirect authentication
        console.log("Using redirect authentication flow");
        await signInWithRedirect(auth, provider);
        // Redirect happens, result is handled by the useEffect above
      }
    } catch (error) {
      console.error("Google Authentication Error:", error);
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Could not complete Google sign in.",
        variant: "destructive",
      });
      setLoadingGoogle(false); // Reset loading if authentication fails
    }
  };

  // --- Render Loading or Login Form ---
  // Show loading indicator while auth or profile are loading
  if (authLoading || profileLoading) { // Check both loading states
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {authLoading ? 'Checking Status...' : 'Loading Profile...'}
          </h2>
        </div>
      </div>
    );
  }

  // If loading is done, and we have user & profile, redirect is handled by useEffect.
  // Render null briefly to prevent flicker before redirect.
  if (currentUser && userProfile) {
     return null; 
  }

  // If not loading and no user, show the login form
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      {/* Branding Area */}
      <div className="mb-10 text-center space-y-3">
         <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
           AAFairShare
         </h1>
         <p className="text-muted-foreground text-lg">Split expenses fairly and easily.</p>
      </div>

      {/* Login Card - Refined design */}
      <Card className="w-full max-w-md border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-semibold">Welcome Back</CardTitle>
          <CardDescription className="text-base">
            Sign in with your Google account to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 p-6 pt-2">
          <Button
            variant="outline"
            size="lg"
            className="w-full flex items-center justify-center py-6 text-base font-medium transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700"
            onClick={handleGoogleLogin}
            disabled={loadingGoogle}
          >
            {loadingGoogle ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign in with Google</span>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Footer */}
      <footer className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} AAFairShare. All rights reserved.
      </footer>
    </div>
  );
}
