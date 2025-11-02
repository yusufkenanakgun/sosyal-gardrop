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
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { DbService } from '../../db/db.service';
import { randomUUID } from 'node:crypto';

const DEFAULT_ALLOWED = [
  'image/', // image/jpeg, image/png, ...
  'application/pdf', // PDF
  'video/', // video/mp4, video/quicktime, ...
];

type WardrobeRow = {
  id: string;
  userId: string;
  type: string;
  brand: string;
  color: string;
  material: string;
  season: string[];
  styleTags: string[];
  size: string;
  imageUrl: string;
  bgRemovedUrl: string | null;
  labelsJSON: Record<string, unknown> | null;
  createdAt: Date;
};

const TYPES = ['tshirt', 'shirt', 'jeans', 'jacket', 'dress', 'skirt', 'sneaker', 'hoodie'] as const;
const BRANDS = ['Zara', 'H&M', 'Nike', 'Adidas', 'Mango', 'Pull&Bear', 'Uniqlo', 'Levi’s'] as const;
const COLORS = ['black', 'white', 'blue', 'navy', 'grey', 'beige', 'green', 'red', 'brown'] as const;
const MATERIALS = ['cotton', 'denim', 'wool', 'polyester', 'linen', 'leather'] as const;
const SIZES = ['XS', 'S', 'M', 'L', 'XL'] as const;
const SEASON_SETS: readonly string[][] = [
  ['spring', 'summer'],
  ['autumn', 'winter'],
  ['summer'],
  ['winter'],
] as const;
const STYLE_TAG_SETS: readonly string[][] = [
  ['casual', 'minimal'],
  ['sport', 'street'],
  ['smart', 'office'],
  ['vintage'],
  ['classic', 'elegant'],
] as const;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

@Injectable()
export class FilesService {
  constructor(
    private readonly cfg: ConfigService,
    private readonly db: DbService,
  ) {}

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
    const env = this.cfg.get<string>('S3_ALLOWED_CONTENT_TYPES');
    if (!env) return DEFAULT_ALLOWED;
    return env
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  /** users/<email-id>/wardrobe */
  private userWardrobePrefix(userId: string, email?: string): string {
    const safe = (s?: string) =>
      (s ?? '').toLowerCase().replace(/[^a-z0-9._-]/g, '');
    const part = email ? `${safe(email)}-${safe(userId)}` : safe(userId);
    return `users/${part}/wardrobe`;
  }

  /** (Opsiyonel) klasör marker objesi (0-byte) bırak */
  private async ensureFolderMarker(prefix: string): Promise<void> {
    const markerKey = `${prefix}/`;
    try {
      const put = new PutObjectCommand({
        Bucket: this.bucket,
        Key: markerKey,
        ContentType: 'application/x-directory',
        Body: '', // 0-byte
      });
      await getS3Client().send(put);
    } catch {
      // kritik değil
    }
  }

