import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { loginUserSchema, registerUserSchema } from "@shared/schema";
import { Key, LogIn, UserPlus } from "lucide-react";
import { z } from "zod";
import AnimatedLogo from "@/components/ui/animated-logo";
import AutoDarkModeDetector from "@/components/ui/auto-dark-mode-detector";

type LoginForm = z.infer<typeof loginUserSchema>;
type RegisterForm = z.infer<typeof registerUserSchema>;

export default function Landing() {
  const [view, setView] = useState<'codeEntry' | 'login' | 'register'>('codeEntry');
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      setLocation('/');
    }
  }, [user, setLocation]);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginUserSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerUserSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const handleCodeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const code = formData.get('classCode') as string;
    if (code) {
      setLocation(`/class/${code}`);
    }
  };

  const handleLogin = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  const handleRegister = (data: RegisterForm) => {
    registerMutation.mutate(data);
  };

  if (user) return null; // Will redirect

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Auto Dark Mode Detection */}
      <AutoDarkModeDetector />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-md mx-auto">
          {view === 'codeEntry' ? (
            <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <AnimatedLogo size="lg" showText={true} className="justify-center mb-6" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Acesso do Participante</h2>
                  <p className="text-gray-600 dark:text-gray-300">Digite o código da avaliação para acessar o formulário</p>
                </div>
                <form onSubmit={handleCodeSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="classCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Código da Avaliação
                    </Label>
                    <Input
                      type="text"
                      id="classCode"
                      name="classCode"
                      className="text-center text-lg font-mono tracking-wider border-gray-200 dark:border-gray-600 dark:focus:border-purple-500 dark:focus:ring-purple-500 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="0000000000"
                      maxLength={10}
                      required
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Exemplo: 6567213123</p>
                  </div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-green-500 to-green-400 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <LogIn className="mr-2 h-4 w-4" />
                    Acessar Formulário
                  </Button>
                  <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Ou</p>
                    <Button
                      type="button"
                      variant="link"
                      className="dark:text-purple-600 dark:hover:text-purple-700 text-blue-600 hover:text-blue-700 transition-colors duration-200"
                      onClick={() => setView('login')}
                    >
                      Sou avaliador - Fazer login
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : view === 'login' ? (
            <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <AnimatedLogo size="lg" showText={true} className="justify-center mb-6" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Login do Avaliador</h2>
                  <p className="text-gray-600 dark:text-gray-300">Acesse sua conta para gerenciar suas avaliações</p>
                </div>
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-6">
                  <div>
                    <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email</Label>
                    <Input
                      {...loginForm.register("email")}
                      type="email"
                      className="mt-1 border-gray-200 dark:border-gray-600 dark:focus:border-purple-500 dark:focus:ring-purple-500 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                    {loginForm.formState.errors.email && (
                      <p className="text-red-500 text-sm mt-1">
                        {loginForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">Senha</Label>
                    <Input
                      {...loginForm.register("password")}
                      type="password"
                      className="mt-1 border-gray-200 dark:border-gray-600 dark:focus:border-purple-500 dark:focus:ring-purple-500 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-red-500 text-sm mt-1">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <Button 
                    type="submit"
                    className="w-full bg-gradient-to-r dark:from-purple-600 dark:to-purple-500 from-blue-600 to-blue-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                    disabled={loginMutation.isPending}
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    {loginMutation.isPending ? "Entrando..." : "Entrar"}
                  </Button>
                  <div className="text-center space-y-2">
                    <Button
                      type="button"
                      variant="link"
                      className="dark:text-purple-600 dark:hover:text-purple-700 text-blue-600 hover:text-blue-700 transition-colors duration-200"
                      onClick={() => setView('register')}
                    >
                      Não tem conta? Cadastre-se
                    </Button>
                    <br />
                    <Button
                      type="button"
                      variant="link"
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-sm"
                      onClick={() => setView('codeEntry')}
                    >
                      Voltar para acesso do participante
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <AnimatedLogo size="lg" showText={true} className="justify-center mb-6" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Criar Conta</h2>
                  <p className="text-gray-600 dark:text-gray-300">Crie sua conta para começar a avaliar competências</p>
                </div>
                <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-gray-700 dark:text-gray-300">Nome</Label>
                      <Input
                        {...registerForm.register("firstName")}
                        className="mt-1 border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500"
                        required
                      />
                      {registerForm.formState.errors.firstName && (
                        <p className="text-red-500 text-sm mt-1">
                          {registerForm.formState.errors.firstName.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-gray-700 dark:text-gray-300">Sobrenome</Label>
                      <Input
                        {...registerForm.register("lastName")}
                        className="mt-1 border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500"
                        required
                      />
                      {registerForm.formState.errors.lastName && (
                        <p className="text-red-500 text-sm mt-1">
                          {registerForm.formState.errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email</Label>
                    <Input
                      {...registerForm.register("email")}
                      type="email"
                      className="mt-1 border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500"
                      required
                    />
                    {registerForm.formState.errors.email && (
                      <p className="text-red-500 text-sm mt-1">
                        {registerForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">Senha</Label>
                    <Input
                      {...registerForm.register("password")}
                      type="password"
                      className="mt-1 border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500"
                      required
                    />
                    {registerForm.formState.errors.password && (
                      <p className="text-red-500 text-sm mt-1">
                        {registerForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <Button 
                    type="submit"
                    className="w-full bg-gradient-to-r from-green-500 to-green-400 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                    disabled={registerMutation.isPending}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    {registerMutation.isPending ? "Criando..." : "Criar Conta"}
                  </Button>
                  <div className="text-center space-y-2">
                    <Button
                      type="button"
                      variant="link"
                      className="dark:text-purple-600 dark:hover:text-purple-700 text-blue-600 hover:text-blue-700 transition-colors duration-200"
                      onClick={() => setView('login')}
                    >
                      Já tem conta? Faça login
                    </Button>
                    <br />
                    <Button
                      type="button"
                      variant="link"
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-sm"
                      onClick={() => setView('codeEntry')}
                    >
                      Voltar para acesso do participante
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
