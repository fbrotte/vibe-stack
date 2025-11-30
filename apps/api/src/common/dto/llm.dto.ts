import { createZodDto } from 'nestjs-zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChatCompletionSchema, EmbeddingSchema } from '@template-dev/shared';

// Zod DTOs for validation
export class ChatCompletionDto extends createZodDto(ChatCompletionSchema) {}
export class EmbeddingDto extends createZodDto(EmbeddingSchema) {}

// Swagger DTOs for documentation (nestjs-zod v5 can't handle z.array(z.object()) for OpenAPI)
export class ChatMessageSwaggerDto {
  @ApiProperty({ enum: ['system', 'user', 'assistant'], example: 'user', type: String })
  role: 'system' | 'user' | 'assistant';

  @ApiProperty({ example: 'Hello, how are you?', type: String })
  content: string;
}

export class ChatCompletionSwaggerDto {
  @ApiProperty({ example: 'gpt-4o-mini', type: String })
  model: string;

  @ApiProperty({ type: () => [ChatMessageSwaggerDto], description: 'Array of chat messages' })
  messages: ChatMessageSwaggerDto[];

  @ApiPropertyOptional({ minimum: 0, maximum: 2, example: 0.7, type: Number })
  temperature?: number;

  @ApiPropertyOptional({ minimum: 1, example: 1000, type: Number })
  maxTokens?: number;
}

export class EmbeddingSwaggerDto {
  @ApiProperty({ example: 'text-embedding-3-small', type: String })
  model: string;

  @ApiProperty({
    type: 'string',
    example: 'Hello world',
    description: 'Text to embed - single string or array of strings',
  })
  input: string | string[];
}