  /**
   * Presigned PUT URL üretir.
   * Key formatı: users/{email-id}/wardrobe/YYYY-MM-DD/{uuid}.{ext}
   */
  async createUploadUrl(
    dto: PresignRequestDto,
    userId: string,
    email?: string,
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
      const datePart = new Date().toISOString().slice(0, 10);
      const uuid = randomUUID();

      const basePrefix = this.userWardrobePrefix(userId, email);
      const key = `${basePrefix}/${datePart}/${uuid}${ext ? '.' + ext : ''}`;

      await this.ensureFolderMarker(basePrefix);

      const put = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: dto.contentType,
      });

      const expiresIn = Number(process.env.S3_PRESIGN_PUT_TTL ?? 300);
      const uploadUrl = await getSignedUrl(getS3Client(), put, { expiresIn });

      const publicUrl = `${this.endpoint}/${this.bucket}/${key}`;
      return { uploadUrl, key, publicUrl };
    } catch {
      throw new InternalServerErrorException('Failed to generate upload URL');
    }
  }

  /** HeadObject ile objeyi doğrula ve publicUrl üret */
  private async verifyAndDescribeObject(key: string): Promise<{
    contentType: string;
    publicUrl: string;
    head: { ETag?: string; ContentLength?: number | undefined };
  }> {
    try {
      const head = await getS3Client().send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      const contentType = head.ContentType || 'application/octet-stream';
      const publicUrl = `${this.endpoint}/${this.bucket}/${key}`;
      return { contentType, publicUrl, head: { ETag: head.ETag, ContentLength: head.ContentLength } };
    } catch {
      throw new InternalServerErrorException('Object not found or not accessible');
    }
  }

  /** Upload tamamla -> DB’ye randomized WardrobeItem insert */
  async completeAndCreateItem(
    userId: string,
    email: string | undefined,
    dto: CompleteUploadDto,
  ) {
    if (!dto.key) throw new BadRequestException('key zorunlu');

    const { contentType, publicUrl, head } = await this.verifyAndDescribeObject(dto.key);

    const id = randomUUID();
    const type = pick(TYPES);
    const brand = pick(BRANDS);
    const color = pick(COLORS);
    const material = pick(MATERIALS);
    const size = pick(SIZES);
    const season = pick(SEASON_SETS);
    const styleTags = pick(STYLE_TAG_SETS);
    const imageUrl = dto.publicUrl ?? publicUrl;

    const labelsJSON = {
      contentType,
      etag: head.ETag,
      size: head.ContentLength,
      // istersen burada daha fazla meta ekleyebilirsin
    };

    const sql = `
      INSERT INTO "WardrobeItem"
        (id, "userId", type, brand, color, material, season, "styleTags", size, "imageUrl", "bgRemovedUrl", "labelsJSON")
      VALUES
        ($1, $2,   $3,   $4,   $5,    $6,     $7,      $8,          $9,   $10,       $11,           $12)
      RETURNING id, "userId", type, brand, color, material, season, "styleTags", size, "imageUrl", "bgRemovedUrl", "labelsJSON", "createdAt";
    `;

    const params = [
      id,
      userId,
      type,
      brand,
      color,
      material,
      season,
      styleTags,
      size,
      imageUrl,
      null,
      labelsJSON,
    ];

    const res = await this.db.query<WardrobeRow>(sql, params);
    return res.rows[0];
  }

  /** Listeleme (sayfalı) – /files/items */
  async listWardrobeItems(
    userId: string,
    q: { limit?: string; cursor?: string; type?: string },
  ) {
    const take = Math.min(Math.max(Number(q.limit ?? 20), 1), 100);

    if (q.cursor) {
      const sql = `
        SELECT id, "userId", type, brand, color, material, season, "styleTags", size, "imageUrl", "bgRemovedUrl", "labelsJSON", "createdAt"
        FROM "WardrobeItem"
        WHERE "userId" = $1
          AND (${q.type ? `type = $2 AND id < $3` : `id < $2`})
        ORDER BY "createdAt" DESC, id DESC
        LIMIT ${q.type ? '$4' : '$3'}
      `;
      const params = q.type
        ? [userId, q.type, q.cursor, take + 1]
        : [userId, q.cursor, take + 1];
      const result = await this.db.query<WardrobeRow>(sql, params);
      return this.paginate(result.rows, take);
    }

    const sql = `
      SELECT id, "userId", type, brand, color, material, season, "styleTags", size, "imageUrl", "bgRemovedUrl", "labelsJSON", "createdAt"
      FROM "WardrobeItem"
      WHERE "userId" = $1
        ${q.type ? `AND type = $2` : ``}
      ORDER BY "createdAt" DESC, id DESC
      LIMIT ${q.type ? '$3' : '$2'}
    `;
    const params = q.type ? [userId, q.type, take + 1] : [userId, take + 1];
    const result = await this.db.query<WardrobeRow>(sql, params);
    return this.paginate(result.rows, take);
  }

  private paginate<T extends { id: string }>(rows: T[], take: number) {
    let nextCursor: string | null = null;
    if (rows.length > take) {
      nextCursor = rows[take].id;
      rows = rows.slice(0, take);
    }
    return { items: rows, nextCursor };
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
