import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Users, BarChart2, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

import { SkipLink } from "@/components/SkipLink";
import { SwipeContainer } from "@/components/SwipeContainer";
// Import DropdownMenu for mobile profile
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button"; // Import Button for trigger
import { useEffect, useState } from "react";

interface MainLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/settlement", label: "Settlement", icon: Users },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, loading } = useAuth();
  const { toast } = useToast();
  const [isMobile] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
    };

    if (isMobile) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, [isMobile]);

  useEffect(() => {
    if (loading) return;
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, loading, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return null;
  }

  // Type guard for userProfile
  type UserProfile = { photoURL?: string | null; username?: string | null };
  const userProfile: UserProfile | null = (typeof currentUser === 'object' && currentUser && 'userProfile' in currentUser)
    ? (currentUser as { userProfile?: UserProfile }).userProfile ?? null
    : null;

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      // Navigate to login after logout
      navigate("/login");
    } catch (error: unknown) {
      console.error("Logout Error:", error);
      toast({ title: "Logout Failed", description: "Could not log out.", variant: "destructive" });
    }
  };

  const getInitials = (name?: string | null, email?: string | null): string => {
    // ... (Keep existing getInitials function) ...
    if (name) {
      const names = name.split(' ');
      if (names.length > 1) return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      return name.substring(0, 2).toUpperCase();
    }
    if (email) return email.substring(0, 2).toUpperCase();
    return '??';
  };

  return (
    // Use h-screen on the outer container for mobile layout control, but remove overflow-hidden
    <div className="flex h-screen bg-background">
      <SkipLink />
      {/* Sidebar (Desktop) - Now fixed on desktop */}
      <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:w-64 md:flex-col bg-card border-r border-border z-40" aria-label="Main navigation">
        {/* Sidebar Title Link */}
        <div className="flex items-center justify-center h-16 border-b border-border flex-shrink-0">
          {/* Apply styles directly to Link, which renders an <a> */}
          <Link to="/" className="text-xl font-semibold text-primary hover:text-primary/80 transition-colors">AAFairShare</Link>
        </div>
        {/* Sidebar Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto" data-testid="desktop-navigation">
          {navItems.map((item) => (
            // Apply styles directly to Link
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${ 
                location.pathname === item.href 
                  ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary" 
                  : "text-foreground/60 hover:bg-secondary hover:text-foreground" 
              }`}
            >
              <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />{item.label}
            </Link>
          ))}
        </nav>
        {/* Sidebar Profile Section */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          {currentUser ? (
            <div className="flex items-center space-x-3">
              {/* Increased Avatar size */}
              <Avatar className="h-12 w-12">
                <AvatarImage src={userProfile?.photoURL ?? currentUser.photoURL ?? undefined} alt={userProfile?.username ?? currentUser.username ?? "User"} />
                <AvatarFallback>{getInitials(userProfile?.username ?? currentUser.username, currentUser.email)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {userProfile?.username ?? currentUser.username ?? "User"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentUser.email}</p>
                </div>
                <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-red-600 transition-colors flex items-center"><LogOut className="mr-1 h-3 w-3" />Logout</button>
              </div>
            </div>
          ) : ( <p className="text-sm text-gray-500">Not logged in</p> )}
        </div>
      </aside>

      {/* Main Content Area - Offset for fixed sidebar on desktop */}
      <div className="flex-1 flex flex-col h-screen min-h-0 md:ml-64">
        <SwipeContainer
          key={location.pathname}
          onSwipeLeft={() => {
            // Find the next navigation item
            const currentIndex = navItems.findIndex(item => item.href === location.pathname);
            if (currentIndex !== -1 && currentIndex < navItems.length - 1) {
              navigate(navItems[currentIndex + 1].href);
            }
          }}
          onSwipeRight={() => {
            // Find the previous navigation item
            const currentIndex = navItems.findIndex(item => item.href === location.pathname);
            if (currentIndex > 0) {
              navigate(navItems[currentIndex - 1].href);
            }
          }}
        >
        {/* Mobile Header - Enhanced with better position & shadow */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-card border-b border-border flex-shrink-0 shadow-sm">
          {/* Mobile App Title/Logo Link */}
          <Link to="/" className="text-lg font-semibold text-primary">
            AAFairShare
          </Link>

          {/* Mobile Actions */}
          <div className="flex items-center space-x-3">
            {/* Mobile User Profile Dropdown */}
            {currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  {/* Increased touch target size */}
                  <Button variant="ghost" className="relative h-11 w-11 rounded-full">
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={userProfile?.photoURL ?? currentUser.photoURL ?? undefined} alt={userProfile?.username ?? currentUser.username ?? "User"} />
                      <AvatarFallback>{getInitials(userProfile?.username ?? currentUser.username, currentUser.email)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2">
                  <DropdownMenuLabel>{userProfile?.username ?? currentUser.username ?? "My Account"}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
               <Link to="/login"><Button variant="outline" size="sm">Login</Button></Link> // Show login button if not logged in
            )}
          </div>
        </header>

        {/* Page Content - Added overflow-y-auto and min-h-0 to ensure scrolling works correctly */}
        <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8 overflow-y-auto min-h-0" tabIndex={-1}>
          {children}
        </main>
        </SwipeContainer>
      </div>

      {/* Bottom Navigation (Mobile) - Enhanced with drop shadow and larger touch targets */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around h-16 items-center z-30 px-1 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]" aria-label="Mobile navigation" data-testid="mobile-navigation">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={`flex flex-col items-center justify-center h-full text-xs font-medium transition-colors p-1 w-full min-w-[3rem] ${ 
              location.pathname === item.href
                ? "text-primary dark:text-primary-foreground bg-primary/10 dark:bg-primary/20"
                : "text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
            aria-current={location.pathname === item.href ? "page" : undefined}
          >
            <item.icon className="h-6 w-6 mb-1" aria-hidden="true" />
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
