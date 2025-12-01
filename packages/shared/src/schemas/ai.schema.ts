import { z } from 'zod';

// Schema for chat messages
export const ChatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
});

// Schema for chat completion requests
export const ChatCompletionSchema = z.object({
  model: z.string().optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(['system', 'user', 'assistant']),
        content: z.string(),
      }),
    )
    .min(1),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  sessionId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Schema for embedding requests
export const EmbeddingSchema = z.object({
  model: z.string().optional(),
  input: z.union([z.string(), z.array(z.string())]),
});

// Inferred types
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatCompletionInput = z.infer<typeof ChatCompletionSchema>;
export type EmbeddingInput = z.infer<typeof EmbeddingSchema>;
