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
}));

export const formQuestionsRelations = relations(formQuestions, ({ one }) => ({
  class: one(classes, {
    fields: [formQuestions.classId],
    references: [classes.id],
  }),
}));

export const formResponsesRelations = relations(formResponses, ({ one }) => ({
  class: one(classes, {
    fields: [formResponses.classId],
    references: [classes.id],
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
