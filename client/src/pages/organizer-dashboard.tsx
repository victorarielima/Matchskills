import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import SidebarDashboard from "@/components/ui/sidebar-dashboard";
import { Plus, Users, FileText, Edit, Eye, MoreVertical, Trash2, Pause, Play, Palette, PencilIcon, Shuffle, TrendingUp, Activity, Calendar, UserCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Class } from "@shared/schema";

export default function OrganizerDashboard() {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const isAuthenticated = !!user;

  // Estados para modais e edição
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [editName, setEditName] = useState("");
  const [deletingClass, setDeletingClass] = useState<Class | null>(null);
  const [changingColorClass, setChangingColorClass] = useState<Class | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Detecção inicial do modo escuro
    return document.documentElement.classList.contains('dark');
  });

  // Detecção de modo escuro
  useEffect(() => {
    const checkDarkMode = () => {
      // Foca apenas na classe 'dark' aplicada ao html/documentElement
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    checkDarkMode();
    
    // Observer para mudanças no DOM
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/');
      return;
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // Função para aplicar efeito glow no modo escuro
  const getGlowStyle = (baseColor: string) => {
    if (!isDarkMode) return {};
    
    const glowColors: Record<string, string> = {
      'blue': '0 0 20px rgba(59, 130, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.2)',
      'green': '0 0 20px rgba(34, 197, 94, 0.4), 0 0 40px rgba(34, 197, 94, 0.2)',
      'purple': '0 0 20px rgba(147, 51, 234, 0.4), 0 0 40px rgba(147, 51, 234, 0.2)',
      'red': '0 0 20px rgba(239, 68, 68, 0.4), 0 0 40px rgba(239, 68, 68, 0.2)',
      'yellow': '0 0 20px rgba(245, 158, 11, 0.4), 0 0 40px rgba(245, 158, 11, 0.2)',
      'pink': '0 0 20px rgba(236, 72, 153, 0.4), 0 0 40px rgba(236, 72, 153, 0.2)',
      'indigo': '0 0 20px rgba(99, 102, 241, 0.4), 0 0 40px rgba(99, 102, 241, 0.2)',
      'teal': '0 0 20px rgba(20, 184, 166, 0.4), 0 0 40px rgba(20, 184, 166, 0.2)',
      'orange': '0 0 20px rgba(249, 115, 22, 0.4), 0 0 40px rgba(249, 115, 22, 0.2)',
      'cyan': '0 0 20px rgba(6, 182, 212, 0.4), 0 0 40px rgba(6, 182, 212, 0.2)'
    };

    return {
      boxShadow: glowColors[baseColor] || glowColors['blue'],
      transition: 'box-shadow 0.3s ease-in-out'
    };
  };

  const { data: classes = [], isLoading: classesLoading } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
    retry: false,
  });

  // Query para buscar contagens de respostas por grupo
  const { data: responseCounts = {} } = useQuery<Record<string, number>>({
    queryKey: ["/api/classes/response-counts"],
    retry: false,
    enabled: classes.length > 0, // Só executa se há grupos
  });

  // Query para buscar respostas recentes
  const { data: recentResponses = [] } = useQuery<Array<{
    id: string;
    classId: string;
    studentName: string;
    studentEmail: string | null;
    submittedAt: Date | null;
    className: string;
  }>>({
    queryKey: ["/api/recent-responses"],
    retry: false,
  });

  // Query para buscar estatísticas de grupos
  const { data: groupStats } = useQuery<{
    totalGroupsCreated: number;
    studentsInGroups: number;
    studentsWithoutGroup: number;
  }>({
    queryKey: ["/api/group-stats"],
    retry: false,
  });

  // Mutation para atualizar nome do grupo
  const updateClassMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      return await apiRequest("PUT", `/api/classes/${id}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({
        title: "Sucesso!",
        description: "Nome do grupo atualizado com sucesso!",
      });
      setEditingClass(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar nome do grupo",
        variant: "destructive",
      });
    },
  });

  // Mutation para alternar status do grupo
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return await apiRequest("PUT", `/api/classes/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({
        title: "Sucesso!",
        description: "Status do grupo atualizado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao alterar status do grupo",
        variant: "destructive",
      });
    },
  });

  // Mutation para deletar grupo
  const deleteClassMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/classes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({
        title: "Sucesso!",
        description: "Grupo deletado com sucesso!",
      });
      setDeletingClass(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao deletar turma",
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar cor da turma
  const updateColorMutation = useMutation({
    mutationFn: async ({ classId, colorIndex }: { classId: string; colorIndex: number }) => {
      return await apiRequest("PATCH", `/api/classes/${classId}/color`, { colorIndex });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({
        title: "Sucesso!",
        description: "Cor da turma atualizada!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar cor da turma",
        variant: "destructive",
      });
    },
  });

  const totalClasses = classes.length;
  const activeClasses = classes.filter(c => c.isActive).length;

  // Função para formatar o horário da resposta
  const formatResponseTime = (date: Date | null) => {
    if (!date) return '';
    
    const responseDate = new Date(date);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - responseDate.getTime()) / (1000 * 60 * 60));
    const diffInMinutes = Math.floor((now.getTime() - responseDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Agora mesmo';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} min atrás`;
    } else if (diffInHours < 24) {
      const hours = responseDate.getHours();
      const minutes = responseDate.getMinutes();
      return `às ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } else {
      const day = responseDate.getDate();
      const month = responseDate.getMonth() + 1;
      return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}`;
    }
  };

  // Opções de cores para as turmas - Shoplay inspired
  const colorOptions = [
    "bg-gradient-to-br dark:from-purple-600 dark:to-purple-500 from-blue-600 to-blue-500",
    "bg-gradient-to-br from-green-500 to-green-400", 
    "bg-gradient-to-br from-orange-500 to-orange-400",
    "bg-gradient-to-br from-blue-500 to-blue-600",
    "bg-gradient-to-br from-indigo-500 to-indigo-600",
    "bg-gradient-to-br from-pink-500 to-pink-600"
  ];

  // Função para obter a cor da turma baseada no colorIndex salvo no banco
  const getClassColor = (classItem: Class) => {
    const colorIndex = classItem.colorIndex || 0;
    return colorOptions[colorIndex] || colorOptions[0];
  };

  // Funções helper
  const openEditDialog = (classItem: Class) => {
    setEditingClass(classItem);
    setEditName(classItem.name);
  };

  const handleUpdateName = () => {
    if (editingClass && editName.trim()) {
      updateClassMutation.mutate({ id: editingClass.id, name: editName.trim() });
    }
  };

  const handleToggleStatus = (classItem: Class) => {
    toggleStatusMutation.mutate({ id: classItem.id, isActive: !classItem.isActive });
  };

  const openDeleteDialog = (classItem: Class) => {
    setDeletingClass(classItem);
  };

  const handleDelete = () => {
    if (deletingClass) {
      deleteClassMutation.mutate(deletingClass.id);
    }
  };

  const openColorDialog = (classItem: Class) => {
    setChangingColorClass(classItem);
  };

  const handleColorChange = (colorIndex: number) => {
    if (changingColorClass) {
      updateColorMutation.mutate({ 
        classId: changingColorClass.id, 
        colorIndex 
      });
      setChangingColorClass(null);
    }
  };

  if (isLoading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <SidebarDashboard />
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto transition-all duration-300" style={{ marginLeft: 'var(--sidebar-width, 16rem)' }}>
        <div className="p-8">
          {/* Welcome Card - Shoplay Style */}
          <div className="mt-6 mb-8">
            <Card className="bg-gradient-to-br dark:from-purple-600 dark:to-purple-500 from-blue-600 to-blue-500 border-0 text-white overflow-hidden relative">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div className="max-w-md">
                    <h2 className="text-2xl font-bold mb-3">Bem-vindo ao MatchSkills!</h2>
                    <p className="text-white/90 mb-6 leading-relaxed">
                      Explore as últimas tendências, crie avaliações personalizadas e acompanhe o progresso dos participantes.
                    </p>
                    <Button 
                      className="bg-white dark:text-purple-600 text-blue-600 hover:bg-gray-100 border-0 shadow-lg"
                      onClick={() => setLocation('/create-class')}
                    >
                      Começar agora
                    </Button>
                  </div>
                  
                  {/* Decorative Sky Scene */}
                  <div className="hidden lg:flex items-center justify-center relative w-64 h-48 overflow-hidden">
                    {/* Modo Escuro - Lua com Estrelas */}
                    <div className="dark:opacity-100 dark:scale-100 opacity-0 scale-50 transition-all duration-1000 ease-in-out absolute inset-0 flex items-center justify-center">
                      {/* Lua - desce do topo */}
                      <div className="absolute w-32 h-32 rounded-full bg-gradient-to-br from-gray-100 to-gray-300 dark:translate-y-0 translate-y-[-250%] transition-all duration-1000 ease-out delay-200">
                        {/* Crateras */}
                        <div className="absolute top-[25%] left-[20%] w-5 h-5 rounded-full bg-gray-400/30 transition-opacity duration-700 delay-500 dark:opacity-30 opacity-0"></div>
                        <div className="absolute bottom-[30%] right-[25%] w-4 h-4 rounded-full bg-gray-400/25 transition-opacity duration-700 delay-600 dark:opacity-25 opacity-0"></div>
                        <div className="absolute top-[45%] left-[35%] w-3 h-3 rounded-full bg-gray-400/20 transition-opacity duration-700 delay-700 dark:opacity-20 opacity-0"></div>
                        <div className="absolute top-[60%] right-[40%] w-2.5 h-2.5 rounded-full bg-gray-400/15 transition-opacity duration-700 delay-750 dark:opacity-15 opacity-0"></div>
                      </div>
                      
                      {/* Estrelas - aparecem gradualmente (mais estrelas) */}
                      <div className="absolute top-[15%] left-[15%] w-2 h-2 bg-yellow-200 rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,150,0.8)] transition-all duration-500 delay-700 dark:opacity-100 dark:scale-100 opacity-0 scale-0"></div>
                      <div className="absolute top-[25%] right-[20%] w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_6px_rgba(255,255,255,0.8)] transition-all duration-500 delay-800 dark:opacity-100 dark:scale-100 opacity-0 scale-0" style={{ animationDelay: '0.3s' }}></div>
                      <div className="absolute bottom-[20%] left-[25%] w-2 h-2 bg-blue-200 rounded-full animate-pulse shadow-[0_0_8px_rgba(200,220,255,0.8)] transition-all duration-500 delay-900 dark:opacity-100 dark:scale-100 opacity-0 scale-0" style={{ animationDelay: '0.6s' }}></div>
                      <div className="absolute top-[35%] right-[15%] w-1 h-1 bg-yellow-100 rounded-full animate-pulse shadow-[0_0_4px_rgba(255,255,200,0.8)] transition-all duration-500 delay-1000 dark:opacity-100 dark:scale-100 opacity-0 scale-0" style={{ animationDelay: '0.9s' }}></div>
                      <div className="absolute bottom-[35%] right-[30%] w-1.5 h-1.5 bg-purple-200 rounded-full animate-pulse shadow-[0_0_6px_rgba(220,200,255,0.8)] transition-all duration-500 delay-[1100ms] dark:opacity-100 dark:scale-100 opacity-0 scale-0" style={{ animationDelay: '1.2s' }}></div>
                      <div className="absolute top-[60%] left-[10%] w-1 h-1 bg-white rounded-full animate-pulse shadow-[0_0_4px_rgba(255,255,255,0.8)] transition-all duration-500 delay-[1200ms] dark:opacity-100 dark:scale-100 opacity-0 scale-0" style={{ animationDelay: '1.5s' }}></div>
                      
                      {/* Mais estrelas */}
                      <div className="absolute top-[10%] left-[35%] w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_5px_rgba(255,255,255,0.7)] transition-all duration-500 delay-[750ms] dark:opacity-100 dark:scale-100 opacity-0 scale-0" style={{ animationDelay: '0.2s' }}></div>
                      <div className="absolute top-[45%] left-[8%] w-1 h-1 bg-blue-100 rounded-full animate-pulse shadow-[0_0_4px_rgba(200,220,255,0.7)] transition-all duration-500 delay-[850ms] dark:opacity-100 dark:scale-100 opacity-0 scale-0" style={{ animationDelay: '0.5s' }}></div>
                      <div className="absolute bottom-[15%] right-[12%] w-1.5 h-1.5 bg-yellow-100 rounded-full animate-pulse shadow-[0_0_5px_rgba(255,255,200,0.7)] transition-all duration-500 delay-[950ms] dark:opacity-100 dark:scale-100 opacity-0 scale-0" style={{ animationDelay: '0.8s' }}></div>
                      <div className="absolute top-[70%] right-[25%] w-1 h-1 bg-purple-100 rounded-full animate-pulse shadow-[0_0_4px_rgba(220,200,255,0.7)] transition-all duration-500 delay-[1050ms] dark:opacity-100 dark:scale-100 opacity-0 scale-0" style={{ animationDelay: '1.1s' }}></div>
                      <div className="absolute top-[20%] right-[35%] w-1 h-1 bg-white rounded-full animate-pulse shadow-[0_0_4px_rgba(255,255,255,0.7)] transition-all duration-500 delay-[1150ms] dark:opacity-100 dark:scale-100 opacity-0 scale-0" style={{ animationDelay: '1.4s' }}></div>
                      <div className="absolute bottom-[50%] left-[5%] w-1.5 h-1.5 bg-blue-200 rounded-full animate-pulse shadow-[0_0_5px_rgba(200,220,255,0.7)] transition-all duration-500 delay-[1250ms] dark:opacity-100 dark:scale-100 opacity-0 scale-0" style={{ animationDelay: '1.7s' }}></div>
                      <div className="absolute bottom-[45%] right-[8%] w-1 h-1 bg-yellow-200 rounded-full animate-pulse shadow-[0_0_4px_rgba(255,255,150,0.7)] transition-all duration-500 delay-[800ms] dark:opacity-100 dark:scale-100 opacity-0 scale-0" style={{ animationDelay: '0.4s' }}></div>
                      <div className="absolute top-[50%] left-[30%] w-1 h-1 bg-white rounded-full animate-pulse shadow-[0_0_4px_rgba(255,255,255,0.7)] transition-all duration-500 delay-[900ms] dark:opacity-100 dark:scale-100 opacity-0 scale-0" style={{ animationDelay: '0.7s' }}></div>
                    </div>

                    {/* Modo Claro - Sol com Nuvens */}
                    <div className="dark:opacity-0 dark:scale-50 opacity-100 scale-100 transition-all duration-1000 ease-in-out absolute inset-0 flex items-center justify-center">
                      {/* Sol - sobe do fundo */}
                      <div className="absolute w-28 h-28 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 dark:translate-y-[250%] translate-y-0 transition-all duration-1000 ease-out delay-200"></div>
                      
                      {/* Nuvens - deslizam da direita com movimento flutuante ultra suave e lento */}
                      <div className="absolute top-[15%] right-[10%] dark:translate-x-[200%] translate-x-0 transition-all duration-1000 delay-700 ease-out animate-[float_25s_ease-in-out_infinite]">
                        <div className="relative">
                          <div className="w-12 h-6 bg-white/80 rounded-full transition-opacity duration-500 dark:opacity-0 opacity-80"></div>
                          <div className="absolute -top-2 left-3 w-8 h-8 bg-white/80 rounded-full transition-opacity duration-500 dark:opacity-0 opacity-80"></div>
                          <div className="absolute -top-1 right-2 w-10 h-7 bg-white/80 rounded-full transition-opacity duration-500 dark:opacity-0 opacity-80"></div>
                        </div>
                      </div>
                      
                      <div className="absolute bottom-[20%] left-[5%] dark:-translate-x-[200%] translate-x-0 transition-all duration-1000 delay-800 ease-out animate-[float_30s_ease-in-out_infinite]" style={{ animationDelay: '5s' }}>
                        <div className="relative">
                          <div className="w-10 h-5 bg-white/70 rounded-full transition-opacity duration-500 dark:opacity-0 opacity-70"></div>
                          <div className="absolute -top-1.5 left-2 w-7 h-7 bg-white/70 rounded-full transition-opacity duration-500 dark:opacity-0 opacity-70"></div>
                          <div className="absolute -top-1 right-1 w-8 h-6 bg-white/70 rounded-full transition-opacity duration-500 dark:opacity-0 opacity-70"></div>
                        </div>
                      </div>
                      
                      <div className="absolute top-[55%] right-[15%] dark:translate-x-[200%] translate-x-0 transition-all duration-1000 delay-900 ease-out animate-[float_35s_ease-in-out_infinite]" style={{ animationDelay: '10s' }}>
                        <div className="relative">
                          <div className="w-8 h-4 bg-white/60 rounded-full transition-opacity duration-500 dark:opacity-0 opacity-60"></div>
                          <div className="absolute -top-1 left-1.5 w-6 h-6 bg-white/60 rounded-full transition-opacity duration-500 dark:opacity-0 opacity-60"></div>
                          <div className="absolute -top-0.5 right-1 w-7 h-5 bg-white/60 rounded-full transition-opacity duration-500 dark:opacity-0 opacity-60"></div>
                        </div>
                      </div>
                      
                      {/* Mais nuvens */}
                      <div className="absolute top-[30%] left-[15%] dark:-translate-x-[200%] translate-x-0 transition-all duration-1000 delay-[750ms] ease-out animate-[float_28s_ease-in-out_infinite]" style={{ animationDelay: '3s' }}>
                        <div className="relative">
                          <div className="w-9 h-4 bg-white/65 rounded-full transition-opacity duration-500 dark:opacity-0 opacity-65"></div>
                          <div className="absolute -top-1 left-2 w-6 h-6 bg-white/65 rounded-full transition-opacity duration-500 dark:opacity-0 opacity-65"></div>
                          <div className="absolute -top-0.5 right-1.5 w-7 h-5 bg-white/65 rounded-full transition-opacity duration-500 dark:opacity-0 opacity-65"></div>
                        </div>
                      </div>
                      
                      <div className="absolute bottom-[35%] right-[8%] dark:translate-x-[200%] translate-x-0 transition-all duration-1000 delay-[850ms] ease-out animate-[float_32s_ease-in-out_infinite]" style={{ animationDelay: '8s' }}>
                        <div className="relative">
                          <div className="w-7 h-3.5 bg-white/55 rounded-full transition-opacity duration-500 dark:opacity-0 opacity-55"></div>
                          <div className="absolute -top-1 left-1.5 w-5 h-5 bg-white/55 rounded-full transition-opacity duration-500 dark:opacity-0 opacity-55"></div>
                          <div className="absolute -top-0.5 right-1 w-6 h-4 bg-white/55 rounded-full transition-opacity duration-500 dark:opacity-0 opacity-55"></div>
                        </div>
                      </div>
                      
                      <div className="absolute top-[8%] left-[35%] dark:-translate-x-[200%] translate-x-0 transition-all duration-1000 delay-[950ms] ease-out animate-[float_27s_ease-in-out_infinite]" style={{ animationDelay: '6s' }}>
                        <div className="relative">
                          <div className="w-8 h-4 bg-white/70 rounded-full transition-opacity duration-500 dark:opacity-0 opacity-70"></div>
                          <div className="absolute -top-1 left-2 w-6 h-6 bg-white/70 rounded-full transition-opacity duration-500 dark:opacity-0 opacity-70"></div>
                          <div className="absolute -top-0.5 right-1 w-7 h-5 bg-white/70 rounded-full transition-opacity duration-500 dark:opacity-0 opacity-70"></div>
                        </div>
                      </div>
                      
                      <div className="absolute bottom-[8%] left-[25%] dark:-translate-x-[200%] translate-x-0 transition-all duration-1000 delay-[1050ms] ease-out animate-[float_33s_ease-in-out_infinite]" style={{ animationDelay: '12s' }}>
                        <div className="relative">
                          <div className="w-6 h-3 bg-white/50 rounded-full transition-opacity duration-500 dark:opacity-0 opacity-50"></div>
                          <div className="absolute -top-1 left-1.5 w-4 h-4 bg-white/50 rounded-full transition-opacity duration-500 dark:opacity-0 opacity-50"></div>
                          <div className="absolute -top-0.5 right-1 w-5 h-3.5 bg-white/50 rounded-full transition-opacity duration-500 dark:opacity-0 opacity-50"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Formulários Ativos
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {activeClasses}
                    </p>
                    <div className="flex items-center mt-2">
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full font-medium">
                        Recebendo respostas
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-green-100 rounded-xl">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Formulários Pausados
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {totalClasses - activeClasses}
                    </p>
                    <div className="flex items-center mt-2">
                      <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full font-medium">
                        Pausado
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-100 rounded-xl">
                    <Pause className="w-6 h-6 text-gray-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Usuários sem Grupo
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {groupStats?.studentsWithoutGroup || 0}
                    </p>
                    <div className="flex items-center mt-2">
                      <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full font-medium">
                        Aguardando
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <UserCircle className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Usuários em Grupos
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {groupStats?.studentsInGroups || 0}
                    </p>
                    <div className="flex items-center mt-2">
                      <span className="text-xs dark:text-purple-600 text-blue-600 dark:bg-purple-100 bg-blue-100 px-2 py-1 rounded-full font-medium">
                        Agrupados
                      </span>
                    </div>
                  </div>
                  <div className="p-3 dark:bg-purple-100 bg-blue-100 rounded-xl">
                    <Users className="w-6 h-6 dark:text-purple-600 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Classes Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Classes Section */}
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Seus Formulários
                  </h2>
                </div>
                <CardContent className="p-6">
                  {classesLoading ? (
                    <div className="text-center py-8 text-gray-500">
                      Carregando turmas...
                    </div>
                  ) : classes.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">
                        Nenhuma turma criada
                      </h3>
                      <p className="mb-4 text-gray-600 dark:text-gray-300">
                        Comece criando sua primeira turma
                      </p>
                      <Button 
                        className="bg-gradient-to-r from-shoplay-green to-shoplay-green-light text-white border-0 shadow-lg"
                        onClick={() => setLocation('/create-class')}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Criar Primeiro Grupo
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {classes.slice(0, 6).map((classItem, index) => {
                        const classColor = getClassColor(classItem);
                        const colorBase = classColor.includes('purple') ? 'purple' : 
                                         classColor.includes('green') ? 'green' :
                                         classColor.includes('coral') ? 'coral' :
                                         classColor.includes('blue') ? 'blue' :
                                         classColor.includes('indigo') ? 'indigo' :
                                         classColor.includes('pink') ? 'pink' : 'purple';

                        return (
                          <Card 
                            key={classItem.id} 
                            className={`${classColor} border-0 relative overflow-hidden h-[270px] flex flex-col`}
                          >
                            <CardContent className="p-6 flex flex-col h-full">
                              {/* Header */}
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1 min-w-0 pr-2">
                                  <h3 className="font-bold text-white text-base mb-2 line-clamp-2 leading-tight h-[40px] overflow-hidden text-ellipsis">
                                    {classItem.name}
                                  </h3>
                                  <p className="text-white/70 text-xs font-medium mb-2">
                                    Código: {classItem.code}
                                  </p>
                                  <Badge 
                                    className={classItem.isActive
                                      ? "bg-white/90 text-green-700 border-0 text-xs font-medium px-2 py-0.5"
                                      : "bg-white/60 text-gray-700 border-0 text-xs font-medium px-2 py-0.5"
                                    }
                                  >
                                    {classItem.isActive ? "Ativo" : "Pausado"}
                                  </Badge>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/10 flex-shrink-0">
                                      <MoreVertical className="h-4 w-4 text-white" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={() => openEditDialog(classItem)}>
                                      <PencilIcon className="mr-2 h-4 w-4" />
                                      Editar Nome
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleToggleStatus(classItem)}>
                                      {classItem.isActive ? (
                                        <>
                                          <Pause className="mr-2 h-4 w-4" />
                                          Pausar Formulário
                                        </>
                                      ) : (
                                        <>
                                          <Play className="mr-2 h-4 w-4" />
                                          Ativar Formulário
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openColorDialog(classItem)}>
                                      <Palette className="mr-2 h-4 w-4" />
                                      Mudar Cor
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => openDeleteDialog(classItem)}
                                      className="text-red-600 focus:text-red-600"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Deletar Turma
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              {/* Info */}
                              <div className="mb-4">
                                <span className="text-white/90 text-sm font-medium">
                                  {responseCounts[classItem.id] || 0} respostas
                                </span>
                              </div>

                              {/* Botões - fixados no bottom */}
                              <div className="flex flex-col gap-2 mt-auto">
                                <div className="flex gap-2">
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setLocation(`/class/${classItem.id}/responses`);
                                    }}
                                    size="sm"
                                    className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm h-8 text-xs font-medium"
                                  >
                                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                                    Ver Respostas
                                  </Button>
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setLocation(`/class/${classItem.id}/groups`);
                                    }}
                                    size="sm"
                                    className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm h-8 text-xs font-medium"
                                  >
                                    <UserCircle className="mr-1.5 h-3.5 w-3.5" />
                                    Dividir Grupos
                                  </Button>
                                </div>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setLocation(`/edit-class/${classItem.id}`);
                                  }}
                                  size="sm"
                                  className="w-full bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm h-8 text-xs font-medium"
                                >
                                  <Edit className="mr-1.5 h-3.5 w-3.5" />
                                  Editar Questões
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Activity History Sidebar */}
            <div className="lg:col-span-1">
              <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Histórico de Atividades
                    </h2>
                    <Button variant="ghost" size="sm" className="text-gray-500">
                      Ver todas
                    </Button>
                  </div>
                </div>
                <CardContent className="p-6">
                  {recentResponses.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Activity className="mx-auto h-12 w-12 mb-2 text-gray-400" />
                      <p className="text-sm">Nenhuma resposta ainda</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentResponses.slice(0, 5).map((response) => (
                        <div key={response.id} className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br dark:from-shoplay-purple dark:to-shoplay-purple-light from-blue-600 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 dark:text-white">
                              <span className="font-medium">{response.studentName}</span>
                              {' '}respondeu o formulário{' '}
                              <span className="font-medium">"{response.className}"</span>
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {formatResponseTime(response.submittedAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para editar nome da turma */}
      <Dialog open={!!editingClass} onOpenChange={() => setEditingClass(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Nome da Turma</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Nome da turma"
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingClass(null)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateName}
              disabled={!editName.trim() || updateClassMutation.isPending}
            >
              {updateClassMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para confirmar exclusão */}
      <AlertDialog open={!!deletingClass} onOpenChange={() => setDeletingClass(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Turma</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o grupo "{deletingClass?.name}"? 
              Esta ação não pode ser desfeita e todos os dados serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteClassMutation.isPending}
            >
              {deleteClassMutation.isPending ? "Deletando..." : "Deletar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal para mudar cor */}
      <Dialog open={!!changingColorClass} onOpenChange={() => setChangingColorClass(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escolher Cor da Turma</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-6 gap-3">
            {colorOptions.map((colorClass, index) => (
              <button
                key={index}
                className={`${colorClass} w-12 h-12 rounded-lg border-2 border-transparent hover:border-gray-400 transition-colors`}
                onClick={() => handleColorChange(index)}
              />
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangingColorClass(null)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
