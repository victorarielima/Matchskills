/**
 * @swagger
 * /api/register:
 *   post:
 *     summary: 🚀 Como criar uma conta no MatchSkills
 *     description: |
 *       ## 👨‍🏫 Para Organizadores (Professores/Instrutores)
 *       
 *       Aqui você aprende como criar sua conta para começar a usar o MatchSkills!
 *       
 *       **O que acontece quando você se cadastra:**
 *       - ✅ Sua conta fica ativa imediatamente
 *       - 🎯 Você pode criar quantos grupos quiser
 *       - 📝 Cada grupo pode ter formulários personalizados
 *       - 👥 Sistema automático de divisão de participantes
 *       
 *       **Informações necessárias:**
 *       - Nome completo (como você quer ser chamado)
 *       - Email válido (será usado para fazer login)
 *       - Senha segura (mínimo 6 caracteres)
 *       
 *       **Dica Pro:** Use um email que você acesse regularmente, pois é por ele que você fará login!
 *     tags: [🔐 Sistema de Login]
 *     responses:
 *       201:
 *         description: |
 *           🎉 **Conta criada com sucesso! Você já pode fazer login.**
 *           
 *           **Exemplo do que você receberá:**
 *           ```json
 *           {
 *             "id": "user-789",
 *             "name": "Professor João Silva",
 *             "email": "joao.silva@escola.com",
 *             "role": "teacher",
 *             "createdAt": "2024-10-02T16:00:00Z",
 *             "profileComplete": false,
 *             "welcomeMessage": "Bem-vindo ao MatchSkills! Sua conta foi criada com sucesso.",
 *             "nextSteps": [
 *               "Complete seu perfil",
 *               "Crie seu primeiro grupo",
 *               "Convide participantes"
 *             ]
 *           }
 *           ```
 *           
 *           **Como interpretar:**
 *           - `role`: Sempre "teacher" para organizadores
 *           - `profileComplete`: Indica se precisa completar informações
 *           - `nextSteps`: Sugestões do que fazer em seguida
 *           - Sua conta já está ativa e você pode fazer login imediatamente
 *       400:
 *         description: ❌ Algo deu errado - verifique se todos os dados estão corretos ou se o email já está sendo usado.
 */

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: 🔑 Como fazer login no MatchSkills
 *     description: |
 *       ## 🚪 Entrando na sua conta
 *       
 *       Use esta funcionalidade sempre que quiser acessar o MatchSkills!
 *       
 *       **Como funciona:**
 *       - 📧 Digite o email que você usou no cadastro
 *       - 🔒 Digite sua senha
 *       - ✨ Pronto! Você está dentro da plataforma
 *       
 *       **Se você esquecer a senha:**
 *       Atualmente não temos recuperação automática, mas entre em contato conosco!
 *       
 *       **Sua sessão fica ativa por:**
 *       - 🕐 24 horas de inatividade
 *       - 🔄 Renovada automaticamente sempre que você usar a plataforma
 *       
 *       **Dica de Segurança:** Sempre faça logout em computadores compartilhados!
 *     tags: [🔐 Sistema de Login]
 *     responses:
 *       200:
 *         description: |
 *           🎯 **Login realizado! Bem-vindo de volta ao MatchSkills.**
 *           
 *           **Exemplo do que você receberá:**
 *           ```json
 *           {
 *             "id": "123e4567-e89b-12d3-a456-426614174000",
 *             "name": "João Professor Silva",
 *             "email": "joao@escola.com.br",
 *             "createdAt": "2024-01-15T10:30:00Z"
 *           }
 *           ```
 *           
 *           **Como interpretar:**
 *           - `id`: Sua identificação única no sistema
 *           - `name`: Nome completo que você cadastrou
 *           - `email`: Email usado para login
 *           - `createdAt`: Data de criação da sua conta
 *       401:
 *         description: |
 *           🚫 **Email ou senha incorretos.**
 *           
 *           **Exemplo da mensagem de erro:**
 *           ```json
 *           {
 *             "error": "Invalid credentials",
 *             "message": "Email ou senha incorretos"
 *           }
 *           ```
 */

/**
 * @swagger
 * /api/logout:
 *   post:
 *     summary: 🚪 Como sair da sua conta com segurança
 *     description: |
 *       ## 🛡️ Fazendo logout seguro
 *       
 *       **Quando usar:**
 *       - 🏠 Quando terminar de usar o MatchSkills
 *       - 💻 SEMPRE em computadores compartilhados
 *       - 🔒 Para máxima segurança da sua conta
 *       
 *       **O que acontece quando você faz logout:**
 *       - ❌ Sua sessão é completamente encerrada
 *       - 🗑️ Todos os dados temporários são apagados
 *       - 🔐 Você precisará fazer login novamente para voltar
 *       
 *       **Dica importante:** Em computadores pessoais você pode ficar logado, 
 *       mas em locais públicos sempre faça logout!
 *     tags: [🔐 Sistema de Login]
 *     responses:
 *       200:
 *         description: |
 *           👋 **Logout realizado com sucesso! Até a próxima.**
 *           
 *           **Exemplo do que você receberá:**
 *           ```json
 *           {
 *             "message": "Logout realizado com sucesso",
 *             "loggedOutAt": "2024-10-02T17:45:00Z",
 *             "sessionDuration": "2 horas e 15 minutos",
 *             "lastActivity": "Visualizou divisões de equipes",
 *             "securityStatus": "Sessão encerrada com segurança",
 *             "accountSafe": true,
 *             "farewell": "Obrigado por usar o MatchSkills! Até a próxima!"
 *           }
 *           ```
 *           
 *           **Como interpretar:**
 *           - `sessionDuration`: Tempo total que você ficou logado
 *           - `lastActivity`: Última ação que você fez na plataforma
 *           - `securityStatus`: Confirmação de que saiu com segurança
 *           - `accountSafe`: True = sua conta está protegida
 *           - Você precisará fazer login novamente para acessar
 */

