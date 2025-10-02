# ClassConnect

Sistema de gestão de turmas e formulários de avaliação desenvolvido com React, TypeScript e Node.js.

## 📋 Funcionalidades

- ✅ **Gestão de Turmas**: Criação, edição e gerenciamento de turmas
- ✅ **Formulários Dinâmicos**: Criação de formulários de avaliação personalizados
- ✅ **Dashboard Interativo**: Visualização de dados e métricas em tempo real
- ✅ **Divisão de Grupos**: Sistema automático de divisão de alunos em grupos
- ✅ **Integração N8N**: Webhook para envio automático de dados de divisão
- ✅ **Autenticação**: Sistema de login seguro
- ✅ **Dark Mode**: Interface adaptável com modo escuro/claro
- ✅ **Responsive Design**: Interface otimizada para desktop e mobile
- ✅ **Banco de Dados**: Persistência de dados com PostgreSQL

## 🛠️ Tecnologias

### Frontend
- **React 18** com TypeScript
- **Vite** para build e desenvolvimento
- **Tailwind CSS** para estilização
- **React Query** para gerenciamento de estado
- **React Hook Form** para formulários
- **Wouter** para roteamento

### Backend
- **Node.js** com TypeScript
- **Express** para API REST
- **Drizzle ORM** para banco de dados
- **PostgreSQL** como banco de dados
- **Supabase** para infraestrutura

### Ferramentas
- **ESLint** e **Prettier** para qualidade de código
- **Playwright** para testes end-to-end

## 🚀 Deploy na Azure

Este projeto está otimizado para deploy na Azure com as seguintes configurações:

### Pré-requisitos
- Node.js 18+ 
- PostgreSQL ou Supabase
- Variáveis de ambiente configuradas

### Estrutura do Build
```bash
npm run build
```

O build gera:
- `/dist/public/` - Assets do frontend
- `/dist/index.js` - Servidor backend otimizado

## 📦 Estrutura do Projeto

```
ClassConnect/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilitários
├── server/                # Backend Node.js
│   ├── auth.ts           # Autenticação
│   ├── routes.ts         # Rotas da API
│   └── storage.ts        # Camada de dados
├── shared/               # Schemas compartilhados
├── migrations/           # Migrações do banco
└── supabase/            # Configurações Supabase
```

## 🔧 Configuração para Equipe

### 1. Clone o repositório
```bash
git clone https://github.com/victorarielima/ClassConnect.git
cd ClassConnect
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
O arquivo `.env` já está configurado com as credenciais da equipe.

### 4. Execute as migrações
```bash
npm run db:migrate
```

### 5. Inicie o projeto
```bash
npm run dev
```

## 📱 Funcionalidades Principais

### Dashboard
- Visualização de turmas ativas
- Métricas de participação
- Contador de respostas em tempo real
- Interface adaptativa (dark/light mode)

### Gestão de Turmas
- Criação de turmas com limites personalizáveis
- Configuração de grupos
- Status de ativação/desativação

### Formulários Dinâmicos
- Perguntas de múltiplos tipos:
  - Texto curto/longo
  - Seleção única/múltipla
  - Escalas numéricas
- Validação de campos obrigatórios
- Preview em tempo real

### Relatórios
- Visualização de respostas
- Exportação de dados
- Análise de participação

## 🎨 Design System

### Cores Principais
- **Primary**: `#3b82f6` (Azul)
- **Secondary**: `#10b981` (Verde)
- **Accent**: `#8b5cf6` (Roxo)
- **Dark Mode Accent**: `#9741E7` (Roxo personalizado)

### Efeitos Visuais
- Glow effects no modo escuro
- Transições suaves entre temas
- Animações em cards e botões

## 🔒 Segurança

- Autenticação via Supabase
- Validação de dados no frontend e backend
- Sanitização de inputs
- Proteção contra CSRF

## 📈 Performance

- Build otimizado com Vite
- Code splitting automático
- Assets otimizados
- Lazy loading de componentes

## 🤝 Contribuição

Para contribuir com o projeto:

1. Faça um fork do repositório
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Faça um push para a branch
5. Abra um Pull Request

## � Integração com N8N

O ClassConnect possui integração nativa com N8N para automação de processos. Quando os grupos são divididos, os dados podem ser enviados automaticamente para um webhook configurado.

### Configuração

1. Configure sua URL de webhook N8N na página de divisão de grupos
2. Os dados serão enviados automaticamente quando os grupos forem criados/atualizados

### Dados Enviados

- Nome dos alunos e suas respostas
- Configurações da divisão (prompt, quantidade por grupo)
- Nome da divisão e dados da turma
- Estrutura completa dos grupos formados

Para mais detalhes, consulte: [WEBHOOK_N8N_GUIDE.md](./WEBHOOK_N8N_GUIDE.md)

### Teste do Webhook

Use o script de teste incluído:

```bash
node test-webhook.js https://seu-n8n.com/webhook/group-division
```

## �📄 Licença

Este projeto é propriedade da equipe e está sob licença privada.

## 👥 Equipe

Desenvolvido por [@victorarielima](https://github.com/victorarielima) e equipe.

---

**Status**: ✅ Pronto para produção | 🚀 Deploy Azure Ready
