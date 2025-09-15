import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { insertClassSchema, insertFormQuestionSchema } from "@shared/schema";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Nav from "@/components/ui/nav";
import FormBuilder from "@/components/forms/form-builder";
import { X, Plus, FileText } from "lucide-react";
import type { InsertClass, InsertFormQuestion, Class, FormQuestion } from "@shared/schema";

// Formulários padrão
const DISC_TEMPLATE: InsertFormQuestion[] = [
  {
    type: "text",
    question: "Qual sua matrícula?",
    order: 1,
    isRequired: true,
  },
  {
    type: "text", 
    question: "Qual seu nome?",
    order: 2,
    isRequired: true,
  },
  {
    type: "radio",
    question: "Qual seu nível de conhecimento em desenvolvimento web (HTML, CSS, JS)?",
    order: 3,
    isRequired: true,
    options: ["Iniciante", "Intermediário", "Avançado", "Nenhum"],
  },
  {
    type: "checkbox",
    question: "Você já usou algum framework web? (Pode marcar mais de uma opção)",
    order: 4,
    isRequired: true,
    options: ["Não", "Angular", "Bootstrap", "Flask", "Node.js", "PHP", "React", "Spring Boot", "Vue.js", "Next.js", "ElysiaJS", "ExpressJS", "Django", "Laravel"],
  },
  {
    type: "radio",
    question: "Qual seu nível de conhecimento em desenvolvimento Mobile?",
    order: 5,
    isRequired: true,
    options: ["Nenhum", "Iniciante", "Intermediário", "Avançado"],
  },
  {
    type: "checkbox",
    question: "Você já desenvolveu apps mobile? (Pode marcar mais de uma opção)",
    order: 6,
    isRequired: true,
    options: ["Não", "Unity", "Android Studio", "React Native", "Expo", "Flutter"],
  },
  {
    type: "checkbox",
    question: "Você já trabalhou com banco de dados?",
    order: 7,
    isRequired: true,
    options: ["Não", "My SQL", "PostgreSQL", "Oracle", "SQL Server", "Firebase", "Mongo DB", "Supabase", "Draw SQL"],
  },
  {
    type: "checkbox",
    question: "Você já publicou algum site ou app?",
    order: 8,
    isRequired: true,
    options: ["Nunca publiquei", "GitHub", "Heroku", "Render", "Vercel", "Firebase", "GCP", "AWS", "Azure"],
  },
  {
    type: "radio",
    question: "Com qual palavra você mais se identifica?",
    order: 9,
    isRequired: true,
    options: ["Cuidadoso", "Paciente", "Comunicativo", "Determinado"],
  },
  {
    type: "radio",
    question: "Qual dessas palavras mais se aplica a você?",
    order: 10,
    isRequired: true,
    options: ["Prestativo", "Entusiasmado", "Organizado", "Competitivo"],
  },
  {
    type: "radio",
    question: "Qual adjetivo te descreve melhor?",
    order: 11,
    isRequired: true,
    options: ["Calmo", "Direto", "Otimista", "Preciso"],
  },
  {
    type: "radio",
    question: "Em uma situação nova, você tende a:",
    order: 12,
    isRequired: true,
    options: ["Manter a harmonia", "Seguir as regras", "Tomar decisões rápidas", "Convencer as pessoas"],
  },
  {
    type: "radio",
    question: "Você prefere:",
    order: 13,
    isRequired: true,
    options: ["Ter estabilidade", "Focar nos resultados", "Trabalhar com dados e fatos", "Estar com pessoas"],
  },
  {
    type: "text",
    question: "Perfil: (Essa informação será determinada com base nas respostas dos participantes)",
    order: 14,
    isRequired: false,
  },
];

