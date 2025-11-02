import {
  Body,
  Controller,
  Get,
  Post,
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
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FilesService } from './files.service';
import { PresignRequestDto, PresignResponseDto } from './dto/presign.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { ListItemsQueryDto } from './dto/list-items.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import type { RequestWithUser } from '../../types/request-with-user';

@ApiTags('files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Post('presign')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Presigned PUT URL oluştur (upload için)' })
  @ApiBody({ type: PresignRequestDto })
  @ApiCreatedResponse({ type: PresignResponseDto })
  async presign(
    @Body() dto: PresignRequestDto,
    @Req() req: RequestWithUser,
  ): Promise<PresignResponseDto> {
    const userId = String(req.user?.id ?? req.user?.sub ?? '');
    const email = String(req.user?.email ?? '');
    if (!userId) throw new UnauthorizedException('Kullanıcı doğrulanamadı');
    return this.files.createUploadUrl(dto, userId, email);
  }

  @Post('complete')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'Upload tamamla: MinIO objesini doğrula ve DB’ye WardrobeItem kaydı oluştur (random metadata)',
  })
  @ApiCreatedResponse({
    description: 'WardrobeItem oluşturuldu',
    schema: { type: 'object' },
  })
  async complete(
    @Body() dto: CompleteUploadDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = String(req.user?.id ?? req.user?.sub ?? '');
    const email = String(req.user?.email ?? '');
    if (!userId) throw new UnauthorizedException('Kullanıcı doğrulanamadı');
    return this.files.completeAndCreateItem(userId, email, dto);
  }

  @Get('items')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Kullanıcının WardrobeItem listesini getir (sayfalı)' })
  @ApiOkResponse({ description: 'items + nextCursor' })
  async list(
    @Query() q: ListItemsQueryDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = String(req.user?.id ?? req.user?.sub ?? '');
    if (!userId) throw new UnauthorizedException('Kullanıcı doğrulanamadı');
    return this.files.listWardrobeItems(userId, q);
  }

  @Get('download-url')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Presigned GET URL oluştur (private bucket için)' })
  @ApiQuery({ name: 'key', required: true })
  @ApiOkResponse({
    schema: {
      type: 'object',
      required: ['downloadUrl'],
      properties: { downloadUrl: { type: 'string' } },
    },
  })
  async downloadUrl(
    @Query('key') key: string,
  ): Promise<{ downloadUrl: string }> {
    return this.files.createDownloadUrl(key);
  }
}
