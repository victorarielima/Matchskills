import swaggerJsdoc from 'swagger-jsdoc';
import { apiReference } from '@scalar/express-api-reference';
import type { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MatchSkills API',
      version: '1.0.0',
      description: `
# MatchSkills API Documentation

MatchSkills é uma plataforma inovadora para gestão de grupos e formulários de avaliação.

## Funcionalidades Principais

- **Gestão de Grupos**: Criação, edição e gerenciamento de grupos
- **Formulários Dinâmicos**: Criação de formulários de avaliação personalizados  
- **Dashboard Interativo**: Visualização de dados e métricas em tempo real
- **Divisão Automática**: Sistema inteligente de divisão de participantes em equipes
- **Integração Webhooks**: Envio automático de dados para sistemas externos

## Autenticação

A API utiliza autenticação baseada em sessão. Endpoints protegidos requerem login prévio.

## Códigos de Status

- **200**: Sucesso
- **201**: Criado com sucesso
- **400**: Erro na requisição
- **401**: Não autorizado
- **404**: Recurso não encontrado
- **500**: Erro interno do servidor
      `,
      contact: {
        name: 'MatchSkills Support',
        email: 'support@matchskills.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:8080',
        description: 'Servidor de Desenvolvimento'
      },
      {
        url: 'https://your-production-url.com',
        description: 'Servidor de Produção'
      }
    ],
    components: {
      securitySchemes: {
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
          description: 'Autenticação baseada em sessão'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            profileImageUrl: { type: 'string', format: 'uri' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Class: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            teacherId: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            code: { type: 'string' },
            studentLimit: { type: 'integer', minimum: 1 },
            groupCount: { type: 'integer', minimum: 1 },
            colorIndex: { type: 'integer', minimum: 0 },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          },
          required: ['name', 'studentLimit', 'groupCount']
        },
        FormQuestion: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            classId: { type: 'string', format: 'uuid' },
            question: { type: 'string' },
            type: { 
              type: 'string', 
              enum: ['text', 'textarea', 'radio', 'checkbox', 'scale'] 
            },
            options: { 
              type: 'array', 
              items: { type: 'string' } 
            },
            isRequired: { type: 'boolean' },
            order: { type: 'integer' },
            scaleMin: { type: 'integer' },
            scaleMax: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' }
          },
          required: ['question', 'type', 'order']
        },
        FormResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            classId: { type: 'string', format: 'uuid' },
            studentName: { type: 'string' },
            studentEmail: { type: 'string', format: 'email' },
            responses: { type: 'object' },
            submittedAt: { type: 'string', format: 'date-time' }
          },
          required: ['studentName', 'responses']
        },
        GroupDivision: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            classId: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            membersPerGroup: { type: 'integer', minimum: 1 },
            prompt: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          },
          required: ['name', 'membersPerGroup']
        },
        GroupMember: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            divisionId: { type: 'string', format: 'uuid' },
            studentName: { type: 'string' },
            studentEmail: { type: 'string', format: 'email' },
            groupNumber: { type: 'integer', minimum: 1 },
            responses: { type: 'object' },
            createdAt: { type: 'string', format: 'date-time' }
          },
          required: ['studentName', 'groupNumber']
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            error: { type: 'string' }
          }
        },
        LoginRequest: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 }
          },
          required: ['email', 'password']
        },
        RegisterRequest: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
            firstName: { type: 'string' },
            lastName: { type: 'string' }
          },
          required: ['email', 'password']
        }
      }
    },
    security: [
      {
        sessionAuth: []
      }
    ]
  },
  apis: ['./server/routes.ts', './server/swagger-docs-educativo.ts', './server/*.ts']
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Express) {

  // Setup Scalar com tema MatchSkills - FOCO 100% EDUCATIVO
  app.use('/docs', 
    // @ts-ignore - Scalar apiReference aceita spec mas a tipagem está incompleta
    apiReference({
      spec: {
        url: '/api-spec.json'
      },
      layout: 'modern',
      hideTestRequestButton: true,
      hideClientButton: true,
      theme: 'bluePlanet',
      hideModels: true,
      showSidebar: true,
      showToolbar: 'never',
      operationTitleSource: 'summary',
      persistAuth: false,
      telemetry: false,
      isEditable: false,
      isLoading: false,
      documentDownloadType: 'both',
      hideSearch: false,
      showOperationId: false,
      hideDarkModeToggle: true,
      withDefaultFonts: true,
      defaultOpenAllTags: false,
      expandAllModelSections: false,
      expandAllResponses: false,
      orderSchemaPropertiesBy: 'alpha',
      orderRequiredPropertiesFirst: true,
      metaData: {
        title: 'MatchSkills - Guia Educativo Completo',
        description: '📚 Aprenda a usar o MatchSkills de forma simples e prática',
        favicon: '/static/favicon.svg'
      },
      customCss: `
      /* MatchSkills - Tema Blue Planet Personalizado */
      :root {
        --scalar-color-1: #0ea5e9;
        --scalar-color-2: #0284c7; 
        --scalar-color-3: #06b6d4;
        --scalar-color-accent: #f59e0b;
      }

      /* Melhorar legibilidade dos títulos */
      h1, h2, h3 {
        color: #0ea5e9;
        font-weight: 700;
      }

      /* Melhorar código inline */
      code {
        background: #e0f2fe;
        padding: 0.2rem 0.4rem;
        border-radius: 4px;
        color: #0369a1;
        font-weight: 500;
      }

      /* Blocos de código */
      pre {
        background: #0c4a6e;
        border-radius: 8px;
        padding: 1rem;
        border: 1px solid #0284c7;
      }

      /* Links */
      a {
        color: #0ea5e9;
        font-weight: 500;
      }

      a:hover {
        color: #0284c7;
      }

      /* Scrollbar personalizada */
      ::-webkit-scrollbar {
        width: 10px;
      }

      ::-webkit-scrollbar-track {
        background: #e0f2fe;
      }

      ::-webkit-scrollbar-thumb {
        background: #0ea5e9;
        border-radius: 5px;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: #0284c7;
      }

      /* Destaque para elementos importantes */
      strong, b {
        color: #0ea5e9;
        font-weight: 700;
      }

      /* Emojis e ícones mantêm destaque */
      .markdown em {
        color: #0ea5e9;
      }

      /* OCULTAR SEÇÕES DE SERVER, AUTHENTICATION E CLIENT LIBRARIES - Múltiplos seletores */
      /* Usando seletores mais genéricos e específicos */
      div[class*="Server"],
      div[class*="Authentication"],
      div[class*="Client"],
      div[class*="client"],
      section:has(h2:contains("Server")),
      section:has(h3:contains("Authentication")),
      section:has(h3:contains("Client Libraries")),
      [class*="api-client"],
      [class*="ApiClient"],
      .references-classic,
      .references-sidebar,
      /* Tentar ocultar pelo conteúdo */
      *:has(> *:contains("Servidor de Desenvolvimento")),
      *:has(> *:contains("Authentication")),
      *:has(> *:contains("Client Libraries")),
      *:has(> *:contains("Shell")),
      *:has(> *:contains("Ruby")),
      *:has(> *:contains("Node.js")),
      *:has(> *:contains("Python")),
      /* Seletores mais amplos */
      [data-testid*="server"],
      [data-testid*="auth"],
      [data-testid*="client"] {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        max-height: 0 !important;
        overflow: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      /* Ocultar "Powered by Scalar" - seletores específicos */
      footer[class*="Footer"],
      .scalar-footer,
      [class*="PoweredBy"],
      a[href*="scalar.com"]:not(.scalar-api-client a) {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        overflow: hidden !important;
      }

      /* Ocultar campos do cabeçalho (Contact e License) */
      [class*="contact"],
      [class*="Contact"],
      [class*="license"],
      [class*="License"],
      a[href^="mailto:"],
      a[href*="opensource.org"],
      nav a[href^="mailto:"],
      header a[href^="mailto:"],
      .scalar-api-client__header a,
      [class*="HeaderLink"] {
        display: none !important;
        visibility: hidden !important;
      }

      /* Ocultar footer do request card */
      .request-card-footer,
      [class*="request-card-footer"],
      .scalar-card-footer,
      .scalar-card-content.scalar-card-footer,
      .scalar-card-content.request-card-footer,
      div[class*="scalar-card-footer"],
      div[class*="request-card-footer"] {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        overflow: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }

      /* OCULTAR APENAS SEÇÕES DE RESPONSE (manter Request visível) */
      /* Ocultar exemplos de response */
      [data-section-id*="response"],
      .scalar-api-client__response,
      .scalar-card-response,
      .scalar-example-response,
      .http-response,
      .response-card,
      .scalar-response,
      section[aria-label*="Response"],
      section[aria-label*="response"],
      .response-section,
      .example-response,
      /* Ocultar código de resposta JSON */
      .response-body,
      .response-example,
      .scalar-response-body,
      /* Ocultar botões de teste - TODAS AS VARIAÇÕES */
      .scalar-api-client__try-it-button,
      button[aria-label*="Try"],
      button[aria-label*="Test"],
      button[aria-label*="test"],
      button[aria-label*="Send"],
      button[aria-label*="send"],
      .try-it,
      .test-request,
      .send-request,
      .scalar-api-client__send-button,
      .scalar-api-client__playground,
      .scalar-button--primary,
      button.scalar-button,
      [class*="test-request"],
      [class*="send-button"],
      [class*="try-it"],
      /* Ocultar painéis laterais de teste */
      .api-client-sidebar,
      .scalar-api-client-sidebar,
      /* OCULTAR COMPLETAMENTE SEÇÕES DE SERVER, AUTHENTICATION E CLIENT LIBRARIES */
      [data-section-id*="server"],
      [data-section-id*="authentication"],
      [data-section-id*="client"],
      section[aria-label*="Server"],
      section[aria-label*="Authentication"],
      section[aria-label*="Client"],
      .scalar-api-client__server,
      .scalar-api-client__authentication,
      .scalar-api-client__client-libraries,
      [class*="ServerSection"],
      [class*="AuthSection"],
      [class*="ClientLibraries"],
      .server-section,
      .authentication-section,
      .client-libraries-section,
      .introduction-card {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        overflow: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }

      /* Garantir que Request e descrições sejam exibidos */
      .scalar-card-content,
      .markdown-content,
      .description-content,
      [data-section-id*="request"],
      .scalar-api-client__request,
      .scalar-card-request,
      .request-card,
      .request-section {
        display: block !important;
        visibility: visible !important;
      }

      /* Responsivo */
      @media (max-width: 768px) {
        body {
          font-size: 14px;
        }
      }
    `
  }));

  // OpenAPI JSON spec
  app.get('/api-spec.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(specs);
  });
}

export { specs };