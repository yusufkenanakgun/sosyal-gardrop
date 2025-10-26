import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse, // ✅
  ApiOkResponse, // ✅
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { FilesService } from './files.service';
import { PresignRequestDto, PresignResponseDto } from './dto/presign.dto';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Post('presign')
  @ApiOperation({ summary: 'Presigned PUT URL oluştur (upload için)' })
  @ApiBody({ type: PresignRequestDto })
  @ApiCreatedResponse({ type: PresignResponseDto }) // ✅ as any kaldırıldı
  async presign(@Body() dto: PresignRequestDto): Promise<PresignResponseDto> {
    return this.files.createUploadUrl(dto);
  }

  @Get('download-url')
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
