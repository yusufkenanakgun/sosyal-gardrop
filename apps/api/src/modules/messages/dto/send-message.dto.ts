import { IsString, IsOptional } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  mediaUrl?: string;
}