/**
 * @swagger
 * /api/classes:
 *   get:
 *     summary: 📚 Como ver todos os seus grupos criados
 *     description: |
 *       ## 👥 Visualizando seus grupos
 *       
 *       **O que você verá aqui:**
 *       - 📋 Lista completa de todos os grupos que você criou
 *       - 🎯 Nome de cada grupo e seu código único
 *       - 👤 Quantos participantes já responderam
 *       - ✅ Status de cada grupo (ativo ou inativo)
 *       
 *       **Informações úteis de cada grupo:**
 *       - 🏷️ Nome do grupo (que você escolheu)
 *       - 🔢 Código de acesso (que os participantes usam)
 *       - 👥 Limite de participantes
 *       - 🎨 Cor de identificação
 *       - 📅 Data de criação
 *       
 *       **Dica:** Use esta lista para acompanhar todos os seus projetos ativos!
 *     tags: [👥 Gestão de Grupos]
 *     responses:
 *       200:
 *         description: |
 *           📊 **Aqui estão todos os seus grupos organizados!**
 *           
 *           **Exemplo do que você receberá:**
 *           ```json
 *           [
 *             {
 *               "id": "grupo-123",
 *               "name": "Turma de Marketing Digital 2024",
 *               "code": "MKT2024",
 *               "studentLimit": 30,
 *               "groupCount": 6, 
 *               "colorIndex": 2,
 *               "isActive": true,
 *               "createdAt": "2024-10-01T09:00:00Z",
 *               "responseCount": 18
 *             },
 *             {
 *               "id": "grupo-456", 
 *               "name": "Workshop de Liderança",
 *               "code": "LEAD24",
 *               "studentLimit": 20,
 *               "groupCount": 4,
 *               "colorIndex": 5,
 *               "isActive": false,
 *               "createdAt": "2024-09-15T14:30:00Z", 
 *               "responseCount": 20
 *             }
 *           ]
 *           ```
 *           
 *           **Como interpretar:**
 *           - `name`: Nome que você deu ao grupo
 *           - `code`: Código que os participantes usam para acessar
 *           - `studentLimit`: Máximo de participantes permitidos
 *           - `groupCount`: Número de equipes para divisão
 *           - `isActive`: Se está aceitando participações
 *           - `responseCount`: Quantas pessoas já responderam
 *       401:
 *         description: 🔐 Você precisa estar logado para ver seus grupos.
 *   post:
 *     summary: ➕ Como criar um novo grupo
 *     description: |
 *       ## 🎯 Criando seu primeiro grupo
 *       
 *       **Passo a passo do que acontece:**
 *       1. 📝 Você define o nome do grupo
 *       2. 👥 Escolhe quantos participantes pode ter
 *       3. 📋 Cria perguntas personalizadas para o formulário
 *       4. 🎨 Sistema escolhe uma cor automaticamente
 *       5. 🔢 Sistema gera um código único para os participantes
 *       
 *       **Configurações importantes:**
 *       - 🏷️ **Nome:** Escolha algo descritivo (ex: "Turma de Marketing 2024")
 *       - 👤 **Limite de participantes:** Máximo de pessoas que podem responder
 *       - 🔢 **Número de equipes:** Para divisão automática posterior
 *       
 *       **Suas perguntas podem ser:**
 *       - 📝 Texto livre (para nome, opinião, etc.)
 *       - ☑️ Múltipla escolha
 *       - 📊 Escala de 1 a 10
 *       - ✅ Sim/Não (checkbox)
 *       
 *       **Dica Pro:** Pense bem nas perguntas - elas ajudam a dividir as equipes de forma inteligente!
 *     tags: [👥 Gestão de Grupos]
 *     responses:
 *       201:
 *         description: |
 *           🎉 **Grupo criado com sucesso! Os participantes já podem acessar.**
 *           
 *           **Exemplo do que você receberá:**
 *           ```json
 *           {
 *             "id": "grupo-789",
 *             "name": "Workshop de Inovação 2024",
 *             "code": "INOV24",
 *             "description": "Workshop focado em metodologias ágeis e inovação",
 *             "studentLimit": 25,
 *             "groupCount": 5,
 *             "color": "#54BF7B",
 *             "isActive": true,
 *             "createdAt": "2024-10-02T16:15:00Z",
 *             "teacherId": "prof-456",
 *             "shareUrl": "https://matchskills.com/join/INOV24",
 *             "status": "ready_for_participants"
 *           }
 *           ```
 *           
 *           **Como interpretar:**
 *           - `code`: Código que você deve compartilhar com os participantes
 *           - `shareUrl`: Link direto para facilitar o compartilhamento
 *           - `status`: "ready_for_participants" indica que está pronto para uso
 *           - `color`: Cor escolhida automaticamente pelo sistema
 *           - Grupo já está ativo e participantes podem começar a responder
 *       400:
 *         description: ❌ Verifique se preencheu todos os campos obrigatórios.
 */

/**
 * @swagger
 * /api/classes/response-counts:
 *   get:
 *     summary: 📊 Como acompanhar quantas pessoas já responderam
 *     description: |
 *       ## 📈 Dashboard de participação
 *       
 *       **Para que serve:**
 *       - 📊 Ver quantas pessoas já responderam em cada grupo
 *       - 🎯 Acompanhar o progresso de participação
 *       - 📈 Decidir quando fazer a divisão de equipes
 *       
 *       **O que você verá:**
 *       - 🔢 Número total de respostas por grupo
 *       - 📋 Nome de cada grupo
 *       - 💯 Porcentagem do limite atingido
 *       
 *       **Quando usar:**
 *       - 🕐 Verificar se é hora de dividir as equipes
 *       - 📢 Saber se precisa lembrar os participantes
 *       - 📊 Acompanhar a participação em tempo real
 *       
 *       **Dica:** Quando atingir pelo menos 80% das respostas esperadas, 
 *       já é um bom momento para dividir as equipes!
 *     tags: [👥 Gestão de Grupos]
 *     responses:
 *       200:
 *         description: |
 *           📊 **Aqui estão os números de participação de cada grupo!**
 *           
 *           **Exemplo do que você receberá:**
 *           ```json
 *           [
 *             {
 *               "classId": "grupo-123",
 *               "className": "Turma Marketing Digital 2024",
 *               "responseCount": 18,
 *               "studentLimit": 30,
 *               "percentageFilled": 60,
 *               "status": "Em andamento"
 *             },
 *             {
 *               "classId": "grupo-456",
 *               "className": "Workshop de Liderança", 
 *               "responseCount": 20,
 *               "studentLimit": 20,
 *               "percentageFilled": 100,
 *               "status": "Completo"
 *             }
 *           ]
 *           ```
 *           
 *           **Como interpretar:**
 *           - `responseCount`: Número atual de respostas recebidas
 *           - `studentLimit`: Limite máximo de participantes
 *           - `percentageFilled`: Porcentagem de participação (0-100%)
 *           - `status`: Indica se está "Em andamento", "Completo" ou "Inativo"
 */

