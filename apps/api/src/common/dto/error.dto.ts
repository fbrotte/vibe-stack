import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class ApiErrorDto {
  @ApiProperty({ example: 401, type: Number })
  statusCode: number

  @ApiProperty({ example: 'Invalid credentials', type: String })
  message: string

  @ApiPropertyOptional({ example: 'Unauthorized', type: String })
  error?: string
}
