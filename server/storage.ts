import {
  type User,
  type RegisterUser,
  type Class,
  type InsertClass,
  type FormQuestion,
  type InsertFormQuestion,
  type FormResponse,
  type InsertFormResponse,
} from "@shared/schema";
import { randomBytes } from "crypto";
import { mockUsers, mockClasses, mockFormQuestions, mockFormResponses } from "../mock-data";

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
  updateClassStatus(id: string, isActive: boolean): Promise<void>;
  
  // Form question operations
  createFormQuestions(classId: string, questions: InsertFormQuestion[]): Promise<FormQuestion[]>;
  getFormQuestions(classId: string): Promise<FormQuestion[]>;
  
  // Form response operations
  submitFormResponse(response: InsertFormResponse): Promise<FormResponse>;
  getClassResponses(classId: string): Promise<FormResponse[]>;
  getResponseById(responseId: string): Promise<FormResponse | undefined>;
}

// In-memory storage for new data created during the session
let inMemoryClasses: Class[] = [...mockClasses];
let inMemoryQuestions: FormQuestion[] = [...mockFormQuestions];
let inMemoryResponses: FormResponse[] = [...mockFormResponses];
let inMemoryUsers: User[] = mockUsers.map(u => ({
  ...u,
  createdAt: new Date(),
  updatedAt: new Date(),
}));

export class MockStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return inMemoryUsers.find(u => u.id === id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return inMemoryUsers.find(u => u.email === email);
  }

  async createUser(userData: RegisterUser): Promise<User> {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryUsers.push(newUser);
    return newUser;
  }

  // Class operations
  async getTeacherClasses(teacherId: string): Promise<Class[]> {
    return inMemoryClasses
      .filter(c => c.teacherId === teacherId)
      .sort((a, b) => (b.createdAt || new Date()).getTime() - (a.createdAt || new Date()).getTime());
  }

  async createClass(teacherId: string, classData: InsertClass): Promise<Class> {
    // Generate unique class code
    const code = this.generateClassCode();
    
    const newClass: Class = {
      ...classData,
      id: `class-${Date.now()}`,
      teacherId,
      code,
      isActive: classData.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    inMemoryClasses.push(newClass);
    return newClass;
  }

  async getClassByCode(code: string): Promise<Class | undefined> {
    return inMemoryClasses.find(c => c.code === code);
  }

  async getClassById(id: string): Promise<Class | undefined> {
    return inMemoryClasses.find(c => c.id === id);
  }

  async updateClassStatus(id: string, isActive: boolean): Promise<void> {
    const classIndex = inMemoryClasses.findIndex(c => c.id === id);
    if (classIndex !== -1) {
      inMemoryClasses[classIndex] = {
        ...inMemoryClasses[classIndex],
        isActive,
        updatedAt: new Date(),
      };
    }
  }

  // Form question operations
  async createFormQuestions(classId: string, questions: InsertFormQuestion[]): Promise<FormQuestion[]> {
    const newQuestions: FormQuestion[] = questions.map((q, index) => ({
      ...q,
      id: `q-${Date.now()}-${index}`,
      classId,
      order: index + 1,
      options: q.options ?? null,
      isRequired: q.isRequired ?? null,
      scaleMin: q.scaleMin ?? null,
      scaleMax: q.scaleMax ?? null,
      createdAt: new Date(),
    }));

    inMemoryQuestions.push(...newQuestions);
    return newQuestions;
  }

  async getFormQuestions(classId: string): Promise<FormQuestion[]> {
    return inMemoryQuestions
      .filter(q => q.classId === classId)
      .sort((a, b) => a.order - b.order);
  }

  // Form response operations
  async submitFormResponse(response: InsertFormResponse): Promise<FormResponse> {
    const newResponse: FormResponse = {
      ...response,
      id: `r-${Date.now()}`,
      studentEmail: response.studentEmail ?? null,
      submittedAt: new Date(),
    };
    
    inMemoryResponses.push(newResponse);
    return newResponse;
  }

  async getClassResponses(classId: string): Promise<FormResponse[]> {
    return inMemoryResponses
      .filter(r => r.classId === classId)
      .sort((a, b) => (b.submittedAt || new Date()).getTime() - (a.submittedAt || new Date()).getTime());
  }

  async getResponseById(responseId: string): Promise<FormResponse | undefined> {
    return inMemoryResponses.find(r => r.id === responseId);
  }

  private generateClassCode(): string {
    // Generate a 10-digit numeric code
    return randomBytes(5).toString('hex').replace(/[a-f]/g, '').substring(0, 10).padEnd(10, '0');
  }
}

export const storage = new MockStorage();