/**
 * @swagger
 * /api/classes/{classId}:
 *   get:
 *     summary: 🔍 Como ver detalhes de um grupo específico
 *     description: |
 *       ## 📋 Informações completas do grupo
 *       
 *       **O que você descobrirá:**
 *       - 📝 Todas as configurações do grupo
 *       - 🎯 Nome, código e limites
 *       - 📅 Data de criação e última atualização
 *       - ✅ Status atual (ativo/inativo)
 *       
 *       **Informações detalhadas:**
 *       - 🏷️ Nome completo do grupo
 *       - 🔢 Código que os participantes usam
 *       - 👥 Limite máximo de participantes
 *       - 🎨 Cor de identificação escolhida
 *       - 📊 Configurações de divisão de equipes
 *       
 *       **Quando é útil:**
 *       - 🤔 Confirmar configurações antes de divulgar
 *       - 📝 Lembrar o código para passar aos participantes
 *       - ✏️ Verificar se precisa fazer algum ajuste
 *     tags: [👥 Gestão de Grupos]
 *     responses:
 *       200:
 *         description: |
 *           📄 **Aqui estão todos os detalhes do seu grupo!**
 *           
 *           **Exemplo do que você receberá:**
 *           ```json
 *           {
 *             "id": "grupo-123",
 *             "name": "Turma Marketing Digital 2024",
 *             "code": "MKT2024",
 *             "description": "Curso intensivo de marketing digital para profissionais",
 *             "studentLimit": 30,
 *             "currentStudents": 18,
 *             "color": "#7D53F3",
 *             "isActive": true,
 *             "createdAt": "2024-09-15T10:00:00Z",
 *             "updatedAt": "2024-10-02T14:30:00Z",
 *             "teacherId": "prof-456",
 *             "formQuestions": 8,
 *             "responses": 18,
 *             "divisions": 2
 *           }
 *           ```
 *           
 *           **Como interpretar:**
 *           - `code`: Código que os participantes usam para acessar
 *           - `studentLimit`: Máximo de participantes permitidos
 *           - `currentStudents`: Número atual de participantes
 *           - `color`: Cor de identificação do grupo (formato hexadecimal)
 *           - `isActive`: Se o grupo está aceitando novas respostas
 *           - `formQuestions`: Número de perguntas no formulário
 *           - `divisions`: Quantas divisões de equipes já foram criadas
 *       404:
 *         description: 🔍 Grupo não encontrado. Verifique se o ID está correto.
 *   put:
 *     summary: ✏️ Como editar um grupo existente
 *     description: |
 *       ## 🔧 Atualizando seu grupo
 *       
 *       **O que você pode alterar:**
 *       - 📝 Nome do grupo
 *       - 👥 Limite de participantes
 *       - 🔢 Número de equipes para divisão
 *       - ✅ Status (ativo/inativo)
 *       - 📋 Perguntas do formulário
 *       
 *       **Dois tipos de edição:**
 *       
 *       ### 🔄 Edição Completa
 *       - Alterar nome, perguntas e configurações
 *       - Usado quando quer reformular o grupo
 *       
 *       ### ⚡ Edição Rápida
 *       - Apenas mudar status ou limite
 *       - Ideal para pequenos ajustes
 *       
 *       **⚠️ Cuidados importantes:**
 *       - Só você pode editar seus próprios grupos
 *       - Mudanças afetam novas respostas
 *       - Respostas já enviadas não são perdidas
 *       
 *       **Dica:** Use a edição rápida para pausar temporariamente um grupo (inativo)
 *     tags: [👥 Gestão de Grupos]
 *     responses:
 *       200:
 *         description: |
 *           ✅ **Grupo atualizado com sucesso!**
 *           
 *           **Exemplo do que você receberá:**
 *           ```json
 *           {
 *             "id": "grupo-123",
 *             "name": "Turma Marketing Digital 2024 - Atualizada",
 *             "code": "MKT2024",
 *             "description": "Curso intensivo de marketing digital para profissionais - Versão atualizada",
 *             "studentLimit": 35,
 *             "currentStudents": 18,
 *             "color": "#7D53F3",
 *             "isActive": true,
 *             "updatedAt": "2024-10-02T15:30:00Z",
 *             "lastModifiedBy": "prof-456",
 *             "version": 2
 *           }
 *           ```
 *           
 *           **Como interpretar:**
 *           - `updatedAt`: Data e hora da última atualização
 *           - `lastModifiedBy`: ID do usuário que fez a alteração
 *           - `version`: Número da versão (aumenta a cada atualização)
 *           - Todas as outras informações refletem os novos valores
 *       404:
 *         description: 🔍 Grupo não encontrado ou você não tem permissão.
 *   delete:
 *     summary: 🗑️ Como excluir um grupo permanentemente
 *     description: |
 *       ## ⚠️ Exclusão permanente do grupo
 *       
 *       **⚠️ ATENÇÃO: Esta ação não pode ser desfeita!**
 *       
 *       **O que será removido:**
 *       - 📋 O grupo e todas suas configurações
 *       - ❓ Todas as perguntas do formulário
 *       - 📝 Todas as respostas dos participantes
 *       - 👥 Todas as divisões de equipes criadas
 *       
 *       **Antes de excluir, considere:**
 *       - 💾 Fazer backup das respostas importantes
 *       - 📊 Exportar dados de divisão de equipes
 *       - 💭 Desativar ao invés de excluir
 *       
 *       **Quando usar:**
 *       - 🧹 Limpeza de grupos antigos desnecessários
 *       - ❌ Grupos criados por engano
 *       - 🔚 Projetos definitivamente finalizados
 *       
 *       **Alternativa mais segura:** Desative o grupo ao invés de excluir, 
 *       assim você preserva os dados mas impede novas participações.
 *     tags: [👥 Gestão de Grupos]
 *     responses:
 *       200:
 *         description: |
 *           🗑️ **Grupo excluído permanentemente.**
 *           
 *           **Exemplo do que você receberá:**
 *           ```json
 *           {
 *             "deletedGroupId": "grupo-123",
 *             "deletedGroupName": "Turma Marketing Digital 2024",
 *             "deletedAt": "2024-10-02T17:00:00Z",
 *             "deletedBy": "prof-456",
 *             "itemsRemoved": {
 *               "responses": 25,
 *               "questions": 8,
 *               "divisions": 3,
 *               "teams": 15
 *             },
 *             "confirmationMessage": "Grupo e todos os dados relacionados foram removidos permanentemente",
 *             "canRecover": false,
 *             "backupAvailable": false
 *           }
 *           ```
 *           
 *           **Como interpretar:**
 *           - `itemsRemoved`: Quantidade de cada tipo de dados removidos
 *           - `canRecover`: False = não é possível recuperar os dados
 *           - `backupAvailable`: Indica se há backup disponível
 *           - `deletedBy`: ID do usuário que executou a exclusão
 *           - Ação irreversível - todos os dados foram permanentemente removidos
 *       404:
 *         description: 🔍 Grupo não encontrado ou você não tem permissão.
 */

