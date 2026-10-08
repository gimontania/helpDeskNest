import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Bad Request' })
  error: string;

  @ApiProperty({ example: 'Error de validación' })
  message: string;

  @ApiPropertyOptional({ example: ['email must be an email'], type: [String] })
  details?: string[];

  @ApiProperty({ example: '2026-10-08T15:20:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/auth/register' })
  path: string;
}
