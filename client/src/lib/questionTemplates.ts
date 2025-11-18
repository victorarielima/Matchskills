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
        type: "radio",
        question: "Qual seu nível de conhecimento em desenvolvimento web (HTML, CSS, JS)?",
        options: ["Iniciante", "Intermediário", "Avançado", "Nenhum"],
        order: 1,
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
        order: 2,
        isRequired: true,
      },
      {
        type: "radio",
        question: "Qual seu nível de conhecimento em desenvolvimento Mobile?",
        options: ["Nenhum", "Iniciante", "Intermediário", "Avançado"],
        order: 3,
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
        order: 4,
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
        order: 5,
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
        order: 6,
        isRequired: true,
      },
      {
        type: "radio",
        question: "Com qual palavra você mais se identifica?",
        options: ["Cuidadoso", "Paciente", "Comunicativo", "Determinado"],
        order: 7,
        isRequired: true,
      },
      {
        type: "radio",
        question: "Qual dessas palavras mais se aplica a você?",
        options: ["Prestativo", "Entusiasmado", "Organizado", "Competitivo"],
        order: 8,
        isRequired: true,
      },
      {
        type: "radio",
        question: "Qual adjetivo te descreve melhor?",
        options: ["Calmo", "Direto", "Otimista", "Preciso"],
        order: 9,
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
        order: 10,
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
        order: 11,
        isRequired: true,
      },
      {
        type: "textarea",
        question: "Perfil: (Essa informação será determinada com base nas respostas dos participantes).",
        order: 12,
        isRequired: false,
      }
    ]
  },
  {
    id: "bigfive",
    name: "Big Five (OCEAN) - Avaliação de Personalidade",
    description: "Avaliação completa dos cinco grandes fatores de personalidade: Abertura, Conscienciosidade, Extroversão, Amabilidade e Neuroticismo",
    questions: [
      // EXTROVERSÃO (Extroversion)
      {
        type: "scale",
        question: "Eu me vejo como alguém extrovertido, entusiasta.",
        order: 1,
        isRequired: true,
        scaleMin: 0,
        scaleMax: 5,
      },
      // AMABILIDADE (Agreeableness)
      {
        type: "scale",
        question: "Eu me vejo como alguém crítico, cético.",
        order: 2,
        isRequired: true,
        scaleMin: 0,
        scaleMax: 5,
      },
      // CONSCIENCIOSIDADE (Conscientiousness)
      {
        type: "scale",
        question: "Eu me vejo como alguém confiável, responsável.",
        order: 3,
        isRequired: true,
        scaleMin: 0,
        scaleMax: 5,
      },
      // NEUROTICISMO (Neuroticism)
      {
        type: "scale",
        question: "Eu me vejo como alguém ansioso, facilmente perturbado.",
        order: 4,
        isRequired: true,
        scaleMin: 0,
        scaleMax: 5,
      },
      // ABERTURA À EXPERIÊNCIA (Openness)
      {
        type: "scale",
        question: "Eu me vejo como alguém aberto a novas experiências, com imaginação.",
        order: 5,
        isRequired: true,
        scaleMin: 0,
        scaleMax: 5,
      },
      // EXTROVERSÃO - Reverso (Extroversion Reverse)
      {
        type: "scale",
        question: "Eu me vejo como alguém reservado, quieto.",
        order: 6,
        isRequired: true,
        scaleMin: 0,
        scaleMax: 5,
      },
      // AMABILIDADE - Reverso (Agreeableness Reverse)
      {
        type: "scale",
        question: "Eu me vejo como alguém generoso, altruísta.",
        order: 7,
        isRequired: true,
        scaleMin: 0,
        scaleMax: 5,
      },
      // CONSCIENCIOSIDADE - Reverso (Conscientiousness Reverse)
      {
        type: "scale",
        question: "Eu me vejo como alguém descuidado, negligente.",
        order: 8,
        isRequired: true,
        scaleMin: 0,
        scaleMax: 5,
      },
      // NEUROTICISMO - Reverso (Neuroticism Reverse)
      {
        type: "scale",
        question: "Eu me vejo como alguém calmo, emocionalmente estável.",
        order: 9,
        isRequired: true,
        scaleMin: 0,
        scaleMax: 5,
      },
      // ABERTURA À EXPERIÊNCIA - Reverso (Openness Reverse)
      {
        type: "scale",
        question: "Eu me vejo como alguém convencional, previsível.",
        order: 10,
        isRequired: true,
        scaleMin: 0,
        scaleMax: 5,
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