import { Controller, Post, Body, UseGuards, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger';
import { LlmService } from './llm.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ChatCompletionDto,
  EmbeddingDto,
  ChatCompletionSwaggerDto,
  EmbeddingSwaggerDto,
  ApiErrorDto,
} from '../../common/dto';

@ApiTags('LLM')
@Controller('llm')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LlmController {
  constructor(@Inject(LlmService) private readonly llmService: LlmService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Generate chat completion' })
  @ApiBody({ type: ChatCompletionSwaggerDto })
  @ApiResponse({ status: 201, description: 'Chat completion generated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error', type: ApiErrorDto })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: ApiErrorDto })
  async chat(@Body() body: ChatCompletionDto) {
    return this.llmService.chatCompletion(body);
  }

  @Post('embedding')
  @ApiOperation({ summary: 'Generate embeddings' })
  @ApiBody({ type: EmbeddingSwaggerDto })
  @ApiResponse({ status: 201, description: 'Embeddings generated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error', type: ApiErrorDto })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: ApiErrorDto })
  async embedding(@Body() body: EmbeddingDto) {
    return this.llmService.embedding(body);
  }
}
