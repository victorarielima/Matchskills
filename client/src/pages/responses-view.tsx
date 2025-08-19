import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Nav from "@/components/ui/nav";
import { ArrowLeft, Download, Filter, SortAsc, BarChart3, Users, FileText, Clock, X } from "lucide-react";
import type { FormResponse, FormQuestion } from "@shared/schema";

export default function ResponsesView() {
  const { classId } = useParams<{ classId: string }>();
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const isAuthenticated = !!user;
  const [, setLocation] = useLocation();
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(null);

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
    if (!value) {
      return <span className="text-gray-400 italic">Não respondida</span>;
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
        return <span className="text-gray-400 italic">Resposta inválida</span>;
      
      case 'radio':
        return <span className="font-medium">{value}</span>;
      
      case 'scale':
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium text-lg">{value}</span>
            <span className="text-gray-500 text-sm">
              (de {question.scaleMin} a {question.scaleMax})
            </span>
          </div>
        );
      
      case 'text':
      case 'textarea':
        return (
          <div className="bg-gray-50 rounded-md p-3 border">
            <p className="text-gray-900 whitespace-pre-wrap">{value}</p>
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
    <div className="min-h-screen bg-gray-50">
      <Nav />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Respostas da Turma</h1>
              <p className="text-gray-600 mt-1">Respostas coletadas do formulário</p>
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
          <Card className="border border-gray-200">
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold text-primary">{responses.length}</p>
              <p className="text-sm text-gray-600">Total de Respostas</p>
            </CardContent>
          </Card>
          
          <Card className="border border-gray-200">
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold text-secondary">-</p>
              <p className="text-sm text-gray-600">Taxa de Conclusão</p>
            </CardContent>
          </Card>
          
          <Card className="border border-gray-200">
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold text-accent">-</p>
              <p className="text-sm text-gray-600">Média Geral</p>
            </CardContent>
          </Card>
          
          <Card className="border border-gray-200">
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold text-gray-700">
                {responses.length > 0 ? getTimeAgo(responses[0].submittedAt!) : "-"}
              </p>
              <p className="text-sm text-gray-600">Última Resposta</p>
            </CardContent>
          </Card>
        </div>

        {/* Responses Table */}
        <Card className="border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Todas as Respostas</h2>
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
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma resposta ainda</h3>
                <p className="text-gray-600">As respostas dos alunos aparecerão aqui</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aluno
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Respostas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {responses.map((response, index) => {
                      const gradientColors = ['primary', 'secondary', 'accent'];
                      const colorClass = gradientColors[index % gradientColors.length];
                      
                      return (
                        <tr key={response.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`h-8 w-8 rounded-full bg-${colorClass}-100 flex items-center justify-center`}>
                                <span className={`text-sm font-medium text-${colorClass}-600`}>
                                  {getInitials(response.studentName)}
                                </span>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {response.studentName}
                                </div>
                                {response.studentEmail && (
                                  <div className="text-sm text-gray-500">
                                    {response.studentEmail}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {Object.keys(response.responses as object).length} respostas
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
            <DialogTitle className="flex items-center justify-between">
              <span>Detalhes da Resposta</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeResponseDetails}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {responseDetailsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando detalhes...</p>
            </div>
          ) : responseDetails ? (
            <div className="space-y-6">
              {/* Student Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-lg font-medium text-primary-600">
                      {getInitials(responseDetails.studentName)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {responseDetails.studentName}
                    </h3>
                    {responseDetails.studentEmail && (
                      <p className="text-gray-600">{responseDetails.studentEmail}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      Respondido {getTimeAgo(responseDetails.submittedAt!)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Responses */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Respostas</h4>
                {responseDetails.questions?.map((question) => {
                  const responseValue = (responseDetails.responses as Record<string, any>)[question.id];
                  return (
                    <Card key={question.id} className="border border-gray-200">
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <h5 className="font-medium text-gray-900 flex-1">
                              {question.question}
                            </h5>
                            <Badge variant="outline" className="ml-2">
                              {question.type.replace('_', ' ')}
                            </Badge>
                          </div>
                          
                          <div className="pt-2 border-t border-gray-100">
                            <div className="text-sm text-gray-500 mb-1">Resposta:</div>
                            <div className="text-gray-900">
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
              <p className="text-gray-600">Erro ao carregar detalhes da resposta.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
