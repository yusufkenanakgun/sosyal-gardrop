import {
  S3Client,
  ListBucketsCommand,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let _s3: S3Client | null = null;

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

export function getS3Client(): S3Client {
  if (_s3) return _s3;

  // Zorunlu/opsiyonel env'ler
  const endpoint = process.env.S3_ENDPOINT || undefined;
  const region = process.env.S3_REGION || 'us-east-1';

  // Hem AWS hem MinIO için anahtar isimleri destekle
  const accessKeyId =
    process.env.S3_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY || '';
  const secretAccessKey =
    process.env.S3_SECRET_ACCESS_KEY || process.env.S3_SECRET_KEY || '';

  // Endpoint amazonaws içermiyorsa (veya custom ise) path-style güvenli
  const forcePathStyle =
    process.env.S3_FORCE_PATH_STYLE === 'true' ||
    (!!endpoint && !endpoint.includes('amazonaws'));

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('Missing S3 credentials');
  }

  _s3 = new S3Client({
    region,
    endpoint,
    forcePathStyle,
    credentials: { accessKeyId, secretAccessKey },
  });

  return _s3;
}

/**
 * Hızlı bağlantı testi — konsolda bucket listesi gösterir
 */
export async function testS3Connection(): Promise<void> {
  try {
    const client = getS3Client();
    const result = await client.send(new ListBucketsCommand({}));

    console.log(
      '✅ S3 connected. Buckets:',
      result.Buckets?.map((b) => b?.Name)
        .filter(Boolean)
        .join(', ') || '(none)',
    );
  } catch (err: unknown) {
    console.error('❌ S3 connection failed:', err);
  }
}

/**
 * Presigned PUT URL üretir (yükleme için)
 */
export async function presignPutUrl(
  bucket: string,
  key: string,
  mime: string,
  ttl = 300,
): Promise<string> {
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: mime,
  });
  return getSignedUrl(client, command, { expiresIn: ttl });
}

/**
 * Presigned GET URL üretir (indirme için)
 */
export async function presignGetUrl(
  bucket: string,
  key: string,
  ttl = 300,
): Promise<string> {
  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  return getSignedUrl(client, command, { expiresIn: ttl });
}

/**
 * Eğer public base varsa doğrudan public URL oluşturur.
 * (MinIO veya CDN senaryosu)
 */
export function getPublicUrl(key: string): string {
  const base = process.env.S3_PUBLIC_BASE;
  const region = process.env.S3_REGION || 'us-east-1';

  if (base) {
    // encodeURI: path içindeki "/" bozulmasın
    return `${base.replace(/\/$/, '')}/${encodeURI(key)}`;
  }

  // AWS S3 public (bucket public ise) — bucket zorunlu
  const bucket = requireEnv('S3_BUCKET');
  return `https://${bucket}.s3.${region}.amazonaws.com/${encodeURI(key)}`;
}
