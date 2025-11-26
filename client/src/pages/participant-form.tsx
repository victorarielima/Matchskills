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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { GraduationCap, Users, Send, ArrowLeft, Lock } from "lucide-react";
import AutoDarkModeDetector from "@/components/ui/auto-dark-mode-detector";
import AnimatedLogo from "@/components/ui/animated-logo";
import type { Class, FormQuestion } from "@shared/schema";

const submitFormSchema = z.object({
  participantName: z.string().min(1, "Nome é obrigatório"),
  participantEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  responses: z.record(z.string()),
});

type SubmitFormData = z.infer<typeof submitFormSchema>;

export default function ParticipantForm() {
  const { code } = useParams<{ code: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [checkboxResponses, setCheckboxResponses] = useState<Record<string, string[]>>({});

  // State to track if class is inactive (closed)
  const [isClassClosed, setIsClassClosed] = useState(false);
  const [isClassFull, setIsClassFull] = useState(false);

  const { data: classData, isLoading: classLoading, error: classError } = useQuery<Class>({
    queryKey: ["/api/class", code],
    enabled: !!code,
    retry: false,
  });

  const { data: questions = [], isLoading: questionsLoading } = useQuery<FormQuestion[]>({
    queryKey: ["/api/class", code, "questions"],
    enabled: !!code && !!classData,
    queryFn: async () => {
      const res = await fetch(`/api/class/${code}/questions`);
      if (!res.ok) throw new Error('Failed to fetch questions');
      const data = await res.json();
      console.log("📋 Questions carregadas do servidor:", data.map((q: any) => ({ id: q.id, question: q.question })));
      return data;
    }
  });

  // Check response count to see if class is full
  const { data: responseCount = 0 } = useQuery<number>({
    queryKey: ["/api/class", code, "response-count"],
    enabled: !!code && !!classData,
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", `/api/class/${code}/response-count`);
        return response?.count || 0;
      } catch {
        return 0;
      }
    },
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  const form = useForm<SubmitFormData>({
    resolver: zodResolver(submitFormSchema),
    defaultValues: {
      participantName: "",
      participantEmail: "",
      responses: {},
    },
  });

  // Handle checkbox responses
  const handleCheckboxChange = (questionId: string, option: string, checked: boolean) => {
    setCheckboxResponses(prev => {
      const currentValues = prev[questionId] || [];
      let newValues: string[];
      
      if (checked) {
        newValues = [...currentValues, option];
      } else {
        newValues = currentValues.filter(value => value !== option);
      }
      
      // Update form state
      form.setValue(`responses.${questionId}`, newValues);
      
      return {
        ...prev,
        [questionId]: newValues
      };
    });
  };

  const submitFormMutation = useMutation({
    mutationFn: async (data: SubmitFormData) => {
      // Get all form values
      const formValues = form.getValues();
      
      console.log("🔍 Submissão iniciada");
      console.log("📋 Questions disponíveis:", questions.length);
      questions.forEach((q, idx) => {
        console.log(`  Q${idx}: ${q.id} = ${q.question}`);
      });
      
      // Create a fresh responses object using question IDs directly
      const responsesByQuestionId: Record<string, any> = {};
      
      // For each question, get the response value
      questions.forEach((question) => {
        let responseValue: any = formValues.responses?.[question.id];
        
        // For checkboxes, always use our separate state which is the source of truth
        if (question.type === 'checkbox') {
          responseValue = checkboxResponses[question.id] || [];
        }
        
        // Only include non-empty responses
        if (responseValue !== undefined && responseValue !== null && responseValue !== '') {
          responsesByQuestionId[question.id] = responseValue;
        }
      });
      
      console.log("✅ Respostas construídas com IDs:", Object.keys(responsesByQuestionId));
      Object.entries(responsesByQuestionId).slice(0, 3).forEach(([k, v]) => {
        console.log(`  ${k} = ${v}`);
      });
      
      const submissionData = {
        studentName: data.participantName,
        studentEmail: data.participantEmail || null,
        responses: responsesByQuestionId,
      };
      
      console.log("📤 Enviando para servidor:", {
        studentName: submissionData.studentName,
        studentEmail: submissionData.studentEmail,
        responsesKeys: Object.keys(submissionData.responses)
      });
      
      return await apiRequest("POST", `/api/class/${code}/submit`, submissionData);
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
      // Check if error indicates the class is closed/inactive
      const errorMessage = (classError as any)?.message || '';
      const errorStatus = (classError as any)?.status || (classError as any)?.response?.status;
      
      if (errorMessage.includes('closed') || errorStatus === 400) {
        setIsClassClosed(true);
      } else {
        toast({
          title: "Erro",
          description: "Grupo não encontrado ou código inválido.",
          variant: "destructive",
        });
        setTimeout(() => setLocation("/"), 2000);
      }
    }
  }, [classError, setLocation, toast]);

  // Check if class has reached student limit
  useEffect(() => {
    if (classData && responseCount >= classData.studentLimit) {
      setIsClassFull(true);
    }
  }, [classData, responseCount]);

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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <AutoDarkModeDetector />
        <div className="text-center">
          <GraduationCap className="mx-auto h-12 w-12 text-primary mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  // Check if form is inactive/locked FIRST
  if (isClassClosed) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <AutoDarkModeDetector />
        <div className="max-w-md mx-auto px-4">
          <AnimatedLogo size="lg" showText={true} className="justify-center mb-6" />
          <Card className="text-center border-blue-200 bg-blue-50 dark:border-purple-700 dark:bg-purple-900/20">
            <CardContent className="p-8">
              <div className="mx-auto h-16 w-16 text-blue-600 dark:text-purple-400 mb-4 flex items-center justify-center">
                <Lock className="w-16 h-16" />
              </div>
              <h1 className="text-xl font-bold text-blue-800 dark:text-purple-200 mb-3">Formulário Fechado</h1>
              <p className="text-blue-700 dark:text-purple-300 mb-4 leading-relaxed">
                Este formulário foi fechado pelo organizador e não está mais disponível para respostas.
              </p>
              <p className="text-blue-600 dark:text-purple-400 text-sm mb-6">
                Entre em contato com o operador para verificar como proceder.
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={() => setLocation("/")} 
                  variant="outline"
                  className="w-full border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-purple-500 dark:text-purple-300 dark:hover:bg-purple-900/30"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para Página Inicial
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Check if class has reached student limit
  if (isClassFull) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <AutoDarkModeDetector />
        <div className="max-w-md mx-auto px-4">
          <AnimatedLogo size="lg" showText={true} className="justify-center mb-6" />
          <Card className="text-center border-orange-200 bg-orange-50 dark:border-orange-700 dark:bg-orange-900/20">
            <CardContent className="p-8">
              <div className="mx-auto h-16 w-16 text-orange-600 dark:text-orange-400 mb-4 flex items-center justify-center">
                <Users className="w-16 h-16" />
              </div>
              <h1 className="text-xl font-bold text-orange-800 dark:text-orange-200 mb-3">Turma Completa</h1>
              <p className="text-orange-700 dark:text-orange-300 mb-4 leading-relaxed">
                Esta turma atingiu o limite máximo de participantes e não está mais aceitando novas respostas.
              </p>
              <p className="text-orange-600 dark:text-orange-400 text-sm mb-6">
                Tente novamente mais tarde ou entre em contato com o organizador.
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={() => setLocation("/")} 
                  variant="outline"
                  className="w-full border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-500 dark:text-orange-300 dark:hover:bg-orange-900/30"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para Página Inicial
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <AutoDarkModeDetector />
        <div className="max-w-md mx-auto px-4">
          <AnimatedLogo size="lg" showText={true} className="justify-center mb-6" />
          <Card className="text-center border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20">
            <CardContent className="p-8">
              <div className="mx-auto h-16 w-16 text-red-600 dark:text-red-400 mb-4 flex items-center justify-center">
                <GraduationCap className="w-16 h-16" />
              </div>
              <h1 className="text-xl font-bold text-red-800 dark:text-red-200 mb-3">Grupo Não Encontrado</h1>
              <p className="text-red-700 dark:text-red-300 mb-4 leading-relaxed">
                O código informado não corresponde a nenhum grupo ativo ou o link pode estar incorreto.
              </p>
              <p className="text-red-600 dark:text-red-400 text-sm mb-6">
                Verifique o código e tente novamente.
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={() => setLocation("/")} 
                  variant="outline"
                  className="w-full border-red-300 text-red-700 hover:bg-red-100 dark:border-red-500 dark:text-red-300 dark:hover:bg-red-900/30"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para Digitar Código
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }



  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AutoDarkModeDetector />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AnimatedLogo size="lg" showText={true} className="justify-center mb-6" />
          <Card className="text-center bg-white dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-8">
              <GraduationCap className="mx-auto h-16 w-16 text-secondary mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Respostas Enviadas!</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AutoDarkModeDetector />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatedLogo size="lg" showText={true} className="justify-center mb-6" />
        {/* Class Header */}
        <Card className="mb-6 border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="text-center">
              <Users className="mx-auto h-12 w-12 text-blue-600 dark:text-purple-500 mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{classData?.name}</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">Preencha o formulário abaixo</p>
              <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-purple-900/30 dark:text-purple-300">
                <span className="font-mono">Código: {classData?.code}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student Form */}
        <Card className="border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Formulário de Avaliação</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Todas as perguntas marcadas com * são obrigatórias</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </div>
          
          <CardContent className="p-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Student Info */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Informações do Participante</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="participantName" className="dark:text-gray-300">Nome Completo *</Label>
                    <Input
                      {...form.register("participantName")}
                      className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                      placeholder="Digite seu nome..."
                      required
                    />
                    {form.formState.errors.participantName && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.participantName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="participantEmail" className="dark:text-gray-300">E-mail</Label>
                    <Input
                      {...form.register("participantEmail")}
                      type="email"
                      className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                      placeholder="seu.email@exemplo.com"
                    />
                    {form.formState.errors.participantEmail && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.participantEmail.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Questions */}
              {questions.map((question, index) => (
                <div key={question.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 dark:bg-gray-700/30">
                  <div className="mb-3">
                    <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {index + 1}. {question.question} {question.isRequired && "*"}
                    </Label>
                  </div>
                  
                  {question.type === "text" && (
                    <Input
                      id={`text-${question.id}`}
                      {...form.register(`responses.${question.id}`, {
                        required: question.isRequired ? "Este campo é obrigatório" : false,
                      })}
                      className="mt-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                      placeholder="Digite aqui..."
                    />
                  )}
                  
                  {question.type === "textarea" && (
                    <Textarea
                      id={`textarea-${question.id}`}
                      {...form.register(`responses.${question.id}`, {
                        required: question.isRequired ? "Este campo é obrigatório" : false,
                      })}
                      rows={4}
                      className="mt-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                      placeholder="Digite aqui..."
                    />
                  )}
                  
                  {question.type === "radio" && question.options && (
                    <RadioGroup
                      value={form.watch(`responses.${question.id}`) || ""}
                      onValueChange={(value) => form.setValue(`responses.${question.id}`, value)}
                      className="mt-2 space-y-2"
                    >
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`radio-${question.id}-${optionIndex}`} />
                          <Label htmlFor={`radio-${question.id}-${optionIndex}`} className="cursor-pointer dark:text-gray-300">{option}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {question.type === "checkbox" && question.options && (
                    <div className="space-y-2 mt-2">
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-2">
                          <Checkbox
                            id={`checkbox-${question.id}-${optionIndex}`}
                            checked={(checkboxResponses[question.id] || []).includes(option)}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(question.id, option, !!checked)
                            }
                          />
                          <Label htmlFor={`checkbox-${question.id}-${optionIndex}`} className="cursor-pointer dark:text-gray-300">{option}</Label>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {question.type === "scale" && question.scaleMin !== undefined && question.scaleMax !== undefined && (
                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mt-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{question.scaleMin} (Baixo)</span>
                      <RadioGroup
                        value={form.watch(`responses.${question.id}`) || ""}
                        onValueChange={(value) => form.setValue(`responses.${question.id}`, value)}
                        className="flex space-x-2"
                      >
                        {Array.from({ length: question.scaleMax - question.scaleMin + 1 }, (_, i) => {
                          const value = question.scaleMin! + i;
                          return (
                            <div key={value} className="flex flex-col items-center">
                              <RadioGroupItem value={value.toString()} id={`scale-${question.id}-${value}`} />
                              <Label htmlFor={`scale-${question.id}-${value}`} className="text-sm cursor-pointer dark:text-gray-300">
                                {value}
                              </Label>
                            </div>
                          );
                        })}
                      </RadioGroup>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{question.scaleMax} (Alto)</span>
                    </div>
                  )}
                </div>
              ))}

              {/* Submit Button */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/")}
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary-600 text-lg py-3"
                    disabled={submitFormMutation.isPending}
                  >
                    <Send className="mr-2 h-5 w-5" />
                    {submitFormMutation.isPending ? "Enviando..." : "Enviar Respostas"}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  Suas respostas serão enviadas de forma anônima para análise do organizador
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
