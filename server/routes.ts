import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth } from "./auth";
import { insertClassSchema, insertFormQuestionSchema, insertFormResponseSchema } from "@shared/schema";
import { parseAndValidateAIResponse, validateCompleteDivision, formatValidationReport } from "@shared/ai-validation";
import { z } from "zod";

export function registerRoutes(app: Express): Server {
  // Auth middleware
  setupAuth(app);

  // Middleware de log para debug
  app.use((req, res, next) => {
    if (req.path.includes('notify-groups')) {
      console.log(`🔍 DEBUG: ${req.method} ${req.path} - Headers:`, req.headers);
    }
    next();
  });

  // Teacher routes
    /**
     * GET /api/classes
     * Retorna todas as turmas do professor autenticado
     */
    app.get('/api/classes', requireAuth, async (req: any, res) => {
    try {
      const teacherId = req.user.id;
      const classes = await storage.getTeacherClasses(teacherId);
      res.json(classes);
    } catch (error) {
      console.error("Error fetching classes:", error);
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });

  /**
   * GET /api/classes/response-counts
   * Retorna a contagem de respostas por turma do professor
   */
  app.get('/api/classes/response-counts', requireAuth, async (req: any, res) => {
    try {
      const teacherId = req.user.id;
      const counts = await storage.getResponseCountsByTeacher(teacherId);
      res.json(counts);
    } catch (error) {
      console.error("Error fetching response counts:", error);
      res.status(500).json({ message: "Failed to fetch response counts" });
    }
  });

  /**
   * GET /api/recent-responses
   * Retorna as respostas mais recentes do professor
   */
  app.get('/api/recent-responses', requireAuth, async (req: any, res) => {
    try {
      const teacherId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 10;
      const responses = await storage.getRecentResponsesByTeacher(teacherId, limit);
      res.json(responses);
    } catch (error) {
      console.error("Error fetching recent responses:", error);
      res.status(500).json({ message: "Failed to fetch recent responses" });
    }
  });

  /**
   * GET /api/group-stats
   * Retorna estatísticas sobre grupos criados pelo professor
   */
  app.get('/api/group-stats', requireAuth, async (req: any, res) => {
    try {
      const teacherId = req.user.id;
      const stats = await storage.getGroupStatsByTeacher(teacherId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching group stats:", error);
      res.status(500).json({ message: "Failed to fetch group stats" });
    }
  });

  /**
   * POST /api/classes
   * Cria uma nova turma e suas perguntas associadas
   * Espera classData e questions no corpo da requisição
   */
  app.post('/api/classes', requireAuth, async (req: any, res) => {
    try {
      const teacherId = req.user.id;
      const classData = insertClassSchema.parse(req.body.classData);
      const questions = z.array(insertFormQuestionSchema).parse(req.body.questions);

      const newClass = await storage.createClass(teacherId, classData);
      
      if (questions.length > 0) {
        await storage.createFormQuestions(newClass.id, questions);
      }

      res.json(newClass);
    } catch (error) {
      console.error("Error creating class:", error);
      res.status(500).json({ message: "Failed to create class" });
    }
  });

  /**
   * PUT /api/classes/:classId
   * Atualiza dados completos ou parciais de uma turma
   * Verifica se o professor é dono da turma
   */
  app.put('/api/classes/:classId', requireAuth, async (req: any, res) => {
    try {
      const { classId } = req.params;
      const teacherId = req.user.id;
      
      // Verify ownership
      const existingClass = await storage.getClassById(classId);
      if (!existingClass || existingClass.teacherId !== teacherId) {
        return res.status(404).json({ message: "Class not found or access denied" });
      }

      // Check if this is a full update (has classData and questions) or partial update
      if (req.body.classData && req.body.questions) {
        // Full update from create-class page
        const classData = insertClassSchema.parse(req.body.classData);
        const questions = z.array(insertFormQuestionSchema).parse(req.body.questions);
        
        // Update class
        const updatedClass = await storage.updateClass(classId, classData);
        
        // Update questions
        await storage.updateFormQuestions(classId, questions);

        res.json(updatedClass);
      } else {
        // Partial update (name, isActive, etc.)
        const allowedFields = ['name', 'isActive', 'studentLimit', 'groupCount'];
        const updateData: Partial<any> = {};
        
        for (const field of allowedFields) {
          if (req.body[field] !== undefined) {
            updateData[field] = req.body[field];
          }
        }

        if (Object.keys(updateData).length === 0) {
          return res.status(400).json({ message: "No valid fields to update" });
        }

        // Update class with partial data
        const updatedClass = await storage.updateClass(classId, updateData);
        res.json(updatedClass);
      }
    } catch (error) {
      console.error("Error updating class:", error);
      res.status(500).json({ message: "Failed to update class" });
    }
  });

  /**
   * GET /api/classes/:classId
   * Retorna dados de uma turma específica do professor
   */
  app.get('/api/classes/:classId', requireAuth, async (req: any, res) => {
    try {
      const { classId } = req.params;
      const teacherId = req.user.id;
      
      const classData = await storage.getClassById(classId);
      if (!classData || classData.teacherId !== teacherId) {
        return res.status(404).json({ message: "Class not found or access denied" });
      }

      res.json(classData);
    } catch (error) {
      console.error("Error fetching class:", error);
      res.status(500).json({ message: "Failed to fetch class" });
    }
  });

  /**
   * GET /api/classes/:classId/questions
   * Retorna as perguntas do formulário de uma turma específica
   */
  app.get('/api/classes/:classId/questions', requireAuth, async (req: any, res) => {
    try {
      const { classId } = req.params;
      const teacherId = req.user.id;
      
      // Verify teacher owns this class
      const classData = await storage.getClassById(classId);
      if (!classData || classData.teacherId !== teacherId) {
        return res.status(404).json({ message: "Class not found or access denied" });
      }

      const questions = await storage.getFormQuestions(classId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  /**
   * GET /api/classes/:classId/responses
   * Retorna todas as respostas dos alunos para uma turma com mapeamento de perguntas
   */
  app.get('/api/classes/:classId/responses', requireAuth, async (req: any, res) => {
    try {
      const { classId } = req.params;
      const teacherId = req.user.id;
      
      // Verify teacher owns this class
      const classData = await storage.getClassById(classId);
      if (!classData || classData.teacherId !== teacherId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Buscar respostas
      const responses = await storage.getClassResponses(classId);
      
      // Log para debug
      if (responses.length > 0) {
        const firstResponse = responses[0];
        console.log("📥 Primeira resposta do banco:", {
          studentName: firstResponse.studentName,
          responsesKeys: Object.keys(firstResponse.responses || {}).slice(0, 3),
          responsesValues: Object.values(firstResponse.responses || {}).slice(0, 3)
        });
      }
      
      // As respostas já estão com os IDs corretos de form_questions
      // (foram salvas dessa forma no submitFormResponse)
      res.json(responses);
    } catch (error) {
      console.error("Error fetching responses:", error);
      res.status(500).json({ message: "Failed to fetch responses" });
    }
  });

  /**
   * GET /api/responses/:responseId
   * Retorna uma resposta específica, junto com as perguntas do formulário
   */
  app.get('/api/responses/:responseId', requireAuth, async (req: any, res) => {
    try {
      const { responseId } = req.params;
      const teacherId = req.user.id;
      
      const response = await storage.getResponseById(responseId);
      if (!response) {
        return res.status(404).json({ message: "Response not found" });
      }

      // Verify teacher owns the class this response belongs to
      const classData = await storage.getClassById(response.classId);
      if (!classData || classData.teacherId !== teacherId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get the questions to provide context
      const questions = await storage.getFormQuestions(response.classId);
      
      res.json({
        ...response,
        questions
      });
    } catch (error) {
      console.error("Error fetching response:", error);
      res.status(500).json({ message: "Failed to fetch response" });
    }
  });

  /**
   * PATCH /api/classes/:classId/status
   * Atualiza o status (ativa/inativa) de uma turma
   */
  app.patch('/api/classes/:classId/status', requireAuth, async (req: any, res) => {
    try {
      const { classId } = req.params;
      const { isActive } = req.body;
      const teacherId = req.user.id;
      
      // Verify teacher owns this class
      const classData = await storage.getClassById(classId);
      if (!classData || classData.teacherId !== teacherId) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.updateClassStatus(classId, isActive);
      res.json({ message: "Class status updated" });
    } catch (error) {
      console.error("Error updating class status:", error);
      res.status(500).json({ message: "Failed to update class status" });
    }
  });

  /**
   * PATCH /api/classes/:classId/color
   * Atualiza a cor da turma (índice de cor)
   */
  app.patch('/api/classes/:classId/color', requireAuth, async (req: any, res) => {
    try {
      const { classId } = req.params;
      const { colorIndex } = req.body;
      const teacherId = req.user.id;
      
      // Verify teacher owns this class
      const classData = await storage.getClassById(classId);
      if (!classData || classData.teacherId !== teacherId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Validate colorIndex
      if (typeof colorIndex !== 'number' || colorIndex < 0 || colorIndex > 5) {
        return res.status(400).json({ message: "Invalid color index. Must be between 0 and 5." });
      }

      const updatedClass = await storage.updateClassColor(classId, colorIndex);
      res.json(updatedClass);
    } catch (error) {
      console.error("Error updating class color:", error);
      res.status(500).json({ message: "Failed to update class color" });
    }
  });

  // ==================== ROTAS PÚBLICAS (Aluno) ====================
  // Não exigem autenticação

  /**
   * GET /api/class/:code
   * Retorna dados da turma pelo código público
   * Só retorna se a turma estiver ativa
   */
  app.get('/api/class/:code', async (req, res) => {
    try {
      const { code } = req.params;
      const classData = await storage.getClassByCode(code);
      
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }

      if (!classData.isActive) {
        return res.status(400).json({ message: "This class is currently closed" });
      }

      res.json(classData);
    } catch (error) {
      console.error("Error fetching class:", error);
      res.status(500).json({ message: "Failed to fetch class" });
    }
  });

  /**
   * GET /api/class/:code/questions
   * Retorna perguntas do formulário da turma pelo código público
   */
  app.get('/api/class/:code/questions', async (req, res) => {
    try {
      const { code } = req.params;
      const classData = await storage.getClassByCode(code);
      
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }

      if (!classData.isActive) {
        return res.status(400).json({ message: "This class is currently closed" });
      }

      const questions = await storage.getFormQuestions(classData.id);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  /**
   * GET /api/class/:code/response-count
   * Retorna a contagem de respostas para uma turma pelo código público
   */
  app.get('/api/class/:code/response-count', async (req, res) => {
    try {
      console.log("📊 GET /api/class/:code/response-count");
      const { code } = req.params;
      console.log("Code:", code);
      
      const classData = await storage.getClassByCode(code);
      console.log("Class data encontrada:", !!classData);
      
      if (!classData) {
        console.log("❌ Class não encontrada");
        return res.status(404).json({ message: "Class not found" });
      }

      console.log("Buscando respostas para classId:", classData.id);
      const responses = await storage.getClassResponses(classData.id);
      console.log("✅ Respostas encontradas:", responses.length);
      
      res.json({ count: responses.length });
    } catch (error) {
      console.error("❌ Erro em /api/class/:code/response-count:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({ 
        message: "Failed to fetch response count",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  /**
   * POST /api/class/:code/submit
   * Submete respostas do aluno para a turma
   * Espera dados do aluno e respostas no corpo
   */
  app.post('/api/class/:code/submit', async (req, res) => {
    try {
      console.log("📨 Requisição POST recebida em /api/class/:code/submit");
      console.log("Body type:", typeof req.body);
      console.log("Body:", JSON.stringify(req.body, null, 2));
      console.log("Responses type:", typeof req.body.responses);
      console.log("Responses value:", req.body.responses);
      
      const { code } = req.params;
      const classData = await storage.getClassByCode(code);
      
      if (!classData) {
        console.log("❌ Classe não encontrada com código:", code);
        return res.status(404).json({ message: "Class not found" });
      }

      if (!classData.isActive) {
        console.log("❌ Classe inativa:", classData.id);
        return res.status(400).json({ message: "This class is currently closed" });
      }

      // Check if class has reached the student limit
      const responses = await storage.getClassResponses(classData.id);
      if (responses.length >= classData.studentLimit) {
        console.log("❌ Limite de respostas atingido para classe:", classData.id);
        return res.status(400).json({ 
          message: "Esta turma atingiu o limite máximo de respostas." 
        });
      }

      const responsesObj = req.body.responses || {};
      
      // Tentar converter se for string
      let responsesData = responsesObj;
      if (typeof responsesObj === 'string') {
        console.log("⚠️ Responses é string, convertendo para objeto...");
        responsesData = JSON.parse(responsesObj);
      }
      
      const responsesEntries = Object.entries(responsesData).slice(0, 3);
      
      console.log("📝 Dados recebidos do formulário:", {
        studentName: req.body.studentName,
        studentEmail: req.body.studentEmail,
        totalRespostas: Object.keys(responsesData).length,
        primeirasTresRespostas: responsesEntries.map(([key, val]) => ({ key, val: String(val).substring(0, 50) }))
      });

      // Log antes da validação
      console.log("🔍 Tentando validar com schema:", {
        hasStudentName: !!req.body.studentName,
        hasResponses: !!responsesData,
        responsesType: typeof responsesData,
        responsesIsObject: responsesData && typeof responsesData === 'object',
        responsesKeys: Object.keys(responsesData)
      });

      const dataToValidate = {
        studentName: req.body.studentName,
        studentEmail: req.body.studentEmail || null,
        responses: responsesData,
        classId: classData.id,
      };

      console.log("🔐 Dados para validação:", JSON.stringify(dataToValidate, null, 2));

      const responseData = insertFormResponseSchema.parse(dataToValidate);

      console.log("✅ Validação passou! Dados:", {
        classId: responseData.classId,
        studentName: responseData.studentName,
        studentEmail: responseData.studentEmail,
        responsesKeys: Object.keys((responseData.responses as any) || {})
      });

      const response = await storage.submitFormResponse(responseData);
      
      console.log("💾 Resposta salva com sucesso:", {
        id: response[0]?.id,
        classId: response[0]?.classId,
        studentName: response[0]?.studentName
      });
      
      res.json(response);
    } catch (error) {
      console.error("❌ Erro completo ao submeter resposta:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        cause: error instanceof Error && 'cause' in error ? (error as any).cause : undefined
      });
      res.status(500).json({ 
        message: "Failed to submit response",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  /**
   * DELETE /api/classes/:classId
   * Exclui uma turma e todos os dados associados
   * Apenas o professor dono pode excluir
   */
  app.delete('/api/classes/:classId', requireAuth, async (req: any, res) => {
    try {
      const { classId } = req.params;
      const teacherId = req.user.id;
      
      // Verify ownership
      const existingClass = await storage.getClassById(classId);
      if (!existingClass || existingClass.teacherId !== teacherId) {
        return res.status(404).json({ message: "Class not found or access denied" });
      }

      // Delete class and all associated data
      await storage.deleteClass(classId);
      
      res.json({ message: "Class deleted successfully" });
    } catch (error) {
      console.error("Error deleting class:", error);
      res.status(500).json({ message: "Failed to delete class" });
    }
  });

  // Group Division Routes
  
  /**
   * GET /api/classes/:classId/group-divisions
   * Retorna todas as divisões de grupos de uma turma
   */
  app.get('/api/classes/:classId/group-divisions', requireAuth, async (req: any, res) => {
    try {
      const { classId } = req.params;
      const teacherId = req.user.id;
      
      // Verify ownership
      const existingClass = await storage.getClassById(classId);
      if (!existingClass || existingClass.teacherId !== teacherId) {
        return res.status(404).json({ message: "Class not found or access denied" });
      }

      const divisions = await storage.getGroupDivisions(classId);
      res.json(divisions);
    } catch (error) {
      console.error("Error fetching group divisions:", error);
      res.status(500).json({ message: "Failed to fetch group divisions" });
    }
  });

  /**
   * POST /api/validate-ai-response
   * Valida a resposta do agente de IA antes de salvar os grupos
   */
  app.post('/api/validate-ai-response', requireAuth, async (req: any, res) => {
    try {
      const { aiResponse, availableStudents } = req.body;

      console.log("🔍 Validando resposta da IA...");
      console.log(`   Estudantes disponíveis: ${availableStudents.length}`);

      // Etapa 1: Parse e validação da estrutura
      let validatedResponse;
      try {
        validatedResponse = parseAndValidateAIResponse(aiResponse);
        console.log("✅ Resposta parseada com sucesso");
      } catch (parseError) {
        console.error("❌ Erro ao parsear resposta:", parseError);
        return res.status(400).json({
          valid: false,
          error: parseError instanceof Error ? parseError.message : "Erro ao parsear resposta",
          type: "parse_error"
        });
      }

      // Etapa 2: Validação de integridade com estudantes disponíveis
      const divisionValidation = validateCompleteDivision(validatedResponse, availableStudents);

      if (!divisionValidation.isValid) {
        console.error("❌ Validação falhou:", divisionValidation.globalErrors);
        return res.status(400).json({
          valid: false,
          error: divisionValidation.globalErrors.join("; "),
          type: "integrity_error",
          details: divisionValidation,
          report: formatValidationReport(divisionValidation)
        });
      }

      console.log("✅ Validação passou:");
      console.log(formatValidationReport(divisionValidation));

      // Retornar resposta validada com relatório
      res.json({
        valid: true,
        message: "Resposta validada com sucesso",
        data: validatedResponse,
        report: formatValidationReport(divisionValidation),
        summary: divisionValidation.summary
      });

    } catch (error) {
      console.error("Erro ao validar resposta da IA:", error);
      res.status(500).json({
        valid: false,
        error: "Erro interno ao validar resposta",
        type: "server_error"
      });
    }
  });

  /**
   * POST /api/classes/:classId/group-divisions
   * Cria uma nova divisão de grupos
   */
  app.post('/api/classes/:classId/group-divisions', requireAuth, async (req: any, res) => {
    try {
      const { classId } = req.params;
      const teacherId = req.user.id;
      const { name, membersPerGroup, prompt, groups } = req.body;
      
      // Verify ownership
      const existingClass = await storage.getClassById(classId);
      if (!existingClass || existingClass.teacherId !== teacherId) {
        return res.status(404).json({ message: "Class not found or access denied" });
      }

      // Converter formato da resposta do agente: students → members
      const formattedGroups = groups.map((group: any) => ({
        groupNumber: group.groupNumber,
        leaderId: group.leaderId,
        members: group.students || group.members || [] // Suportar ambos os formatos
      }));

      const division = await storage.createGroupDivision({
        classId,
        name,
        membersPerGroup,
        prompt,
        groups: formattedGroups
      });
      
      res.json(division);
    } catch (error) {
      console.error("Error creating group division:", error);
      res.status(500).json({ message: "Failed to create group division" });
    }
  });

  /**
   * PUT /api/classes/:classId/group-divisions/:divisionId
   * Atualiza uma divisão de grupos existente
   */
  app.put('/api/classes/:classId/group-divisions/:divisionId', requireAuth, async (req: any, res) => {
    try {
      const { classId, divisionId } = req.params;
      const { name, membersPerGroup, prompt, groups } = req.body;
      const teacherId = req.user.id;
      
      console.log('🔄 Updating group division:', divisionId, 'in class:', classId);
      
      // Verify ownership
      const existingClass = await storage.getClassById(classId);
      if (!existingClass || existingClass.teacherId !== teacherId) {
        return res.status(404).json({ message: "Class not found or access denied" });
      }

      // Converter formato da resposta do agente: students → members
      const formattedGroups = groups.map((group: any) => ({
        groupNumber: group.groupNumber,
        leaderId: group.leaderId,
        members: group.students || group.members || [] // Suportar ambos os formatos
      }));

      // Update the division
      await storage.updateGroupDivision(divisionId, {
        name,
        membersPerGroup,
        prompt,
        groups: formattedGroups
      });

      console.log('✅ Group division updated successfully');
      res.json({ id: divisionId, message: "Group division updated successfully" });
    } catch (error) {
      console.error("Error updating group division:", error);
      res.status(500).json({ message: "Failed to update group division" });
    }
  });

  /**
   * GET /api/classes/:classId/group-divisions/:divisionId/groups
   * Retorna os grupos de uma divisão específica
   */
  app.get('/api/classes/:classId/group-divisions/:divisionId/groups', requireAuth, async (req: any, res) => {
    try {
      const { classId, divisionId } = req.params;
      const teacherId = req.user.id;
      
      console.log('🔍 Loading groups for division:', divisionId, 'in class:', classId);
      
      // Verify ownership
      const existingClass = await storage.getClassById(classId);
      if (!existingClass || existingClass.teacherId !== teacherId) {
        console.log('❌ Access denied for class:', classId);
        return res.status(404).json({ message: "Class not found or access denied" });
      }

      const groups = await storage.getGroupMembers(divisionId);
      console.log('✅ Groups loaded successfully:', groups.length, 'groups found');
      res.json(groups);
    } catch (error) {
      console.error("Error fetching group members:", error);
      res.status(500).json({ message: "Failed to fetch group members" });
    }
  });

  /**
   * DELETE /api/classes/:classId/group-divisions
   * Exclui todas as divisões de grupos de uma classe
   */
  app.delete('/api/classes/:classId/group-divisions', requireAuth, async (req: any, res) => {
    try {
      const { classId } = req.params;
      const teacherId = req.user.id;
      
      // Verify ownership
      const existingClass = await storage.getClassById(classId);
      if (!existingClass || existingClass.teacherId !== teacherId) {
        return res.status(404).json({ message: "Class not found or access denied" });
      }

      await storage.deleteAllGroupDivisionsByClass(classId);
      res.json({ message: "All group divisions deleted successfully" });
    } catch (error) {
      console.error("Error deleting all group divisions:", error);
      res.status(500).json({ message: "Failed to delete all group divisions" });
    }
  });

  /**
   * DELETE /api/classes/:classId/group-divisions/:divisionId
   * Exclui uma divisão de grupos
   */
  app.delete('/api/classes/:classId/group-divisions/:divisionId', requireAuth, async (req: any, res) => {
    try {
      const { classId, divisionId } = req.params;
      const teacherId = req.user.id;
      
      // Verify ownership
      const existingClass = await storage.getClassById(classId);
      if (!existingClass || existingClass.teacherId !== teacherId) {
        return res.status(404).json({ message: "Class not found or access denied" });
      }

      await storage.deleteGroupDivision(divisionId);
      res.json({ message: "Group division deleted successfully" });
    } catch (error) {
      console.error("Error deleting group division:", error);
      res.status(500).json({ message: "Failed to delete group division" });
    }
  });

  /**
   * GET /api/analytics/:classId
   * Retorna análises detalhadas de um formulário
   */
  app.get('/api/analytics/:classId', requireAuth, async (req: any, res) => {
    try {
      const { classId } = req.params;
      const teacherId = req.user.id;
      
      // Verify ownership
      const classInfo = await storage.getClassById(classId);
      if (!classInfo || classInfo.teacherId !== teacherId) {
        return res.status(404).json({ message: "Class not found or access denied" });
      }

      // Get questions and responses
      const questions = await storage.getFormQuestions(classId);
      const responses = await storage.getClassResponses(classId);

      // Calculate analytics for each question
      const questionAnalytics = questions.map(question => {
        const questionResponses = responses
          .map((r: any) => {
            try {
              const responseData = typeof r.responses === 'string' 
                ? JSON.parse(r.responses) 
                : r.responses;
              return responseData[question.id];
            } catch {
              return null;
            }
          })
          .filter(Boolean);

        // Count response distribution
        const distribution: Record<string, number> = {};
        let sum = 0;
        let count = 0;

        questionResponses.forEach((response: any) => {
          if (Array.isArray(response)) {
            // For checkbox questions
            response.forEach(item => {
              distribution[item] = (distribution[item] || 0) + 1;
            });
          } else if (response !== null && response !== undefined) {
            const responseStr = String(response);
            distribution[responseStr] = (distribution[responseStr] || 0) + 1;
            
            // Calculate average for scale questions
            if (question.type === 'scale') {
              const numValue = Number(response);
              if (!isNaN(numValue)) {
                sum += numValue;
                count++;
              }
            }
          }
        });

        const analytics: any = {
          questionId: question.id,
          question: question.question,
          type: question.type,
          totalResponses: questionResponses.length,
          responseDistribution: distribution,
        };

        if (question.type === 'scale' && count > 0) {
          analytics.averageValue = sum / count;
        }

        return analytics;
      });

      const totalResponses = responses.length;
      const completionRate = classInfo.studentLimit 
        ? (totalResponses / classInfo.studentLimit) * 100 
        : 0;

      const analytics = {
        classInfo,
        totalResponses,
        questions,
        questionAnalytics,
        completionRate,
        lastResponseDate: responses.length > 0 
          ? responses[responses.length - 1].submittedAt 
          : null,
        // Adiciona respostas individuais de cada participante
        individualResponses: responses.map((response: any) => {
          const responseData = typeof response.responses === 'string' 
            ? JSON.parse(response.responses) 
            : response.responses;
          return {
            participantId: response.studentId,
            participantName: response.studentName || 'Participante Desconhecido',
            submittedAt: response.submittedAt,
            responses: responseData,
          };
        }),
      };

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  /**
   * POST /api/classes/:classId/notify-groups
   * Envia notificações para os membros dos grupos
   */
  app.post('/api/classes/:classId/notify-groups', requireAuth, async (req: any, res) => {
    try {
      console.log("📧 POST /api/classes/:classId/notify-groups iniciado");
      const { classId } = req.params;
      const teacherId = req.user.id;

      console.log("ClassId:", classId, "TeacherId:", teacherId);

      // Verify teacher owns this class
      const classData = await storage.getClassById(classId);
      console.log("Class encontrada:", !!classData);
      
      if (!classData || classData.teacherId !== teacherId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get the division with groups
      console.log("Buscando divisões para classId:", classId);
      const divisions = await storage.getGroupDivisions(classId);
      console.log("Divisões encontradas:", divisions.length);
      
      if (divisions.length === 0) {
        return res.status(400).json({ message: "No group division found" });
      }

      const division = divisions[0];
      console.log("Buscando membros para divisionId:", division.id);
      
      const members = await storage.getGroupMembers(division.id);
      console.log("Membros encontrados:", members.length);
      console.log("Estrutura completa dos membros:", JSON.stringify(members, null, 2));

      // Agrupar por groupNumber
      const groupsMap = new Map<number, any[]>();
      
      for (const member of members) {
        if (!groupsMap.has(member.groupNumber)) {
          groupsMap.set(member.groupNumber, []);
        }
        groupsMap.get(member.groupNumber)!.push(member);
      }

      console.log("Grupos criados:", groupsMap.size);

      // Construir um ÚNICO objeto com TODOS os grupos
      const payloadGrupos: any[] = [];

      for (const [groupNumber, groupMembers] of groupsMap) {
        console.log(`\n📦 Processando Grupo ${groupNumber} com ${groupMembers.length} membros`);
        
        // Construir lista de membros para este grupo
        const membrosGrupo = groupMembers.map(member => ({
          nome: member.studentName || 'Desconhecido',
          email: member.studentEmail || ''
        }));

        // Construir mensagem simples
        const nomesMembros = membrosGrupo.map(m => m.nome).join(', ');
        const message = `A divisão de grupos foi concluída. O Grupo ${groupNumber} é composto por: ${nomesMembros}. Entre em contato com os outros membros para começar a trabalhar juntos.`;

        payloadGrupos.push({
          grupo: groupNumber,
          membros: membrosGrupo,
          mensagem: message
        });
      }

      console.log("Total de grupos a enviar:", payloadGrupos.length);

      // Construir payload único
      const payloadCompleto = {
        classId: classId,
        timestamp: new Date().toISOString(),
        grupos: payloadGrupos
      };

      console.log("📤 Enviando payload completo para webhook:", JSON.stringify(payloadCompleto, null, 2));

      // Send single notification to webhook
      const webhookUrl = "https://n8n.nexosoftwere.cloud/webhook/7206e7fb-2153-454f-bac5-62118e90c0d8";

      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payloadCompleto)
        });

        console.log(`✅ Payload enviado com sucesso. Status: ${response.status}`);

        res.json({
          message: "Notification sent successfully",
          success: response.ok,
          status: response.status,
          gruposNotificados: payloadGrupos.length
        });
      } catch (error) {
        console.error(`❌ Erro ao enviar payload para webhook:`, error);
        res.status(500).json({
          message: "Failed to send notification",
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } catch (error) {
      console.error("❌ Erro completo em notify-groups:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({ 
        message: "Failed to notify groups",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Inicializa o servidor HTTP com as rotas registradas
  const httpServer = createServer(app);
  return httpServer;
}
