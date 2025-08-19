# ClassConnect - Configuração com Supabase

Este projeto agora utiliza Supabase como banco de dados principal, substituindo os dados mockados por uma base de dados real PostgreSQL.

## 📋 Pré-requisitos

- Node.js (versão 18 ou superior)
- Uma conta no [Supabase](https://supabase.com)

## 🚀 Configuração Inicial

### 1. Configurar o Projeto Supabase

1. Acesse [Supabase](https://supabase.com) e crie uma nova conta (se necessário)
2. Clique em "New Project"
3. Escolha sua organização
4. Defina um nome para o projeto (ex: "ClassConnect")
5. Defina uma senha segura para o banco de dados
6. Escolha uma região próxima
7. Clique em "Create new project"

### 2. Obter as Credenciais

Após a criação do projeto, vá para:
- **Settings** > **API**

Você precisará dos seguintes valores:
- `Project URL`
- `anon public key`
- `service_role key` (opcional, para operações administrativas)

### 3. Configurar Variáveis de Ambiente

1. Copie o arquivo `.env.local` e renomeie para `.env`
2. Substitua os valores placeholders pelas suas credenciais reais:

```env
# Supabase Configuration
SUPABASE_URL=https://seu-project-id.supabase.co
SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# Database URL para Drizzle ORM
DATABASE_URL=postgresql://postgres:SUA-SENHA@db.seu-project-id.supabase.co:5432/postgres

# Session Secret
SESSION_SECRET=sua-chave-secreta-aqui

# Node Environment  
NODE_ENV=development
```

### 4. Configurar o Schema do Banco

Execute os seguintes comandos na ordem:

```bash
# Gerar as migrações
npm run db:generate

# Aplicar as migrações ao banco
npm run db:push
```

### 5. Popular o Banco com Dados Iniciais

```bash
npm run db:seed
```

Este comando criará:
- 3 usuários de exemplo
- 2 turmas de exemplo
- Perguntas de formulário
- Algumas respostas de exemplo

### 6. Iniciar o Projeto

```bash
npm run dev
```

## 🔐 Credenciais de Teste

Após executar o seed, você pode fazer login com:
- **Email:** ana.silva@matchskills.com
- **Senha:** 123456

## 📊 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Compila o projeto para produção
- `npm run start` - Inicia o servidor em produção
- `npm run db:generate` - Gera migrações do Drizzle
- `npm run db:push` - Aplica migrações ao banco
- `npm run db:seed` - Popular banco com dados iniciais
- `npm run supabase:start` - Inicia Supabase local (opcional)
- `npm run supabase:stop` - Para Supabase local
- `npm run supabase:status` - Status do Supabase local

## 🔧 Estrutura de Dados

O banco de dados contém as seguintes tabelas:

### `users`
- Informações dos usuários (professores)
- Senhas são criptografadas com bcrypt

### `classes`
- Turmas criadas pelos professores
- Cada turma tem um código único

### `form_questions`
- Perguntas dos formulários de cada turma
- Suporta diferentes tipos: text, textarea, radio, checkbox, scale

### `form_responses`
- Respostas dos alunos aos formulários
- Dados armazenados em formato JSON

### `sessions`
- Sessões de usuário para autenticação

## 🛠️ Desenvolvido com

- **Frontend:** React + TypeScript + Vite
- **Backend:** Express.js + TypeScript
- **Banco de Dados:** PostgreSQL (Supabase)
- **ORM:** Drizzle ORM
- **Autenticação:** Passport.js + bcrypt
- **UI:** Tailwind CSS + Radix UI

## 🔄 Migrando de Dados Mockados

O projeto originalmente utilizava dados mockados. A migração para Supabase foi feita:

1. ✅ Substituindo `storage.ts` por `storage-real.ts`
2. ✅ Implementando conexão real com PostgreSQL
3. ✅ Adicionando criptografia de senhas com bcrypt
4. ✅ Criando sistema de migrações
5. ✅ Adicionando script de seed para dados iniciais

## 🆘 Troubleshooting

### Erro de Conexão com Banco
- Verifique se a `DATABASE_URL` está correta
- Confirme se o projeto Supabase está ativo
- Verifique se a senha está correta

### Erro de Migração
- Execute `npm run db:generate` antes de `npm run db:push`
- Verifique se as tabelas não existem previamente

### Erro de Autenticação
- Confirme se executou o `npm run db:seed`
- Verifique se está usando as credenciais corretas

## 📞 Suporte

Se encontrar problemas, verifique:
1. As variáveis de ambiente estão configuradas corretamente
2. O projeto Supabase está ativo e acessível
3. As migrações foram executadas com sucesso
4. Os dados foram populados com o seed
