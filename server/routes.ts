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

  // Student routes (no authentication required)
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

  const httpServer = createServer(app);
  return httpServer;
}
