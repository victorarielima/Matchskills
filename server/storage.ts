import { eq, desc } from "drizzle-orm";
import { db } from "./db.js";
import {
  users,
  classes,
  formQuestions,
  formResponses,
  type User,
  type RegisterUser,
  type Class,
  type InsertClass,
  type FormQuestion,
  type InsertFormQuestion,
  type FormResponse,
  type InsertFormResponse,
} from "../shared/schema.js";
import { randomBytes } from "crypto";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: RegisterUser): Promise<User>;
  
  // Class operations
  getTeacherClasses(teacherId: string): Promise<Class[]>;
  createClass(teacherId: string, classData: InsertClass): Promise<Class>;
  getClassByCode(code: string): Promise<Class | undefined>;
  getClassById(id: string): Promise<Class | undefined>;
  updateClass(id: string, classData: Partial<InsertClass>): Promise<Class>;
  updateClassStatus(id: string, isActive: boolean): Promise<void>;
  deleteClass(id: string): Promise<void>;
  
  // Form question operations
  createFormQuestions(classId: string, questions: InsertFormQuestion[]): Promise<FormQuestion[]>;
  getFormQuestions(classId: string): Promise<FormQuestion[]>;
  updateFormQuestions(classId: string, questions: InsertFormQuestion[]): Promise<FormQuestion[]>;
  
  // Form response operations
  submitFormResponse(response: InsertFormResponse): Promise<FormResponse>;
  getClassResponses(classId: string): Promise<FormResponse[]>;
  getResponseById(responseId: string): Promise<FormResponse | undefined>;
}

function generateClassCode(): string {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.email, email));
      return result[0];
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async createUser(userData: RegisterUser): Promise<User> {
    try {
      // Hash the password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const result = await db.insert(users).values({
        ...userData,
        password: hashedPassword,
      }).returning();
      
      return result[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  // Class operations
  async getTeacherClasses(teacherId: string): Promise<Class[]> {
    try {
      const result = await db
        .select()
        .from(classes)
        .where(eq(classes.teacherId, teacherId))
        .orderBy(desc(classes.createdAt));
      return result;
    } catch (error) {
      console.error('Error getting teacher classes:', error);
      return [];
    }
  }

  async createClass(teacherId: string, classData: InsertClass): Promise<Class> {
    try {
      const code = generateClassCode();
      const result = await db.insert(classes).values({
        ...classData,
        teacherId,
        code,
      }).returning();
      
      return result[0];
    } catch (error) {
      console.error('Error creating class:', error);
      throw new Error('Failed to create class');
    }
  }

  async getClassByCode(code: string): Promise<Class | undefined> {
    try {
      const result = await db.select().from(classes).where(eq(classes.code, code));
      return result[0];
    } catch (error) {
      console.error('Error getting class by code:', error);
      return undefined;
    }
  }

  async getClassById(id: string): Promise<Class | undefined> {
    try {
      const result = await db.select().from(classes).where(eq(classes.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting class by id:', error);
      return undefined;
    }
  }

  async updateClass(id: string, classData: Partial<InsertClass>): Promise<Class> {
    try {
      const result = await db
        .update(classes)
        .set({ ...classData, updatedAt: new Date() })
        .where(eq(classes.id, id))
        .returning();
      
      if (result.length === 0) {
        throw new Error('Class not found');
      }
      
      return result[0];
    } catch (error) {
      console.error('Error updating class:', error);
      throw new Error('Failed to update class');
    }
  }

  async updateClassStatus(id: string, isActive: boolean): Promise<void> {
    try {
      await db
        .update(classes)
        .set({ isActive, updatedAt: new Date() })
        .where(eq(classes.id, id));
    } catch (error) {
      console.error('Error updating class status:', error);
      throw new Error('Failed to update class status');
    }
  }

  async deleteClass(id: string): Promise<void> {
    try {
      // Delete in order due to foreign key constraints
      // 1. Delete form responses first
      await db.delete(formResponses).where(eq(formResponses.classId, id));
      
      // 2. Delete form questions 
      await db.delete(formQuestions).where(eq(formQuestions.classId, id));
      
      // 3. Delete the class itself
      await db.delete(classes).where(eq(classes.id, id));
    } catch (error) {
      console.error('Error deleting class:', error);
      throw new Error('Failed to delete class');
    }
  }

  // Form question operations
  async createFormQuestions(classId: string, questions: InsertFormQuestion[]): Promise<FormQuestion[]> {
    try {
      const questionsWithClassId = questions.map(q => ({
        ...q,
        classId,
      }));
      
      const result = await db.insert(formQuestions).values(questionsWithClassId).returning();
      return result;
    } catch (error) {
      console.error('Error creating form questions:', error);
      throw new Error('Failed to create form questions');
    }
  }

  async getFormQuestions(classId: string): Promise<FormQuestion[]> {
    try {
      const result = await db
        .select()
        .from(formQuestions)
        .where(eq(formQuestions.classId, classId))
        .orderBy(formQuestions.order);
      return result;
    } catch (error) {
      console.error('Error getting form questions:', error);
      return [];
    }
  }

  async updateFormQuestions(classId: string, questions: InsertFormQuestion[]): Promise<FormQuestion[]> {
    try {
      // Delete existing questions
      await db.delete(formQuestions).where(eq(formQuestions.classId, classId));
      
      // Insert new questions
      if (questions.length > 0) {
        const questionsWithClassId = questions.map(q => ({
          ...q,
          classId,
        }));
        
        const result = await db.insert(formQuestions).values(questionsWithClassId).returning();
        return result;
      }
      
      return [];
    } catch (error) {
      console.error('Error updating form questions:', error);
      throw new Error('Failed to update form questions');
    }
  }

  // Form response operations
  async submitFormResponse(response: InsertFormResponse): Promise<FormResponse> {
    try {
      const result = await db.insert(formResponses).values(response).returning();
      return result[0];
    } catch (error) {
      console.error('Error submitting form response:', error);
      throw new Error('Failed to submit form response');
    }
  }

  async getClassResponses(classId: string): Promise<FormResponse[]> {
    try {
      const result = await db
        .select()
        .from(formResponses)
        .where(eq(formResponses.classId, classId))
        .orderBy(desc(formResponses.submittedAt));
      return result;
    } catch (error) {
      console.error('Error getting class responses:', error);
      return [];
    }
  }

  async getResponseById(responseId: string): Promise<FormResponse | undefined> {
    try {
      const result = await db.select().from(formResponses).where(eq(formResponses.id, responseId));
      return result[0];
    } catch (error) {
      console.error('Error getting response by id:', error);
      return undefined;
    }
  }
}

// Create and export the storage instance
export const storage = new DatabaseStorage();
