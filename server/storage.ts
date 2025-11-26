import { eq, desc, sql, inArray } from "drizzle-orm";
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
  getRecentResponsesByTeacher(teacherId: string, limit?: number): Promise<Array<FormResponse & { className: string }>>;

  
  // Group division operations
  getGroupDivisions(classId: string): Promise<GroupDivision[]>;
  createGroupDivision(data: { classId: string; name: string; membersPerGroup: number; prompt?: string; groups: any[] }): Promise<GroupDivision>;
  getGroupMembers(divisionId: string): Promise<any[]>;
  updateGroupDivision(divisionId: string, data: { name: string; membersPerGroup: number; prompt: string; groups: any[] }): Promise<void>;
  deleteGroupDivision(divisionId: string): Promise<void>;
  deleteAllGroupDivisionsByClass(classId: string): Promise<void>;
  getGroupStatsByTeacher(teacherId: string): Promise<{
    totalGroupsCreated: number;
    studentsInGroups: number;
    studentsWithoutGroup: number;
  }>;
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

  async getRecentResponsesByTeacher(teacherId: string, limit: number = 10): Promise<Array<FormResponse & { className: string }>> {
    try {
      const result = await db
        .select({
          id: formResponses.id,
          classId: formResponses.classId,
          studentName: formResponses.studentName,
          studentEmail: formResponses.studentEmail,
          responses: formResponses.responses,
          submittedAt: formResponses.submittedAt,
          className: classes.name,
        })
        .from(formResponses)
        .innerJoin(classes, eq(formResponses.classId, classes.id))
        .where(eq(classes.teacherId, teacherId))
        .orderBy(desc(formResponses.submittedAt))
        .limit(limit);

      return result;
    } catch (error) {
      console.error('Error getting recent responses:', error);
      return [];
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
      console.log('📊 Criando divisão com dados:');
      console.log(JSON.stringify(data.groups, null, 2).substring(0, 1000));
      
      // Create the division
      const divisionData: InsertGroupDivision = {
        classId: data.classId,
        name: data.name,
        membersPerGroup: data.membersPerGroup,
        prompt: data.prompt || null,
      };

      const [division] = await db.insert(groupDivisions).values(divisionData).returning();

      // Create group members - usando SQL raw para garantir inserção correta de arrays
      let totalSaved = 0;
      for (const group of data.groups) {
        console.log(`👥 Processando grupo ${group.groupNumber}, leaderId: ${group.leaderId}`);
        for (const member of group.members) {
          const isLeader = member.id === group.leaderId;
          const strengthsArray = Array.isArray(member.strengths) ? member.strengths.filter((s: string) => s && s.length > 0) : [];
          const attentionArray = Array.isArray(member.attention) ? member.attention.filter((a: string) => a && a.length > 0) : [];
          
          console.log(`  └─ Membro ${member.studentName} (${member.id}):`);
          console.log(`     isLeader=${isLeader}`);
          console.log(`     strengths=${strengthsArray.length} items: ${strengthsArray.slice(0, 2).join("; ")}`);
          console.log(`     attention=${attentionArray.length} items: ${attentionArray.slice(0, 2).join("; ")}`);
          
          // Construir SQL para os arrays
          const strengthsSQL = strengthsArray.length > 0 
            ? `ARRAY[${strengthsArray.map((s: string) => `'${s.replace(/'/g, "''")}'`).join(',')}]::text[]`
            : `ARRAY[]::text[]`;
          const attentionSQL = attentionArray.length > 0
            ? `ARRAY[${attentionArray.map((a: string) => `'${a.replace(/'/g, "''")}'`).join(',')}]::text[]`
            : `ARRAY[]::text[]`;
          
          // Inserir usando raw SQL para garantir que os arrays funcionem
          await db.execute(sql`
            INSERT INTO group_members (division_id, group_number, form_response_id, is_leader, strengths, attention, created_at)
            VALUES (
              ${division.id},
              ${group.groupNumber},
              ${member.id},
              ${isLeader},
              ${sql.raw(strengthsSQL)},
              ${sql.raw(attentionSQL)},
              NOW()
            )
          `);
          
          totalSaved++;
          console.log(`     ✅ Membro inserido com sucesso`);
        }
      }

      console.log(`✅ Total de ${totalSaved} membros salvos no banco de dados com sucesso!`);

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
          isLeader: groupMembers.isLeader,
          strengths: groupMembers.strengths,
          attention: groupMembers.attention,
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
            members: [],
            leaderId: undefined
          };
        }
        
        // Create full FormResponse object
        const member = {
          id: row.formResponseId,
          studentName: row.studentName,
          studentEmail: row.studentEmail,
          responses: row.responses,
          submittedAt: row.submittedAt,
          isLeader: row.isLeader,
          strengths: row.strengths || [], // Incluir pontos fortes
          attention: row.attention || [] // Incluir pontos de atenção
        };
        
        // Se este membro é líder, armazenar seu ID no grupo
        if (row.isLeader) {
          groups[row.groupNumber].leaderId = row.formResponseId;
        }
        
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
      console.log('🔄 Atualizando divisão:', divisionId);
      console.log('📊 Dados recebidos:');
      console.log(JSON.stringify(data.groups, null, 2).substring(0, 1000));
      
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

        // Insert new group members - inserção individual com controle de arrays
        let totalMembers = 0;
        for (const group of data.groups) {
          console.log(`👥 Processando grupo ${group.groupNumber}, leaderId: ${group.leaderId}`);
          for (const member of group.members) {
            const strengthsArray = Array.isArray(member.strengths) ? member.strengths.filter((s: string) => s && s.length > 0) : [];
            const attentionArray = Array.isArray(member.attention) ? member.attention.filter((a: string) => a && a.length > 0) : [];
            
            console.log(`  └─ Membro ${member.studentName}:`);
            console.log(`     strengths=${strengthsArray.length} items`);
            console.log(`     attention=${attentionArray.length} items`);
            
            const memberRecord: InsertGroupMember = {
              divisionId: divisionId,
              formResponseId: member.id,
              groupNumber: group.groupNumber,
              isLeader: member.id === group.leaderId,
              strengths: strengthsArray.length > 0 ? strengthsArray : [],
              attention: attentionArray.length > 0 ? attentionArray : [],
            };
            
            await tx.insert(groupMembers).values(memberRecord);
            totalMembers++;
          }
        }

        console.log(`✅ ${totalMembers} membros salvos com sucesso!`);
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

  async getGroupStatsByTeacher(teacherId: string): Promise<{
    totalGroupsCreated: number;
    studentsInGroups: number;
    studentsWithoutGroup: number;
  }> {
    try {
      // Get all classes for this teacher
      const teacherClasses = await this.getTeacherClasses(teacherId);
      const classIds = teacherClasses.map(c => c.id);
      
      if (classIds.length === 0) {
        return {
          totalGroupsCreated: 0,
          studentsInGroups: 0,
          studentsWithoutGroup: 0,
        };
      }

      // Count total unique groups created across all divisions
      // A group is identified by (divisionId, groupNumber)
      const groupsResult = await db
        .select({
          divisionId: groupMembers.divisionId,
          groupNumber: groupMembers.groupNumber,
        })
        .from(groupMembers)
        .innerJoin(groupDivisions, eq(groupMembers.divisionId, groupDivisions.id))
        .where(inArray(groupDivisions.classId, classIds))
        .groupBy(groupMembers.divisionId, groupMembers.groupNumber);

      const totalGroups = groupsResult.length;

      // Count unique students in groups
      const studentsInGroupsResult = await db
        .select({
          formResponseId: groupMembers.formResponseId,
        })
        .from(groupMembers)
        .innerJoin(groupDivisions, eq(groupMembers.divisionId, groupDivisions.id))
        .where(inArray(groupDivisions.classId, classIds))
        .groupBy(groupMembers.formResponseId);

      const studentsInGroups = studentsInGroupsResult.length;

      // Count total responses (all students who answered forms)
      const totalResponsesResult = await db
        .select({
          count: sql<number>`COUNT(*)`,
        })
        .from(formResponses)
        .where(inArray(formResponses.classId, classIds));

      const totalResponses = Number(totalResponsesResult[0]?.count || 0);
      const studentsWithoutGroup = totalResponses - studentsInGroups;

      console.log('📊 Group stats:', {
        totalGroups,
        studentsInGroups,
        totalResponses,
        studentsWithoutGroup,
      });

      return {
        totalGroupsCreated: totalGroups,
        studentsInGroups,
        studentsWithoutGroup: Math.max(0, studentsWithoutGroup),
      };
    } catch (error) {
      console.error('Error getting group stats:', error);
      return {
        totalGroupsCreated: 0,
        studentsInGroups: 0,
        studentsWithoutGroup: 0,
      };
    }
  }
}

// Create and export the storage instance
export const storage = new DatabaseStorage();