const BIG_FIVE_TEMPLATE: InsertFormQuestion[] = [
  {
    type: "text",
    question: "Qual sua matrícula?",
    order: 1,
    isRequired: true,
  },
  {
    type: "text",
    question: "Qual seu nome?",
    order: 2,
    isRequired: true,
  },
  {
    type: "scale",
    question: "Eu me vejo como alguém que é falante, extrovertido",
    order: 3,
    isRequired: true,
    scaleMin: 1,
    scaleMax: 7,
  },
  {
    type: "scale",
    question: "Eu me vejo como alguém que tende a encontrar defeitos nos outros",
    order: 4,
    isRequired: true,
    scaleMin: 1,
    scaleMax: 7,
  },
  {
    type: "scale",
    question: "Eu me vejo como alguém que faz um trabalho completo e minucioso",
    order: 5,
    isRequired: true,
    scaleMin: 1,
    scaleMax: 7,
  },
  {
    type: "scale",
    question: "Eu me vejo como alguém que fica deprimido, melancólico",
    order: 6,
    isRequired: true,
    scaleMin: 1,
    scaleMax: 7,
  },
  {
    type: "scale",
    question: "Eu me vejo como alguém que é original, tem ideias novas",
    order: 7,
    isRequired: true,
    scaleMin: 1,
    scaleMax: 7,
  },
];

const createClassFormSchema = insertClassSchema.extend({
  questions: z.array(insertFormQuestionSchema).optional(),
});

type CreateClassForm = z.infer<typeof createClassFormSchema>;

