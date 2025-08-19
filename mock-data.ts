// Mock data para desenvolvimento do MatchSkills
export const mockUsers = [
  {
    id: "user-1",
    email: "ana.silva@matchskills.com",
    password: "123456",
    firstName: "Ana",
    lastName: "Silva",
    profileImageUrl: null,
  },
  {
    id: "user-2", 
    email: "carlos.santos@matchskills.com",
    password: "123456",
    firstName: "Carlos",
    lastName: "Santos",
    profileImageUrl: null,
  },
  {
    id: "user-3",
    email: "maria.oliveira@matchskills.com", 
    password: "123456",
    firstName: "Maria",
    lastName: "Oliveira",
    profileImageUrl: null,
  },
];

export const mockClasses = [
  {
    id: "class-1",
    teacherId: "user-1",
    name: "Avaliação de Competências - Equipe Marketing",
    code: "6567213123",
    studentLimit: 15,
    groupCount: 3,
    isActive: true,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "class-2", 
    teacherId: "user-1",
    name: "Soft Skills - Desenvolvimento",
    code: "9876543210",
    studentLimit: 20,
    groupCount: 4,
    isActive: false,
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-12"),
  },
  {
    id: "class-3",
    teacherId: "user-2",
    name: "Avaliação 360 - Liderança",
    code: "1234567890",
    studentLimit: 10,
    groupCount: 2, 
    isActive: true,
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
  },
];

export const mockFormQuestions = [
  // Questions for class-1 (Marketing)
  {
    id: "q-1",
    classId: "class-1",
    question: "Como você avalia sua capacidade de comunicação?",
    type: "scale" as const,
    options: null,
    isRequired: true,
    order: 1,
    scaleMin: 1,
    scaleMax: 5,
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "q-2",
    classId: "class-1", 
    question: "Quais ferramentas de marketing digital você domina?",
    type: "checkbox" as const,
    options: ["Google Ads", "Facebook Ads", "Instagram", "LinkedIn", "Email Marketing", "SEO"],
    isRequired: true,
    order: 2,
    scaleMin: null,
    scaleMax: null,
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "q-3",
    classId: "class-1",
    question: "Descreva um projeto de marketing que você considera bem-sucedido:",
    type: "textarea" as const,
    options: null,
    isRequired: false,
    order: 3,
    scaleMin: null,
    scaleMax: null,
    createdAt: new Date("2024-01-15"),
  },
  // Questions for class-2 (Desenvolvimento)
  {
    id: "q-4",
    classId: "class-2",
    question: "Qual sua principal linguagem de programação?",
    type: "radio" as const,
    options: ["JavaScript", "Python", "Java", "C#", "PHP", "Go"],
    isRequired: true,
    order: 1,
    scaleMin: null,
    scaleMax: null,
    createdAt: new Date("2024-01-10"),
  },
  {
    id: "q-5",
    classId: "class-2",
    question: "Como você se avalia em trabalho em equipe?",
    type: "scale" as const,
    options: null,
    isRequired: true,
    order: 2,
    scaleMin: 1,
    scaleMax: 10,
    createdAt: new Date("2024-01-10"),
  },
  // Questions for class-3 (Liderança)
  {
    id: "q-6",
    classId: "class-3",
    question: "Quantos anos de experiência em liderança você tem?",
    type: "text" as const,
    options: null,
    isRequired: true,
    order: 1,
    scaleMin: null,
    scaleMax: null,
    createdAt: new Date("2024-01-20"),
  },
];

export const mockFormResponses = [
  // Responses for class-1 (Marketing)
  {
    id: "r-1",
    classId: "class-1",
    studentName: "João Pedro",
    studentEmail: "joao.pedro@empresa.com",
    responses: {
      "q-1": "4",
      "q-2": ["Google Ads", "Instagram", "Email Marketing"],
      "q-3": "Implementei uma campanha de Black Friday que aumentou as vendas em 150%"
    },
    submittedAt: new Date("2024-01-16T10:30:00"),
  },
  {
    id: "r-2",
    classId: "class-1", 
    studentName: "Fernanda Lima",
    studentEmail: "fernanda.lima@empresa.com",
    responses: {
      "q-1": "5",
      "q-2": ["Facebook Ads", "Instagram", "LinkedIn", "SEO"],
      "q-3": "Criei uma estratégia de conteúdo que triplicou o engajamento nas redes sociais"
    },
    submittedAt: new Date("2024-01-16T14:15:00"),
  },
  {
    id: "r-3",
    classId: "class-1",
    studentName: "Ricardo Souza", 
    studentEmail: "ricardo.souza@empresa.com",
    responses: {
      "q-1": "3",
      "q-2": ["Google Ads", "Email Marketing"],
      "q-3": ""
    },
    submittedAt: new Date("2024-01-17T09:00:00"),
  },
  // Responses for class-3 (Liderança)
  {
    id: "r-4",
    classId: "class-3",
    studentName: "Patricia Mendes",
    studentEmail: "patricia.mendes@empresa.com", 
    responses: {
      "q-6": "8 anos"
    },
    submittedAt: new Date("2024-01-21T16:45:00"),
  },
  {
    id: "r-5", 
    classId: "class-3",
    studentName: "Roberto Alves",
    studentEmail: "roberto.alves@empresa.com",
    responses: {
      "q-6": "3 anos"
    },
    submittedAt: new Date("2024-01-22T11:30:00"),
  },
];

export function getMockPassword(email: string): string {
  const user = mockUsers.find(u => u.email === email);
  return user?.password || "123456";
}