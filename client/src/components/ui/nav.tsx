import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import AnimatedLogo from "./animated-logo";

export default function Nav() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navigateTo = (path: string) => {
    setLocation(path);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <AnimatedLogo 
              size="sm" 
              showText={true} 
              className="flex-row space-y-0 space-x-3" 
              layout="horizontal"
            />
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <Button 
              variant="ghost" 
              className="text-[#1e3a8a] hover:text-white hover:bg-[#22c55e] transition-colors duration-200"
              onClick={() => navigateTo("/")}
            >
              Dashboard
            </Button>
            
            <div className="ml-4 flex items-center">
              {user?.profileImageUrl ? (
                <img 
                  className="h-8 w-8 rounded-full object-cover" 
                  src={user.profileImageUrl} 
                  alt="Profile" 
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-600">
                    {user?.firstName?.[0] || user?.email?.[0] || "U"}
                  </span>
                </div>
              )}
              <span className="ml-2 text-sm font-medium text-gray-700">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="ml-3 text-gray-500 hover:text-gray-700"
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? "Saindo..." : "Sair"}
              </Button>
            </div>
          </div>
          
          <div className="md:hidden">
            <Button variant="ghost" size="sm">
              <span className="sr-only">Menu</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
