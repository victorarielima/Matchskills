import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

interface DarkModeToggleProps {
  compact?: boolean;
}

export default function DarkModeToggle({ compact = false }: DarkModeToggleProps) {
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Verifica se o dark mode está habilitado no localStorage ao carregar
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    
    if (savedDarkMode === 'enabled' || savedDarkMode === 'disabled') {
      // Se há preferência salva do usuário, usa ela
      const isDarkMode = savedDarkMode === 'enabled';
      setDarkMode(isDarkMode);
      
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      // Se não há preferência salva, detecta do sistema e salva como preferência inicial
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const systemPrefersDark = mediaQuery.matches;
      
      setDarkMode(systemPrefersDark);
      localStorage.setItem('darkMode', systemPrefersDark ? 'enabled' : 'disabled');
      
      if (systemPrefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
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

  // Versão compacta (ícone com decoração interna)
  if (compact) {
    return (
      <button
        onClick={toggleDarkMode}
        className="relative p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors overflow-visible"
        aria-label="Toggle dark mode"
        title={darkMode ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
      >
        {darkMode ? (
          <div className="relative w-[18px] h-[18px]">
            {/* Ícone da lua com céu de fundo */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-900 via-purple-900 to-purple-800 flex items-center justify-center">
              {/* Estrelas dentro */}
              <div className="absolute top-[3px] left-[4px] w-[2px] h-[2px] bg-yellow-200 rounded-full animate-pulse" />
              <div className="absolute top-[6px] right-[3px] w-[1.5px] h-[1.5px] bg-purple-200 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
              <div className="absolute bottom-[4px] left-[5px] w-[1px] h-[1px] bg-white rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
              <div className="absolute top-[9px] left-[7px] w-[1.5px] h-[1.5px] bg-yellow-300 rounded-full" />
              <div className="absolute bottom-[7px] right-[5px] w-[1px] h-[1px] bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '0.9s' }} />
              {/* Lua em destaque */}
              <Moon className="w-[14px] h-[14px] text-purple-200 relative z-10" strokeWidth={2.5} />
            </div>
          </div>
        ) : (
          <div className="relative w-[18px] h-[18px]">
            {/* Ícone do sol com céu de fundo */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-sky-300 via-blue-200 to-blue-300 flex items-center justify-center">
              {/* Nuvens dentro */}
              <div className="absolute top-[4px] left-[3px] w-[4px] h-[2px] bg-white/60 rounded-full" />
              <div className="absolute top-[7px] right-[2px] w-[5px] h-[2.5px] bg-white/50 rounded-full" />
              <div className="absolute bottom-[5px] left-[4px] w-[3px] h-[2px] bg-white/70 rounded-full" />
              <div className="absolute top-[10px] left-[6px] w-[2px] h-[1.5px] bg-white/40 rounded-full" />
              {/* Sol em destaque */}
              <Sun className="w-[14px] h-[14px] text-yellow-400 relative z-10" strokeWidth={2.5} />
            </div>
          </div>
        )}
      </button>
    );
  }

  // Versão completa (sol/lua + toggle com decoração + lua/sol)
  return (
    <div className="flex items-center gap-2">
      {/* Ícone Sol */}
      <Sun className="w-4 h-4 text-yellow-500 dark:text-gray-600 flex-shrink-0" />
      
      {/* Toggle Switch com decoração */}
      <button
        onClick={toggleDarkMode}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 dark:focus:ring-purple-500 focus:ring-blue-500 focus:ring-offset-2 overflow-hidden ${
          darkMode 
            ? 'bg-gradient-to-r from-indigo-900 via-purple-900 to-purple-800' 
            : 'bg-gradient-to-r from-blue-400 via-sky-300 to-blue-400'
        }`}
        aria-label="Toggle dark mode"
      >
        {/* Decoração de fundo - Estrelas (modo escuro) */}
        {darkMode && (
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1 left-1 w-[2px] h-[2px] bg-yellow-200 rounded-full animate-pulse" />
            <div className="absolute top-2 right-2 w-[1.5px] h-[1.5px] bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
            <div className="absolute bottom-1 left-3 w-[1px] h-[1px] bg-white rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
            <div className="absolute top-1 right-5 w-[1.5px] h-[1.5px] bg-purple-200 rounded-full" />
            <div className="absolute bottom-1.5 right-1 w-[1px] h-[1px] bg-yellow-300 rounded-full animate-pulse" style={{ animationDelay: '0.9s' }} />
          </div>
        )}
        
        {/* Decoração de fundo - Nuvens (modo claro) */}
        {!darkMode && (
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0.5 left-1 w-[4px] h-[2px] bg-white/40 rounded-full" />
            <div className="absolute top-1.5 right-1.5 w-[5px] h-[2.5px] bg-white/30 rounded-full" />
            <div className="absolute bottom-0.5 left-3 w-[3px] h-[2px] bg-white/50 rounded-full" />
          </div>
        )}

        {/* Botão deslizante */}
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
            darkMode ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>

      {/* Ícone Lua */}
      <Moon className="w-4 h-4 text-gray-600 dark:text-purple-400 flex-shrink-0" />
    </div>
  );
}