export default function CreateClass() {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const isAuthenticated = !!user;
  const [, setLocation] = useLocation();
  const { classId } = useParams<{ classId?: string }>();
  const queryClient = useQueryClient();
  const [questions, setQuestions] = useState<InsertFormQuestion[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const isEditMode = !!classId;

  const form = useForm<CreateClassForm>({
    resolver: zodResolver(createClassFormSchema),
    defaultValues: {
      name: "",
      studentLimit: 30,
      groupCount: 4,
      isActive: true,
    },
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
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
      const html = document.documentElement;
      const isDark = html.classList.contains('dark') || 
                     window.getComputedStyle(html).colorScheme === 'dark' ||
                     window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    });

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', checkDarkMode);
    };
  }, []);

  // Glow effect function
  const getGlowStyle = (color: string = '#3b82f6') => {
    if (!isDarkMode) return {};
    
    return {
      textShadow: `0 0 10px ${color}40, 0 0 20px ${color}30, 0 0 30px ${color}20`,
      transition: 'text-shadow 0.3s ease-in-out',
    };
  };

  // Button glow style function
  const getButtonStyle = () => {
    if (!isDarkMode) return {};
    
    return {
      backgroundColor: '#9741E7',
      borderColor: '#9741E7',
      color: 'white',
      boxShadow: `0 0 10px #9741E740, 0 0 20px #9741E730, 0 0 30px #9741E720`,
      transition: 'all 0.3s ease-in-out',
    };
  };

  // Load class data for editing
  const { data: classData } = useQuery<Class>({
    queryKey: ["/api/classes", classId],
    enabled: isEditMode && isAuthenticated,
    retry: false,
  });

  const { data: existingQuestions = [] } = useQuery<FormQuestion[]>({
    queryKey: ["/api/classes", classId, "questions"],
    enabled: isEditMode && isAuthenticated,
    retry: false,
  });

  // Update form when class data is loaded
  useEffect(() => {
    if (classData && isEditMode) {
      form.reset({
        name: classData.name,
        studentLimit: classData.studentLimit,
        groupCount: classData.groupCount,
        isActive: classData.isActive ?? true,
      });
    }
  }, [classData, isEditMode, form]);

  // Update questions when existing questions are loaded
  useEffect(() => {
    if (existingQuestions.length > 0 && isEditMode) {
      setQuestions(existingQuestions.map((q, index) => ({
        type: q.type,
        question: q.question,
        order: index + 1,
        options: q.options,
        isRequired: q.isRequired ?? false,
        scaleMin: q.scaleMin,
        scaleMax: q.scaleMax,
      })));
    }
  }, [existingQuestions, isEditMode]);

  const createClassMutation = useMutation({
    mutationFn: async (data: { classData: InsertClass; questions: InsertFormQuestion[] }) => {
      if (isEditMode) {
        return await apiRequest("PUT", `/api/classes/${classId}`, data);
      } else {
        return await apiRequest("POST", "/api/classes", data);
      }
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: isEditMode ? "Turma atualizada com sucesso!" : "Turma criada com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      setLocation("/");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: `Falha ao ${isEditMode ? 'atualizar' : 'criar'} turma. Tente novamente.`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateClassForm) => {
    createClassMutation.mutate({
      classData: {
        name: data.name,
        studentLimit: data.studentLimit,
        groupCount: data.groupCount,
        isActive: data.isActive,
      },
      questions,
    });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Nav />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white" style={getGlowStyle('#3b82f6')}>
                    {isEditMode ? 'Editar Turma' : 'Criar Nova Turma'}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 mt-2" style={isDarkMode ? getGlowStyle('#64748b') : {}}>
                    {isEditMode 
                      ? 'Atualize as informações da sua turma e formulário de avaliação'
                      : 'Configure sua turma e crie um formulário de avaliação personalizado'
                    }
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setLocation("/")}
                  style={getButtonStyle()}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Basic Class Information */}
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white" style={getGlowStyle('#10b981')}>Informações da Turma</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome da Turma</Label>
                      <Input
                        id="name"
                        placeholder="Ex: Avaliação de Competências - Marketing"
                        className="bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            // Trigger form submission
                            const form = e.currentTarget.closest('form');
                            if (form) {
                              form.requestSubmit();
                            }
                          }
                        }}
                        {...form.register("name")}
                      />
                      {form.formState.errors.name && (
                        <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="studentLimit">Limite de Participantes</Label>
                      <Input
                        id="studentLimit"
                        type="number"
                        min="1"
                        max="200"
                        className="bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            // Trigger form submission
                            const form = e.currentTarget.closest('form');
                            if (form) {
                              form.requestSubmit();
                            }
                          }
                        }}
                        {...form.register("studentLimit", { valueAsNumber: true })}
                      />
                      {form.formState.errors.studentLimit && (
                        <p className="text-sm text-red-600">{form.formState.errors.studentLimit.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="groupCount">Número de Grupos</Label>
                      <Input
                        id="groupCount"
                        type="number"
                        min="1"
                        max="20"
                        className="bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            // Trigger form submission
                            const form = e.currentTarget.closest('form');
                            if (form) {
                              form.requestSubmit();
                            }
                          }
                        }}
                        {...form.register("groupCount", { valueAsNumber: true })}
                      />
                      {form.formState.errors.groupCount && (
                        <p className="text-sm text-red-600">{form.formState.errors.groupCount.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="isActive">Status da Turma</Label>
                      <div className="flex items-center space-x-2">
                        <input
                          id="isActive"
                          type="checkbox"
                          {...form.register("isActive")}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label htmlFor="isActive" className="text-sm text-gray-600 dark:text-gray-300" style={isDarkMode ? getGlowStyle('#f59e0b') : {}}>
                          Turma ativa (permite receber respostas)
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Builder */}
                <div className="space-y-6">
                  <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white" style={getGlowStyle('#8b5cf6')}>Formulário de Avaliação</h2>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setQuestions(DISC_TEMPLATE)}
                        style={getButtonStyle()}
                      >
                        Usar Template DISC
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setQuestions(BIG_FIVE_TEMPLATE)}
                        style={getButtonStyle()}
                      >
                        Usar Template Big Five
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setQuestions([...questions, {
                          type: "text",
                          question: "",
                          order: questions.length + 1,
                          isRequired: false,
                        }])}
                        style={getButtonStyle()}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Pergunta
                      </Button>
                    </div>
                  </div>

                  {/* Templates Info */}
                  {questions.length === 0 && (
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3" style={getGlowStyle('#10b981')}>
                        Templates Disponíveis
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-white dark:bg-gray-700 rounded border">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Template DISC</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Formulário completo para avaliação de perfil comportamental DISC, incluindo perguntas sobre conhecimentos técnicos e características pessoais.
                          </p>
                        </div>
                        <div className="p-3 bg-white dark:bg-gray-700 rounded border">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Template Big Five</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Formulário baseado no modelo dos Cinco Grandes Fatores de personalidade com escalas de avaliação.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <FormBuilder
                    questions={questions}
                    onChange={setQuestions}
                  />

                  {questions.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <FileText className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-500 mb-4" />
                      <p style={isDarkMode ? getGlowStyle('#6b7280') : {}}>Nenhuma pergunta adicionada ainda.</p>
                      <p className="text-sm" style={isDarkMode ? getGlowStyle('#6b7280') : {}}>Clique em "Adicionar Pergunta" para começar.</p>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/")}
                    style={getButtonStyle()}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createClassMutation.isPending}
                    style={getButtonStyle()}
                  >
                    {createClassMutation.isPending 
                      ? (isEditMode ? "Atualizando..." : "Criando...")
                      : (isEditMode ? "Atualizar Turma" : "Criar Turma")
                    }
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
