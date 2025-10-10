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
import SidebarDashboard from "@/components/ui/sidebar-dashboard";
import { ArrowLeft, Users, Shuffle, BarChart3, FileText, UserPlus, AlertTriangle, Brain } from "lucide-react";
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

  // Buscar perguntas do formulário da classe
  const { data: formQuestions = [] } = useQuery({
    queryKey: ["formQuestions", classId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/classes/${classId}/questions`, {
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
        console.error("Error fetching form questions:", error);
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
        return []; // Retornar array vazio em caso de erro
      }
    },
    enabled: isAuthenticated && !!classId,
  });

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

  // Função para enviar dados para webhook do n8n
  const sendToWebhook = async (webhookData: any) => {
    try {
      // URL do webhook N8N configurada via variável de ambiente
      const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
      
      if (!webhookUrl) {
        console.error("❌ WEBHOOK - URL não configurada. Configure VITE_N8N_WEBHOOK_URL no arquivo .env");
        toast({
          title: "Erro de Configuração",
          description: "URL do webhook não está configurada. Verifique as variáveis de ambiente.",
          variant: "destructive",
        });
        return;
      }
      
      // Log detalhado dos dados que estão sendo enviados
      console.log("🚀 WEBHOOK - Dados completos sendo enviados:", JSON.stringify(webhookData, null, 2));
      console.log("🔍 WEBHOOK - Primeiro estudante:", webhookData.groups?.[0]?.students?.[0]);
      console.log("📋 WEBHOOK - FormQuestions:", webhookData.formQuestions);
      
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookData),
      });

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status}`);
      }

      console.log("✅ Dados enviados para o webhook com sucesso");
      toast({
        title: "Dados enviados!",
        description: "Os dados da divisão foram enviados para o webhook com sucesso.",
      });
      
    } catch (error) {
      console.error("❌ Erro ao enviar dados para o webhook:", error);
      toast({
        title: "Erro no webhook",
        description: "Não foi possível enviar os dados para o webhook. Os grupos foram salvos normalmente.",
        variant: "destructive",
      });
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
    onSuccess: async (_, variables) => {
      toast({
        title: "Grupos salvos com sucesso!",
        description: currentDivisionId ? "A divisão de grupos foi atualizada." : "A divisão de grupos foi criada.",
      });

      // Aguardar que as queries necessárias estejam prontas
      console.log("🚀 Preparando dados para webhook...");
      
      // Se formQuestions não estiver carregada, aguardar um pouco e tentar recarregar
      let currentFormQuestions = formQuestions;
      if (!currentFormQuestions || currentFormQuestions.length === 0) {
        console.log("⏳ Aguardando carregamento das perguntas do formulário...");
        try {
          // Forçar refetch das perguntas
          const questionsResult = await queryClient.fetchQuery({
            queryKey: ["formQuestions", classId],
            queryFn: async () => {
              const response = await fetch(`/api/classes/${classId}/questions`, {
                credentials: "include"
              });
              
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              
              return response.json();
            }
          });
          currentFormQuestions = questionsResult;
          console.log("✅ Perguntas carregadas:", currentFormQuestions.length);
        } catch (error) {
          console.error("❌ Erro ao carregar perguntas:", error);
          currentFormQuestions = [];
        }
      }

      console.log("📋 Perguntas do formulário:", currentFormQuestions);
      console.log("👥 Respostas dos participantes:", responses);
      
      // Função para mapear com as perguntas atuais
      const mapWithCurrentQuestions = (studentResponses: any) => {
        console.log("🎯 INICIANDO MAPEAMENTO - Respostas recebidas:", studentResponses);
        console.log("🎯 INICIANDO MAPEAMENTO - Perguntas disponíveis:", currentFormQuestions?.length || 0);
        
        const mappedResponses: Record<string, { question: string; answer: any }> = {};
        
        // Se não há perguntas carregadas, retornar o formato simples
        if (!currentFormQuestions || currentFormQuestions.length === 0) {
          console.log("⚠️ Nenhuma pergunta carregada, usando formato simples");
          Object.keys(studentResponses).forEach(questionId => {
            mappedResponses[questionId] = {
              question: `Pergunta ID: ${questionId}`,
              answer: studentResponses[questionId]
            };
          });
          console.log("⚠️ Resultado do mapeamento simples:", mappedResponses);
          return mappedResponses;
        }
        
        console.log("🔍 Mapeando respostas:", studentResponses);
        console.log("🗃️ Perguntas disponíveis:", currentFormQuestions.length, "perguntas");
        console.log("📝 Lista de perguntas:", currentFormQuestions.map((q: any) => ({ id: q.id, question: q.question })));
        
        Object.keys(studentResponses).forEach(questionId => {
          const question = currentFormQuestions.find((q: any) => q.id === questionId);
          
          if (question) {
            console.log(`✅ Pergunta encontrada para ${questionId}: ${question.question}`);
            mappedResponses[questionId] = {
              question: question.question,
              answer: studentResponses[questionId]
            };
          } else {
            console.log(`❌ Pergunta NÃO encontrada para ${questionId}`);
            console.log(`❌ IDs de perguntas disponíveis:`, currentFormQuestions.map((q: any) => q.id));
            mappedResponses[questionId] = {
              question: `Pergunta ID: ${questionId} (não encontrada)`,
              answer: studentResponses[questionId]
            };
          }
        });
        
        console.log("✅ Resultado final do mapeamento:", mappedResponses);
        return mappedResponses;
      };
      
      const webhookData = {
        classId: classId,
        className: classData?.name || "Classe sem nome",
        divisionName: variables.name,
        prompt: variables.prompt,
        membersPerGroup: variables.membersPerGroup,
        totalGroups: variables.groups.length,
        totalStudents: variables.groups.reduce((total, group) => total + group.members.length, 0),
        createdAt: new Date().toISOString(),
        formQuestions: currentFormQuestions.map((question: any) => ({
          id: question.id,
          question: question.question,
          type: question.type,
          options: question.options || [],
          isRequired: question.isRequired,
          order: question.order
        })),
        groups: variables.groups.map((group, index) => ({
          groupNumber: group.groupNumber,
          groupName: `Grupo ${group.groupNumber}`,
          memberCount: group.members.length,
          students: group.members.map(member => ({
            id: member.id,
            name: member.studentName,
            responses: mapWithCurrentQuestions(member.responses || {}),
            rawResponses: member.responses || {} // Manter formato original também
          }))
        })),
        allStudentResponses: responses?.map((response: FormResponse) => ({
          id: response.id,
          studentName: response.studentName,
          responses: mapWithCurrentQuestions(response.responses || {}),
          rawResponses: response.responses || {} // Manter formato original também
        })) || []
      };

      // Enviar para o webhook
      sendToWebhook(webhookData);

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

  // Mutation para deletar todas as divisões de uma classe
  const deleteAllDivisionsMutation = useMutation({
    mutationFn: async () => {
      console.log("🗑️ Deletando todas as divisões da classe:", classId);
      const response = await fetch(`/api/classes/${classId}/group-divisions`, {
        method: "DELETE",
        credentials: "include"
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      console.log("✅ Todas as divisões foram deletadas com sucesso");
      // Invalidar caches relacionados
      queryClient.invalidateQueries({ queryKey: ["groupDivisions", classId] });
      queryClient.invalidateQueries({ queryKey: ["responses", classId] });
      queryClient.invalidateQueries({ queryKey: ["class", classId] });
    },
    onError: (error) => {
      console.error("❌ Erro ao deletar divisões:", error);
      toast({
        title: "Erro ao limpar divisões",
        description: "Não foi possível deletar as divisões antigas do banco de dados.",
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
  const createNewDivision = async () => {
    try {
      // Primeiro, deletar todas as divisões existentes do banco de dados
      if (currentDivisionId || existingDivisions.length > 0) {
        console.log("🗑️ Limpando divisões antigas antes de criar nova...");
        await deleteAllDivisionsMutation.mutateAsync();
      }
      
      // Limpar estado local
      setGroups([]);
      setCurrentDivisionId(null);
      setDivisionName("Nova Divisão");
      
      toast({
        title: "Nova divisão criada",
        description: "Todas as divisões antigas foram removidas. Agora você pode criar uma nova organização de grupos.",
      });
    } catch (error) {
      console.error("❌ Erro ao criar nova divisão:", error);
      toast({
        title: "Erro ao criar nova divisão",
        description: "Houve um problema ao limpar as divisões antigas.",
        variant: "destructive",
      });
    }
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

  // Função para dividir grupos com IA
  const divideGroupsWithAI = async (confirm = false) => {
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

    if (!prompt.trim()) {
      toast({
        title: "Prompt necessário",
        description: "Por favor, forneça instruções no campo 'Prompt' para que a IA possa dividir os grupos de forma inteligente.",
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
          isReorganizing: true,
          isAI: true
        }
      });
      return;
    }

    // Mostrar toast de carregamento
    toast({
      title: "IA processando...",
      description: "A inteligência artificial está analisando as respostas para criar grupos otimizados.",
    });

    try {
      // Aguardar que as perguntas estejam carregadas
      let currentFormQuestions = formQuestions;
      if (!currentFormQuestions || currentFormQuestions.length === 0) {
        console.log("⏳ IA - Aguardando carregamento das perguntas do formulário...");
        try {
          // Forçar refetch das perguntas
          const questionsResult = await queryClient.fetchQuery({
            queryKey: ["formQuestions", classId],
            queryFn: async () => {
              const response = await fetch(`/api/classes/${classId}/questions`, {
                credentials: "include"
              });
              
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              
              return response.json();
            }
          });
          currentFormQuestions = questionsResult;
          console.log("✅ IA - Perguntas carregadas:", currentFormQuestions.length);
        } catch (error) {
          console.error("❌ IA - Erro ao carregar perguntas:", error);
          currentFormQuestions = [];
        }
      }

      // Função para mapear respostas com perguntas na IA
      const mapAIResponsesWithQuestions = (studentResponses: any) => {
        console.log("🤖 IA - Mapeando respostas:", studentResponses);
        const mappedResponses: Record<string, { question: string; answer: any }> = {};
        
        if (!currentFormQuestions || currentFormQuestions.length === 0) {
          console.log("⚠️ IA - Nenhuma pergunta carregada, usando formato simples");
          Object.keys(studentResponses).forEach(questionId => {
            mappedResponses[questionId] = {
              question: `Pergunta ID: ${questionId}`,
              answer: studentResponses[questionId]
            };
          });
          return mappedResponses;
        }
        
        Object.keys(studentResponses).forEach(questionId => {
          const question = currentFormQuestions.find((q: any) => q.id === questionId);
          
          if (question) {
            console.log(`✅ IA - Pergunta encontrada para ${questionId}: ${question.question}`);
            mappedResponses[questionId] = {
              question: question.question,
              answer: studentResponses[questionId]
            };
          } else {
            console.log(`❌ IA - Pergunta NÃO encontrada para ${questionId}`);
            mappedResponses[questionId] = {
              question: `Pergunta ID: ${questionId} (não encontrada)`,
              answer: studentResponses[questionId]
            };
          }
        });
        
        return mappedResponses;
      };

      // Preparar dados para a IA com mapeamento das perguntas
      const aiRequestData = {
        students: responses.map((response: FormResponse) => ({
          id: response.id,
          name: response.studentName,
          responses: mapAIResponsesWithQuestions(response.responses || {}),
          rawResponses: response.responses || {} // Manter formato original também
        })),
        prompt: prompt,
        membersPerGroup: membersPerGroup,
        className: classData?.name || "Classe sem nome",
        formQuestions: currentFormQuestions.map((question: any) => ({
          id: question.id,
          question: question.question,
          type: question.type,
          options: question.options || [],
          isRequired: question.isRequired,
          order: question.order
        }))
      };

      console.log("🤖 IA - Dados preparados:", JSON.stringify(aiRequestData, null, 2));

      // Configurar URL do webhook para IA (via variável de ambiente)
      const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
      
      if (!webhookUrl) {
        console.error("❌ IA - URL do webhook não configurada. Configure VITE_N8N_WEBHOOK_URL no arquivo .env");
        toast({
          title: "Erro de Configuração",
          description: "URL do webhook N8N não está configurada.",
          variant: "destructive",
        });
        return;
      }
      
      // Enviar dados para IA via webhook
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-AI-Request": "true", // Header para identificar que é uma requisição de IA
        },
        body: JSON.stringify({
          type: "ai_division",
          data: aiRequestData
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status}`);
      }

      const aiResult = await response.json();
      
      // Por enquanto, vamos usar uma divisão inteligente baseada nas respostas
      // Em uma implementação futura, isso virá da resposta da IA
      const intelligentGroups = createIntelligentGroups(responses, membersPerGroup, prompt);
      
      setGroups(intelligentGroups);
      setAlertState({ type: null, isOpen: false });

      // Salvar/atualizar no banco de dados
      saveGroupsMutation.mutate({
        name: divisionName + " (IA)",
        membersPerGroup,
        prompt,
        groups: intelligentGroups
      });

      toast({
        title: "Grupos criados com IA!",
        description: "A inteligência artificial analisou as respostas e criou grupos otimizados.",
      });

    } catch (error) {
      console.error("Erro na divisão com IA:", error);
      toast({
        title: "Erro na divisão com IA",
        description: "Não foi possível processar com IA. Tente novamente ou use a divisão normal.",
        variant: "destructive",
      });
    }
  };

  // Função auxiliar para criar grupos inteligentes (simulação de IA)
  const createIntelligentGroups = (studentResponses: FormResponse[], groupSize: number, aiPrompt: string): GroupWithMembers[] => {
    // Esta é uma implementação básica que simula divisão inteligente
    // Em uma implementação real, isso seria processado por IA
    
    const students = [...studentResponses];
    const groups: GroupWithMembers[] = [];
    const totalGroups = Math.ceil(students.length / groupSize);

    // Algoritmo simples de balanceamento baseado em diversidade de respostas
    for (let i = 0; i < totalGroups; i++) {
      groups.push({
        groupNumber: i + 1,
        members: []
      });
    }

    // Distribuir estudantes de forma balanceada
    students.forEach((student, index) => {
      const groupIndex = index % totalGroups;
      groups[groupIndex].members.push(student);
    });

    // Rebalancear se algum grupo exceder o limite
    for (let i = 0; i < groups.length; i++) {
      while (groups[i].members.length > groupSize && i < groups.length - 1) {
        const student = groups[i].members.pop();
        if (student) {
          groups[i + 1].members.push(student);
        }
      }
    }

    return groups;
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
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <SidebarDashboard />
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto transition-all duration-300" style={{ marginLeft: 'var(--sidebar-width, 16rem)' }}>
        <div className="p-8">
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
              Configure e divida os participantes em grupos automaticamente
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
                  <span className="font-semibold dark:text-purple-600 text-blue-600 dark:text-purple-400">
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
                    Prompt para IA (instruções especiais)
                  </Label>
                  <Textarea
                    id="prompt"
                    placeholder="Ex: Divida considerando habilidades complementares, diversidade de experiência, horários compatíveis..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="mt-1 resize-none"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Descreva como você gostaria que os grupos fossem organizados. A IA usará essas instruções.
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

                  <Button
                    onClick={() => divideGroupsWithAI(false)}
                    className="w-full bg-gradient-to-r dark:from-purple-600 dark:to-pink-600 dark:hover:from-purple-700 dark:hover:to-pink-700 from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white"
                    disabled={actualResponses === 0 || !prompt.trim()}
                  >
                    <Brain className="mr-2 h-4 w-4" />
                    {groups.length > 0 ? "Reorganizar com IA" : "Separar Grupos com IA"}
                  </Button>
                  
                  {!prompt.trim() && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
                      💡 Configure o prompt acima para usar a divisão com IA
                    </p>
                  )}
                  
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

            {/* Participantes Não Alocados */}
            {unallocatedMembers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900 dark:text-gray-100">
                    <UserPlus className="mr-2 h-5 w-5" />
                    Participantes Não Alocados ({unallocatedMembers.length})
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
                  Você já possui grupos organizados. Deseja reorganizar todos os participantes em novos grupos?
                  <br /><br />
                  Com {alertState.data?.totalMembers} participantes e grupos de {alertState.data?.membersPerGroup} pessoas, 
                  serão criados {alertState.data?.completeGroups} grupos completos{alertState.data?.remainingMembers > 0 && 
                  ` e 1 grupo com apenas ${alertState.data?.remainingMembers} ${alertState.data?.remainingMembers === 1 ? 'pessoa' : 'pessoas'}`}.
                </>
              ) : (
                <>
                  Com {alertState.data?.totalMembers} participantes e grupos de {alertState.data?.membersPerGroup} pessoas, 
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
            <AlertDialogAction onClick={() => alertState.data?.isAI ? divideGroupsWithAI(true) : divideGroups(true)}>
              {alertState.data?.isReorganizing ? 
                (alertState.data?.isAI ? "Reorganizar com IA" : "Reorganizar Grupos") : 
                (alertState.data?.isAI ? "Prosseguir com IA" : "Prosseguir com Grupos Desiguais")
              }
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
    </div>
  );
}