import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import SidebarDashboard from "@/components/ui/sidebar-dashboard";
import AutoDarkModeDetector from "@/components/ui/auto-dark-mode-detector";
import { 
  BarChart3, 
  PieChart, 
  Calendar,
  Download,
  ChevronRight,
  Activity
} from "lucide-react";
import type { Class, FormQuestion, FormResponse } from "@shared/schema";

interface QuestionAnalytics {
  questionId: string;
  question: string;
  type: string;
  totalResponses: number;
  responseDistribution: Record<string, number>;
  averageValue?: number;
}

interface ClassAnalytics {
  classInfo: Class;
  totalResponses: number;
  questions: FormQuestion[];
  questionAnalytics: QuestionAnalytics[];
  completionRate: number;
  lastResponseDate?: string;
}

// Função para normalizar texto (remove espaços extras, pontuação, converte para minúsculas)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '') // Remove pontuação
    .replace(/\s+/g, ' '); // Normaliza espaços
}

// Função para agrupar respostas similares
function groupSimilarResponses(responses: Record<string, number>): Array<{ text: string; count: number; variants: string[] }> {
  const normalizedMap = new Map<string, { text: string; count: number; variants: Set<string> }>();
  
  Object.entries(responses).forEach(([response, count]) => {
    const normalized = normalizeText(response);
    
    if (normalizedMap.has(normalized)) {
      const existing = normalizedMap.get(normalized)!;
      existing.count += count;
      existing.variants.add(response);
    } else {
      normalizedMap.set(normalized, {
        text: response, // Mantém a primeira variante como texto principal
        count,
        variants: new Set([response])
      });
    }
  });
  
  return Array.from(normalizedMap.values())
    .map(item => ({ ...item, variants: Array.from(item.variants) }))
    .sort((a, b) => b.count - a.count);
}