/**
 * @swagger
 * /api/classes/{classId}/questions:
 *   get:
 *     summary: ❓ Como ver as perguntas do formulário
 *     description: |
 *       ## 📋 Visualizando suas perguntas
 *       
 *       **O que você verá:**
 *       - 📝 Todas as perguntas que criou para o grupo
 *       - 🔢 Ordem em que aparecem para os participantes
 *       - 📊 Tipo de cada pergunta (texto, múltipla escolha, etc.)
 *       - ✅ Quais são obrigatórias
 *       
 *       **Tipos de pergunta que você pode ter criado:**
 *       - 📝 **Texto livre:** Para nomes, opiniões, ideias
 *       - 📝 **Área de texto:** Para respostas longas
 *       - ☑️ **Múltipla escolha:** Selecionar uma opção
 *       - ✅ **Checkbox:** Selecionar várias opções
 *       - 📊 **Escala:** Números de 1 a 10
 *       
 *       **Para que serve:**
 *       - 🔍 Conferir se as perguntas estão certas
 *       - 📋 Lembrar o que você perguntou
 *       - ✏️ Decidir se precisa editar algo
 *       
 *       **Dica:** Estas perguntas são a base para a divisão inteligente de equipes!
 *     tags: [📝 Formulários]
 *     responses:
 *       200:
 *         description: |
 *           📋 **Aqui estão todas as perguntas do seu formulário!**
 *           
 *           **Exemplo do que você receberá:**
 *           ```json
 *           [
 *             {
 *               "id": 1,
 *               "question": "Qual é seu nível de experiência com marketing digital?",
 *               "type": "multiple_choice",
 *               "options": [
 *                 "Iniciante - nunca trabalhei com marketing digital",
 *                 "Básico - já tive algum contato",
 *                 "Intermediário - trabalho na área",
 *                 "Avançado - sou especialista"
 *               ],
 *               "order": 1,
 *               "isRequired": true
 *             },
 *             {
 *               "id": 2,
 *               "question": "Descreva seu principal objetivo com este curso",
 *               "type": "text",
 *               "order": 2,
 *               "isRequired": false
 *             }
 *           ]
 *           ```
 *           
 *           **Como interpretar:**
 *           - `type`: Pode ser "multiple_choice", "text", "textarea", "checkbox", "scale"
 *           - `options`: Lista de opções (apenas para perguntas de múltipla escolha ou checkbox)
 *           - `order`: Ordem de exibição das perguntas no formulário
 *           - `isRequired`: Se a pergunta é obrigatória (true) ou opcional (false)
 *       404:
 *         description: 🔍 Grupo não encontrado ou você não tem permissão.
 */

/**
 * @swagger
 * /api/classes/{classId}/responses:
 *   get:
 *     summary: 📊 Como ver todas as respostas dos participantes
 *     description: |
 *       ## 👥 Respostas completas dos participantes
 *       
 *       **O que você encontrará:**
 *       - 📝 Todas as respostas de todos os participantes
 *       - 👤 Nome de cada pessoa que respondeu
 *       - 📅 Data e hora que cada um respondeu
 *       - 💬 Respostas organizadas por pergunta
 *       
 *       **Como as informações são organizadas:**
 *       - 🆔 ID único de cada resposta
 *       - 👤 Nome do participante
 *       - 📋 Respostas para cada pergunta
 *       - 🕐 Timestamp de quando respondeu
 *       
 *       **Para que usar estes dados:**
 *       - 📊 Analisar padrões nas respostas
 *       - 🎯 Entender o perfil do seu grupo
 *       - 👥 Preparar divisão manual de equipes
 *       - 📈 Gerar relatórios e insights
 *       
 *       **Dica Pro:** Use essas informações para conhecer melhor seus participantes 
 *       antes de fazer a divisão automática de equipes!
 *     tags: [📊 Respostas]
 *     responses:
 *       200:
 *         description: |
 *           📋 **Aqui estão todas as respostas organizadas!**
 *           
 *           **Exemplo do que você receberá:**
 *           ```json
 *           [
 *             {
 *               "id": "resp-001",
 *               "participantName": "Ana Maria Silva",
 *               "submittedAt": "2024-10-02T10:15:30Z",
 *               "responses": {
 *                 "nome": "Ana Maria Silva",
 *                 "experiencia": "5 anos em marketing",
 *                 "lideranca_escala": 8,
 *                 "trabalho_equipe": 9,
 *                 "areas_interesse": ["Marketing Digital", "Análise de Dados"],
 *                 "disponibilidade": "Integral"
 *               }
 *             },
 *             {
 *               "id": "resp-002", 
 *               "participantName": "Carlos Santos",
 *               "submittedAt": "2024-10-02T11:30:45Z",
 *               "responses": {
 *                 "nome": "Carlos Santos",
 *                 "experiencia": "Recém formado",
 *                 "lideranca_escala": 6,
 *                 "trabalho_equipe": 10, 
 *                 "areas_interesse": ["Desenvolvimento", "UX Design"],
 *                 "disponibilidade": "Meio período"
 *               }
 *             }
 *           ]
 *           ```
 *           
 *           **Como interpretar:**
 *           - `participantName`: Nome da pessoa que respondeu
 *           - `submittedAt`: Data e hora da resposta
 *           - `responses`: Objeto com todas as respostas organizadas por pergunta
 *           - Escalas aparecem como números (1-10)
 *           - Múltipla escolha aparece como arrays
 *       403:
 *         description: 🚫 Você não tem permissão para ver estas respostas.
 */

