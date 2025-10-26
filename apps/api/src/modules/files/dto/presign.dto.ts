import { ApiProperty } from '@nestjs/swagger';

export class PresignRequestDto {
  @ApiProperty({ example: 'photo.jpg' })
  filename!: string;

  @ApiProperty({ example: 'image/jpeg' })
  contentType!: string;

  @ApiProperty({ example: 'users/abc123', required: false })
  prefix?: string;
}

export class PresignResponseDto {
  uploadUrl!: string;
  key!: string;
  publicUrl?: string;
}
