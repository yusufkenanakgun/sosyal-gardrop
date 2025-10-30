import { ApiProperty } from '@nestjs/swagger';

export class PresignRequestDto {
  @ApiProperty({ example: 'photo.jpg' })
  filename!: string;

  @ApiProperty({ example: 'image/jpeg' })
  contentType!: string;
}

export class PresignResponseDto {
  uploadUrl!: string;
  key!: string;
  publicUrl?: string;
}
