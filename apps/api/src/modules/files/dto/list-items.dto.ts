import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListItemsQueryDto {
  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  limit?: string;

  @ApiPropertyOptional({ description: 'cursor olarak önceki sayfanın son id’si' })
  cursor?: string;

  @ApiPropertyOptional({ description: 'tshirt, shirt, jeans vb.' })
  type?: string;
}
