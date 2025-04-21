import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      console.log("Login Page: User authenticated, redirecting to /");
      navigate("/", { replace: true });
    }
  }, [currentUser, navigate]);

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      console.log("Starting Google popup authentication...");
      const result = await signInWithPopup(auth, provider);
      console.log("Popup authentication successful:", result.user.uid);
      toast({ title: "Login Successful", description: "Welcome back!" });
      
      // Navigate to home page
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Google Authentication Error:", error);
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Could not complete Google sign in.",
        variant: "destructive",
      });
    } finally {
      setLoadingGoogle(false);
    }
  };

  // If already logged in, show nothing (will redirect)
  if (currentUser) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      {/* Branding Area */}
      <div className="mb-10 text-center space-y-3">
         <h1 className="text-5xl font-bold tracking-tight text-gray-900 ">
           AAFairShare
         </h1>
         <p className="text-muted-foreground text-lg">Split expenses fairly and easily.</p>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md border border-gray-200  shadow-sm hover:shadow-md transition-shadow duration-300">
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
            className="w-full flex items-center justify-center py-6 text-base font-medium transition-all duration-200 hover:bg-gray-50  border-gray-200 "
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
      <footer className="mt-12 text-center text-sm text-gray-500 ">
        &copy; {new Date().getFullYear()} AAFairShare. All rights reserved.
      </footer>
    </div>
  );
}
