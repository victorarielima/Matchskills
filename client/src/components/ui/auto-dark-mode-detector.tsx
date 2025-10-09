import { useEffect } from 'react';

export default function AutoDarkModeDetector() {
  useEffect(() => {
    // Verifica se há preferência salva pelo usuário
    const savedDarkMode = localStorage.getItem('darkMode');
    
    if (savedDarkMode === 'enabled' || savedDarkMode === 'disabled') {
      // Se o usuário já definiu uma preferência, usa ela
      if (savedDarkMode === 'enabled') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      // Se não há preferência salva, detecta automaticamente do sistema
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const updateTheme = (e: MediaQueryListEvent | MediaQueryList) => {
        if (e.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      };

      // Aplica o tema inicial
      updateTheme(mediaQuery);

      // Escuta mudanças na preferência do sistema
      mediaQuery.addEventListener('change', updateTheme);

      return () => {
        mediaQuery.removeEventListener('change', updateTheme);
      };
    }
  }, []);

  return null; // Este componente não renderiza nada
}