/**
 * @swagger
 * /api/responses/{responseId}:
 *   get:
 *     summary: 🔍 Como ver uma resposta específica em detalhes
 *     description: |
 *       ## 👤 Resposta individual completa
 *       
 *       **O que você verá:**
 *       - 📝 Resposta completa de um participante específico
 *       - ❓ Perguntas junto com as respostas
 *       - 📅 Data e hora exatas da submissão
 *       - 🆔 Informações técnicas para suporte
 *       
 *       **Informações detalhadas:**
 *       - 👤 Nome do participante
 *       - 📋 Cada pergunta com sua respectiva resposta
 *       - 🕐 Momento exato que foi enviado
 *       - 🎯 Contexto completo da participação
 *       
 *       **Quando é útil:**
 *       - 🤔 Analisar uma resposta específica
 *       - 🆘 Ajudar participante com dúvidas
 *       - 📊 Validar dados antes da divisão
 *       - 🔍 Investigar respostas suspeitas
 *       
 *       **Proteção de privacidade:** Você só pode ver respostas dos seus próprios grupos.
 *     tags: [📊 Respostas]
 *     responses:
 *       200:
 *         description: |
 *           📄 **Aqui estão os detalhes completos desta resposta!**
 *           
 *           **Exemplo do que você receberá:**
 *           ```json
 *           {
 *             "id": "resp-001",
 *             "participantName": "Ana Maria Silva",
 *             "participantEmail": "ana.silva@email.com",
 *             "submittedAt": "2024-10-02T10:15:30Z",
 *             "classId": "grupo-123",
 *             "className": "Turma Marketing Digital 2024",
 *             "responses": {
 *               "nome": "Ana Maria Silva",
 *               "experiencia": "5 anos em marketing",
 *               "lideranca_escala": 8,
 *               "trabalho_equipe": 9,
 *               "areas_interesse": ["Marketing Digital", "Análise de Dados"],
 *               "disponibilidade": "Integral",
 *               "objetivo_curso": "Aprender estratégias avançadas de SEO"
 *             },
 *             "ipAddress": "192.168.1.100",
 *             "userAgent": "Mozilla/5.0..."
 *           }
 *           ```
 *           
 *           **Como interpretar:**
 *           - `responses`: Objeto com todas as respostas organizadas por pergunta
 *           - `submittedAt`: Data e hora exata do envio
 *           - `ipAddress`: IP de onde foi enviado (para auditoria)
 *           - `userAgent`: Informações do navegador (para suporte técnico)
 *           - Escalas aparecem como números (1-10)
 *           - Múltiplas escolhas aparecem como arrays
 *       404:
 *         description: 🔍 Resposta não encontrada ou você não tem permissão.
 */

/**
 * @swagger
 * /api/class/{code}:
 *   get:
 *     summary: 🔓 Como os participantes acessam o grupo (público)
 *     description: |
 *       ## 🎯 Acesso público para participantes
 *       
 *       **⚠️ Esta função é para os PARTICIPANTES, não para você organizador!**
 *       
 *       **Como funciona para os participantes:**
 *       - 🔢 Eles digitam o código que você forneceu
 *       - 📝 Sistema mostra informações básicas do grupo
 *       - ✅ Confirmam que é o grupo certo
 *       - 📋 Podem prosseguir para o formulário
 *       
 *       **O que os participantes veem:**
 *       - 🏷️ Nome do grupo
 *       - 👨‍🏫 Nome do organizador
 *       - 📊 Se ainda podem participar
 *       - 🎯 Instruções básicas
 *       
 *       **Como organizador, você deve:**
 *       1. 📢 Divulgar o código para os participantes
 *       2. 📝 Explicar que devem acessar via este código
 *       3. 🕐 Definir prazo para participação
 *       
 *       **Estados possíveis:**
 *       - ✅ **Ativo:** Participantes podem responder
 *       - ❌ **Inativo:** Participação suspensa
 *       - 🔒 **Lotado:** Limite de participantes atingido
 *       
 *       **Dica:** Compartilhe apenas o código, nunca o link direto da sua área administrativa!
 *     tags: [🌐 Acesso Público]
 *     responses:
 *       200:
 *         description: |
 *           📋 **Informações do grupo para o participante**
 *           
 *           **Exemplo do que o participante verá:**
 *           ```json
 *           {
 *             "id": "grupo-123",
 *             "name": "Turma Marketing Digital 2024",
 *             "code": "MKT2024", 
 *             "description": "Curso intensivo de marketing digital para profissionais",
 *             "isActive": true,
 *             "studentLimit": 30,
 *             "currentStudents": 18,
 *             "teacherName": "Prof. Maria Silva",
 *             "institution": "Instituto de Marketing",
 *             "estimatedTime": "10-15 minutos para responder",
 *             "instructions": "Responda com sinceridade para formarmos as melhores equipes!"
 *           }
 *           ```
 *           
 *           **O participante usa essas informações para:**
 *           - ✅ Confirmar que está no grupo certo
 *           - 📚 Entender do que se trata o curso/atividade
 *           - ⏱️ Saber quanto tempo vai levar para responder
 *           - 👨‍🏫 Ver quem é o professor/organizador
 *       404:
 *         description: 🔍 Código inválido ou grupo não encontrado.
 */

/**
 * @swagger
 * /api/class/{code}/questions:
 *   get:
 *     summary: 📋 Como os participantes veem o formulário (público)
 *     description: |
 *       ## 📝 Formulário para os participantes
 *       
 *       **⚠️ Esta função é usada pelos PARTICIPANTES!**
 *       
 *       **O que acontece:**
 *       - 🔢 Participante usa o código do grupo
 *       - 📋 Sistema mostra todas as perguntas
 *       - ❓ Perguntas aparecem na ordem que você definiu
 *       - ✅ Marcação clara de campos obrigatórios
 *       
 *       **Como as perguntas aparecem para eles:**
 *       - 📝 **Texto:** Caixa para escrever
 *       - ☑️ **Múltipla escolha:** Botões de rádio
 *       - ✅ **Checkbox:** Caixas de seleção
 *       - 📊 **Escala:** Números de 1 a 10
 *       - 📝 **Área de texto:** Caixa maior para respostas longas
 *       
 *       **Validações automáticas:**
 *       - ⚠️ Campos obrigatórios devem ser preenchidos
 *       - 🔢 Escalas só aceitam números válidos
 *       - 📝 Textos têm limite de caracteres
 *       
 *       **Como organizador:**
 *       - 👀 Você não precisa acessar esta função diretamente
 *       - 📊 Use esta info para entender a experiência do participante
 *       - 🎯 Ajude participantes que tiverem dúvidas
 *     tags: [🌐 Acesso Público]
 *     responses:
 *       200:
 *         description: |
 *           📋 **Formulário pronto para o participante responder**
 *           
 *           **Exemplo das perguntas que o participante verá:**
 *           ```json
 *           [
 *             {
 *               "id": 1,
 *               "question": "Qual é seu nome completo?",
 *               "type": "text",
 *               "isRequired": true,
 *               "order": 1,
 *               "placeholder": "Digite seu nome completo"
 *             },
 *             {
 *               "id": 2,
 *               "question": "Qual é seu nível de experiência?",
 *               "type": "multiple_choice",
 *               "isRequired": true,
 *               "order": 2,
 *               "options": [
 *                 "Iniciante - primeira vez na área",
 *                 "Básico - até 2 anos de experiência", 
 *                 "Intermediário - 3 a 5 anos",
 *                 "Avançado - mais de 5 anos"
 *               ]
 *             },
 *             {
 *               "id": 3,
 *               "question": "De 1 a 10, como você avalia sua capacidade de liderança?",
 *               "type": "scale",
 *               "isRequired": false,
 *               "order": 3,
 *               "min": 1,
 *               "max": 10
 *             }
 *           ]
 *           ```
 *           
 *           **Interface amigável para o participante:**
 *           - ⚠️ Campos obrigatórios claramente marcados
 *           - 🎯 Instruções claras para cada tipo de pergunta
 *           - 📱 Interface responsiva (funciona no celular)
 *           - 💾 Validação antes de enviar
 *       404:
 *         description: 🔍 Código inválido ou formulário não disponível.
 */

