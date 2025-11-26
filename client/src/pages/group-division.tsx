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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import SidebarDashboard from "@/components/ui/sidebar-dashboard";
import { ArrowLeft, Users, Shuffle, BarChart3, FileText, UserPlus, AlertTriangle, Brain, FileBarChart } from "lucide-react";
import type { FormResponse, Class, GroupDivision, GroupMember } from "@shared/schema";
import { 
  parseAndValidateAIResponse, 
  validateCompleteDivision, 
  formatValidationReport,
  type AIDivisionResponse 
} from "@shared/ai-validation";
import {
  normalizeGroupNumbers,
  removeDuplicateStudents,
  getSuggestions,
  logSuggestions,
  type AIDivisionResponse as RepairAIDivisionResponse
} from "@shared/ai-response-repair";

// Estender FormResponse para incluir análise da IA
interface FormResponseWithAnalysis extends FormResponse {
  strengths?: string[];
  attention?: string[];
}

interface GroupWithMembers {
  groupNumber: number;
  members: FormResponseWithAnalysis[];
  leaderId?: string; // ID do líder do grupo
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
  const [projectDescription, setProjectDescription] = useState<string>("");
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [currentDivisionId, setCurrentDivisionId] = useState<string | null>(null);
  const [alertState, setAlertState] = useState<AlertState>({ type: null, isOpen: false });
  const [isAIDivision, setIsAIDivision] = useState<boolean>(false); // Rastrear se é divisão com IA
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });
  const [selectedMemberForReport, setSelectedMemberForReport] = useState<string | null>(null);

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
    setProjectDescription("");
  }, [classId]);

  // Função para assignar líderes aos grupos (sempre usa primeiro membro ou o designado como líder)
  const assignLeadersToGroups = (groupsToProcess: GroupWithMembers[]): GroupWithMembers[] => {
    return groupsToProcess.map(group => {
      // Se não há líder definido, usar o primeiro membro como líder
      if (!group.leaderId) {
        return {
          ...group,
          leaderId: group.members[0]?.id
        };
      }
      return group;
    });
  };

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
          setProjectDescription(division.prompt || "");
          
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
        
        // Carregar os líderes do servidor
        const loadedLeaders = new Set<string>();
        for (const group of groupsData) {
          if (group.leaderId) {
            loadedLeaders.add(group.leaderId);
          }
        }
        console.log("👑 Líderes carregados:", groupsData.map((g: any) => g.leaderId));
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
      console.log("🚀 WEBHOOK - Iniciando envio de dados...");
      console.log(`👥 Total de estudantes: ${webhookData.students.length}`);
      console.log(`📋 Pessoas por grupo: ${webhookData.membersPerGroup}`);
      console.log(`📝 Descrição do projeto: ${webhookData.projectDescription}`);
      console.log("📄 Dados que serão enviados:", JSON.stringify(webhookData, null, 2));
      
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
    mutationFn: async (data: { name: string; membersPerGroup: number; prompt: string; groups: GroupWithMembers[]; sendToWebhook?: boolean }) => {
      // Se já existe uma divisão, atualizá-la ao invés de criar nova
      if (currentDivisionId) {
        console.log("🔄 Atualizando divisão existente:", currentDivisionId);
        const response = await fetch(`/api/classes/${classId}/group-divisions/${currentDivisionId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            name: data.name,
            membersPerGroup: data.membersPerGroup,
            prompt: data.prompt,
            groups: data.groups
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update groups");
        }

        return { ...response.json(), sendToWebhook: data.sendToWebhook };
      } else {
        console.log("➕ Criando nova divisão");
        const response = await fetch(`/api/classes/${classId}/group-divisions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            name: data.name,
            membersPerGroup: data.membersPerGroup,
            prompt: data.prompt,
            groups: data.groups
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save groups");
        }

        const result = await response.json();
        setCurrentDivisionId(result.id); // Armazenar o ID da nova divisão
        return { ...result, sendToWebhook: data.sendToWebhook };
      }
    },
    onSuccess: async (result, variables) => {
      toast({
        title: "Grupos salvos com sucesso!",
        description: currentDivisionId ? "A divisão de grupos foi atualizada." : "A divisão de grupos foi criada.",
      });

      // Só enviar para o webhook se explicitamente solicitado (apenas para IA)
      if (!variables.sendToWebhook) {
        console.log("⏭️ Webhook desabilitado para esta operação");
        // Invalidar todos os caches relacionados para forçar refetch
        queryClient.invalidateQueries({ queryKey: ["groupDivisions", classId] });
        queryClient.invalidateQueries({ queryKey: ["responses", classId] });
        queryClient.invalidateQueries({ queryKey: ["class", classId] });
        return;
      }

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
      
      // Construir dados no formato simplificado solicitado
      const webhookData = {
        membersPerGroup: variables.membersPerGroup,
        projectDescription: variables.prompt,
        students: responses.map(student => ({
          name: student.studentName,
          id: student.id,
          responses: Object.entries(student.responses).map(([questionId, data]: [string, any]) => ({
            pergunta: data.question || `Pergunta ${questionId}`,
            resposta: data.answer
          }))
        }))
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

  // Função para gerar relatório completo
  const generateReport = async () => {
    if (groups.length === 0) {
      toast({
        title: "Erro",
        description: "Não há grupos para gerar relatório.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("🔄 Iniciando busca de dados para o relatório...");
      
      // Buscar respostas do API
      const responsesResponse = await fetch(`/api/classes/${classId}/responses`, {
        credentials: "include"
      });
      const fetchedResponses = responsesResponse.ok ? await responsesResponse.json() : [];
      console.log("✅ Respostas carregadas:", fetchedResponses.length);
      console.log("Respostas:", JSON.stringify(fetchedResponses, null, 2));
      
      // Buscar perguntas do API
      const questionsResponse = await fetch(`/api/classes/${classId}/questions`, {
        credentials: "include"
      });
      const fetchedQuestions = questionsResponse.ok ? await questionsResponse.json() : [];
      console.log("✅ Perguntas carregadas:", fetchedQuestions.length);
      console.log("Perguntas:", JSON.stringify(fetchedQuestions, null, 2));
      
      // Agora gerar o relatório com os dados
      generateReportHTML(fetchedResponses, fetchedQuestions);
    } catch (error) {
      console.error("Erro ao buscar dados para relatório:", error);
      toast({
        title: "Erro",
        description: "Erro ao buscar dados para gerar o relatório.",
        variant: "destructive",
      });
    }
  };

  // Função auxiliar para gerar o HTML do relatório
  const generateReportHTML = (responses: any[], formQuestions: any[]) => {

    let reportHTML = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relatório de Divisão de Grupos</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
            color: #333;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .header h1 {
            margin: 0;
            font-size: 2.5em;
          }
          .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 1.1em;
          }
          .class-info {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .class-info h2 {
            margin-top: 0;
            color: #667eea;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .info-label {
            font-weight: 600;
            color: #555;
          }
          .group {
            background: white;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border-left: 5px solid #667eea;
          }
          .group h3 {
            margin-top: 0;
            color: #667eea;
            font-size: 1.5em;
          }
          .member {
            background: #f9f9f9;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 8px;
            border: 1px solid #ddd;
          }
          .member.leader {
            background: #fff9e6;
            border: 2px solid #ffd700;
          }
          .member h4 {
            margin: 0 0 10px 0;
            color: #333;
            font-size: 1.1em;
          }
          .member-email {
            color: #666;
            font-size: 0.9em;
            margin-bottom: 10px;
          }
          .leader-badge {
            display: inline-block;
            background: #ffd700;
            color: #333;
            padding: 4px 10px;
            border-radius: 4px;
            font-weight: 600;
            margin-right: 5px;
          }
          .strengths {
            margin-top: 10px;
          }
          .strengths h5 {
            margin: 0 0 8px 0;
            color: #2563eb;
            font-size: 0.95em;
          }
          .strength-item {
            background: #eff6ff;
            color: #1e40af;
            padding: 6px 10px;
            margin: 4px 0;
            border-radius: 4px;
            border-left: 3px solid #2563eb;
            font-size: 0.9em;
          }
          .attention {
            margin-top: 10px;
          }
          .attention h5 {
            margin: 0 0 8px 0;
            color: #9333ea;
            font-size: 0.95em;
          }
          .attention-item {
            background: #faf5ff;
            color: #6b21a8;
            padding: 6px 10px;
            margin: 4px 0;
            border-radius: 4px;
            border-left: 3px solid #9333ea;
            font-size: 0.9em;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #eee;
            color: #999;
            font-size: 0.9em;
          }
          @media print {
            body {
              background: white;
              padding: 0;
            }
            .group {
              page-break-inside: avoid;
            }
            .member {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Relatório de Divisão de Grupos</h1>
          <p>${divisionName}</p>
        </div>
        
        <div class="class-info">
          <h2>Informações da Divisão</h2>
          <div class="info-row">
            <span class="info-label">Nome da Divisão:</span>
            <span>${divisionName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Total de Grupos:</span>
            <span>${groups.length} grupos</span>
          </div>
          <div class="info-row">
            <span class="info-label">Membros por Grupo:</span>
            <span>${membersPerGroup} membros</span>
          </div>
          <div class="info-row">
            <span class="info-label">Total de Membros:</span>
            <span>${groups.reduce((sum, g) => sum + g.members.length, 0)} membros</span>
          </div>
          <div class="info-row">
            <span class="info-label">Tipo de Divisão:</span>
            <span>${isAIDivision ? '🤖 Criação Inteligente com IA' : '🎲 Criação Aleatória'}</span>
          </div>
          ${projectDescription ? `
          <div class="info-row">
            <span class="info-label">Descrição do Projeto:</span>
            <span>${projectDescription}</span>
          </div>
          ` : ''}
          <div class="info-row">
            <span class="info-label">Data de Geração:</span>
            <span>${new Date().toLocaleString('pt-BR')}</span>
          </div>
        </div>
    `;

    // Adicionar detalhes de cada grupo
    groups.forEach((group) => {
      reportHTML += `
        <div class="group">
          <h3>Grupo ${group.groupNumber}</h3>
          <p style="margin: 0 0 15px 0; color: #666;">Total de membros: ${group.members.length}</p>
      `;

      group.members.forEach((member) => {
        const isLeader = member.id === group.leaderId;
        reportHTML += `
          <div class="member ${isLeader ? 'leader' : ''}">
            <h4>${isLeader ? '<span class="leader-badge">LÍDER</span>' : ''}${member.studentName}</h4>
            <div class="member-email">${member.studentEmail || 'Email não fornecido'}</div>
        `;

        if (member.strengths && member.strengths.length > 0) {
          reportHTML += `
            <div class="strengths">
              <h5>Pontos Fortes</h5>
              ${member.strengths.map(s => `<div class="strength-item">${s}</div>`).join('')}
            </div>
          `;
        }

        if (member.attention && member.attention.length > 0) {
          reportHTML += `
            <div class="attention">
              <h5>Pontos de Atenção</h5>
              ${member.attention.map(a => `<div class="attention-item">${a}</div>`).join('')}
            </div>
          `;
        }

        // Adicionar perguntas e respostas do participante
        // Buscar a resposta pelo nome do aluno (não existe studentId nas respostas)
        const memberResponse = responses && responses.length > 0 
          ? responses.find((r: any) => r.studentName === member.studentName) 
          : null;
        
        console.log(`\n🔍 Procurando resposta para ${member.studentName}`);
        console.log("Nomes disponíveis nas respostas:", responses?.map((r: any) => r.studentName));
        console.log("Resposta encontrada?", !!memberResponse);
        
        reportHTML += `
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
            <h5 style="margin: 0 0 10px 0; color: #333; font-weight: 600;">Respostas do Formulário</h5>
        `;
        
        if (!formQuestions || formQuestions.length === 0) {
          reportHTML += `<p style="color: #999;">(Formulário sem perguntas)</p>`;
          console.log(`Sem perguntas disponíveis`);
        } else if (!memberResponse) {
          reportHTML += `<p style="color: #999;">(Participante não respondeu ao formulário)</p>`;
          console.log(`Sem respostas disponíveis para ${member.studentName}`);
        } else {
          console.log(`✅ Adicionando respostas para ${member.studentName}`);
          try {
            // As respostas já estão como objeto, não como string
            const memberResponses = typeof memberResponse.responses === 'string' 
              ? JSON.parse(memberResponse.responses) 
              : memberResponse.responses;
            
            console.log(`Respostas do aluno:`, memberResponses);
            
            formQuestions.forEach((question: any, idx: number) => {
              const answer = memberResponses[question.id];
              console.log(`Pergunta ${question.id}: ${question.question} -> Resposta: ${answer}`);
              
              reportHTML += `
                <div style="margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid #f0f0f0;">
                  <p style="margin: 0 0 5px 0; font-weight: 500; color: #555;">
                    ${idx + 1}. ${question.question}
                  </p>
                  <div style="margin-left: 15px; color: #666;">
              `;
              
              if (Array.isArray(answer)) {
                reportHTML += `<ul style="margin: 0; padding-left: 20px;">`;
                answer.forEach((item: string) => {
                  reportHTML += `<li>${item}</li>`;
                });
                reportHTML += `</ul>`;
              } else if (answer !== null && answer !== undefined && answer !== '') {
                reportHTML += `<p style="margin: 0;">${String(answer)}</p>`;
              } else {
                reportHTML += `<p style="margin: 0; font-style: italic; color: #999;">(Sem resposta)</p>`;
              }
              
              reportHTML += `
                  </div>
                </div>
              `;
            });
          } catch (e) {
            console.error('Erro ao processar respostas:', e);
            reportHTML += `<p style="color: #999;">(Erro ao carregar respostas)</p>`;
          }
        }
        
        reportHTML += `</div>`;

        reportHTML += `</div>`;
      });

      reportHTML += `</div>`;
    });

    reportHTML += `
        <div class="footer">
          <p>Relatório gerado automaticamente pelo sistema MatchSkills</p>
          <p>${new Date().toLocaleString('pt-BR')}</p>
        </div>
      </body>
      </html>
    `;

    // Abrir em uma nova aba e imprimir
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(reportHTML);
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }

    toast({
      title: "Sucesso!",
      description: "Relatório gerado. Use a opção de impressão para salvar como PDF.",
    });
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
      setIsAIDivision(false); // Resetar flag de divisão com IA
      
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
    let newGroups: GroupWithMembers[] = [];
    
    for (let i = 0; i < shuffledResponses.length; i += membersPerGroup) {
      const members = shuffledResponses.slice(i, i + membersPerGroup);
      const groupNumber = Math.floor(i / membersPerGroup) + 1;
      
      newGroups.push({
        groupNumber,
        members
      });
    }

    // Assignar líderes aos grupos
    newGroups = assignLeadersToGroups(newGroups);

    setGroups(newGroups);
    setIsAIDivision(false); // Marcar como divisão comum (não-IA)
    setAlertState({ type: null, isOpen: false });
    
    console.log('📤 Enviando grupos:', JSON.stringify(newGroups.slice(0, 1), null, 2));
    
    // Salvar no banco de dados (sem enviar para webhook)
    saveGroupsMutation.mutate({
      name: divisionName,
      membersPerGroup,
      prompt: "",
      groups: newGroups,
      sendToWebhook: false
    });

    toast({
      title: "Grupos divididos!",
      description: `${newGroups.length} grupos foram criados aleatoriamente. Use "Dividir com IA" para otimizar.`,
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

    if (!projectDescription.trim()) {
      toast({
        title: "Descrição do projeto necessária",
        description: "Por favor, forneça uma descrição do projeto para que a IA possa dividir os grupos de forma inteligente.",
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
      // Usar as perguntas que já foram carregadas via useQuery
      let currentFormQuestions = formQuestions || [];
      
      // Se as perguntas não estão disponíveis, fazer um fetch síncrono
      if (currentFormQuestions.length === 0) {
        console.log("⏳ IA - Perguntas não carregadas, fazendo fetch...");
        try {
          const questionsResponse = await fetch(`/api/classes/${classId}/questions`, {
            credentials: "include"
          });
          if (questionsResponse.ok) {
            currentFormQuestions = await questionsResponse.json();
            console.log("✅ IA - Perguntas carregadas via fetch:", currentFormQuestions.length);
          }
        } catch (error) {
          console.warn("⚠️ IA - Erro ao fazer fetch de perguntas:", error);
        }
      }
      
      console.log("📋 IA - Perguntas disponíveis:", currentFormQuestions.length);
      if (currentFormQuestions.length > 0) {
        console.log("✅ IA - Perguntas carregadas:", currentFormQuestions.map((q: any) => ({ id: q.id, question: q.question })));
      }

      // Função para mapear respostas com perguntas na IA
      const mapAIResponsesWithQuestions = (studentResponses: any) => {
        console.log("🤖 IA - Mapeando respostas:", studentResponses);
        const mappedResponses: Record<string, { question: string; answer: any }> = {};
        
        Object.keys(studentResponses).forEach(questionId => {
          const question = currentFormQuestions.find((q: any) => q.id === questionId);
          
          if (question) {
            console.log(`✅ IA - Pergunta encontrada para ${questionId}: ${question.question}`);
            mappedResponses[questionId] = {
              question: question.question,
              answer: studentResponses[questionId]
            };
          } else {
            console.warn(`⚠️ IA - Pergunta NÃO encontrada para ${questionId}`);
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
        metadata: {
          classId: classId,
          className: classData?.name || "Classe sem nome",
          divisionName: divisionName,
          projectDescription: projectDescription,
          membersPerGroup: membersPerGroup,
          totalStudents: responses?.length || 0,
          timestamp: new Date().toISOString()
        },
        formQuestions: currentFormQuestions.map((question: any) => ({
          id: question.id,
          question: question.question,
          type: question.type,
          options: question.options || [],
          isRequired: question.isRequired,
          order: question.order
        })),
        students: responses.map((response: FormResponse) => ({
          studentId: response.id,
          studentName: response.studentName,
          studentEmail: response.studentEmail || "sem-email",
          submittedAt: response.submittedAt,
          responses: mapAIResponsesWithQuestions(response.responses || {}),
          rawResponses: response.responses || {}
        }))
      };

      console.log("🤖 IA - Dados preparados:", JSON.stringify(aiRequestData, null, 2));
      console.log(`📊 Total de estudantes: ${aiRequestData.students.length}`);
      console.log(`📋 Total de perguntas: ${aiRequestData.formQuestions.length}`);
      console.log("✅ Enviando para webhook N8N...")

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
          "X-Request-Type": "ai_division",
        },
        body: JSON.stringify({
          type: "ai_division",
          source: "group-division",
          action: "divide_with_ai",
          data: aiRequestData
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status}`);
      }

      const aiResult = await response.json();
      console.log("🤖 IA - Resposta bruta do webhook:", aiResult);
      console.log("🔍 Tipo da resposta:", typeof aiResult);
      console.log("📊 É array?", Array.isArray(aiResult));
      
      if (Array.isArray(aiResult)) {
        console.log(`   Comprimento do array: ${aiResult.length}`);
        if (aiResult.length > 0) {
          console.log("   Primeiro elemento:", aiResult[0]);
          console.log("   Chaves do primeiro elemento:", Object.keys(aiResult[0]));
        }
      }
      
      // Validar e fazer parse da resposta da IA localmente
      let validatedResponse: AIDivisionResponse;
      try {
        validatedResponse = parseAndValidateAIResponse(aiResult);
        console.log("✅ IA - Resposta validada localmente com sucesso");
      } catch (validationError) {
        console.error("❌ IA - Erro na validação da resposta:", validationError);
        throw new Error(
          validationError instanceof Error 
            ? `Resposta inválida da IA: ${validationError.message}`
            : "Resposta inválida da IA"
        );
      }

      // Validar integridade dos grupos com os estudantes disponíveis (localmente)
      console.log("🔍 IA - Validando integridade dos grupos...");
      const divisionValidation = validateCompleteDivision(validatedResponse, responses);
      
      if (!divisionValidation.isValid) {
        const reportMessage = formatValidationReport(divisionValidation);
        console.error("❌ IA - Validação falhou:\n" + reportMessage);
        
        // Tentar reparar automaticamente se for um problema simples
        console.log("🔧 IA - Tentando reparar resposta automaticamente...");
        
        // 1. Verificar sugestões de reparo
        const suggestions = getSuggestions(validatedResponse, responses.map(r => ({ id: r.id, studentName: r.studentName })));
        console.log("📋 IA - Sugestões de reparo:\n" + logSuggestions(suggestions));
        
        // 2. Se forem problemas simples, tentar reparar
        let repairedResponse = validatedResponse;
        
        // Normalizar numeração de grupos se estiver fora de ordem
        if (suggestions.issues.includes("Numeração de grupos não é sequencial")) {
          console.log("🔧 IA - Normalizando numeração de grupos...");
          repairedResponse = normalizeGroupNumbers(repairedResponse);
        }
        
        // Remover duplicatas se houver
        if (suggestions.issues.some(i => i.includes("duplicado"))) {
          console.log("🔧 IA - Removendo estudantes duplicados...");
          const dupeResult = removeDuplicateStudents(repairedResponse);
          repairedResponse = dupeResult.response;
          if (dupeResult.duplicates.length > 0) {
            console.log(`   Removidos: ${dupeResult.duplicates.join(", ")}`);
          }
        }
        
        // Validar novamente após reparos
        const revalidation = validateCompleteDivision(repairedResponse, responses);
        
        if (revalidation.isValid) {
          console.log("✅ IA - Resposta reparada com sucesso!");
          validatedResponse = repairedResponse;
        } else {
          // Se ainda tiver problemas, não é um reparo simples
          const repairedReport = formatValidationReport(revalidation);
          console.error("❌ IA - Reparo automático não foi suficiente:\n" + repairedReport);
          
          // Mostrar erros para o usuário
          toast({
            title: "Erro na validação dos grupos",
            description: revalidation.globalErrors.slice(0, 2).join("; "),
            variant: "destructive",
          });
          throw new Error("Validação dos grupos falhou mesmo após reparos automáticos");
        }
      } else {
        console.log("✅ IA - Validação passou:\n" + formatValidationReport(divisionValidation));
      }
      
      // Usar a resposta da IA se disponível, caso contrário usar fallback
      let intelligentGroups: GroupWithMembers[] = [];
      
      if (validatedResponse.groups && Array.isArray(validatedResponse.groups) && validatedResponse.groups.length > 0) {
        console.log("🤖 IA - Construindo grupos com dados da IA");
        // Mapear os grupos retornados pela IA para o formato esperado
        intelligentGroups = validatedResponse.groups.map((group) => ({
          groupNumber: group.groupNumber,
          members: group.students
            .map((student) => {
              const studentData = responses.find((r: FormResponse) => r.id === student.id);
              if (!studentData) {
                console.warn(`⚠️ Estudante ${student.id} não encontrado`);
                return null;
              }
              
              // Log das informações recebidas da IA
              console.log(`📊 Estudante ${student.studentName}:`, {
                hasStrengths: (student.strengths && student.strengths.length > 0),
                strengthsCount: student.strengths?.length || 0,
                hasAttention: (student.attention && student.attention.length > 0),
                attentionCount: student.attention?.length || 0,
                strengths: student.strengths,
                attention: student.attention
              });
              
              return {
                ...studentData,
                strengths: student.strengths && student.strengths.length > 0 ? student.strengths : [],
                attention: student.attention && student.attention.length > 0 ? student.attention : []
              };
            })
            .filter((s): s is FormResponseWithAnalysis => s !== null),
          leaderId: group.leaderId
        }));
        
        console.log("✅ IA - Grupos construídos com sucesso", intelligentGroups.length);
        
        // Log dos grupos construídos para verificação
        intelligentGroups.forEach(group => {
          console.log(`📌 Grupo ${group.groupNumber}:`);
          group.members.forEach(member => {
            console.log(`   - ${member.studentName}: ${member.strengths?.length || 0} forças, ${member.attention?.length || 0} atenções`);
          });
        });
      } else {
        console.log("⚠️ IA - Nenhum resultado válido da IA, usando divisão inteligente local");
        // Por enquanto, vamos usar uma divisão inteligente baseada nas respostas
        // Em uma implementação futura, isso virá da resposta da IA
        intelligentGroups = createIntelligentGroups(responses, membersPerGroup, projectDescription);
        
        // Assignar líderes aos grupos criados localmente
        intelligentGroups = assignLeadersToGroups(intelligentGroups);
      }
      
      setGroups(intelligentGroups);
      setIsAIDivision(true); // Marcar como divisão com IA
      setAlertState({ type: null, isOpen: false });

      // Log detalhado antes de salvar
      console.log("📤 DADOS A SALVAR NO BANCO:");
      const payloadToSave = {
        name: divisionName + " (IA)",
        membersPerGroup,
        prompt,
        groups: intelligentGroups,
        sendToWebhook: true
      };
      
      console.log("Estrutura do payload:");
      console.log(`  Total de grupos: ${payloadToSave.groups.length}`);
      payloadToSave.groups.forEach((group, idx) => {
        console.log(`  Grupo ${group.groupNumber}: ${group.members.length} membros`);
        group.members.forEach((member) => {
          const hasStrengths = member.strengths && member.strengths.length > 0;
          const hasAttention = member.attention && member.attention.length > 0;
          console.log(`    - ${member.studentName}: strengths=${hasStrengths ? member.strengths.length : 0}, attention=${hasAttention ? member.attention.length : 0}`);
          if (hasStrengths) {
            console.log(`      Strengths: ${member.strengths.slice(0, 1).join("; ")}`);
          }
          if (hasAttention) {
            console.log(`      Attention: ${member.attention.slice(0, 1).join("; ")}`);
          }
        });
      });

      // Salvar/atualizar no banco de dados (com webhook para IA)
      saveGroupsMutation.mutate(payloadToSave);

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
            groups: newGroups,
            sendToWebhook: false
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
            <Card className="bg-white dark:bg-gray-800 dark:border-gray-700">
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
            <Card className="bg-white dark:bg-gray-800 dark:border-gray-700">
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
                  <Label htmlFor="projectDescription" className="text-gray-700 dark:text-gray-300">
                    Descrição do Projeto
                  </Label>
                  <Textarea
                    id="projectDescription"
                    placeholder="Ex: Projeto de programação, Projeto de equipe tech, Projeto de marketing digital..."
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    className="mt-1 resize-none"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => divideGroups(false)}
                    className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all"
                    disabled={actualResponses === 0}
                  >
                    Criação Aleatória
                  </Button>

                  <Button
                    onClick={() => divideGroupsWithAI(false)}
                    className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all"
                    disabled={actualResponses === 0 || !projectDescription.trim()}
                  >
                    Criação Inteligente com IA
                  </Button>
                  
                  
                  {/* Botão para gerar relatório (só aparece se há grupos) */}
                  {groups.length > 0 && (
                    <Button
                      onClick={() => generateReport()}
                      className="bg-gradient-to-r from-green-500 to-green-400 hover:from-green-600 hover:to-green-500 text-white shadow-lg hover:shadow-xl transition-all"
                    >
                      Gerar Relatório Completo
                    </Button>
                  )}
                  
                  {/* Botão para criar nova divisão (só aparece se já há grupos) */}
                  {groups.length > 0 && (
                    <Button
                      onClick={createNewDivision}
                      className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all"
                    >
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
            <Card className="bg-white dark:bg-gray-800">
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
                        className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-700 rounded-lg p-4 border border-blue-200 dark:border-slate-600 shadow-md hover:shadow-lg transition-shadow"
                      >
                        <h4 className="font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent mb-3">
                          Grupo {group.groupNumber}
                        </h4>
                        <div className="space-y-2">
                          {group.members.map((member) => {
                            const hasStrengths = member.strengths && member.strengths.length > 0;
                            const hasAttention = member.attention && member.attention.length > 0;
                            
                            return (
                            <Popover key={member.id}>
                              <PopoverTrigger asChild>
                                <div
                                  className={`rounded px-3 py-2 text-sm border cursor-pointer transition-all hover:shadow-md ${
                                    member.id === group.leaderId
                                      ? 'bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/50 dark:to-amber-900/50 border-yellow-400 dark:border-yellow-600 hover:from-yellow-200 hover:to-amber-200 dark:hover:from-yellow-800/70 dark:hover:to-amber-800/70'
                                      : 'bg-gradient-to-r from-white to-gray-50 dark:from-slate-700 dark:to-slate-600 border-blue-200 dark:border-slate-500 hover:from-blue-50 hover:to-indigo-50 dark:hover:from-slate-600 dark:hover:to-slate-500'
                                  }`}
                                >
                                  <span className="font-medium text-gray-900 dark:text-gray-100">
                                    {member.id === group.leaderId && ''}
                                    {member.studentName}
                                    {member.id === group.leaderId && ' (Líder)'}
                                  </span>
                                  {(hasStrengths || hasAttention) && (
                                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">Passe o mouse para detalhes</p>
                                  )}
                                </div>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-600">
                                <div className="space-y-4 max-h-[calc(90vh-100px)] overflow-y-auto pr-4">
                                  <div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{member.studentName}</h3>
                                    {member.studentEmail && (
                                      <p className="text-sm text-gray-600 dark:text-gray-400">{member.studentEmail}</p>
                                    )}
                                    {member.id === group.leaderId && (
                                      <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 mt-1">Líder do Grupo</p>
                                    )}
                                  </div>
                                  
                                  {(hasStrengths || hasAttention) && (
                                    <div className="grid grid-cols-2 gap-3">
                                      {hasStrengths && member.strengths && (
                                        <div>
                                          <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-2 text-sm">Pontos Fortes</h4>
                                          <div className="space-y-1">
                                            {member.strengths.map((strength, idx) => (
                                              <div
                                                key={idx}
                                                className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1.5 rounded text-xs border border-blue-300 dark:border-blue-700"
                                              >
                                                {strength}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {hasAttention && member.attention && (
                                        <div>
                                          <h4 className="font-semibold text-purple-700 dark:text-purple-400 mb-2 text-sm">Pontos de Atenção</h4>
                                          <div className="space-y-1">
                                            {member.attention.map((att, idx) => (
                                              <div
                                                key={idx}
                                                className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-2 py-1.5 rounded text-xs border border-purple-300 dark:border-purple-700"
                                              >
                                                {att}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {!hasStrengths && hasAttention && (
                                        <div />
                                      )}
                                      {hasStrengths && !hasAttention && (
                                        <div />
                                      )}
                                    </div>
                                  )}
                                  
                                  {!hasStrengths && !hasAttention && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 italic">Nenhum dado de análise disponível para este membro.</p>
                                  )}
                                  
                                  {member.id !== group.leaderId && (
                                    <Button
                                      onClick={() => {
                                        const updatedGroups = groups.map(g => {
                                          if (g.groupNumber === group.groupNumber) {
                                            return { ...g, leaderId: member.id };
                                          }
                                          return g;
                                        });
                                        setGroups(updatedGroups);
                                        toast({
                                          title: "Líder alterado",
                                          description: `${member.studentName} é agora o líder do Grupo ${group.groupNumber}.`,
                                        });
                                      }}
                                      className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white font-medium mt-2 focus:outline-none focus:ring-0"
                                    >
                                      Tornar Líder
                                    </Button>
                                  )}
                                </div>
                                <div className="h-2" />
                              </PopoverContent>
                            </Popover>
                            );
                          })}
                        </div>
                        <div className="mt-3 text-xs text-blue-600 dark:text-blue-400 font-medium">
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
                (alertState.data?.isAI ? "Criação inteligente" : "Criação aleatória") : 
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