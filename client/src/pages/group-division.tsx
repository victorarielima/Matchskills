import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import Nav from "@/components/ui/nav";
import { ArrowLeft, Users, Shuffle, BarChart3, FileText, UserPlus, AlertTriangle } from "lucide-react";
import type { FormResponse, Class, GroupDivision, GroupMember } from "@shared/schema";

interface GroupWithMembers {
  groupNumber: number;
  members: FormResponse[];
}

interface AlertState {
  type: 'uneven' | 'capacity' | null;
  isOpen: boolean;
  data?: any;
}

export default function GroupDivision() {
  const { classId } = useParams<{ classId: string }>();
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const isAuthenticated = !!user;
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Estados principais
  const [divisionName, setDivisionName] = useState<string>("Divisão Principal");
  const [membersPerGroup, setMembersPerGroup] = useState<number>(4);
  const [prompt, setPrompt] = useState<string>("");
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [currentDivisionId, setCurrentDivisionId] = useState<string | null>(null);
  const [alertState, setAlertState] = useState<AlertState>({ type: null, isOpen: false });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Não autorizado",
        description: "Você foi desconectado. Redirecionando...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Dark mode detection
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    checkDarkMode();
    
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  // Limpar estado ao mudar de classe
  useEffect(() => {
    console.log("🧹 Limpando estado para nova classe:", classId);
    setGroups([]);
    setCurrentDivisionId(null);
    setDivisionName("Divisão Principal");
    setMembersPerGroup(4);
    setPrompt("");
  }, [classId]);

  // Buscar dados da classe
  const { data: classData, isLoading: isClassLoading } = useQuery({
    queryKey: ["class", classId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/classes/${classId}`, {
          credentials: "include"
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Unauthorized");
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.json();
      } catch (error) {
        console.error("Error fetching class:", error);
        if (error instanceof Error && error.message === "Unauthorized") {
          toast({
            title: "Sessão expirada",
            description: "Sua sessão expirou. Redirecionando para login...",
            variant: "destructive",
          });
          setTimeout(() => {
            window.location.href = "/api/login";
          }, 1000);
        }
        throw error;
      }
    },
    enabled: isAuthenticated && !!classId,
  });

  // Buscar respostas do formulário
  const { data: responses = [], isLoading: isResponsesLoading } = useQuery({
    queryKey: ["responses", classId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/classes/${classId}/responses`, {
          credentials: "include"
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Unauthorized");
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.json();
      } catch (error) {
        console.error("Error fetching responses:", error);
        if (error instanceof Error && error.message === "Unauthorized") {
          toast({
            title: "Sessão expirada",
            description: "Sua sessão expirou. Redirecionando para login...",
            variant: "destructive",
          });
          setTimeout(() => {
            window.location.href = "/api/login";
          }, 1000);
        }
        throw error;
      }
    },
    enabled: isAuthenticated && !!classId,
    staleTime: 0, // Sempre considerar dados como obsoletos
    gcTime: 0, // Não manter cache
  });

  // Buscar divisões existentes e carregar a única divisão da classe
  const { data: existingDivisions = [], isLoading: isDivisionsLoading, refetch: refetchDivisions } = useQuery({
    queryKey: ["groupDivisions", classId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/classes/${classId}/group-divisions`, {
          credentials: "include"
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Unauthorized");
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const divisions = await response.json();
        
        // Se há divisões existentes, carregar a primeira (deveria ser única)
        if (divisions.length > 0) {
          const division = divisions[0]; // Pegar a primeira divisão
          console.log("🔄 Carregando divisão existente:", division.name);
          setCurrentDivisionId(division.id);
          setDivisionName(division.name);
          setMembersPerGroup(division.membersPerGroup);
          setPrompt(division.prompt || "");
          
          // Carregar os grupos da divisão
          console.log("📥 Carregando grupos da divisão ID:", division.id);
          loadGroupsFromDivision(division.id);
        } else {
          console.log("📋 Nenhuma divisão existente encontrada - pronto para criar primeira divisão");
          setCurrentDivisionId(null);
          setGroups([]); // Limpar grupos se não há divisão
        }
        
        return divisions;
      } catch (error) {
        console.error("Error fetching group divisions:", error);
        return [];
      }
    },
    enabled: isAuthenticated && !!classId,
    staleTime: 0, // Sempre considerar dados como obsoletos
    gcTime: 0, // Não manter cache (substituiu cacheTime)
  });

  // Força refetch quando entrar na página com um classId
  useEffect(() => {
    if (classId && isAuthenticated && refetchDivisions) {
      console.log("🔃 Forçando refetch ao entrar na página para class:", classId);
      refetchDivisions();
    }
  }, [classId, isAuthenticated, refetchDivisions]);

  // Função para carregar grupos de uma divisão específica
  const loadGroupsFromDivision = async (divisionId: string) => {
    try {
      console.log("🔍 Buscando grupos para divisão:", divisionId);
      const response = await fetch(`/api/classes/${classId}/group-divisions/${divisionId}/groups?t=${Date.now()}`, {
        credentials: "include",
        cache: 'no-cache' // Forçar busca sem cache
      });
      
      if (response.ok) {
        const groupsData = await response.json();
        console.log("✅ Grupos carregados:", groupsData);
        setGroups(groupsData);
      } else {
        console.error("❌ Erro ao carregar grupos:", response.status, response.statusText);
        setGroups([]); // Limpar grupos em caso de erro
      }
    } catch (error) {
      console.error("💥 Erro ao carregar grupos:", error);
      setGroups([]); // Limpar grupos em caso de erro
    }
  };

  // Mutation para salvar/atualizar divisão de grupos
  const saveGroupsMutation = useMutation({
    mutationFn: async (data: { name: string; membersPerGroup: number; prompt: string; groups: GroupWithMembers[] }) => {
      // Se já existe uma divisão, atualizá-la ao invés de criar nova
      if (currentDivisionId) {
        console.log("🔄 Atualizando divisão existente:", currentDivisionId);
        const response = await fetch(`/api/classes/${classId}/group-divisions/${currentDivisionId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error("Failed to update groups");
        }

        return response.json();
      } else {
        console.log("➕ Criando nova divisão");
        const response = await fetch(`/api/classes/${classId}/group-divisions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error("Failed to save groups");
        }

        const result = await response.json();
        setCurrentDivisionId(result.id); // Armazenar o ID da nova divisão
        return result;
      }
    },
    onSuccess: () => {
      toast({
        title: "Grupos salvos com sucesso!",
        description: currentDivisionId ? "A divisão de grupos foi atualizada." : "A divisão de grupos foi criada.",
      });
      // Invalidar todos os caches relacionados para forçar refetch
      queryClient.invalidateQueries({ queryKey: ["groupDivisions", classId] });
      queryClient.invalidateQueries({ queryKey: ["responses", classId] });
      queryClient.invalidateQueries({ queryKey: ["class", classId] });
    },
    onError: (error) => {
      console.error("Error saving groups:", error);
      toast({
        title: "Erro ao salvar grupos",
        description: "Ocorreu um erro ao salvar a divisão de grupos.",
        variant: "destructive",
      });
    },
  });

  // Calcular membros não alocados
  const unallocatedMembers = responses?.filter((response: FormResponse) => 
    !groups.some(group => 
      group.members.some(member => member.id === response.id)
    )
  ) || [];

  // Função para validar divisão desigual
  const validateUnevenDivision = (totalMembers: number, membersPerGroup: number) => {
    const remainder = totalMembers % membersPerGroup;
    return remainder > 0;
  };

  // Função para criar uma nova divisão (limpar tudo)
  const createNewDivision = () => {
    setGroups([]);
    setCurrentDivisionId(null);
    setDivisionName("Nova Divisão");
    toast({
      title: "Nova divisão criada",
      description: "Agora você pode criar uma nova organização de grupos.",
    });
  };
  const divideGroups = (confirm = false) => {
    if (!responses || responses.length === 0) {
      toast({
        title: "Erro",
        description: "Não há respostas suficientes para dividir em grupos.",
        variant: "destructive",
      });
      return;
    }

    if (membersPerGroup < 1) {
      toast({
        title: "Erro",
        description: "O número de membros por grupo deve ser pelo menos 1.",
        variant: "destructive",
      });
      return;
    }

    // Se já existem grupos, perguntar se quer realmente reorganizar
    if (groups.length > 0 && !confirm) {
      setAlertState({
        type: 'uneven',
        isOpen: true,
        data: {
          totalMembers: responses.length,
          membersPerGroup,
          completeGroups: Math.floor(responses.length / membersPerGroup),
          remainingMembers: responses.length % membersPerGroup,
          isReorganizing: true
        }
      });
      return;
    }

    const totalMembers = responses.length;
    const willCreateUnevenGroups = validateUnevenDivision(totalMembers, membersPerGroup);

    // Se vai criar grupos desiguais e usuário não confirmou, mostrar alerta
    if (willCreateUnevenGroups && !confirm) {
      const completeGroups = Math.floor(totalMembers / membersPerGroup);
      const remainingMembers = totalMembers % membersPerGroup;
      
      setAlertState({
        type: 'uneven',
        isOpen: true,
        data: {
          totalMembers,
          membersPerGroup,
          completeGroups,
          remainingMembers,
          isReorganizing: false
        }
      });
      return;
    }

    // Pegar apenas membros não alocados ou todos se for reorganização
    const membersToAllocate = confirm ? responses : responses.filter((r: FormResponse) => !isMemberAllocated(r.id));
    
    // Se for reorganização, limpar grupos atuais
    if (confirm) {
      setGroups([]);
    }

    // Embaralhar respostas aleatoriamente
    const shuffledResponses = [...membersToAllocate].sort(() => Math.random() - 0.5);
    
    // Dividir em grupos
    const newGroups: GroupWithMembers[] = [];
    
    for (let i = 0; i < shuffledResponses.length; i += membersPerGroup) {
      const members = shuffledResponses.slice(i, i + membersPerGroup);
      const groupNumber = Math.floor(i / membersPerGroup) + 1;
      
      newGroups.push({
        groupNumber,
        members
      });
    }

    setGroups(newGroups);
    setAlertState({ type: null, isOpen: false });
    
    // Salvar/atualizar no banco de dados
    saveGroupsMutation.mutate({
      name: divisionName,
      membersPerGroup,
      prompt,
      groups: newGroups
    });
  };

  // Função para verificar se um membro já está alocado em algum grupo
  const isMemberAllocated = (memberId: string): boolean => {
    return groups.some(group => 
      group.members.some(member => member.id === memberId)
    );
  };

  // Função para remover membro de todos os grupos
  const removeMemberFromAllGroups = (memberId: string) => {
    setGroups(prevGroups => 
      prevGroups.map(group => ({
        ...group,
        members: group.members.filter(member => member.id !== memberId)
      }))
    );
  };

  // Função para adicionar membro específico a um grupo
  const addMemberToGroup = (memberId: string, groupNumber: number) => {
    const member = responses?.find((r: FormResponse) => r.id === memberId);
    if (!member) return;

    // Se o membro já está alocado, removê-lo do grupo atual primeiro
    if (isMemberAllocated(memberId)) {
      removeMemberFromAllGroups(memberId);
      toast({
        title: "Membro realocado",
        description: `${member.studentName} foi movido para o Grupo ${groupNumber}.`,
      });
    } else {
      toast({
        title: "Membro adicionado",
        description: `${member.studentName} foi adicionado ao Grupo ${groupNumber}.`,
      });
    }

    setGroups(prevGroups => {
      const newGroups = [...prevGroups];
      const targetGroup = newGroups.find(g => g.groupNumber === groupNumber);
      
      if (targetGroup) {
        targetGroup.members = [...targetGroup.members, member];
      }
      
      // Salvar alterações automaticamente se já existe uma divisão
      if (currentDivisionId) {
        setTimeout(() => {
          saveGroupsMutation.mutate({
            name: divisionName,
            membersPerGroup,
            prompt,
            groups: newGroups
          });
        }, 500); // Delay pequeno para evitar muitas chamadas
      }
      
      return newGroups;
    });
  };

  // Função para aleatorizar um membro
  const randomizeMember = (memberId: string) => {
    const member = responses?.find((r: FormResponse) => r.id === memberId);
    if (!member) return;

    // Se o membro já está alocado, removê-lo primeiro
    if (isMemberAllocated(memberId)) {
      removeMemberFromAllGroups(memberId);
    }

    // Verificar se todos os grupos estão com capacidade máxima
    const allGroupsAtCapacity = groups.every(group => group.members.length >= membersPerGroup);
    
    if (allGroupsAtCapacity) {
      setAlertState({
        type: 'capacity',
        isOpen: true,
        data: { member, membersPerGroup }
      });
      return;
    }

    // Encontrar grupos com espaço disponível
    const availableGroups = groups.filter(group => group.members.length < membersPerGroup);
    
    if (availableGroups.length === 0) {
      // Criar novo grupo
      const newGroupNumber = Math.max(...groups.map(g => g.groupNumber), 0) + 1;
      setGroups(prevGroups => [
        ...prevGroups,
        { groupNumber: newGroupNumber, members: [member] }
      ]);
      
      toast({
        title: "Novo grupo criado",
        description: `${member.studentName} foi adicionado ao novo Grupo ${newGroupNumber}.`,
      });
    } else {
      // Selecionar grupo aleatório com espaço
      const randomGroup = availableGroups[Math.floor(Math.random() * availableGroups.length)];
      addMemberToGroup(memberId, randomGroup.groupNumber);
    }
  };

  // Função para lidar com capacidade cheia
  const handleCapacityChoice = (choice: 'existing' | 'new', memberId: string) => {
    const member = responses?.find((r: FormResponse) => r.id === memberId);
    if (!member) return;

    if (choice === 'existing') {
      // Adicionar a um grupo existente aleatório
      const randomGroup = groups[Math.floor(Math.random() * groups.length)];
      addMemberToGroup(memberId, randomGroup.groupNumber);
    } else {
      // Criar novo grupo
      const newGroupNumber = Math.max(...groups.map(g => g.groupNumber), 0) + 1;
      setGroups(prevGroups => [
        ...prevGroups,
        { groupNumber: newGroupNumber, members: [member] }
      ]);
      
      toast({
        title: "Novo grupo criado",
        description: `${member.studentName} foi adicionado ao novo Grupo ${newGroupNumber}.`,
      });
    }
    
    setAlertState({ type: null, isOpen: false });
  };

  if (isLoading || isClassLoading || isResponsesLoading || isDivisionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  const expectedResponses = classData?.studentLimit || 0;
  const actualResponses = responses?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <Nav />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation(`/class/${classId}/responses`)}
            className="mb-4 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Respostas
          </Button>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Divisão de Grupos - {classData?.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Configure e divida os alunos em grupos automaticamente
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Painel de Configuração */}
          <div className="lg:col-span-1 space-y-6">
            {/* Estatísticas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-gray-100">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Estatísticas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Respostas recebidas:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">{actualResponses}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Respostas esperadas:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{expectedResponses}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Não alocados:</span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">{unallocatedMembers.length}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-slate-600">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Taxa de resposta:</span>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    {expectedResponses > 0 ? `${Math.round((actualResponses / expectedResponses) * 100)}%` : '0%'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Configuração */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-gray-100">
                  <Users className="mr-2 h-5 w-5" />
                  Configuração
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="divisionName" className="text-gray-700 dark:text-gray-300">
                    Nome da divisão
                  </Label>
                  <Input
                    id="divisionName"
                    value={divisionName}
                    onChange={(e) => setDivisionName(e.target.value)}
                    className="mt-1"
                    placeholder="Ex: Grupos para Projeto Final"
                  />
                </div>
                
                <div>
                  <Label htmlFor="membersPerGroup" className="text-gray-700 dark:text-gray-300">
                    Pessoas por grupo
                  </Label>
                  <Input
                    id="membersPerGroup"
                    type="number"
                    min="1"
                    max="20"
                    value={membersPerGroup}
                    onChange={(e) => setMembersPerGroup(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="prompt" className="text-gray-700 dark:text-gray-300">
                    Prompt (funcionalidade futura)
                  </Label>
                  <Textarea
                    id="prompt"
                    placeholder="Digite aqui instruções especiais para a divisão de grupos..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="mt-1 resize-none"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Esta funcionalidade estará disponível em breve
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => divideGroups(false)}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                    disabled={actualResponses === 0}
                  >
                    <Shuffle className="mr-2 h-4 w-4" />
                    {groups.length > 0 ? "Reorganizar Grupos" : "Dividir Grupos"}
                  </Button>
                  
                  {/* Botão para criar nova divisão (só aparece se já há grupos) */}
                  {groups.length > 0 && (
                    <Button
                      onClick={createNewDivision}
                      variant="outline"
                      className="w-full border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Nova Divisão (Limpar)
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Alunos Não Alocados */}
            {unallocatedMembers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900 dark:text-gray-100">
                    <UserPlus className="mr-2 h-5 w-5" />
                    Alunos Não Alocados ({unallocatedMembers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {unallocatedMembers.map((member: FormResponse) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{member.studentName}</p>
                        {member.studentEmail && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{member.studentEmail}</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Select onValueChange={(value) => addMemberToGroup(member.id, parseInt(value))}>
                          <SelectTrigger className="w-20">
                            <SelectValue placeholder="Grupo" />
                          </SelectTrigger>
                          <SelectContent>
                            {groups.map((group) => (
                              <SelectItem key={group.groupNumber} value={group.groupNumber.toString()}>
                                {group.groupNumber}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => randomizeMember(member.id)}
                        >
                          <Shuffle className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Resultado dos Grupos */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-gray-100">
                  <FileText className="mr-2 h-5 w-5" />
                  Grupos Formados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {groups.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Nenhum grupo criado ainda
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Configure as opções e clique em "Dividir Grupos" para começar
                    </p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {groups.map((group) => (
                      <div
                        key={group.groupNumber}
                        className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-lg p-4 border border-blue-200 dark:border-blue-800"
                      >
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                          Grupo {group.groupNumber}
                        </h4>
                        <div className="space-y-2">
                          {group.members.map((member) => (
                            <div
                              key={member.id}
                              className="bg-white dark:bg-slate-800 rounded px-3 py-2 text-sm border border-blue-100 dark:border-blue-900"
                            >
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {member.studentName}
                              </span>
                              {member.studentEmail && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {member.studentEmail}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 text-xs text-blue-600 dark:text-blue-400">
                          {group.members.length} {group.members.length === 1 ? 'membro' : 'membros'}
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

      {/* Alert Dialog para Grupos Desiguais */}
      <AlertDialog open={alertState.isOpen && alertState.type === 'uneven'} onOpenChange={(open) => !open && setAlertState({ type: null, isOpen: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-yellow-500" />
              Grupos com Tamanhos Desiguais
            </AlertDialogTitle>
            <AlertDialogDescription>
              {alertState.data?.isReorganizing ? (
                <>
                  Você já possui grupos organizados. Deseja reorganizar todos os alunos em novos grupos?
                  <br /><br />
                  Com {alertState.data?.totalMembers} alunos e grupos de {alertState.data?.membersPerGroup} pessoas, 
                  serão criados {alertState.data?.completeGroups} grupos completos{alertState.data?.remainingMembers > 0 && 
                  ` e 1 grupo com apenas ${alertState.data?.remainingMembers} ${alertState.data?.remainingMembers === 1 ? 'pessoa' : 'pessoas'}`}.
                </>
              ) : (
                <>
                  Com {alertState.data?.totalMembers} alunos e grupos de {alertState.data?.membersPerGroup} pessoas, 
                  serão criados {alertState.data?.completeGroups} grupos completos e 1 grupo com apenas {alertState.data?.remainingMembers} {alertState.data?.remainingMembers === 1 ? 'pessoa' : 'pessoas'}.
                  <br /><br />
                  Você gostaria de aguardar mais respostas ou prosseguir com grupos desiguais?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {alertState.data?.isReorganizing ? "Cancelar" : "Aguardar Mais Respostas"}
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => divideGroups(true)}>
              {alertState.data?.isReorganizing ? "Reorganizar Grupos" : "Prosseguir com Grupos Desiguais"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Dialog para Capacidade Cheia */}
      <AlertDialog open={alertState.isOpen && alertState.type === 'capacity'} onOpenChange={(open) => !open && setAlertState({ type: null, isOpen: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5 text-blue-500" />
              Grupos na Capacidade Máxima
            </AlertDialogTitle>
            <AlertDialogDescription>
              Todos os grupos já possuem {alertState.data?.membersPerGroup} {alertState.data?.membersPerGroup === 1 ? 'pessoa' : 'pessoas'} como definido.
              <br /><br />
              Como deseja adicionar <strong>{alertState.data?.member?.studentName}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button 
              variant="outline" 
              onClick={() => handleCapacityChoice('existing', alertState.data?.member?.id)}
            >
              Adicionar a Grupo Existente
            </Button>
            <AlertDialogAction onClick={() => handleCapacityChoice('new', alertState.data?.member?.id)}>
              Criar Novo Grupo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}