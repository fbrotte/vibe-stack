import { Controller, Post, Body, UseGuards, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LlmService } from './llm.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatCompletionDto, EmbeddingDto } from '../../common/dto';

@ApiTags('LLM')
@Controller('llm')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LlmController {
  constructor(@Inject(LlmService) private readonly llmService: LlmService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Generate chat completion' })
  async chat(@Body() body: ChatCompletionDto) {
    return this.llmService.chatCompletion(body);
  }

  @Post('embedding')
  @ApiOperation({ summary: 'Generate embeddings' })
  async embedding(@Body() body: EmbeddingDto) {
    return this.llmService.embedding(body);
  }
}
