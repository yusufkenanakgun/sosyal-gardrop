// apps/api/src/wardrobe/dto/list-wardrobe-items.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListWardrobeItemsQuery {
  @ApiPropertyOptional({ example: 20 })
  limit?: number;

  @ApiPropertyOptional({ example: 'cursor-token' })
  cursor?: string;

  @ApiPropertyOptional({ example: 'tshirt' })
  type?: string;
}
