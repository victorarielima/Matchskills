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
import { questionTemplates, applyTemplate } from "@/lib/questionTemplates";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SidebarDashboard from "@/components/ui/sidebar-dashboard";
import FormBuilder from "@/components/forms/form-builder";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { X, Plus, FileText, Layers, ChevronDown } from "lucide-react";
import type { InsertClass, InsertFormQuestion, Class, FormQuestion } from "@shared/schema";

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
      const isDark = html.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      observer.disconnect();
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
    if (!isDarkMode) {
      return {
        backgroundColor: '#2563eb', // blue-600
        borderColor: '#2563eb',
        color: 'white',
        transition: 'all 0.3s ease-in-out',
      };
    }
    
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
        description: isEditMode ? "Grupo atualizado com sucesso!" : "Grupo criado com sucesso!",
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
        description: `Falha ao ${isEditMode ? 'atualizar' : 'criar'} grupo. Tente novamente.`,
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

  const applyQuestionTemplate = (templateId: string) => {
    const templateQuestions = applyTemplate(templateId);
    setQuestions(templateQuestions);
    toast({
      title: "Template aplicado!",
      description: `${templateQuestions.length} perguntas foram adicionadas do template.`,
    });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <SidebarDashboard />
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto transition-all duration-300" style={{ marginLeft: 'var(--sidebar-width, 16rem)' }}>
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white" style={isDarkMode ? getGlowStyle('#3b82f6') : {}}>
                    {isEditMode ? 'Editar Formulário' : 'Criar Novo Formulário'}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 mt-2" style={isDarkMode ? getGlowStyle('#64748b') : {}}>
                    {isEditMode 
                      ? 'Atualize as informações do seu grupo e formulário de avaliação'
                      : 'Configure seu grupo e crie um formulário de avaliação personalizado'
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
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white" style={getGlowStyle('#10b981')}>Informações do Grupo</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome do Grupo</Label>
                      <Input
                        id="name"
                        placeholder="Ex: Avaliação de Competências - Marketing"
                        className="bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
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
                        {...form.register("groupCount", { valueAsNumber: true })}
                      />
                      {form.formState.errors.groupCount && (
                        <p className="text-sm text-red-600">{form.formState.errors.groupCount.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="isActive">Status do Grupo</Label>
                      <div className="flex items-center space-x-2">
                        <input
                          id="isActive"
                          type="checkbox"
                          {...form.register("isActive")}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label htmlFor="isActive" className="text-sm text-gray-600 dark:text-gray-300" style={isDarkMode ? getGlowStyle('#f59e0b') : {}}>
                          Grupo ativo (permite receber respostas)
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Builder */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white" style={getGlowStyle('#8b5cf6')}>Formulário de Avaliação</h2>
                    <div className="flex items-center space-x-3">
                      {/* Template Dropdown Button */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                          >
                            <Layers className="mr-2 h-4 w-4" />
                            Templates
                            <ChevronDown className="ml-1 h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80">
                          {questionTemplates.map((template) => (
                            <DropdownMenuItem
                              key={template.id}
                              className="cursor-pointer p-3 transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-950/50 dark:hover:to-indigo-950/50 hover:shadow-sm border-l-4 border-transparent hover:border-blue-500 dark:hover:border-blue-400"
                              onClick={() => applyQuestionTemplate(template.id)}
                            >
                              <div className="flex flex-col space-y-1">
                                <div className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                                  {template.name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                  {template.description}
                                </div>
                                <div className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium">
                                  {template.questions.length} perguntas
                                </div>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      {/* Add Question Button */}
                      <Button
                        type="button"
                        variant="outline"
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
                      : (isEditMode ? "Atualizar Formulário" : "Criar Formulário")
                    }
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