/**
 * @swagger
 * /api/class/{code}/submit:
 *   post:
 *     summary: 📤 Como os participantes enviam suas respostas (público)
 *     description: |
 *       ## ✅ Envio de respostas pelos participantes
 *       
 *       **⚠️ Esta função é executada pelos PARTICIPANTES!**
 *       
 *       **Processo de envio:**
 *       1. 📝 Participante preenche todo o formulário
 *       2. ✅ Sistema valida todas as respostas
 *       3. 💾 Dados são salvos permanentemente
 *       4. 🎉 Participante recebe confirmação
 *       
 *       **Validações que acontecem:**
 *       - ⚠️ Todos os campos obrigatórios preenchidos
 *       - 📝 Textos dentro do limite de caracteres
 *       - 🔢 Escalas com valores válidos
 *       - 📋 Formato correto para cada tipo de pergunta
 *       
 *       **O que acontece após o envio:**
 *       - 💾 Resposta fica salva permanentemente
 *       - 📊 Conta no total de participações
 *       - 🎯 Dados ficam disponíveis para divisão de equipes
 *       - ✅ Participante não pode responder novamente
 *       
 *       **Como organizador, você verá:**
 *       - 📈 Aumento no contador de respostas
 *       - 📋 Nova resposta na lista completa
 *       - 📊 Dados prontos para análise
 *       
 *       **Estados de erro possíveis:**
 *       - 🔒 Grupo lotado (limite atingido)
 *       - ❌ Grupo inativo
 *       - ⚠️ Dados inválidos ou incompletos
 *     tags: [🌐 Acesso Público]
 *     responses:
 *       201:
 *         description: |
 *           🎉 **Resposta enviada com sucesso! Obrigado pela participação.**
 *           
 *           **Exemplo do que o participante receberá:**
 *           ```json
 *           {
 *             "id": "resp-123",
 *             "participantName": "Carlos Alberto Silva",
 *             "className": "Turma Marketing Digital 2024",
 *             "submittedAt": "2024-10-02T16:30:00Z",
 *             "responseNumber": 19,
 *             "confirmationMessage": "Sua resposta foi registrada com sucesso!",
 *             "nextSteps": "O organizador fará a divisão de equipes em breve.",
 *             "canEdit": false,
 *             "thankYouMessage": "Obrigado por participar! Aguarde a formação das equipes."
 *           }
 *           ```
 *           
 *           **Como interpretar:**
 *           - `responseNumber`: Ele foi o 19º participante a responder
 *           - `canEdit`: False = não pode mais alterar as respostas
 *           - `nextSteps`: Informação sobre o que acontece agora
 *           - `submittedAt`: Data e hora exata do envio da resposta
 *       400:
 *         description: ❌ Dados inválidos. Verifique se preencheu tudo corretamente.
 *       403:
 *         description: 🚫 Não é possível participar (grupo inativo ou lotado).
 */

