import { createZodDto } from 'nestjs-zod';
import { ChatCompletionSchema, EmbeddingSchema } from '@template-dev/shared';

export class ChatCompletionDto extends createZodDto(ChatCompletionSchema) {}
export class EmbeddingDto extends createZodDto(EmbeddingSchema) {}
