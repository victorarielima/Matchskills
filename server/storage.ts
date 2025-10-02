import { eq, desc, sql } from "drizzle-orm";
import { db } from "./db.js";
import {
  users,
  classes,
  formQuestions,
  formResponses,
  groupDivisions,
  groupMembers,
  type User,
  type RegisterUser,
  type Class,
  type InsertClass,
  type FormQuestion,
  type InsertFormQuestion,
  type FormResponse,
  type InsertFormResponse,
  type GroupDivision,
  type InsertGroupDivision,
  type GroupMember,
  type InsertGroupMember,
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
  updateClassColor(id: string, colorIndex: number): Promise<Class>;
  getResponseCountsByTeacher(teacherId: string): Promise<Record<string, number>>;
  deleteClass(id: string): Promise<void>;
  
  // Form question operations
  createFormQuestions(classId: string, questions: InsertFormQuestion[]): Promise<FormQuestion[]>;
  getFormQuestions(classId: string): Promise<FormQuestion[]>;
  updateFormQuestions(classId: string, questions: InsertFormQuestion[]): Promise<FormQuestion[]>;
  
  // Form response operations
  submitFormResponse(response: InsertFormResponse): Promise<FormResponse>;
  getClassResponses(classId: string): Promise<FormResponse[]>;
  getResponseById(responseId: string): Promise<FormResponse | undefined>;
  
  // Group division operations
  getGroupDivisions(classId: string): Promise<GroupDivision[]>;
  createGroupDivision(data: { classId: string; name: string; membersPerGroup: number; prompt?: string; groups: any[] }): Promise<GroupDivision>;
  getGroupMembers(divisionId: string): Promise<any[]>;
  updateGroupDivision(divisionId: string, data: { name: string; membersPerGroup: number; prompt: string; groups: any[] }): Promise<void>;
  deleteGroupDivision(divisionId: string): Promise<void>;
  deleteAllGroupDivisionsByClass(classId: string): Promise<void>;
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

  async updateClassColor(id: string, colorIndex: number): Promise<Class> {
    try {
      const result = await db
        .update(classes)
        .set({ colorIndex, updatedAt: new Date() })
        .where(eq(classes.id, id))
        .returning();
      
      if (result.length === 0) {
        throw new Error('Class not found');
      }
      
      return result[0];
    } catch (error) {
      console.error('Error updating class color:', error);
      throw new Error('Failed to update class color');
    }
  }

  async getResponseCountsByTeacher(teacherId: string): Promise<Record<string, number>> {
    try {
      // Get all classes for the teacher
      const teacherClasses = await db
        .select({ id: classes.id })
        .from(classes)
        .where(eq(classes.teacherId, teacherId));

      if (teacherClasses.length === 0) {
        return {};
      }

      // Get response counts for each class
      const classIds = teacherClasses.map(c => c.id);
      const responseCounts: Record<string, number> = {};

      for (const classId of classIds) {
        const count = await db
          .select({ count: sql<number>`count(*)` })
          .from(formResponses)
          .where(eq(formResponses.classId, classId));
        
        responseCounts[classId] = count[0]?.count || 0;
      }

      return responseCounts;
    } catch (error) {
      console.error('Error getting response counts:', error);
      return {};
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

  // Group division operations
  async getGroupDivisions(classId: string): Promise<GroupDivision[]> {
    try {
      const result = await db
        .select()
        .from(groupDivisions)
        .where(eq(groupDivisions.classId, classId))
        .orderBy(desc(groupDivisions.createdAt));
      return result;
    } catch (error) {
      console.error('Error getting group divisions:', error);
      return [];
    }
  }

  async createGroupDivision(data: { 
    classId: string; 
    name: string; 
    membersPerGroup: number; 
    prompt?: string; 
    groups: any[] 
  }): Promise<GroupDivision> {
    try {
      // Create the division
      const divisionData: InsertGroupDivision = {
        classId: data.classId,
        name: data.name,
        membersPerGroup: data.membersPerGroup,
        prompt: data.prompt || null,
      };

      const [division] = await db.insert(groupDivisions).values(divisionData).returning();

      // Create group members
      const memberData: InsertGroupMember[] = [];
      for (const group of data.groups) {
        for (const member of group.members) {
          memberData.push({
            divisionId: division.id,
            groupNumber: group.groupNumber,
            formResponseId: member.id,
          });
        }
      }

      if (memberData.length > 0) {
        await db.insert(groupMembers).values(memberData);
      }

      return division;
    } catch (error) {
      console.error('Error creating group division:', error);
      throw new Error('Failed to create group division');
    }
  }

  async getGroupMembers(divisionId: string): Promise<any[]> {
    try {
      const result = await db
        .select({
          groupNumber: groupMembers.groupNumber,
          formResponseId: groupMembers.formResponseId,
          studentName: formResponses.studentName,
          studentEmail: formResponses.studentEmail,
          responses: formResponses.responses,
          submittedAt: formResponses.submittedAt
        })
        .from(groupMembers)
        .innerJoin(formResponses, eq(groupMembers.formResponseId, formResponses.id))
        .where(eq(groupMembers.divisionId, divisionId))
        .orderBy(groupMembers.groupNumber, formResponses.studentName);

      // Group by groupNumber
      const groups: Record<number, any> = {};
      for (const row of result) {
        if (!groups[row.groupNumber]) {
          groups[row.groupNumber] = {
            groupNumber: row.groupNumber,
            members: []
          };
        }
        
        // Create full FormResponse object
        const member = {
          id: row.formResponseId,
          studentName: row.studentName,
          studentEmail: row.studentEmail,
          responses: row.responses,
          submittedAt: row.submittedAt
        };
        
        groups[row.groupNumber].members.push(member);
      }

      console.log('📊 Groups found for division:', divisionId, Object.values(groups));
      return Object.values(groups);
    } catch (error) {
      console.error('Error getting group members:', error);
      return [];
    }
  }

  async updateGroupDivision(divisionId: string, data: { name: string; membersPerGroup: number; prompt: string; groups: any[] }): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        // Update the division details
        await tx
          .update(groupDivisions)
          .set({
            name: data.name,
            membersPerGroup: data.membersPerGroup,
            prompt: data.prompt,
            updatedAt: new Date()
          })
          .where(eq(groupDivisions.id, divisionId));

        // Delete existing group members
        await tx
          .delete(groupMembers)
          .where(eq(groupMembers.divisionId, divisionId));

        // Insert new group members
        for (const group of data.groups) {
          for (const member of group.members) {
            await tx.insert(groupMembers).values({
              id: crypto.randomUUID(),
              divisionId: divisionId,
              formResponseId: member.id,
              groupNumber: group.groupNumber,
              createdAt: new Date()
            });
          }
        }
      });

      console.log('✅ Group division updated successfully:', divisionId);
    } catch (error) {
      console.error('Error updating group division:', error);
      throw error;
    }
  }

  async deleteGroupDivision(divisionId: string): Promise<void> {
    try {
      // Delete members first (cascade should handle this, but being explicit)
      await db.delete(groupMembers).where(eq(groupMembers.divisionId, divisionId));
      
      // Delete the division
      await db.delete(groupDivisions).where(eq(groupDivisions.id, divisionId));
    } catch (error) {
      console.error('Error deleting group division:', error);
      throw new Error('Failed to delete group division');
    }
  }

  async deleteAllGroupDivisionsByClass(classId: string): Promise<void> {
    try {
      // First, get all division IDs for this class
      const divisionsToDelete = await db
        .select({ id: groupDivisions.id })
        .from(groupDivisions)
        .where(eq(groupDivisions.classId, classId));
      
      // Delete all members for all divisions of this class
      for (const division of divisionsToDelete) {
        await db.delete(groupMembers).where(eq(groupMembers.divisionId, division.id));
      }
      
      // Delete all divisions for this class
      await db.delete(groupDivisions).where(eq(groupDivisions.classId, classId));
      
      console.log(`✅ Deleted ${divisionsToDelete.length} divisions for class ${classId}`);
    } catch (error) {
      console.error('Error deleting all group divisions for class:', error);
      throw new Error('Failed to delete all group divisions for class');
    }
  }
}

// Create and export the storage instance
export const storage = new DatabaseStorage();