/**
 * @swagger
 * /api/classes/{classId}/group-divisions:
 *   get:
 *     summary: 👥 Como ver as divisões de equipes já criadas
 *     description: |
 *       ## 🎯 Suas divisões de equipes
 *       
 *       **O que você encontrará:**
 *       - 📋 Lista de todas as divisões já feitas para este grupo
 *       - 📅 Data de criação de cada divisão
 *       - 🎯 Nome/descrição de cada divisão
 *       - 👥 Quantas equipes foram formadas
 *       
 *       **Para cada divisão você verá:**
 *       - 🏷️ Nome da divisão (ex: "Divisão por habilidades")
 *       - 📊 Método usado (automático inteligente)
 *       - 👤 Quantas pessoas foram divididas
 *       - 🎯 Número de equipes formadas
 *       - 📅 Quando foi criada
 *       
 *       **Por que você pode ter várias divisões:**
 *       - 🔄 Testou diferentes critérios
 *       - 📊 Comparou resultados
 *       - 🎯 Ajustou para diferentes projetos
 *       - 👥 Criou grupos para atividades específicas
 *       
 *       **Dica:** Mantenha apenas as divisões que realmente usa, 
 *       delete as experimentais para manter organizado!
 *     tags: [🎯 Divisão de Equipes]
 *     responses:
 *       200:
 *         description: |
 *           📊 **Aqui estão todas as suas divisões criadas!**
 *           
 *           **Exemplo do que você receberá:**
 *           ```json
 *           [
 *             {
 *               "id": "div-001",
 *               "name": "Divisão por Habilidades - Marketing",
 *               "createdAt": "2024-10-02T14:30:00Z",
 *               "method": "smart_algorithm",
 *               "participantCount": 25,
 *               "teamCount": 5,
 *               "teamSize": 5,
 *               "status": "completed"
 *             },
 *             {
 *               "id": "div-002", 
 *               "name": "Grupos para Projeto Final",
 *               "createdAt": "2024-10-03T09:15:00Z",
 *               "method": "smart_algorithm",
 *               "participantCount": 20,
 *               "teamCount": 4,
 *               "teamSize": 5,
 *               "status": "active"
 *             }
 *           ]
 *           ```
 *           
 *           **Como interpretar:**
 *           - `method`: Sempre "smart_algorithm" (nossa IA inteligente)
 *           - `participantCount`: Quantas pessoas foram divididas
 *           - `teamCount`: Número de equipes formadas
 *           - `teamSize`: Tamanho médio das equipes
 *           - `status`: "completed", "active" ou "draft"
 *       404:
 *         description: 🔍 Grupo não encontrado ou você não tem permissão.
 *   post:
 *     summary: ✨ Como criar uma nova divisão automática de equipes
 *     description: |
 *       ## 🤖 Divisão automática inteligente
 *       
 *       **🎯 A mágica do MatchSkills!**
 *       
 *       Esta é a funcionalidade principal: nosso algoritmo inteligente 
 *       analisa todas as respostas e cria equipes balanceadas automaticamente!
 *       
 *       **Como funciona a inteligência artificial:**
 *       1. 📊 Sistema analisa todas as respostas dos participantes
 *       2. 🧠 Identifica padrões e complementaridades
 *       3. ⚖️ Cria equipes balanceadas e diversas
 *       4. 👥 Garante que cada equipe tenha mix de habilidades
 *       
 *       **Fatores considerados pelo algoritmo:**
 *       - 📊 Respostas de escala (notas 1-10)
 *       - 🎯 Preferências declaradas
 *       - 💡 Habilidades complementares
 *       - ⚖️ Balanceamento de perfis
 *       
 *       **Configurações que você define:**
 *       - 🏷️ Nome da divisão (para organizar)
 *       - 👥 Número de equipes desejado
 *       - 🎯 Critério principal (automático)
 *       
 *       **Vantagens da divisão automática:**
 *       - ⚡ Rápida e eficiente
 *       - 🧠 Considera fatores que humanos não percebem
 *       - ⚖️ Elimina vieses pessoais
 *       - 📊 Baseada em dados reais
 *       
 *       **Dica Pro:** Aguarde pelo menos 10-15 respostas para ter 
 *       uma divisão mais rica e balanceada!
 *     tags: [🎯 Divisão de Equipes]
 *     responses:
 *       201:
 *         description: |
 *           🎉 **Equipes formadas com sucesso! Veja o resultado.**
 *           
 *           **Exemplo do que você receberá:**
 *           ```json
 *           {
 *             "divisionId": "div-123",
 *             "name": "Divisão por Habilidades Complementares",
 *             "createdAt": "2024-10-02T16:45:00Z",
 *             "participantsProcessed": 25,
 *             "teamsCreated": 5,
 *             "averageTeamSize": 5,
 *             "balanceScore": 92,
 *             "processingTime": "2.3 segundos",
 *             "algorithm": "smart_algorithm_v2",
 *             "status": "completed",
 *             "summary": "25 participantes divididos em 5 equipes balanceadas com excelente complementaridade de habilidades"
 *           }
 *           ```
 *           
 *           **Como interpretar:**
 *           - `balanceScore`: Nota de 0-100 da qualidade do balanceamento
 *           - `processingTime`: Tempo que levou para processar
 *           - `algorithm`: Versão do algoritmo inteligente usado
 *           - `summary`: Resumo do que foi realizado
 *           - Agora você pode ver as equipes formadas no endpoint específico
 *       400:
 *         description: ❌ Verifique se há respostas suficientes para dividir.
 *   delete:
 *     summary: 🗑️ Como apagar todas as divisões de uma vez
 *     description: |
 *       ## 🧹 Limpeza geral das divisões
 *       
 *       **⚠️ CUIDADO: Remove TODAS as divisões do grupo!**
 *       
 *       **O que será apagado:**
 *       - 📋 Todas as divisões já criadas
 *       - 👥 Todas as equipes formadas
 *       - 📊 Histórico de divisões anteriores
 *       
 *       **⚠️ O que NÃO é apagado:**
 *       - 📝 Respostas dos participantes (ficam seguras)
 *       - 🎯 Configurações do grupo
 *       - ❓ Perguntas do formulário
 *       
 *       **Quando usar:**
 *       - 🔄 Quer recomeçar do zero
 *       - 🧹 Limpeza de testes experimentais
 *       - 📊 Mudou completamente os critérios
 *       
 *       **Alternativa mais segura:**
 *       Delete divisões individualmente ao invés de todas de uma vez.
 *       
 *       **Depois da limpeza:**
 *       - ✨ Pode criar novas divisões
 *       - 📊 Dados dos participantes continuam disponíveis
 *       - 🎯 Processo volta ao estado inicial
 *     tags: [🎯 Divisão de Equipes]
 *     responses:
 *       200:
 *         description: |
 *           🗑️ **Todas as divisões foram removidas.**
 *           
 *           **Exemplo do que você receberá:**
 *           ```json
 *           {
 *             "classId": "grupo-123",
 *             "className": "Turma Marketing Digital 2024",
 *             "deletedAt": "2024-10-02T17:15:00Z",
 *             "deletedBy": "prof-456",
 *             "divisionsRemoved": 4,
 *             "teamsRemoved": 20,
 *             "detailedRemoval": [
 *               {
 *                 "divisionId": "div-001",
 *                 "divisionName": "Por Habilidades",
 *                 "teamsInDivision": 5
 *               },
 *               {
 *                 "divisionId": "div-002", 
 *                 "divisionName": "Por Experiência",
 *                 "teamsInDivision": 5
 *               }
 *             ],
 *             "responsesPreserved": true,
 *             "groupConfigPreserved": true,
 *             "nextAction": "Você pode criar novas divisões quando quiser"
 *           }
 *           ```
 *           
 *           **Como interpretar:**
 *           - `divisionsRemoved`: Total de divisões que foram apagadas
 *           - `teamsRemoved`: Total de equipes que foram removidas
 *           - `responsesPreserved`: True = respostas dos participantes continuam seguras
 *           - `detailedRemoval`: Lista detalhada do que foi removido
 *           - Grupo continua ativo, apenas as divisões foram limpas
 *       404:
 *         description: 🔍 Grupo não encontrado ou você não tem permissão.
 */

