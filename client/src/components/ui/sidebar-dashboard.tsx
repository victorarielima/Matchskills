import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import AnimatedLogo from "./animated-logo";
import DarkModeToggle from "./dark-mode-toggle";
import { 
  LayoutDashboard, 
  FileText, 
  BarChart3, 
  Plus,
  Menu,
  X,
  LogOut,
  ChevronDown
} from "lucide-react";
import { Button } from "./button";
import { useAuth } from "@/hooks/use-auth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./dropdown-menu";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path: string;
  isActive?: boolean;
}

export default function SidebarDashboard() {
  const [location, setLocation] = useLocation();
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('sidebar-expanded');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const { user, logoutMutation } = useAuth();

  // Atualiza a margem do body quando o sidebar muda
  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', isExpanded ? '16rem' : '5rem');
    localStorage.setItem('sidebar-expanded', JSON.stringify(isExpanded));
  }, [isExpanded]);

  const sidebarItems: SidebarItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/',
      isActive: location === '/'
    },
    {
      id: 'forms',
      label: 'Formulários',
      icon: FileText,
      path: '/create-class',
      isActive: location.startsWith('/create-class')
    },
    {
      id: 'reports',
      label: 'Relatórios',
      icon: BarChart3,
      path: '/reports',
      isActive: location.startsWith('/reports')
    }
  ];

  const handleNavigation = (path: string) => {
    setLocation(path);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div 
      className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col z-40 transition-all duration-300 ${
        isExpanded ? 'w-64' : 'w-20'
      }`}
    >
      {/* Header with Logo and Toggle */}
      <div className={`p-4 ${isExpanded ? '' : 'px-3'}`}>
        <div className="flex items-center justify-between">
          {isExpanded ? (
            <>
              <AnimatedLogo 
                size="sm" 
                showText={true} 
                className="flex-1" 
                layout="horizontal"
              />
              <button
                onClick={() => setIsExpanded(false)}
                className="ml-2 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Recolher menu"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsExpanded(true)}
              className="w-full p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex justify-center"
              aria-label="Expandir menu"
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 py-2 overflow-y-auto">
        <nav className="space-y-0.5">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center ${isExpanded ? 'space-x-3 px-2' : 'justify-center px-2'} py-2 rounded-md text-left transition-all duration-150 ${
                  item.isActive
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                }`}
                title={!isExpanded ? item.label : undefined}
              >
                <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isExpanded ? '' : 'mx-auto'}`} />
                {isExpanded && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Create New Button */}
        <div className="mt-4">
          {isExpanded ? (
            <Button
              onClick={() => handleNavigation('/create-class')}
              className="w-full dark:bg-purple-600 dark:hover:bg-purple-700 bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-sm text-sm font-medium h-9"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Grupo
            </Button>
          ) : (
            <Button
              onClick={() => handleNavigation('/create-class')}
              className="w-full dark:bg-purple-600 dark:hover:bg-purple-700 bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-sm p-2"
              title="Novo Grupo"
            >
              <Plus className="w-[18px] h-[18px]" />
            </Button>
          )}
        </div>
      </div>

      {/* Bottom Section - Dark Mode + User Profile */}
      <div className={`border-t border-gray-200 dark:border-gray-800 ${isExpanded ? 'p-3' : 'p-2'}`}>
        {/* Dark Mode Toggle */}
        <div className={`${isExpanded ? 'mb-2 p-2' : 'mb-2 p-1'} rounded-md hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors flex ${isExpanded ? 'justify-center' : 'justify-center'}`}>
          <DarkModeToggle compact={!isExpanded} />
        </div>

        {/* User Profile */}
        {isExpanded ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                {user?.profileImageUrl ? (
                  <img 
                    className="h-7 w-7 rounded-md object-cover flex-shrink-0" 
                    src={user.profileImageUrl} 
                    alt="Profile" 
                  />
                ) : (
                  <div className="h-7 w-7 rounded-md bg-gradient-to-br dark:from-purple-600 dark:to-purple-500 from-blue-600 to-blue-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-white">
                      {user?.firstName?.[0] || user?.email?.[0] || "U"}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user?.firstName || user?.email?.split('@')[0]}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              </div>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-56 mb-2">
              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {user?.email}
                </p>
              </div>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="text-red-600 dark:text-red-400 cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {logoutMutation.isPending ? "Saindo..." : "Sair"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className="w-full p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex justify-center"
            title="Sair"
          >
            {user?.profileImageUrl ? (
              <img 
                className="h-7 w-7 rounded-md object-cover" 
                src={user.profileImageUrl} 
                alt="Profile" 
              />
            ) : (
              <div className="h-7 w-7 rounded-md bg-gradient-to-br dark:from-purple-600 dark:to-purple-500 from-blue-600 to-blue-500 flex items-center justify-center">
                <span className="text-xs font-semibold text-white">
                  {user?.firstName?.[0] || user?.email?.[0] || "U"}
                </span>
              </div>
            )}
          </button>
        )}
      </div>
    </div>
  );
}