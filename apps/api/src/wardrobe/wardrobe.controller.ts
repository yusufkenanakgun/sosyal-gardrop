// apps/api/src/wardrobe/wardrobe.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WardrobeService } from './wardrobe.service';
import { CreateWardrobeItemDto } from './dto/create-wardrobe-item.dto';
import type { Request } from 'express';

type JwtUser = { id?: string; sub?: string; email?: string; role?: string };

@ApiTags('wardrobe')
@UseGuards(JwtAuthGuard)
@Controller('wardrobe/items')
export class WardrobeController {
  constructor(private readonly wardrobe: WardrobeService) {}

  @Post()
  @ApiOperation({
    summary:
      'MinIO yüklemesi sonrası DB’ye WardrobeItem kaydı oluştur (şimdilik random metadata)',
  })
  @ApiCreatedResponse({ description: 'WardrobeItem oluşturuldu' })
  async create(@Body() dto: CreateWardrobeItemDto, @Req() req: Request) {
    const user = req.user as JwtUser | undefined;
    const userId = user?.id ?? user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Invalid token payload (missing id/sub)');
    }
    return this.wardrobe.createRandomized(userId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Kullanıcının WardrobeItem listesini getir (sayfalı)',
  })
  @ApiOkResponse({ description: 'Liste döner' })
  async list(
    @Query('limit') limit = '20',
    @Query('cursor') cursor?: string,
    @Query('type') type?: string,
    @Req() req: Request = {} as Request,
  ) {
    const user = (req.user as JwtUser | undefined) ?? undefined;
    const userId = user?.id ?? user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Invalid token payload (missing id/sub)');
    }
    const take = Math.min(Math.max(Number(limit) || 20, 1), 100);
    return this.wardrobe.list(userId, { limit: take, cursor, type });
  }
}