/**
 * @swagger
 * /api/classes/{classId}/group-divisions/{divisionId}:
 *   put:
 *     summary: ✏️ Como editar uma divisão específica
 *     description: |
 *       ## 🔧 Ajustando uma divisão existente
 *       
 *       **O que você pode alterar:**
 *       - 🏷️ Nome/descrição da divisão
 *       - 📝 Notas ou comentários sobre a divisão
 *       - 🎯 Configurações específicas
 *       
 *       **⚠️ O que você NÃO pode alterar:**
 *       - 👥 Composição das equipes (isso requer nova divisão)
 *       - 📊 Método de divisão usado
 *       - 👤 Participantes incluídos
 *       
 *       **Para que serve:**
 *       - 📝 Dar nomes mais descritivos
 *       - 🎯 Adicionar contexto sobre quando usar cada divisão
 *       - 📋 Organizar melhor suas divisões
 *       
 *       **Exemplo de uso:**
 *       - Alterar nome de "Divisão 1" para "Equipes por Habilidade Técnica"
 *       - Adicionar nota: "Usar para projetos de programação"
 *       
 *       **Dica:** Use nomes descritivos para lembrar depois qual 
 *       critério foi usado em cada divisão!
 *     tags: [🎯 Divisão de Equipes]
 *     responses:
 *       200:
 *         description: |
 *           ✅ **Divisão atualizada com sucesso!**
 *           
 *           **Exemplo do que você receberá:**
 *           ```json
 *           {
 *             "id": "div-001",
 *             "name": "Equipes por Habilidade Técnica - Atualizada",
 *             "description": "Divisão focada em balancear habilidades técnicas para projetos de programação",
 *             "updatedAt": "2024-10-02T15:45:00Z",
 *             "method": "smart_algorithm",
 *             "participantCount": 25,
 *             "teamCount": 5,
 *             "teamSize": 5,
 *             "status": "active",
 *             "lastModifiedBy": "prof-456"
 *           }
 *           ```
 *           
 *           **Como interpretar:**
 *           - `updatedAt`: Data e hora da última atualização
 *           - `description`: Nova descrição que você adicionou
 *           - `status`: Estado atual da divisão
 *           - `lastModifiedBy`: ID do usuário que fez a última alteração
 *       404:
 *         description: 🔍 Divisão não encontrada ou você não tem permissão.
 *   delete:
 *     summary: 🗑️ Como apagar uma divisão específica
 *     description: |
 *       ## 🎯 Removendo uma divisão individual
 *       
 *       **O que será removido:**
 *       - 📋 A divisão específica escolhida
 *       - 👥 Todas as equipes desta divisão
 *       - 📊 Dados específicos desta divisão
 *       
 *       **⚠️ O que permanece:**
 *       - 📝 Respostas dos participantes
 *       - 🎯 Outras divisões que você criou
 *       - 📋 Configurações do grupo
 *       
 *       **Quando usar:**
 *       - 🧪 Remover divisões experimentais
 *       - 🗑️ Limpar divisões que não ficaram boas
 *       - 📊 Manter apenas as divisões que realmente usa
 *       
 *       **Vantagem sobre limpeza geral:**
 *       - 🎯 Remove apenas o que não quer
 *       - 💾 Preserva divisões que funcionaram bem
 *       - 📊 Mantém organização
 *       
 *       **Após remoção:**
 *       - ✨ Pode criar nova divisão no lugar
 *       - 📋 Outras divisões continuam funcionando
 *       - 🎯 Processo fica mais organizado
 *     tags: [🎯 Divisão de Equipes]
 *     responses:
 *       200:
 *         description: |
 *           🗑️ **Divisão removida com sucesso.**
 *           
 *           **Exemplo do que você receberá:**
 *           ```json
 *           {
 *             "deletedDivisionId": "div-001",
 *             "deletedDivisionName": "Equipes por Habilidade Técnica",
 *             "classId": "grupo-123",
 *             "deletedAt": "2024-10-02T17:30:00Z",
 *             "deletedBy": "prof-456",
 *             "teamsRemoved": 5,
 *             "participantsAffected": 25,
 *             "remainingDivisions": 2,
 *             "otherDivisionsPreserved": [
 *               {
 *                 "id": "div-002",
 *                 "name": "Por Experiência Profissional"
 *               },
 *               {
 *                 "id": "div-003", 
 *                 "name": "Grupos Mistos"
 *               }
 *             ],
 *             "dataPreserved": {
 *               "responses": true,
 *               "groupConfig": true,
 *               "otherDivisions": true
 *             }
 *           }
 *           ```
 *           
 *           **Como interpretar:**
 *           - `teamsRemoved`: Quantas equipes foram removidas desta divisão
 *           - `remainingDivisions`: Quantas outras divisões você ainda tem
 *           - `otherDivisionsPreserved`: Lista das divisões que continuam ativas
 *           - `dataPreserved`: Confirmação de que outros dados estão seguros
 *           - Apenas esta divisão específica foi removida
 *       404:
 *         description: 🔍 Divisão não encontrada ou você não tem permissão.
 */

/**
 * @swagger
 * /api/classes/{classId}/group-divisions/{divisionId}/groups:
 *   get:
 *     summary: 👥 Como ver as equipes formadas em uma divisão
 *     description: |
 *       ## 🎯 Resultado final: suas equipes!
 *       
 *       **🏆 Este é o momento que você esperava!**
 *       
 *       Aqui você vê o resultado da divisão automática: 
 *       quem ficou em cada equipe e por quê!
 *       
 *       **O que você encontrará:**
 *       - 👥 Lista completa de todas as equipes
 *       - 👤 Nome de cada participante em cada equipe
 *       - 📊 Balanceamento de habilidades por equipe
 *       - 🎯 Resumo de características de cada grupo
 *       
 *       **Informações de cada equipe:**
 *       - 🏷️ Nome/número da equipe
 *       - 👤 Lista completa de membros
 *       - 📊 Perfil geral da equipe
 *       - ⚖️ Balanceamento de habilidades
 *       
 *       **Como usar estas informações:**
 *       - 📢 Divulgar equipes para os participantes
 *       - 🎯 Entender o perfil de cada grupo
 *       - 📊 Verificar se o balanceamento ficou bom
 *       - 📋 Planejar atividades específicas para cada equipe
 *       
 *       **Dicas para usar os resultados:**
 *       - 📞 Crie grupos no WhatsApp/Telegram
 *       - 📧 Envie email com a composição das equipes
 *       - 🎯 Adapte atividades ao perfil de cada equipe
 *       - 📊 Use dados para coaching diferenciado
 *       
 *       **Se não ficou satisfeito:**
 *       - 🔄 Pode criar nova divisão com critérios diferentes
 *       - 📊 Analise se precisa de mais respostas
 *       - 🎯 Ajuste o número de equipes
 *     tags: [🎯 Divisão de Equipes]
 *     responses:
 *       200:
 *         description: |
 *           🎉 **Aqui estão suas equipes formadas!**
 *           
 *           **Exemplo do que você receberá:**
 *           ```json
 *           [
 *             {
 *               "groupId": "grupo-1", 
 *               "groupName": "Equipe Alpha",
 *               "members": [
 *                 {
 *                   "name": "João Silva",
 *                   "skills": ["Liderança: 8", "Técnico: 6"],
 *                   "responses": {...}
 *                 },
 *                 {
 *                   "name": "Maria Santos",
 *                   "skills": ["Criatividade: 9", "Comunicação: 8"], 
 *                   "responses": {...}
 *                 }
 *               ],
 *               "balanceScore": 85,
 *               "teamProfile": "Equipe equilibrada com forte liderança e criatividade"
 *             }
 *           ]
 *           ```
 *           
 *           **Como interpretar:**
 *           - `groupName`: Nome automático da equipe
 *           - `members`: Lista de participantes da equipe
 *           - `balanceScore`: Nota de 0-100 do balanceamento  
 *           - `teamProfile`: Resumo das características da equipe
 *       404:
 *         description: 🔍 Divisão não encontrada ou você não tem permissão.
 */