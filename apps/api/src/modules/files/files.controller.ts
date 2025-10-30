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
    if (!userId) throw new UnauthorizedException('Kullanıcı doğrulanamadı');
    return this.files.createUploadUrl(dto, userId);
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
