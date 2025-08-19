import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { GraduationCap, Users, Send } from "lucide-react";
import type { Class, FormQuestion } from "@shared/schema";

const submitFormSchema = z.object({
  studentName: z.string().min(1, "Nome é obrigatório"),
  studentEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  responses: z.record(z.string()),
});

type SubmitFormData = z.infer<typeof submitFormSchema>;

export default function StudentForm() {
  const { code } = useParams<{ code: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const { data: classData, isLoading: classLoading, error: classError } = useQuery<Class>({
    queryKey: ["/api/class", code],
    enabled: !!code,
  });

  const { data: questions = [], isLoading: questionsLoading } = useQuery<FormQuestion[]>({
    queryKey: ["/api/class", code, "questions"],
    enabled: !!code && !!classData,
  });

  const form = useForm<SubmitFormData>({
    resolver: zodResolver(submitFormSchema),
    defaultValues: {
      studentName: "",
      studentEmail: "",
      responses: {},
    },
  });

  const submitFormMutation = useMutation({
    mutationFn: async (data: SubmitFormData) => {
      return await apiRequest("POST", `/api/class/${code}/submit`, {
        studentName: data.studentName,
        studentEmail: data.studentEmail || null,
        responses: data.responses,
      });
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Suas respostas foram enviadas com sucesso!",
      });
      setSubmitted(true);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao enviar respostas. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Redirect if class not found or closed
  useEffect(() => {
    if (classError) {
      toast({
        title: "Erro",
        description: "Turma não encontrada ou código inválido.",
        variant: "destructive",
      });
      setTimeout(() => setLocation("/"), 2000);
    }
  }, [classError, setLocation, toast]);

  const onSubmit = (data: SubmitFormData) => {
    // Validate required questions
    const requiredQuestions = questions.filter(q => q.isRequired);
    const missingAnswers = requiredQuestions.filter(q => !data.responses[q.id]);
    
    if (missingAnswers.length > 0) {
      toast({
        title: "Erro",
        description: "Por favor, responda todas as perguntas obrigatórias.",
        variant: "destructive",
      });
      return;
    }

    submitFormMutation.mutate(data);
  };

  if (classLoading || questionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <GraduationCap className="mx-auto h-12 w-12 text-primary mb-4" />
          <p className="text-gray-600">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Turma não encontrada</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="text-center">
            <CardContent className="p-8">
              <GraduationCap className="mx-auto h-16 w-16 text-secondary mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Respostas Enviadas!</h1>
              <p className="text-gray-600 mb-4">
                Obrigado por participar. Suas respostas foram registradas com sucesso.
              </p>
              <Button onClick={() => setLocation("/")} variant="outline">
                Voltar ao Início
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Class Header */}
        <Card className="mb-6 border border-gray-200">
          <CardContent className="p-6">
            <div className="text-center">
              <Users className="mx-auto h-12 w-12 text-primary mb-4" />
              <h1 className="text-2xl font-bold text-gray-900">{classData.name}</h1>
              <p className="text-gray-600 mt-2">Preencha o formulário abaixo</p>
              <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800">
                <span className="font-mono">Código: {classData.code}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student Form */}
        <Card className="border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Formulário de Avaliação</h2>
            <p className="text-sm text-gray-600 mt-1">Todas as perguntas marcadas com * são obrigatórias</p>
          </div>
          
          <CardContent className="p-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Student Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Informações do Aluno</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="studentName">Nome Completo *</Label>
                    <Input
                      {...form.register("studentName")}
                      className="mt-1"
                      required
                    />
                    {form.formState.errors.studentName && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.studentName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="studentEmail">E-mail</Label>
                    <Input
                      {...form.register("studentEmail")}
                      type="email"
                      className="mt-1"
                    />
                    {form.formState.errors.studentEmail && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.studentEmail.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Questions */}
              {questions.map((question, index) => (
                <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="mb-3">
                    <Label className="block text-sm font-medium text-gray-700">
                      {index + 1}. {question.question} {question.isRequired && "*"}
                    </Label>
                  </div>
                  
                  {question.type === "text" && (
                    <Input
                      {...form.register(`responses.${question.id}`)}
                      required={question.isRequired}
                    />
                  )}
                  
                  {question.type === "textarea" && (
                    <Textarea
                      {...form.register(`responses.${question.id}`)}
                      rows={4}
                      required={question.isRequired}
                    />
                  )}
                  
                  {question.type === "radio" && question.options && (
                    <RadioGroup
                      onValueChange={(value) => form.setValue(`responses.${question.id}`, value)}
                    >
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`${question.id}-${optionIndex}`} />
                          <Label htmlFor={`${question.id}-${optionIndex}`}>{option}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                  
                  {question.type === "scale" && question.scaleMin && question.scaleMax && (
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                      <span className="text-sm text-gray-600">{question.scaleMin} (Baixo)</span>
                      <RadioGroup
                        className="flex space-x-2"
                        onValueChange={(value) => form.setValue(`responses.${question.id}`, value)}
                      >
                        {Array.from({ length: question.scaleMax - question.scaleMin + 1 }, (_, i) => {
                          const value = question.scaleMin! + i;
                          return (
                            <div key={value} className="flex flex-col items-center">
                              <RadioGroupItem value={value.toString()} id={`${question.id}-${value}`} />
                              <Label htmlFor={`${question.id}-${value}`} className="text-sm">
                                {value}
                              </Label>
                            </div>
                          );
                        })}
                      </RadioGroup>
                      <span className="text-sm text-gray-600">{question.scaleMax} (Alto)</span>
                    </div>
                  )}
                </div>
              ))}

              {/* Submit Button */}
              <div className="pt-6 border-t border-gray-200">
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-600 text-lg py-3"
                  disabled={submitFormMutation.isPending}
                >
                  <Send className="mr-2 h-5 w-5" />
                  {submitFormMutation.isPending ? "Enviando..." : "Enviar Respostas"}
                </Button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Suas respostas serão enviadas de forma anônima para análise do professor
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
