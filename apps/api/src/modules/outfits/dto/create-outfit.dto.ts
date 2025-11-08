import { IsArray, IsOptional, IsString, ArrayMinSize } from 'class-validator';

export class CreateOutfitDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  itemIds: string[];

  @IsOptional()
  @IsString()
  weatherTag?: string;

  @IsOptional()
  @IsString()
  occasionTag?: string;
}
