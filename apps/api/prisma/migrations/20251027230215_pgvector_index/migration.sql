-- Enable pgvector (idempotent)
CREATE EXTENSION IF NOT EXISTS vector;

-- Ensure correct column type exists (idempotent safety)
-- Not changing column here because your schema already has vector(512).

-- ANN index for embedding (IVF, L2)
CREATE INDEX IF NOT EXISTS wardrobeitem_embedding_ivf
ON "WardrobeItem"
USING ivfflat (embedding vector_l2_ops)
WITH (lists = 100);

ANALYZE "WardrobeItem";
