-- Migration: Affiliate Product Auto-Import System
-- Adds fields needed for automatic product ingestion, categorization, and scoring.

ALTER TABLE affiliate_products
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS conversion_score DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS estimated_ctr DECIMAL(5,4) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS source_network TEXT,
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_affiliate_products_category ON affiliate_products(category);
CREATE INDEX IF NOT EXISTS idx_affiliate_products_tags ON affiliate_products USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_affiliate_products_conversion ON affiliate_products(conversion_score DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_products_external ON affiliate_products(source_network, external_id);
