import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth } from "./auth";
import { insertClassSchema, insertFormQuestionSchema, insertFormResponseSchema } from "@shared/schema";
import { z } from "zod";

export function registerRoutes(app: Express): Server {
  // Auth middleware
  setupAuth(app);

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
   * Retorna todas as respostas dos alunos para uma turma
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

      const responses = await storage.getClassResponses(classId);
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
   * POST /api/class/:code/submit
   * Submete respostas do aluno para a turma
   * Espera dados do aluno e respostas no corpo
   */
  app.post('/api/class/:code/submit', async (req, res) => {
    try {
      const { code } = req.params;
      const classData = await storage.getClassByCode(code);
      
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }

      if (!classData.isActive) {
        return res.status(400).json({ message: "This class is currently closed" });
      }

      const responseData = insertFormResponseSchema.parse({
        ...req.body,
        classId: classData.id,
      });

      const response = await storage.submitFormResponse(responseData);
      res.json(response);
    } catch (error) {
      console.error("Error submitting response:", error);
      res.status(500).json({ message: "Failed to submit response" });
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

      const division = await storage.createGroupDivision({
        classId,
        name,
        membersPerGroup,
        prompt,
        groups
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

      // Update the division
      await storage.updateGroupDivision(divisionId, {
        name,
        membersPerGroup,
        prompt,
        groups
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

  // Inicializa o servidor HTTP com as rotas registradas
  const httpServer = createServer(app);
  return httpServer;
}
