import type { InsertFormQuestion } from "@shared/schema";

export interface QuestionTemplate {
  id: string;
  name: string;
  description: string;
  questions: Omit<InsertFormQuestion, 'classId'>[];
}

export const questionTemplates: QuestionTemplate[] = [
  {
    id: "disc",
    name: "DISC - Perfil Comportamental e Habilidades Técnicas",
    description: "Template completo para avaliar perfil DISC e conhecimentos técnicos em desenvolvimento",
    questions: [
      {
        type: "text",
        question: "Qual sua matrícula?",
        order: 1,
        isRequired: true,
      },
      {
        type: "text",
        question: "Qual seu nome?",
        order: 2,
        isRequired: true,
      },
      {
        type: "radio",
        question: "Qual seu nível de conhecimento em desenvolvimento web (HTML, CSS, JS)?",
        options: ["Iniciante", "Intermediário", "Avançado", "Nenhum"],
        order: 3,
        isRequired: true,
      },
      {
        type: "checkbox",
        question: "Você já usou algum framework web? (Pode marcar mais de uma opção)",
        options: [
          "Não",
          "Angular",
          "Bootstrap", 
          "Flask",
          "Node.js",
          "PHP",
          "React",
          "Spring Boot",
          "Vue.js",
          "Next.js",
          "ElysiaJS",
          "ExpressJS",
          "Django",
          "Laravel"
        ],
        order: 4,
        isRequired: true,
      },
      {
        type: "radio",
        question: "Qual seu nível de conhecimento em desenvolvimento Mobile?",
        options: ["Nenhum", "Iniciante", "Intermediário", "Avançado"],
        order: 5,
        isRequired: true,
      },
      {
        type: "checkbox",
        question: "Você já desenvolveu apps mobile? (Pode marcar mais de uma opção)",
        options: [
          "Não",
          "Unity",
          "Android Studio",
          "React Native",
          "Expo",
          "Flutter"
        ],
        order: 6,
        isRequired: true,
      },
      {
        type: "checkbox",
        question: "Você já trabalhou com banco de dados?",
        options: [
          "Não",
          "My SQL",
          "PostgreSQL",
          "Oracle",
          "SQL Server",
          "Firebase",
          "Mongo DB",
          "Supabase",
          "Draw SQL"
        ],
        order: 7,
        isRequired: true,
      },
      {
        type: "checkbox",
        question: "Você já publicou algum site ou app?",
        options: [
          "Nunca publiquei",
          "GitHub",
          "Heroku",
          "Render",
          "Vercel",
          "Firebase",
          "GCP",
          "AWS",
          "Azure"
        ],
        order: 8,
        isRequired: true,
      },
      {
        type: "radio",
        question: "Com qual palavra você mais se identifica?",
        options: ["Cuidadoso", "Paciente", "Comunicativo", "Determinado"],
        order: 9,
        isRequired: true,
      },
      {
        type: "radio",
        question: "Qual dessas palavras mais se aplica a você?",
        options: ["Prestativo", "Entusiasmado", "Organizado", "Competitivo"],
        order: 10,
        isRequired: true,
      },
      {
        type: "radio",
        question: "Qual adjetivo te descreve melhor?",
        options: ["Calmo", "Direto", "Otimista", "Preciso"],
        order: 11,
        isRequired: true,
      },
      {
        type: "radio",
        question: "Em uma situação nova, você tende a:",
        options: [
          "Manter a harmonia",
          "Seguir as regras", 
          "Tomar decisões rápidas",
          "Convencer as pessoas"
        ],
        order: 12,
        isRequired: true,
      },
      {
        type: "radio",
        question: "Você prefere:",
        options: [
          "Ter estabilidade",
          "Focar nos resultados",
          "Trabalhar com dados e fatos",
          "Estar com pessoas"
        ],
        order: 13,
        isRequired: true,
      },
      {
        type: "textarea",
        question: "Perfil: (Essa informação será determinada com base nas respostas dos participantes).",
        order: 14,
        isRequired: false,
      }
    ]
  },
  {
    id: "bigfive",
    name: "Big Five (OCEAN) - Avaliação de Personalidade",
    description: "Avaliação completa dos cinco grandes fatores de personalidade: Abertura, Conscienciosidade, Extroversão, Amabilidade e Neuroticismo",
    questions: [
      {
        type: "text",
        question: "Nome completo:",
        order: 1,
        isRequired: true,
      },
      {
        type: "text",
        question: "Email:",
        order: 2,
        isRequired: true,
      },
      // ABERTURA À EXPERIÊNCIA (Openness)
      {
        type: "radio",
        question: "Tenho uma imaginação vívida e criativa",
        options: ["Discordo totalmente", "Discordo", "Neutro", "Concordo", "Concordo totalmente"],
        order: 3,
        isRequired: true,
      },
      {
        type: "radio",
        question: "Gosto de explorar novas ideias e conceitos",
        options: ["Discordo totalmente", "Discordo", "Neutro", "Concordo", "Concordo totalmente"],
        order: 4,
        isRequired: true,
      },
      {
        type: "radio",
        question: "Aprecio arte, música e literatura",
        options: ["Discordo totalmente", "Discordo", "Neutro", "Concordo", "Concordo totalmente"],
        order: 5,
        isRequired: true,
      },
      {
        type: "radio",
        question: "Prefiro rotinas conhecidas a experimentar coisas novas",
        options: ["Discordo totalmente", "Discordo", "Neutro", "Concordo", "Concordo totalmente"],
        order: 6,
        isRequired: true,
      },
      // CONSCIENCIOSIDADE (Conscientiousness)
      {
        type: "radio",
        question: "Sou sempre bem preparado(a) e organizado(a)",
        options: ["Discordo totalmente", "Discordo", "Neutro", "Concordo", "Concordo totalmente"],
        order: 7,
        isRequired: true,
      },
      {
        type: "radio",
        question: "Presto atenção aos detalhes em tudo que faço",
        options: ["Discordo totalmente", "Discordo", "Neutro", "Concordo", "Concordo totalmente"],
        order: 8,
        isRequired: true,
      },
      {
        type: "radio",
        question: "Completo tarefas imediatamente sem procrastinar",
        options: ["Discordo totalmente", "Discordo", "Neutro", "Concordo", "Concordo totalmente"],
        order: 9,
        isRequired: true,
      },
      {
        type: "radio",
        question: "Às vezes deixo minhas coisas espalhadas e desorganizadas",
        options: ["Discordo totalmente", "Discordo", "Neutro", "Concordo", "Concordo totalmente"],
        order: 10,
        isRequired: true,
      },
      // EXTROVERSÃO (Extroversion)
      {
        type: "radio",
        question: "Sou a alma da festa e gosto de ser o centro das atenções",
        options: ["Discordo totalmente", "Discordo", "Neutro", "Concordo", "Concordo totalmente"],
        order: 11,
        isRequired: true,
      },
      {
        type: "radio",
        question: "Gosto de estar em meio a muitas pessoas",
        options: ["Discordo totalmente", "Discordo", "Neutro", "Concordo", "Concordo totalmente"],
        order: 12,
        isRequired: true,
      },
      {
        type: "radio",
        question: "Me sinto energizado(a) quando estou com outras pessoas",
        options: ["Discordo totalmente", "Discordo", "Neutro", "Concordo", "Concordo totalmente"],
        order: 13,
        isRequired: true,
      },
      {
        type: "radio",
        question: "Prefiro ficar em segundo plano em situações sociais",
        options: ["Discordo totalmente", "Discordo", "Neutro", "Concordo", "Concordo totalmente"],
        order: 14,
        isRequired: true,
      },
      // AMABILIDADE (Agreeableness)
      {
        type: "radio",
        question: "Simpatizo facilmente com os sentimentos dos outros",
        options: ["Discordo totalmente", "Discordo", "Neutro", "Concordo", "Concordo totalmente"],
        order: 15,
        isRequired: true,
      },
      {
        type: "radio",
        question: "Tenho um bom coração e me importo com o bem-estar dos outros",
        options: ["Discordo totalmente", "Discordo", "Neutro", "Concordo", "Concordo totalmente"],
        order: 16,
        isRequired: true,
      },
      {
        type: "radio",
        question: "Confio nas pessoas e acredito em suas boas intenções",
        options: ["Discordo totalmente", "Discordo", "Neutro", "Concordo", "Concordo totalmente"],
        order: 17,
        isRequired: true,
      },
      {
        type: "radio",
        question: "Às vezes sou duro(a) com pessoas que cometem erros",
        options: ["Discordo totalmente", "Discordo", "Neutro", "Concordo", "Concordo totalmente"],
        order: 18,
        isRequired: true,
      },
      // NEUROTICISMO (Neuroticism)
      {
        type: "radio",
        question: "Fico estressado(a) facilmente em situações difíceis",
        options: ["Discordo totalmente", "Discordo", "Neutro", "Concordo", "Concordo totalmente"],
        order: 19,
        isRequired: true,
      },
      {
        type: "radio",
        question: "Me preocupo frequentemente com coisas que podem dar errado",
        options: ["Discordo totalmente", "Discordo", "Neutro", "Concordo", "Concordo totalmente"],
        order: 20,
        isRequired: true,
      },
      {
        type: "radio",
        question: "Meu humor muda frequentemente sem motivo aparente",
        options: ["Discordo totalmente", "Discordo", "Neutro", "Concordo", "Concordo totalmente"],
        order: 21,
        isRequired: true,
      },
      {
        type: "radio",
        question: "Raramente me sinto triste ou deprimido(a)",
        options: ["Discordo totalmente", "Discordo", "Neutro", "Concordo", "Concordo totalmente"],
        order: 22,
        isRequired: true,
      },
      // CAMPO PARA RESULTADO
      {
        type: "textarea",
        question: "Resultado da Avaliação Big Five: (Este campo será preenchido com base na análise das respostas)",
        order: 23,
        isRequired: false,
      }
    ]
  }
];

export const getTemplateById = (id: string): QuestionTemplate | undefined => {
  return questionTemplates.find(template => template.id === id);
};

export const applyTemplate = (templateId: string): Omit<InsertFormQuestion, 'classId'>[] => {
  const template = getTemplateById(templateId);
  return template ? template.questions : [];
};