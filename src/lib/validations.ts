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
});

export const updateTaskSchema = z.object({
  translatedContent: z.string().optional(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "SUBMITTED", "APPROVED", "REJECTED"]).optional(),
  assignedToId: z.string().nullable().optional(),
  reviewedById: z.string().nullable().optional(),
});

export const submitTaskSchema = z.object({
  translatedContent: z.string().min(1, "Translation is required"),
});

export const reviewTaskSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewNote: z.string().optional(),
});
