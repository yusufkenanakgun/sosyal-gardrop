CREATE EXTENSION IF NOT EXISTS vector;
-- pgvector eklentisi zaten kurulu (SELECT * FROM pg_extension WHERE extname='vector')
-- 1) bytea olan embedding'i vector(512)'ye dönüştür (cast yok: yeni kolon → rename)
ALTER TABLE "WardrobeItem" ADD COLUMN "embedding_v" vector(512);

-- Eğer mevcut veride embedding NULL ise direkt rename yeterli.
-- Dolu veri için buraya özel dönüştürme mantığı (USING) gerekir; bizde gerek yok.

ALTER TABLE "WardrobeItem" DROP COLUMN "embedding";
ALTER TABLE "WardrobeItem" RENAME COLUMN "embedding_v" TO "embedding";

-- 2) IVF index (başlangıç için lists=100)
CREATE INDEX IF NOT EXISTS wardrobeitem_embedding_ivf
ON "WardrobeItem" USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);
