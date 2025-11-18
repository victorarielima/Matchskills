import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Classes table
export const classes = pgTable("classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  code: varchar("code").notNull().unique(),
  studentLimit: integer("student_limit").notNull(),
  groupCount: integer("group_count").notNull(),
  colorIndex: integer("color_index").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Form questions table
export const formQuestions = pgTable("form_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: varchar("class_id").notNull().references(() => classes.id, { onDelete: 'cascade' }),
  question: text("question").notNull(),
  type: varchar("type").notNull(), // 'text', 'textarea', 'radio', 'checkbox', 'scale'
  options: text("options").array(), // For multiple choice questions
  isRequired: boolean("is_required").default(false),
  order: integer("order").notNull(),
  scaleMin: integer("scale_min"),
  scaleMax: integer("scale_max"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Form responses table
export const formResponses = pgTable("form_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: varchar("class_id").notNull().references(() => classes.id, { onDelete: 'cascade' }),
  studentName: varchar("student_name").notNull(),
  studentEmail: varchar("student_email"),
  responses: jsonb("responses").notNull(), // Store all answers as JSON
  submittedAt: timestamp("submitted_at").defaultNow(),
});

// Individual question responses table - NEW APPROACH
export const questionResponses = pgTable("question_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  formResponseId: varchar("form_response_id").notNull().references(() => formResponses.id, { onDelete: 'cascade' }),
  questionId: varchar("question_id").notNull().references(() => formQuestions.id, { onDelete: 'cascade' }),
  responseValue: text("response_value").notNull(), // Store individual response as text/JSON string
  createdAt: timestamp("created_at").defaultNow(),
});

// Group divisions table - For managing group configurations
export const groupDivisions = pgTable("group_divisions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: varchar("class_id").notNull().references(() => classes.id, { onDelete: 'cascade' }),
  name: varchar("name").notNull(), // "Divisão 1", "Grupos Projeto Final"
  membersPerGroup: integer("members_per_group").notNull(),
  prompt: text("prompt"), // Para IA futura
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Group members table - For storing group assignments
export const groupMembers = pgTable("group_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  divisionId: varchar("division_id").notNull().references(() => groupDivisions.id, { onDelete: 'cascade' }),
  groupNumber: integer("group_number").notNull(), // 1, 2, 3, etc.
  formResponseId: varchar("form_response_id").notNull().references(() => formResponses.id, { onDelete: 'cascade' }),
  isLeader: boolean("is_leader").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  classes: many(classes),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  teacher: one(users, {
    fields: [classes.teacherId],
    references: [users.id],
  }),
  questions: many(formQuestions),
  responses: many(formResponses),
  groupDivisions: many(groupDivisions),
}));

export const formQuestionsRelations = relations(formQuestions, ({ one, many }) => ({
  class: one(classes, {
    fields: [formQuestions.classId],
    references: [classes.id],
  }),
  responses: many(questionResponses),
}));

export const formResponsesRelations = relations(formResponses, ({ one, many }) => ({
  class: one(classes, {
    fields: [formResponses.classId],
    references: [classes.id],
  }),
  questionResponses: many(questionResponses),
  groupMemberships: many(groupMembers),
}));

export const questionResponsesRelations = relations(questionResponses, ({ one }) => ({
  formResponse: one(formResponses, {
    fields: [questionResponses.formResponseId],
    references: [formResponses.id],
  }),
  question: one(formQuestions, {
    fields: [questionResponses.questionId],
    references: [formQuestions.id],
  }),
}));

export const groupDivisionsRelations = relations(groupDivisions, ({ one, many }) => ({
  class: one(classes, {
    fields: [groupDivisions.classId],
    references: [classes.id],
  }),
  members: many(groupMembers),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  division: one(groupDivisions, {
    fields: [groupMembers.divisionId],
    references: [groupDivisions.id],
  }),
  formResponse: one(formResponses, {
    fields: [groupMembers.formResponseId],
    references: [formResponses.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginUserSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const registerUserSchema = insertUserSchema.extend({
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export const insertClassSchema = createInsertSchema(classes).omit({
  id: true,
  teacherId: true,
  code: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFormQuestionSchema = createInsertSchema(formQuestions).omit({
  id: true,
  classId: true,
  createdAt: true,
});

export const insertFormResponseSchema = createInsertSchema(formResponses).omit({
  id: true,
  submittedAt: true,
});

export const insertQuestionResponseSchema = createInsertSchema(questionResponses).omit({
  id: true,
  createdAt: true,
});

export const insertGroupDivisionSchema = createInsertSchema(groupDivisions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGroupMemberSchema = createInsertSchema(groupMembers).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type User = typeof users.$inferSelect;
export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type FormQuestion = typeof formQuestions.$inferSelect;
export type InsertFormQuestion = z.infer<typeof insertFormQuestionSchema>;
export type FormResponse = typeof formResponses.$inferSelect;
export type InsertFormResponse = z.infer<typeof insertFormResponseSchema>;
export type QuestionResponse = typeof questionResponses.$inferSelect;
export type InsertQuestionResponse = z.infer<typeof insertQuestionResponseSchema>;
export type GroupDivision = typeof groupDivisions.$inferSelect;
export type InsertGroupDivision = z.infer<typeof insertGroupDivisionSchema>;
export type GroupMember = typeof groupMembers.$inferSelect;
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;
