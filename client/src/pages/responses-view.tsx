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
import { ArrowLeft, Download, Filter, SortAsc, BarChart3, Users, FileText, Clock, Eye, Shuffle } from "lucide-react";
import type { FormResponse, FormQuestion } from "@shared/schema";

export default function ResponsesView() {
  const { classId } = useParams<{ classId: string }>();
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const isAuthenticated = !!user;
  const [, setLocation] = useLocation();
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Detecção inicial do modo escuro
    return document.documentElement.classList.contains('dark');
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

  const { data: responses = [], isLoading: responsesLoading, error } = useQuery<FormResponse[]>({
    queryKey: ["/api/classes", classId, "responses"],
    enabled: !!classId && isAuthenticated,
    retry: false,
  });

  const { data: responseDetails, isLoading: responseDetailsLoading } = useQuery<FormResponse & { questions: FormQuestion[] }>({
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
    if (!value && value !== 0 && value !== false) {
      return <span className="text-muted-foreground italic">Não respondida</span>;
    }

    switch (question.type) {
      case 'checkbox':
        let checkboxValues: string[] = [];
        
        // Handle different possible formats
        if (Array.isArray(value)) {
          checkboxValues = value;
        } else if (typeof value === 'string') {
          try {
            // Try to parse as JSON array
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
              checkboxValues = parsed;
            } else {
              // Single value as string
              checkboxValues = [value];
            }
          } catch {
            // Not JSON, treat as single value
            checkboxValues = [value];
          }
        }
        
        if (checkboxValues.length > 0) {
          return (
            <div className="flex flex-wrap gap-1">
              {checkboxValues.map((item, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {item}
                </Badge>
              ))}
            </div>
          );
        }
        return <span className={`italic ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          Nenhuma opção selecionada
        </span>;
      
      case 'radio':
        return <span className="font-medium">{String(value)}</span>;
      
      case 'scale':
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium text-lg">{value}</span>
            <span className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              (de {question.scaleMin} a {question.scaleMax})
            </span>
          </div>
        );
      
      case 'text':
      case 'textarea':
        return (
          <div className={`rounded-md p-3 border transition-all duration-300 ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <p className={`whitespace-pre-wrap ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {String(value)}
            </p>
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
                Respostas da Turma
              </h1>
              <p 
                className={`mt-1 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}
                style={isDarkMode ? { textShadow: '0 0 10px rgba(255, 255, 255, 0.3)' } : {}}
              >
                Respostas coletadas do formulário
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <Button 
                variant="outline"
                onClick={() => setLocation(`/class/${classId}/groups`)}
                className={`transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Shuffle className="mr-2 h-4 w-4" />
                Dividir Grupos
              </Button>
              <Button 
                variant="outline" 
                className={`transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setLocation("/")}
                className={`transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                    Total de Respostas
                  </p>
                  <p 
                    className={`text-2xl font-bold ${
                      isDarkMode ? 'text-white' : 'text-matchskills-blue-800'
                    }`}
                    style={isDarkMode ? { textShadow: '0 0 10px rgba(59, 130, 246, 0.5)' } : {}}
                  >
                    {responses.length}
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
                    2
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
                    ? 'bg-purple-500 bg-opacity-20' 
                    : 'bg-purple-100'
                }`}>
                  <BarChart3 className={`text-xl ${
                    isDarkMode 
                      ? 'text-purple-400' 
                      : 'text-purple-600'
                  }`} />
                </div>
                <div className="ml-4">
                  <p className={`text-sm font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Média Geral
                  </p>
                  <p 
                    className={`text-2xl font-bold ${
                      isDarkMode ? 'text-white' : 'text-matchskills-blue-800'
                    }`}
                    style={isDarkMode ? { textShadow: '0 0 10px rgba(147, 51, 234, 0.5)' } : {}}
                  >
                    -
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
                    ? 'bg-yellow-500 bg-opacity-20' 
                    : 'bg-yellow-100'
                }`}>
                  <Eye className={`text-xl ${
                    isDarkMode 
                      ? 'text-yellow-400' 
                      : 'text-yellow-600'
                  }`} />
                </div>
                <div className="ml-4">
                  <p className={`text-sm font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Última Resposta
                  </p>
                  <p 
                    className={`text-2xl font-bold ${
                      isDarkMode ? 'text-white' : 'text-matchskills-blue-800'
                    }`}
                    style={isDarkMode ? { textShadow: '0 0 10px rgba(245, 158, 11, 0.5)' } : {}}
                  >
                    {responses.length > 0 ? getTimeAgo(responses[0].submittedAt!) : "-"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Responses Table */}
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
            <div className="flex items-center justify-between">
              <h2 
                className={`text-lg font-semibold transition-all duration-300 ${
                  isDarkMode ? 'text-white' : 'text-matchskills-blue-800'
                }`}
                style={isDarkMode ? { textShadow: '0 0 10px rgba(255, 255, 255, 0.3)' } : {}}
              >
                Todas as Respostas
              </h2>
              <div className="flex space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={`transition-all duration-300 ${
                    isDarkMode 
                      ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Filter className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={`transition-all duration-300 ${
                    isDarkMode 
                      ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <SortAsc className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <CardContent className="p-6">
            {responsesLoading ? (
              <div className={`text-center py-8 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-900'
              }`}>
                Carregando respostas...
              </div>
            ) : responses.length === 0 ? (
              <div className="text-center py-8">
                <FileText className={`mx-auto h-12 w-12 mb-4 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <h3 className={`text-lg font-medium mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Nenhuma resposta ainda
                </h3>
                <p className={`${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  As respostas dos alunos aparecerão aqui
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className={`${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-2/5 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Aluno
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/6 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Respostas
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/6 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Data
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/6 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Ações
                      </th>
                    </tr>
                  </thead>
                <tbody className={`divide-y ${
                  isDarkMode 
                    ? 'bg-gray-800 divide-gray-700' 
                    : 'bg-white divide-gray-200'
                }`}>
                    {responses.map((response, index) => {
                      return (
                        <tr key={response.id} className={`transition-colors duration-200 ${
                          isDarkMode 
                            ? 'hover:bg-gray-700' 
                            : 'hover:bg-gray-50'
                        }`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center min-w-0">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                isDarkMode 
                                  ? 'bg-blue-500 bg-opacity-20' 
                                  : 'bg-matchskills-blue-100'
                              }`}>
                                <span className={`text-sm font-medium ${
                                  isDarkMode 
                                    ? 'text-blue-400' 
                                    : 'text-matchskills-blue-600'
                                }`}>
                                  {getInitials(response.studentName)}
                                </span>
                              </div>
                              <div className="ml-3 min-w-0 flex-1">
                                <div className={`text-sm font-medium truncate ${
                                  isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {response.studentName}
                                </div>
                                {response.studentEmail && (
                                  <div className={`text-sm truncate ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                    {response.studentEmail}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {Object.keys(response.responses as object).length} respostas
                            </div>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {getTimeAgo(response.submittedAt!)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button 
                              variant="link" 
                              className={`transition-colors duration-200 ${
                                isDarkMode 
                                  ? 'text-blue-400 hover:text-blue-300' 
                                  : 'text-blue-600 hover:text-blue-800'
                              }`}
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
        <DialogContent className={`max-w-4xl max-h-[80vh] overflow-y-auto ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <DialogHeader>
            <DialogTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>
              Detalhes da Resposta
            </DialogTitle>
          </DialogHeader>
          
          {responseDetailsLoading ? (
            <div className="text-center py-8">
              <div className={`animate-spin rounded-full h-8 w-8 border-b-2 mx-auto ${
                isDarkMode ? 'border-blue-400' : 'border-blue-600'
              }`}></div>
              <p className={`mt-2 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Carregando detalhes...
              </p>
            </div>
          ) : responseDetails ? (
            <div className="space-y-6">
              {/* Student Info */}
              <div className={`rounded-lg p-4 border transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                    isDarkMode 
                      ? 'bg-blue-500 bg-opacity-20' 
                      : 'bg-matchskills-blue-100'
                  }`}>
                    <span className={`text-lg font-medium ${
                      isDarkMode 
                        ? 'text-blue-400' 
                        : 'text-matchskills-blue-600'
                    }`}>
                      {getInitials(responseDetails.studentName)}
                    </span>
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {responseDetails.studentName}
                    </h3>
                    {responseDetails.studentEmail && (
                      <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                        {responseDetails.studentEmail}
                      </p>
                    )}
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Respondido {getTimeAgo(responseDetails.submittedAt!)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Responses */}
              <div className="space-y-4">
                <h4 className={`text-lg font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Respostas
                </h4>
                
                {responseDetails.questions?.map((question, index) => {
                  const responses = responseDetails.responses as Record<string, any>;
                  
                  // Direct ID match - this should always work now
                  const responseValue = responses[question.id];
                  
                  return (
                    <Card key={`${question.id}-${index}`} className={`transition-all duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-200'
                    }`}>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <h5 className={`font-medium flex-1 ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {question.question}
                              {question.order !== undefined && (
                                <span className={`text-xs ml-1 ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  (#{question.order})
                                </span>
                              )}
                            </h5>
                            <Badge variant="outline" className="ml-2">
                              {question.type.replace('_', ' ')}
                            </Badge>
                          </div>
                          
                          <div className={`pt-2 border-t ${
                            isDarkMode ? 'border-gray-600' : 'border-gray-200'
                          }`}>
                            <div className={`text-sm mb-1 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              Resposta:
                            </div>
                            <div className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                              {renderResponseValue(question, responseValue)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                Erro ao carregar detalhes da resposta.
              </p>
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
