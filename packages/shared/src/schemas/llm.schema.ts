import { z } from 'zod';

export const ChatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
});

export const ChatCompletionSchema = z.object({
  model: z.string(),
  messages: z.array(ChatMessageSchema).min(1),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
});

export const EmbeddingSchema = z.object({
  model: z.string(),
  input: z.union([z.string(), z.array(z.string())]),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatCompletionInput = z.infer<typeof ChatCompletionSchema>;
export type EmbeddingInput = z.infer<typeof EmbeddingSchema>;