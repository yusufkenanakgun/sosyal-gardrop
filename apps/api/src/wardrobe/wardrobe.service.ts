// apps/api/src/wardrobe/wardrobe.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { CreateWardrobeItemDto } from './dto/create-wardrobe-item.dto';
import { randomUUID } from 'node:crypto';

type ListQuery = { limit?: number; cursor?: string; type?: string };

const TYPES = [
  'tshirt',
  'shirt',
  'jeans',
  'jacket',
  'dress',
  'skirt',
  'sneaker',
  'hoodie',
] as const;
const BRANDS = [
  'Zara',
  'H&M',
  'Nike',
  'Adidas',
  'Mango',
  'Pull&Bear',
  'Uniqlo',
  'Levi’s',
] as const;
const COLORS = [
  'black',
  'white',
  'blue',
  'navy',
  'grey',
  'beige',
  'green',
  'red',
  'brown',
] as const;
const MATERIALS = [
  'cotton',
  'denim',
  'wool',
  'polyester',
  'linen',
  'leather',
] as const;
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

@Injectable()
export class WardrobeService {
  constructor(private db: DbService) {}

  async createRandomized(userId: string, dto: CreateWardrobeItemDto) {
    if (!dto.objectKey || !dto.contentType || !dto.publicUrl) {
      throw new BadRequestException(
        'objectKey, contentType, publicUrl zorunlu',
      );
    }

    const id = randomUUID();

    // RANDOM atamalar:
    const type = pick(TYPES);
    const brand = pick(BRANDS);
    const color = pick(COLORS);
    const material = pick(MATERIALS);
    const size = pick(SIZES);
    const season = pick(SEASON_SETS);
    const styleTags = pick(STYLE_TAG_SETS);

    // Şemaya göre imageUrl zorunlu — publicUrl’i yazıyoruz.
    const imageUrl = dto.publicUrl;

    const insertSQL = `
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
      season, // text[]
      styleTags, // text[]
      size,
      imageUrl,
      null, // bgRemovedUrl
      null, // labelsJSON
    ];

    const res = await this.db.query<WardrobeRow>(insertSQL, params);
    return res.rows[0];
  }

  async list(userId: string, q: ListQuery) {
    const take = Math.min(Math.max(Number(q.limit ?? 20), 1), 100);

    if (q.cursor) {
      const sql = `
        SELECT id, "userId", type, brand, color, material, season, "styleTags", size, "imageUrl", "bgRemovedUrl", "labelsJSON", "createdAt"
        FROM "WardrobeItem"
        WHERE "userId" = $1
          AND (${q.type ? `type = $2 AND id < $3` : `id < $2`})
        ORDER BY "createdAt" DESC, id DESC
        LIMIT $4
      `;
      const params = q.type
        ? [userId, q.type, q.cursor, take + 1]
        : [userId, q.cursor, take + 1];
      const result = await this.db.query<WardrobeRow>(sql, params);
      return this.paginate(result.rows, take);
    }

    // İlk sayfa
    const sql = `
      SELECT id, "userId", type, brand, color, material, season, "styleTags", size, "imageUrl", "bgRemovedUrl", "labelsJSON", "createdAt"
      FROM "WardrobeItem"
      WHERE "userId" = $1
        ${q.type ? `AND type = $2` : ``}
      ORDER BY "createdAt" DESC, id DESC
      LIMIT $3
    `;
    const params = q.type ? [userId, q.type, take + 1] : [userId, take + 1];
    const result = await this.db.query<WardrobeRow>(sql, params);
    return this.paginate(result.rows, take);
  }

  private paginate<T extends { id: string }>(rows: T[], take: number) {
    let nextCursor: string | null = null;

    // take+1 kayıt getiriyoruz; fazladan olanı cursor üretmek için kullan
    if (rows.length > take) {
      nextCursor = rows[take].id; // fazladan gelen elemanın id'si
      rows = rows.slice(0, take); // sadece ilk "take" öğeyi döndür
    }

    return { items: rows, nextCursor };
  }
}
