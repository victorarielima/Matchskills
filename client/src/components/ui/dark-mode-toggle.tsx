import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from './button';

export default function DarkModeToggle() {
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Verifica se o dark mode está habilitado no localStorage ao carregar
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    const isDarkMode = savedDarkMode === 'enabled';
    
    setDarkMode(isDarkMode);
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Função para habilitar o dark mode
  const enableDarkMode = () => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('darkMode', 'enabled');
    setDarkMode(true);
  };

  // Função para desabilitar o dark mode
  const disableDarkMode = () => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('darkMode', 'disabled');
    setDarkMode(false);
  };

  // Função para alternar o dark mode
  const toggleDarkMode = () => {
    if (darkMode) {
      disableDarkMode();
    } else {
      enableDarkMode();
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleDarkMode}
      className="relative w-10 h-10 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
      aria-label="Toggle dark mode"
    >
      {/* Sol - visível em dark mode */}
      <Sun 
        className={`absolute inset-0 w-5 h-5 m-auto text-gray-600 dark:text-yellow-400 transition-all duration-300 ${
          darkMode 
            ? 'rotate-0 scale-100 opacity-100' 
            : 'rotate-90 scale-0 opacity-0'
        }`} 
      />
      
      {/* Lua - visível em light mode */}
      <Moon 
        className={`absolute inset-0 w-5 h-5 m-auto text-gray-600 dark:text-blue-300 transition-all duration-300 ${
          !darkMode 
            ? 'rotate-0 scale-100 opacity-100' 
            : '-rotate-90 scale-0 opacity-0'
        }`} 
      />
    </Button>
  );
}
