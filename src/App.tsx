// import React, { lazy, Suspense, ComponentType } from "react"; // Removed unused React import
import { lazy, Suspense, useEffect } from "react"; // Removed ComponentType
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { QueryClientProvider as QueryCli } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ResourceProvider } from "./contexts/ResourceContext";
import { UserProvider } from "./contexts/UserContext";

import MainLayout from "@/components/layouts/MainLayout";
import ErrorBoundary from "@/components/ErrorBoundary";
import { LiveRegionAnnouncer } from "@/components/LiveRegion";
// InstallPrompt removed as requested
import { MobileToastProvider } from "@/components/ui/mobile-toast";

// Lazy load page components
const NotFound = lazy(() => import("./pages/not-found"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Settlement = lazy(() => import("./pages/Settlement"));
const Settings = lazy(() => import("./pages/Settings"));
const Login = lazy(() => import("./pages/Login"));

// Simple loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="text-center space-y-4">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <h2 className="text-lg font-medium text-foreground">Loading Page...</h2>
    </div>
  </div>
);

// ProtectedRoute component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  // Only show loading indicator during initial authentication check
  // (but limit this to a brief period to ensure UI renders)
  useEffect(() => {
    if (!loading && !currentUser) {
      console.warn("ProtectedRoute: Not authenticated. Redirecting to login.");
      navigate("/login", { replace: true });
    }
  }, [currentUser, loading, navigate]);

  // Always return content if we're on a protected route to prevent blank screens
  return (
    <>
      {loading && (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center space-y-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <h2 className="text-lg font-medium text-foreground">Loading...</h2>
            <p className="text-sm text-muted-foreground">Checking authentication...</p>
          </div>
        </div>
      )}
      {!loading && children}
    </>
  );
}

// App component using react-router-dom
function App() {
  console.log("App: Rendering App component");
  
  return (
    <QueryCli client={queryClient}>

        <AuthProvider>
          <ResourceProvider>
            <UserProvider>
              <MobileToastProvider>
                <ErrorBoundary>
                  <BrowserRouter>
                    <Suspense fallback={<LoadingFallback />}>
                      <Routes>
                        {/* Public route */}
                        <Route path="/login" element={<Login />} />

                        {/* Explicit redirect from root to dashboard */}
                        <Route index element={<Navigate to="/dashboard" replace />} />
                        
                        {/* Protected Routes */}
                        <Route
                          path="/dashboard"
                          element={
                            <ProtectedRoute>
                              <MainLayout>
                                <Dashboard />
                              </MainLayout>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/analytics"
                          element={
                            <ProtectedRoute>
                              <MainLayout>
                                <Analytics />
                              </MainLayout>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/settlement"
                          element={
                            <ProtectedRoute>
                              <MainLayout>
                                <Settlement />
                              </MainLayout>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/settings"
                          element={
                            <ProtectedRoute>
                              <MainLayout>
                                <Settings />
                              </MainLayout>
                            </ProtectedRoute>
                          }
                        />

                        {/* Catch-all for 404 */}
                        <Route
                          path="*"
                          element={
                            <ProtectedRoute>
                              <MainLayout>
                                <NotFound />
                              </MainLayout>
                            </ProtectedRoute>
                          }
                        />
                      </Routes>
                    </Suspense>
                    <SonnerToaster richColors closeButton />
                    <LiveRegionAnnouncer />
                  </BrowserRouter>
                </ErrorBoundary>
              </MobileToastProvider>
            </UserProvider>
          </ResourceProvider>
        </AuthProvider>

    </QueryCli>
  );
}

export default App;
