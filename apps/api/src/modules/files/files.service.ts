import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getS3Client } from '../../lib/s3.client';
import { PresignRequestDto, PresignResponseDto } from './dto/presign.dto';
import { randomUUID } from 'node:crypto';

@Injectable()
export class FilesService {
  constructor(private cfg: ConfigService) {}

  get bucket() {
    return this.cfg.get<string>('S3_BUCKET')!;
  }

  get endpoint() {
    return this.cfg.get<string>('S3_ENDPOINT')!;
  }

  async createUploadUrl(dto: PresignRequestDto): Promise<PresignResponseDto> {
    try {
      const ext = dto.filename.includes('.')
        ? dto.filename.split('.').pop()
        : undefined;
      const uuid = randomUUID();
      const prefix = dto.prefix ? dto.prefix.replace(/^\/|\/$/g, '') + '/' : '';
      const key = `${prefix}${uuid}${ext ? '.' + ext : ''}`;

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: dto.contentType,
      });

      const uploadUrl = await getSignedUrl(getS3Client(), command, {
        expiresIn: 300,
      });

      let publicUrl: string | undefined = undefined;
      if (this.endpoint && this.bucket) {
        publicUrl = `${this.endpoint.replace(/\/$/, '')}/${this.bucket}/${key}`;
      }

      return { uploadUrl, key, publicUrl };
    } catch {
      throw new InternalServerErrorException('Failed to generate upload URL');
    }
  }

  async createDownloadUrl(key: string): Promise<{ downloadUrl: string }> {
    try {
      await getS3Client().send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      const { GetObjectCommand } = await import('@aws-sdk/client-s3');
      const cmd = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      const downloadUrl = await getSignedUrl(getS3Client(), cmd, {
        expiresIn: 300,
      });
      return { downloadUrl };
    } catch {
      throw new InternalServerErrorException('Failed to generate download URL');
    }
  }
}
