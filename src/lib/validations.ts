import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "TRANSLATOR", "REVIEWER"]),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(["ADMIN", "TRANSLATOR", "REVIEWER"]).optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  isActive: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, "Password must be at least 6 characters"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export const createProjectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  sourceLang: z.enum(["EN", "HA"]).default("EN"),
  targetLang: z.enum(["EN", "HA"]).default("HA"),
});

export const updateProjectSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  sourceLang: z.enum(["EN", "HA"]).optional(),
  targetLang: z.enum(["EN", "HA"]).optional(),
});

export const createTaskSchema = z.object({
  originalContent: z.string().min(1, "Content is required"),
  assignedToId: z.string().optional(),
  reviewedById: z.string().optional(),
  dueDate: z.string().datetime({ offset: true }).optional().or(z.string().date().optional()),
});

export const updateTaskSchema = z.object({
  originalContent: z.string().min(1).optional(),
  translatedContent: z.string().optional(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "SUBMITTED", "APPROVED", "REJECTED"]).optional(),
  assignedToId: z.string().nullable().optional(),
  reviewedById: z.string().nullable().optional(),
  dueDate: z.string().datetime({ offset: true }).nullable().optional().or(z.string().date().nullable().optional()),
});

export const submitTaskSchema = z.object({
  translatedContent: z.string().min(1, "Translation is required"),
});

export const reviewTaskSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewNote: z.string().optional(),
  translatedContent: z.string().optional(),
});

export const createGlossarySchema = z.object({
  english: z.string(),
  hausa: z.string(),
  reviewed: z.string().optional(),
  definition: z.string().optional(),
  partOfSpeech: z.string().optional(),
  usageExample: z.string().optional(),
  domain: z.string().optional(),
  forbiddenTerms: z.array(z.string()).optional(),
  notes: z.string().optional(),
  status: z.enum(["approved", "proposed"]).optional(),
});

export const updateGlossarySchema = z.object({
  english: z.string().optional(),
  hausa: z.string().optional(),
  reviewed: z.string().optional(),
  definition: z.string().optional(),
  partOfSpeech: z.string().optional(),
  usageExample: z.string().optional(),
  domain: z.string().optional(),
  forbiddenTerms: z.array(z.string()).optional(),
  notes: z.string().optional(),
  status: z.enum(["approved", "proposed"]).optional(),
});

export const documentUploadSchema = z.object({
  segments: z.array(z.object({
    content: z.string().min(1),
    segmentType: z.string(),
    orderIndex: z.number().int().min(0),
  })).min(1),
  sourceFormat: z.enum(["docx", "html"]),
  sourceFileName: z.string().min(1),
  assignedToId: z.string().optional(),
  reviewedById: z.string().optional(),
  dueDate: z.string().optional(),
});

export const bulkGlossarySchema = z.object({
  entries: z.array(createGlossarySchema).min(1, "At least one entry is required"),
});
