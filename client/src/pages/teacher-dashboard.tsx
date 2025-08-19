import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Nav from "@/components/ui/nav";
import { Plus, Users, FileText, BarChart3, Edit, Eye, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Class } from "@shared/schema";

export default function TeacherDashboard() {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const isAuthenticated = !!user;

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/');
      return;
    }
  }, [isAuthenticated, isLoading, setLocation]);

  const { data: classes = [], isLoading: classesLoading } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
    retry: false,
  });

  const totalClasses = classes.length;
  const activeClasses = classes.filter(c => c.isActive).length;

  if (isLoading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-matchskills-blue-800">Dashboard</h1>
              <p className="text-gray-600 mt-1">Gerencie suas avaliações e formulários</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button 
                className="bg-matchskills-green-500 hover:bg-matchskills-green-600 text-white shadow-sm transition-colors duration-200"
                onClick={() => setLocation('/create-class')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Avaliação
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-matchskills-blue-100 rounded-lg">
                  <Users className="text-matchskills-blue-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Turmas</p>
                  <p className="text-2xl font-bold text-matchskills-blue-800">{totalClasses}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-matchskills-green-100 rounded-lg">
                  <FileText className="text-matchskills-green-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Formulários Ativos</p>
                  <p className="text-2xl font-bold text-matchskills-blue-800">{activeClasses}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-matchskills-teal-400 bg-opacity-20 rounded-lg">
                  <BarChart3 className="text-matchskills-teal-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Respostas Coletadas</p>
                  <p className="text-2xl font-bold text-matchskills-blue-800">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Classes Grid */}
        <Card className="border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-matchskills-blue-800">Suas Turmas</h2>
          </div>
          <CardContent className="p-6">
            {classesLoading ? (
              <div className="text-center py-8">Carregando turmas...</div>
            ) : classes.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma turma criada</h3>
                <p className="text-gray-600 mb-4">Comece criando sua primeira turma</p>
                <Button 
                  className="bg-matchskills-green-500 hover:bg-matchskills-green-600 text-white transition-colors duration-200"
                  onClick={() => setLocation('/create-class')}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeira Turma
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map((classItem, index) => {
                  const gradientColors = [
                    'bg-gradient-to-r from-blue-500 to-blue-600',
                    'bg-gradient-to-r from-green-500 to-green-600', 
                    'bg-gradient-to-r from-purple-500 to-purple-600',
                    'bg-gradient-to-r from-orange-500 to-orange-600',
                    'bg-gradient-to-r from-teal-500 to-teal-600',
                    'bg-gradient-to-r from-pink-500 to-pink-600',
                  ];
                  const gradientClass = gradientColors[index % gradientColors.length];

                  return (
                    <div key={classItem.id} className={`${gradientClass} rounded-lg p-6 text-white`}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{classItem.name}</h3>
                          <p className="text-white text-opacity-75 text-sm mt-1">
                            Código: {classItem.code}
                          </p>
                        </div>
                        <button className="text-white hover:text-white hover:text-opacity-75">
                          <MoreVertical className="h-5 w-5" />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm mb-4">
                        <span>Até {classItem.studentLimit} alunos</span>
                        <span>{classItem.groupCount} grupos</span>
                      </div>
                      
                      <div className="flex space-x-2 mb-4">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-0"
                          onClick={() => setLocation(`/edit-class/${classItem.id}`)}
                        >
                          <Edit className="mr-1 h-4 w-4" />
                          Editar
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-0"
                          onClick={() => setLocation(`/class/${classItem.id}/responses`)}
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          Respostas
                        </Button>
                      </div>
                      
                      <div className="pt-3 border-t border-white border-opacity-25">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white text-opacity-75">Status:</span>
                          <Badge 
                            variant={classItem.isActive ? "default" : "secondary"}
                            className={classItem.isActive 
                              ? "bg-green-500 hover:bg-green-600 text-white border-0" 
                              : "bg-gray-500 hover:bg-gray-600 text-white border-0"
                            }
                          >
                            {classItem.isActive ? "Ativo" : "Pausado"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
