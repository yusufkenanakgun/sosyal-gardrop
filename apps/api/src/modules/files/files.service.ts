import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getS3Client } from '../../lib/s3.client';
import { PresignRequestDto, PresignResponseDto } from './dto/presign.dto';
import { randomUUID } from 'node:crypto';

const DEFAULT_ALLOWED = [
  'image/', // image/jpeg, image/png, ...
  'application/pdf', // PDF
  'video/', // video/mp4, video/quicktime, ...
];

@Injectable()
export class FilesService {
  constructor(private readonly cfg: ConfigService) {}

  private get bucket(): string {
    const b = this.cfg.get<string>('S3_BUCKET');
    if (!b) throw new Error('S3_BUCKET not set');
    return b;
  }

  private get endpoint(): string {
    const e = this.cfg.get<string>('S3_ENDPOINT');
    if (!e) throw new Error('S3_ENDPOINT not set');
    return e.replace(/\/$/, '');
  }

  private get allowedMimePrefixes(): string[] {
    // ENV ile override edilebilir: "image/,application/pdf,video/"
    const env = this.cfg.get<string>('S3_ALLOWED_CONTENT_TYPES');
    if (!env) return DEFAULT_ALLOWED;
    return env
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  /** Sunucu tarafında güvenli user prefix üret */
  private userWardrobePrefix(userId: string): string {
    const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, '');
    return `users/${safeId}/wardrobe`;
  }

  /** (Opsiyonel) klasör marker objesi (0-byte) bırak */
  private async ensureFolderMarker(prefix: string): Promise<void> {
    const markerKey = `${prefix}/`;
    try {
      // MinIO/S3 idempotent: aynı key varsa overwrite olur, sorun değil
      const put = new PutObjectCommand({
        Bucket: this.bucket,
        Key: markerKey,
        ContentType: 'application/x-directory',
        Body: '', // 0-byte
      });
      await getS3Client().send(put);
    } catch {
      // marker başarısız olsa da kritik değil; sessiz geç
    }
  }

  /**
   * Presigned PUT URL üretir.
   * Key formatı: users/{userId}/wardrobe/YYYY-MM-DD/{uuid}.{ext}
   */
  async createUploadUrl(
    dto: PresignRequestDto,
    userId: string,
  ): Promise<PresignResponseDto> {
    try {
      if (!dto.filename || !dto.contentType) {
        throw new BadRequestException('filename ve contentType zorunlu');
      }

      const allowed = this.allowedMimePrefixes;
      if (!allowed.some((p) => dto.contentType.startsWith(p))) {
        throw new BadRequestException(
          `MIME tipi desteklenmiyor: ${dto.contentType}`,
        );
      }

      const ext = dto.filename.includes('.')
        ? dto.filename.split('.').pop()
        : undefined;
      const datePart = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const uuid = randomUUID();

      const basePrefix = this.userWardrobePrefix(userId);
      const key = `${basePrefix}/${datePart}/${uuid}${ext ? '.' + ext : ''}`;

      // (Opsiyonel) klasör marker
      await this.ensureFolderMarker(basePrefix);

      const put = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: dto.contentType,
      });

      const expiresIn = Number(process.env.S3_PRESIGN_PUT_TTL ?? 300);
      const uploadUrl = await getSignedUrl(getS3Client(), put, { expiresIn });

      // Path-style public URL (bucket public ise direkt kullanılabilir)
      const publicUrl = `${this.endpoint}/${this.bucket}/${key}`;

      return { uploadUrl, key, publicUrl };
    } catch {
      throw new InternalServerErrorException('Failed to generate upload URL');
    }
  }

  /** Var olan obje için presigned GET URL üretir. */
  async createDownloadUrl(key: string): Promise<{ downloadUrl: string }> {
    try {
      if (!key) throw new BadRequestException('key zorunlu');

      await getS3Client().send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );

      const get = new GetObjectCommand({ Bucket: this.bucket, Key: key });
      const expiresIn = Number(process.env.S3_PRESIGN_GET_TTL ?? 300);
      const downloadUrl = await getSignedUrl(getS3Client(), get, { expiresIn });

      return { downloadUrl };
    } catch {
      throw new InternalServerErrorException('Failed to generate download URL');
    }
  }
}
