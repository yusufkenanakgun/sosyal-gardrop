// apps/api/src/wardrobe/dto/create-wardrobe-item.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class CreateWardrobeItemDto {
  @ApiProperty({
    description: 'MinIO objesinin key’i',
    example: 'users/uid123/wardrobe/2025-10-29/uuid.jpg',
  })
  objectKey!: string;

  @ApiProperty({ description: 'İçerik tipi', example: 'image/jpeg' })
  contentType!: string;

  @ApiProperty({
    description:
      'Public URL (backend de üretilebilir; şu an client gönderiyor)',
    example: 'http://minio.local/bucket/users/uid/wardrobe/2025-10-29/uuid.jpg',
  })
  publicUrl!: string;
}
