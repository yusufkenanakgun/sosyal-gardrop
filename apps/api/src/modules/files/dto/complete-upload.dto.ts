import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CompleteUploadDto {
  @ApiProperty({
    example: 'users/john.doe-usr_123/wardrobe/2025-10-31/6c7e...-a.jpg',
  })
  @IsString()
  key!: string;

  @ApiPropertyOptional({
    description:
      'Opsiyonel. Gönderilmezse service endpoint ve bucket üzerinden üretir',
  })
  @IsOptional()
  @IsString()
  publicUrl?: string;
}
