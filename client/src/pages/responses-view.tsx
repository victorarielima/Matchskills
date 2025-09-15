import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import Nav from "@/components/ui/nav";
import { ArrowLeft, Download, Filter, SortAsc, BarChart3, Users, FileText, Clock } from "lucide-react";
import type { FormResponse, FormQuestion } from "@shared/schema";

export default function ResponsesView() {
  const { classId } = useParams<{ classId: string }>();
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const isAuthenticated = !!user;
  const [, setLocation] = useLocation();
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  const { data: responses = [], isLoading: responsesLoading, error } = useQuery<FormResponse[]>({
    queryKey: ["/api/classes", classId, "responses"],
    enabled: !!classId && isAuthenticated,
    retry: false,
  });

  const { data: responseDetails, isLoading: responseDetailsLoading, error: responseDetailsError } = useQuery<FormResponse & { questions: FormQuestion[] }>({
    queryKey: ["/api/responses", selectedResponseId],
    enabled: !!selectedResponseId && isAuthenticated,
    retry: false,
  });

  useEffect(() => {
    if (error && isUnauthorizedError(error)) {
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
  }, [error, toast]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getTimeAgo = (date: string | Date) => {
    const now = new Date();
    const submittedDate = typeof date === 'string' ? new Date(date) : date;
    const diffInMinutes = Math.floor((now.getTime() - submittedDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min atrás`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h atrás`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d atrás`;
    }
  };

  const openResponseDetails = (responseId: string) => {
    setSelectedResponseId(responseId);
  };

  const closeResponseDetails = () => {
    setSelectedResponseId(null);
  };

  const renderResponseValue = (question: FormQuestion, value: any) => {
    if (value === undefined || value === null || value === "") {
      return <span className="text-muted-foreground italic">Não respondida</span>;
    }

    switch (question.type) {
      case 'checkbox':
        if (Array.isArray(value)) {
          return (
            <div className="flex flex-wrap gap-1">
              {value.map((item, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {item}
                </Badge>
              ))}
            </div>
          );
        }
        return <span className="text-muted-foreground italic">Resposta inválida</span>;
      
      case 'radio':
        return <span className="font-medium">{value}</span>;
      
      case 'scale':
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium text-lg">{value}</span>
            <span className="text-muted-foreground text-sm">
              (de {question.scaleMin} a {question.scaleMax})
            </span>
          </div>
        );
      
      case 'text':
      case 'textarea':
        return (
          <div className="bg-muted/50 rounded-md p-3 border border-border">
            <p className="text-foreground whitespace-pre-wrap">{value}</p>
          </div>
        );
      
      default:
        return <span>{String(value)}</span>;
    }
  };

  if (isLoading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <Nav />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground" style={getGlowStyle('#3b82f6')}>Respostas da Turma</h1>
              <p className="text-muted-foreground mt-1" style={isDarkMode ? getGlowStyle('#64748b') : {}}>Respostas coletadas do formulário</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" className="bg-secondary hover:bg-secondary-600 text-white border-secondary">
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
              <Button variant="outline" onClick={() => setLocation("/")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-border bg-card">
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold text-primary" style={getGlowStyle('#3b82f6')}>{responses.length}</p>
              <p className="text-sm text-muted-foreground" style={isDarkMode ? getGlowStyle('#6b7280') : {}}>Total de Respostas</p>
            </CardContent>
          </Card>
          
          <Card className="border-border bg-card">
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold text-secondary" style={getGlowStyle('#10b981')}>-</p>
              <p className="text-sm text-muted-foreground" style={isDarkMode ? getGlowStyle('#6b7280') : {}}>Taxa de Conclusão</p>
            </CardContent>
          </Card>
          
          <Card className="border-border bg-card">
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold text-accent" style={getGlowStyle('#8b5cf6')}>-</p>
              <p className="text-sm text-muted-foreground" style={isDarkMode ? getGlowStyle('#6b7280') : {}}>Média Geral</p>
            </CardContent>
          </Card>
          
          <Card className="border-border bg-card">
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold text-muted-foreground" style={getGlowStyle('#f59e0b')}>
                {responses.length > 0 ? getTimeAgo(responses[0].submittedAt!) : "-"}
              </p>
              <p className="text-sm text-muted-foreground" style={isDarkMode ? getGlowStyle('#6b7280') : {}}>Última Resposta</p>
            </CardContent>
          </Card>
        </div>

        {/* Responses Table */}
        <Card className="border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground" style={getGlowStyle('#10b981')}>Todas as Respostas</h2>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm">
                  <Filter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <SortAsc className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <CardContent className="p-0">
            {responsesLoading ? (
              <div className="text-center py-8">Carregando respostas...</div>
            ) : responses.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2" style={getGlowStyle('#6b7280')}>Nenhuma resposta ainda</h3>
                <p className="text-muted-foreground" style={isDarkMode ? getGlowStyle('#6b7280') : {}}>As respostas dos alunos aparecerão aqui</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Aluno
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Respostas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {responses.map((response, index) => {
                      const gradientColors = ['primary', 'secondary', 'accent'];
                      const colorClass = gradientColors[index % gradientColors.length];
                      
                      return (
                        <tr key={response.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`h-8 w-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center`}>
                                <span className={`text-sm font-medium text-primary`}>
                                  {getInitials(response.studentName)}
                                </span>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-foreground">
                                  {response.studentName}
                                </div>
                                {response.studentEmail && (
                                  <div className="text-sm text-muted-foreground">
                                    {response.studentEmail}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-foreground">
                              {Object.keys(response.responses as object).length} respostas
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {getTimeAgo(response.submittedAt!)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button 
                              variant="link" 
                              className="text-primary hover:text-primary-600"
                              onClick={() => openResponseDetails(response.id)}
                            >
                              Ver Detalhes
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Response Details Modal */}
      <Dialog open={!!selectedResponseId} onOpenChange={closeResponseDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detalhes da Resposta
            </DialogTitle>
          </DialogHeader>
          
          {responseDetailsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Carregando detalhes...</p>
            </div>
          ) : responseDetails ? (
            <div className="space-y-6">
              {/* Student Info */}
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                    <span className="text-lg font-medium text-primary">
                      {getInitials(responseDetails.studentName)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {responseDetails.studentName}
                    </h3>
                    {responseDetails.studentEmail && (
                      <p className="text-muted-foreground">{responseDetails.studentEmail}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Respondido {getTimeAgo(responseDetails.submittedAt!)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Responses */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-foreground">Respostas</h4>
                
                {/* Debug info for development */}
                {import.meta.env.DEV && responseDetails && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-xs">
                    <p><strong>Debug Info:</strong></p>
                    <p>Questions: {responseDetails.questions?.length || 0}</p>
                    <p>Response object type: {typeof responseDetails.responses}</p>
                    <p>Response keys: {responseDetails.responses ? Object.keys(responseDetails.responses as object).join(', ') : 'none'}</p>
                    {responseDetails.questions?.length > 0 && (
                      <p>First question ID: {responseDetails.questions[0].id}</p>
                    )}
                    {responseDetails.responses && responseDetails.questions?.length > 0 && (
                      <p>Sample response value: {JSON.stringify((responseDetails.responses as any)[responseDetails.questions[0].id])}</p>
                    )}
                  </div>
                )}
                
                {responseDetailsError ? (
                  <div className="text-center py-8">
                    <p className="text-red-500">Erro ao carregar detalhes da resposta.</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Tente novamente ou entre em contato com o suporte.
                    </p>
                  </div>
                ) : responseDetails?.questions && responseDetails.questions.length > 0 ? (
                  <div className="space-y-3">
                    {responseDetails.questions.map((question) => {
                      // Ensure responses is an object and safely access the value
                      const responses = responseDetails.responses as Record<string, any> || {};
                      const responseValue = responses[question.id];
                      
                      return (
                        <Card key={question.id} className="border border-gray-200">
                          <CardContent className="pt-4">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <h5 className="font-medium text-foreground flex-1">
                                  {question.question}
                                </h5>
                                <Badge variant="outline" className="ml-2">
                                  {question.type.replace('_', ' ')}
                                </Badge>
                              </div>
                              
                              <div className="pt-2 border-t border-gray-100">
                                <div className="text-sm text-muted-foreground mb-1">Resposta:</div>
                                <div className="text-foreground">
                                  {renderResponseValue(question, responseValue)}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                    
                    {/* Show helpful message if no responses match any questions */}
                    {responseDetails.questions.length > 0 && 
                     responseDetails.responses && 
                     Object.keys(responseDetails.responses as object).length === 0 && (
                      <div className="text-center py-4 bg-amber-50 border border-amber-200 rounded-md">
                        <p className="text-amber-700 text-sm">
                          Nenhuma resposta foi encontrada para as perguntas desta turma.
                        </p>
                      </div>
                    )}
                  </div>
                ) : responseDetails && responseDetails.questions ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Esta turma não possui perguntas configuradas.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Carregando perguntas...
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Erro ao carregar detalhes da resposta.</p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={closeResponseDetails}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