export default function Reports() {
  const { user } = useAuth();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // Fetch all classes
  const { data: classes = [], isLoading: classesLoading } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
    enabled: !!user,
  });

  // Fetch analytics for selected class
  const { data: analytics, isLoading: analyticsLoading } = useQuery<ClassAnalytics>({
    queryKey: selectedClassId ? [`/api/analytics/${selectedClassId}`] : [],
    enabled: !!selectedClassId,
  });

  const activeClasses = classes.filter(c => c.isActive);
  const selectedClass = selectedClassId ? classes.find(c => c.id === selectedClassId) : null;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <AutoDarkModeDetector />
      <SidebarDashboard />
      
      <div className="lg:pl-64">
        <main className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-purple-900/30 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600 dark:text-purple-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Relatórios e Análises
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Visualize estatísticas detalhadas de cada formulário
                </p>
              </div>
            </div>
          </div>

          {/* Class Selection and Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar - Class List */}
            <Card className="lg:col-span-1 bg-white dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">
                  Selecione um Formulário
                </CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Clique para ver análises detalhadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {classesLoading ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      Carregando formulários...
                    </div>
                  ) : activeClasses.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      Nenhum formulário ativo
                    </div>
                  ) : (
                    activeClasses.map((classItem) => (
                      <button
                        key={classItem.id}
                        onClick={() => setSelectedClassId(classItem.id)}
                        className={`w-full text-left p-4 rounded-lg border transition-all ${
                          selectedClassId === classItem.id
                            ? 'border-blue-500 dark:border-purple-500 bg-blue-50 dark:bg-purple-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-purple-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                              {classItem.name}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <Calendar className="h-3 w-3" />
                              {new Date(classItem.createdAt || '').toLocaleDateString('pt-BR')}
                            </div>
                            <div className="mt-2">
                              <Badge variant="outline" className="text-xs dark:border-gray-600 dark:text-gray-300">
                                Código: {classItem.code}
                              </Badge>
                            </div>
                          </div>
                          <ChevronRight className={`h-5 w-5 transition-transform ${
                            selectedClassId === classItem.id ? 'rotate-90 text-blue-600 dark:text-purple-400' : 'text-gray-400'
                          }`} />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Right Panel - Analytics */}
            <div className="lg:col-span-2">
              {!selectedClassId ? (
                <Card className="bg-white dark:bg-gray-800 dark:border-gray-700">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <PieChart className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Selecione um Formulário
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
                      Escolha um formulário da lista ao lado para visualizar estatísticas detalhadas,
                      gráficos de distribuição de respostas e análises por questão.
                    </p>
                  </CardContent>
                </Card>
              ) : analyticsLoading ? (
                <Card className="bg-white dark:bg-gray-800 dark:border-gray-700">
                  <CardContent className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <Activity className="h-12 w-12 text-blue-600 dark:text-purple-400 animate-pulse mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">Carregando análises...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : analytics ? (
                <div className="space-y-6">
                  {/* Class Header */}
                  <Card className="bg-white dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-gray-900 dark:text-white text-2xl">
                            {analytics.classInfo.name}
                          </CardTitle>
                          <CardDescription className="dark:text-gray-400 mt-2">
                            Análise detalhada do formulário
                          </CardDescription>
                        </div>
                        <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                          <Download className="h-4 w-4 mr-2" />
                          Exportar
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
                            Total de Respostas
                          </p>
                          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                            {analytics.totalResponses}
                          </p>
                        </div>
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">
                            Taxa de Conclusão
                          </p>
                          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                            {Math.round(analytics.completionRate)}%
                          </p>
                        </div>
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">
                            Total de Questões
                          </p>
                          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                            {analytics.questions.length}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Question Analytics */}
                  <Card className="bg-white dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-gray-900 dark:text-white">
                        Análise por Questão
                      </CardTitle>
                      <CardDescription className="dark:text-gray-400">
                        Distribuição de respostas para cada questão do formulário
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-8">
                        {analytics.questionAnalytics.map((qa, index) => (
                          <div key={qa.questionId}>
                            {index > 0 && <Separator className="my-6 dark:bg-gray-700" />}
                            
                            <div className="space-y-4">
                              <div>
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                                    {index + 1}. {qa.question}
                                  </h4>
                                  <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-300">
                                    {qa.type}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {qa.totalResponses} resposta{qa.totalResponses !== 1 ? 's' : ''}
                                </p>
                              </div>

                              {/* Response Distribution */}
                              {qa.type === 'scale' && qa.averageValue !== undefined ? (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      Média
                                    </span>
                                    <span className="text-lg font-bold text-blue-600 dark:text-purple-400">
                                      {qa.averageValue.toFixed(1)}
                                    </span>
                                  </div>
                                  <div className="space-y-2">
                                    {Object.entries(qa.responseDistribution)
                                      .sort(([a], [b]) => Number(a) - Number(b))
                                      .map(([value, count]) => {
                                        const percentage = (count / qa.totalResponses) * 100;
                                        return (
                                          <div key={value}>
                                            <div className="flex items-center justify-between mb-1">
                                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                                Nota {value}
                                              </span>
                                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                {count} ({percentage.toFixed(0)}%)
                                              </span>
                                            </div>
                                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                              <div
                                                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-purple-500 dark:to-purple-600 rounded-full transition-all"
                                                style={{ width: `${percentage}%` }}
                                              />
                                            </div>
                                          </div>
                                        );
                                      })}
                                  </div>
                                </div>
                              ) : qa.type === 'textarea' ? (
                                // Nuvem de palavras para respostas de texto livre
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      Mapa de Respostas
                                    </span>
                                  </div>
                                  
                                  {/* Legenda */}
                                  <div className="flex items-center gap-4 text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">Legenda:</span>
                                    <div className="flex items-center gap-1">
                                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                      <span className="text-gray-600 dark:text-gray-400">Poucas (1-20%)</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                      <span className="text-gray-600 dark:text-gray-400">Baixas (21-40%)</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                      <span className="text-gray-600 dark:text-gray-400">Médias (41-60%)</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                      <span className="text-gray-600 dark:text-gray-400">Altas (61-80%)</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                      <span className="text-gray-600 dark:text-gray-400">Muitas (81-100%)</span>
                                    </div>
                                  </div>
                                  
                                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 min-h-[300px] flex flex-wrap items-center justify-center gap-3">
                                    {groupSimilarResponses(qa.responseDistribution).map((item, idx) => {
                                      const maxCount = Math.max(...groupSimilarResponses(qa.responseDistribution).map(r => r.count));
                                      const minCount = Math.min(...groupSimilarResponses(qa.responseDistribution).map(r => r.count));
                                      
                                      // Normaliza a contagem para um tamanho de fonte entre 14px e 48px
                                      const normalizedSize = minCount === maxCount 
                                        ? 28 
                                        : 14 + ((item.count - minCount) / (maxCount - minCount)) * 34;
                                      
                                      // Calcula a porcentagem em relação ao total de respostas
                                      const percentage = (item.count / qa.totalResponses) * 100;
                                      
                                      // Define cor baseada na porcentagem do total
                                      const getColorByPercentage = (pct: number) => {
                                        if (pct >= 81) return 'text-red-600 dark:text-red-400';
                                        if (pct >= 61) return 'text-orange-600 dark:text-orange-400';
                                        if (pct >= 41) return 'text-yellow-600 dark:text-yellow-500';
                                        if (pct >= 21) return 'text-blue-600 dark:text-blue-400';
                                        return 'text-green-600 dark:text-green-400';
                                      };
                                      
                                      const color = getColorByPercentage(percentage);
                                      
                                      return (
                                        <span
                                          key={idx}
                                          className={`${color} font-semibold hover:opacity-70 transition-opacity cursor-default inline-block px-1`}
                                          style={{ fontSize: `${normalizedSize}px` }}
                                          title={`${item.count} de ${qa.totalResponses} respostas (${percentage.toFixed(1)}%)${item.variants.length > 1 ? ` - ${item.variants.length} variações agrupadas` : ''}`}
                                        >
                                          {item.text || '(vazio)'}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {Object.entries(qa.responseDistribution)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([response, count]) => {
                                      const percentage = (count / qa.totalResponses) * 100;
                                      return (
                                        <div key={response}>
                                          <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[70%]">
                                              {response || '(Sem resposta)'}
                                            </span>
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                              {count} ({percentage.toFixed(0)}%)
                                            </span>
                                          </div>
                                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-purple-500 dark:to-purple-600 rounded-full transition-all"
                                              style={{ width: `${percentage}%` }}
                                            />
                                          </div>
                                        </div>
                                      );
                                    })}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : null}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
