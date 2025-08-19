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
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {isEditMode ? 'Editar Turma' : 'Criar Nova Turma'}
                  </h1>
                  <p className="text-gray-600 mt-2">
                    {isEditMode 
                      ? 'Atualize as informações da sua turma e formulário de avaliação'
                      : 'Configure sua turma e crie um formulário de avaliação personalizado'
                    }
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setLocation("/")}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Basic Class Information */}
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Informações da Turma</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome da Turma</Label>
                      <Input
                        id="name"
                        placeholder="Ex: Avaliação de Competências - Marketing"
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
                        <Label htmlFor="isActive" className="text-sm text-gray-600">
                          Turma ativa (permite receber respostas)
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Builder */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Formulário de Avaliação</h2>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setQuestions([...questions, {
                        type: "text",
                        question: "",
                        order: questions.length + 1,
                        isRequired: false,
                      }])}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Pergunta
                    </Button>
                  </div>

                  <FormBuilder
                    questions={questions}
                    onChange={setQuestions}
                  />

                  {questions.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                      <p>Nenhuma pergunta adicionada ainda.</p>
                      <p className="text-sm">Clique em "Adicionar Pergunta" para começar.</p>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/")}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createClassMutation.isPending}
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
