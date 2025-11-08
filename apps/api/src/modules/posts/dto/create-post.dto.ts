import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsEnum, MaxLength } from 'class-validator';

export enum PostVisibility {
  PUBLIC = 'public',
  FOLLOWERS = 'followers',
  PRIVATE = 'private',
}

export class CreatePostDto {
  @ApiProperty({ required: false, maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  caption?: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];

  @ApiProperty({ enum: PostVisibility, default: PostVisibility.PUBLIC })
  @IsOptional()
  @IsEnum(PostVisibility)
  visibility?: PostVisibility;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  outfitId?: string;
}
