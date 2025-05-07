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
import { useAuth } from "@/contexts/NewAuthContext";

const ALLOWED_EMAILS = [
  "andypamo@gmail.com",
  "antoniojosephsmith18@gmail.com"
];

export default function Login() {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const { toast } = useToast();
  const { user, signInWithGoogle, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (ALLOWED_EMAILS.includes(user.email)) {
        navigate("/", { replace: true });
      } else {
        // Not allowed, sign out and show error
        signOut();
        toast({
          title: "Access Denied",
          description: "You are not authorized to use this app.",
          variant: "destructive",
        });
      }
    }
  }, [user, navigate, signOut, toast]);

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    try {
      await signInWithGoogle();
      toast({ title: "Login Successful", description: "Welcome back!" });
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
  if (user) {
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in to FairShare</CardTitle>
          <CardDescription>Only Google Sign-In is supported.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleGoogleLogin}
            disabled={loadingGoogle}
            className="w-full"
          >
            {loadingGoogle ? "Signing in..." : "Sign in with Google"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
