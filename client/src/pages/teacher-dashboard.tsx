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
import Nav from "@/components/ui/nav";
import { Plus, Users, FileText, BarChart3, Edit, Eye, MoreVertical, Trash2, Pause, Play, Palette, PencilIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Class } from "@shared/schema";

export default function TeacherDashboard() {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const isAuthenticated = !!user;

  // Estados para modais e edição
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [editName, setEditName] = useState("");
  const [deletingClass, setDeletingClass] = useState<Class | null>(null);
  const [changingColorClass, setChangingColorClass] = useState<Class | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  // Query para buscar contagens de respostas por turma
  const { data: responseCounts = {} } = useQuery<Record<string, number>>({
    queryKey: ["/api/classes/response-counts"],
    retry: false,
    enabled: classes.length > 0, // Só executa se há turmas
  });

  // Mutation para atualizar nome da turma
  const updateClassMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      return await apiRequest("PUT", `/api/classes/${id}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({
        title: "Sucesso!",
        description: "Nome da turma atualizado com sucesso!",
      });
      setEditingClass(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar nome da turma",
        variant: "destructive",
      });
    },
  });

  // Mutation para alternar status da turma
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return await apiRequest("PUT", `/api/classes/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({
        title: "Sucesso!",
        description: "Status da turma atualizado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao alterar status da turma",
        variant: "destructive",
      });
    },
  });

  // Mutation para deletar turma
  const deleteClassMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/classes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({
        title: "Sucesso!",
        description: "Turma deletada com sucesso!",
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

  // Opções de cores para as turmas
  const colorOptions = [
    "bg-gradient-to-br from-blue-500 to-blue-700",
    "bg-gradient-to-br from-purple-500 to-purple-700", 
    "bg-gradient-to-br from-green-500 to-green-700",
    "bg-gradient-to-br from-red-500 to-red-700",
    "bg-gradient-to-br from-yellow-500 to-yellow-700",
    "bg-gradient-to-br from-pink-500 to-pink-700",
    "bg-gradient-to-br from-indigo-500 to-indigo-700",
    "bg-gradient-to-br from-teal-500 to-teal-700",
    "bg-gradient-to-br from-orange-500 to-orange-700",
    "bg-gradient-to-br from-cyan-500 to-cyan-700"
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
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Nav />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 
                className={`text-3xl font-bold transition-all duration-300 ${
                  isDarkMode 
                    ? 'text-white' 
                    : 'text-matchskills-blue-800'
                }`}
                style={isDarkMode ? { textShadow: '0 0 20px rgba(255, 255, 255, 0.5)' } : {}}
              >
                Dashboard
              </h1>
              <p 
                className={`mt-1 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}
                style={isDarkMode ? { textShadow: '0 0 10px rgba(255, 255, 255, 0.3)' } : {}}
              >
                Gerencie suas avaliações e formulários
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button 
                className="bg-matchskills-green-500 hover:bg-matchskills-green-600 text-white shadow-sm transition-colors duration-200"
                onClick={() => setLocation('/create-class')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Avaliação
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className={`transition-all duration-300 ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'border border-gray-200'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${
                  isDarkMode 
                    ? 'bg-blue-500 bg-opacity-20' 
                    : 'bg-matchskills-blue-100'
                }`}>
                  <Users className={`text-xl ${
                    isDarkMode 
                      ? 'text-blue-400' 
                      : 'text-matchskills-blue-600'
                  }`} />
                </div>
                <div className="ml-4">
                  <p className={`text-sm font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Total de Turmas
                  </p>
                  <p 
                    className={`text-2xl font-bold ${
                      isDarkMode ? 'text-white' : 'text-matchskills-blue-800'
                    }`}
                    style={isDarkMode ? { textShadow: '0 0 10px rgba(59, 130, 246, 0.5)' } : {}}
                  >
                    {totalClasses}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={`transition-all duration-300 ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'border border-gray-200'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${
                  isDarkMode 
                    ? 'bg-green-500 bg-opacity-20' 
                    : 'bg-matchskills-green-100'
                }`}>
                  <FileText className={`text-xl ${
                    isDarkMode 
                      ? 'text-green-400' 
                      : 'text-matchskills-green-600'
                  }`} />
                </div>
                <div className="ml-4">
                  <p className={`text-sm font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Formulários Ativos
                  </p>
                  <p 
                    className={`text-2xl font-bold ${
                      isDarkMode ? 'text-white' : 'text-matchskills-blue-800'
                    }`}
                    style={isDarkMode ? { textShadow: '0 0 10px rgba(34, 197, 94, 0.5)' } : {}}
                  >
                    {activeClasses}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Classes Grid */}
        <Card className={`transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'border border-gray-200'
        }`}>
          <div className={`px-6 py-4 transition-colors duration-300 ${
            isDarkMode 
              ? 'border-b border-gray-700' 
              : 'border-b border-gray-200'
          }`}>
            <h2 
              className={`text-lg font-semibold transition-all duration-300 ${
                isDarkMode ? 'text-white' : 'text-matchskills-blue-800'
              }`}
              style={isDarkMode ? { textShadow: '0 0 10px rgba(255, 255, 255, 0.3)' } : {}}
            >
              Suas Turmas
            </h2>
          </div>
          <CardContent className="p-6">
            {classesLoading ? (
              <div className={`text-center py-8 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-900'
              }`}>
                Carregando turmas...
              </div>
            ) : classes.length === 0 ? (
              <div className="text-center py-8">
                <FileText className={`mx-auto h-12 w-12 mb-4 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <h3 className={`text-lg font-medium mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Nenhuma turma criada
                </h3>
                <p className={`mb-4 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Comece criando sua primeira turma
                </p>
                <Button 
                  className="bg-matchskills-green-500 hover:bg-matchskills-green-600 text-white transition-colors duration-200"
                  onClick={() => setLocation('/create-class')}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeira Turma
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map((classItem, index) => {
                  const classColor = getClassColor(classItem);
                  const colorBase = classColor.includes('blue') ? 'blue' : 
                                   classColor.includes('green') ? 'green' :
                                   classColor.includes('purple') ? 'purple' :
                                   classColor.includes('red') ? 'red' :
                                   classColor.includes('yellow') ? 'yellow' :
                                   classColor.includes('pink') ? 'pink' :
                                   classColor.includes('indigo') ? 'indigo' :
                                   classColor.includes('teal') ? 'teal' :
                                   classColor.includes('orange') ? 'orange' :
                                   classColor.includes('cyan') ? 'cyan' : 'blue';

                return (
                  <div 
                    key={classItem.id} 
                    className={`${classColor} rounded-lg p-6 text-white`}
                    style={getGlowStyle(colorBase)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{classItem.name}</h3>
                        <p className="text-white text-opacity-75 text-sm mt-1">
                          Código: {classItem.code}
                        </p>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-white hover:text-white hover:bg-white hover:bg-opacity-20 p-1 h-8 w-8"
                          >
                            <MoreVertical className="h-5 w-5" />
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
                    
                    <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                        <div className="text-center">
                          <div className="font-semibold">{classItem.studentLimit}</div>
                          <div className="text-white text-opacity-75 text-xs">Limite alunos</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{classItem.groupCount}</div>
                          <div className="text-white text-opacity-75 text-xs">Grupos</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{responseCounts[classItem.id] || 0}</div>
                          <div className="text-white text-opacity-75 text-xs">Respostas</div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 mb-4">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-0"
                          onClick={() => setLocation(`/edit-class/${classItem.id}`)}
                        >
                          <Edit className="mr-1 h-4 w-4" />
                          Editar
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-0"
                          onClick={() => setLocation(`/class/${classItem.id}/responses`)}
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          Respostas
                        </Button>
                      </div>
                      
                      <div className="pt-3 border-t border-white border-opacity-25">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white text-opacity-75">Status:</span>
                          <Badge 
                            variant={classItem.isActive ? "default" : "secondary"}
                            className={classItem.isActive 
                              ? "bg-green-500 hover:bg-green-600 text-white border-0" 
                              : "bg-gray-500 hover:bg-gray-600 text-white border-0"
                            }
                          >
                            {classItem.isActive ? "Ativo" : "Pausado"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
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
              Tem certeza que deseja deletar a turma "{deletingClass?.name}"? 
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
          <div className="grid grid-cols-5 gap-3">
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
